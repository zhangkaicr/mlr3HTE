# 目的：用一份「只有混杂强度在变」的模拟网格，量化五族 metalearner 在观察性数据下
#       的 CATE 相关与 ATE 偏差如何随混杂强度变化；未调整差值作为「不校正」的参照线
# 输入：无（全部现场生成；mlr3HTE_demo_continuous(setting = "obs") 的 strength 控制混杂强度）
# 输出：tutorial/figures/17_confounding_strength.png（左 CATE 相关 / 右 ATE 偏差）
#       tutorial/figures/17_confounding_strength.csv（含未调整差值行，页面表格可直接复算）
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, tidyr, purrr, ggplot2, patchwork, cli, readr
# 运行：在 mlr3HTE/ 目录下执行
#       LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 Rscript tutorial/code/17_混杂强度扫描.R

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(mlr3)
  library(mlr3learners)
  library(dplyr)
  library(tidyr)
  library(ggplot2)
  library(patchwork)
  library(cli)
  library(readr)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 620, type = "cairo"))
}

# 1 扫描设计 ----
## 1.1 网格参数 ----
#   混杂强度 strength：0 = RCT（A 与 X 独立）→ 0.5 / 1 / 1.5 / 2（越来越强）
#   learner：S / T / X / R / DR。R / DR 一律开交叉拟合——它们的伪结果含
#     「同一批数据上拟合的干扰参数」，mu 用 ranger 时样本内残差被过拟合压向 0，
#     会让 tau 整体衰减（实测 ATE 被砍掉六成）。Nie & Wager 2021 的 R-learner
#     与 Kennedy 2020 的 DR 理论都以交叉拟合为前提。
#   CATE 相关必须在留出集上算：柔性学习器会记住训练噪声，回代自己必然虚高。
n_rep     <- 10        # 每个（强度 × learner）重复几次取均值，压掉 Monte Carlo 噪声
n_size    <- 2000      # 每份数据的样本量
strengths <- c(0, 0.5, 1, 1.5, 2)
learners  <- c("S", "T", "X", "R", "DR")
lb <- mlr3::lrn("regr.ranger", num.trees = 200, seed = 1)   # 结局模型基学习器

## 1.2 为什么给 R/DR 收紧 ps_bounds ----
# v0.46 起 ps_bounds 默认 [0.01, 0.99]。本 DGP 在 strength = 2 时约 7.5% 个体
# 真实 PS < 0.05、约 2% > 0.95，Robinson 伪结果 (Y - mu) / (A - e) 在这些人身上
# 被放大成噪声。配对诊断 dev/_diag17_ps_bounds.R（同一数据与划分，只改截断）显示：
#   strength = 2 的 R：cor 0.197 → 0.496，ATE bias 1.003 → 0.292，RMSE 5.970 → 1.682；
#   X 三项几乎不变，S / T 不拟合 PS、不受影响。
# 所以只给 R/DR 传收紧值，其余保持默认。注意收紧救不回 v0.43 移除的 tau 回归权重：
# R 在高强度下仍明显退化，页面结论按实测写，不粉饰成「已修复」。
ps_tight <- c(0.05, 0.95)
ps_dflt  <- c(0.01, 0.99)

cli::cli_alert_info("扫描设计：{length(strengths)} 档强度 × {length(learners)} 族 × {n_rep} 次重复，n = {n_size}")

# 2 单次估计 ----
## 2.1 估计函数 ----
# 返回 cor / ate / bias / rmse，cor 与 rmse 都在 30% 留出集上算。
# 形参名与 expand.grid 的列名一致，pmap_dfr 才能按名对齐。
# 网格里这段逻辑要跑 250 次，抽一个 one_run；除此之外全脚本保持直线流程。
one_run <- function(strength, learner, seed) {
  d <- mlr3HTE_demo_continuous(setting = "obs", n = n_size, strength = strength, seed = seed)
  tr <- sample(seq_len(nrow(d$X)), size = floor(0.7 * nrow(d$X)))
  te <- setdiff(seq_len(nrow(d$X)), tr)
  needs_ps_clip <- learner %in% c("R", "DR")
  fit <- suppressMessages(
    metalearner(learner, d$X[tr, , drop = FALSE], d$A[tr], d$Y[tr],
                learner_base = lb, cross_fitting = needs_ps_clip, n_folds = 5,
                ps_bounds = if (needs_ps_clip) ps_tight else ps_dflt)
  )
  cate_te <- fit$predict(d$X[te, , drop = FALSE])
  data.frame(
    strength = strength, learner = learner, seed = seed,
    cor_test = cor(cate_te, d$tau[te]),
    ate      = fit$ate,
    bias     = fit$ate - d$ate,
    rmse     = sqrt(mean((cate_te - d$tau[te])^2))
  )
}

# 3 跑完整网格 ----
grid <- expand.grid(strength = strengths, learner = learners,
                    seed = seq_len(n_rep), stringsAsFactors = FALSE)
res <- purrr::pmap_dfr(grid, one_run)
cli::cli_alert_success("扫描完成：{nrow(res)} 次拟合")

# 4 汇总与参照线 ----
## 4.1 五族汇总：每个（强度 × learner）取重复的均值 ----
summ <- res |>
  group_by(strength, learner) |>
  summarise(cor_test = mean(cor_test),
            bias     = mean(bias),
            rmse     = mean(rmse),
            .groups  = "drop")
summ

## 4.2 未调整差值：它没有 CATE，单独算 bias ----
# 真值 ATE 与 strength 无关（Y 的生成式里 mu 与 tau 都不随强度变，只有 e 变），
# 因此取 strength = 0 那份的 d$ate 作为共同真值。
d0 <- mlr3HTE_demo_continuous(setting = "obs", n = n_size, strength = 0, seed = 1)
naive_tab <- purrr::map_dfr(strengths, function(s) {
  b <- purrr::map_dbl(seq_len(n_rep), function(k) {
    d <- mlr3HTE_demo_continuous(setting = "obs", n = n_size, strength = s, seed = k)
    mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
  })
  data.frame(strength = s, learner = "未调整差值", bias = mean(b) - d0$ate)
})

# 5 画图与落盘 ----
## 5.1 两幅图：左 = CATE 相关，右 = ATE 偏差 ----
# 收紧 ps_bounds 之后 S/T/X 仍是平线，但 R 从强度 1.5 起明显下滑，
# 所以左图标题不再写「不随强度退化」，改成如实描述。
learner_cols <- c("S" = "#1B6CA8", "T" = "#2E8B57", "X" = "#B5651D",
                  "R" = "#7B3FA0", "DR" = "#C0392B")

p_cor <- ggplot(summ |> filter(learner != "未调整差值"),
                aes(x = strength, y = cor_test, colour = learner)) +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  scale_colour_manual(values = learner_cols) +
  scale_y_continuous(limits = c(0, 1)) +
  labs(x = "混杂强度（0 = RCT）", y = "cor(估计 CATE, 真实 CATE)",
       title = "留出集 CATE 相关：S/T/X 平稳，R 在高混杂下退化") +
  theme_minimal(base_size = 12)

p_bias <- ggplot(summ |> filter(learner != "未调整差值"),
                 aes(x = strength, y = bias, colour = learner)) +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  geom_line(data = naive_tab, aes(x = strength, y = bias),
            colour = "grey35", linewidth = 1, linetype = "22") +
  annotate("text", x = max(strengths) * 0.62, y = max(naive_tab$bias) * 0.9,
           label = "未调整差值", colour = "grey35", size = 3.5) +
  scale_colour_manual(values = learner_cols) +
  geom_hline(yintercept = 0, colour = "grey70") +
  labs(x = "混杂强度（0 = RCT）", y = "ATE 估计 − 真实 ATE",
       title = "ATE 偏差：条件化压住混杂，未调整差值一路下坠") +
  theme_minimal(base_size = 12)

p_all <- p_cor + p_bias +
  plot_layout(guides = "collect") &
  theme(legend.position = "bottom")
p_all

## 5.2 同步写盘 ----
# 站点另有一份同名图 docs/assets/img/bench/confounding_strength.png，
# 刷新后需复制过去，两处保持一致。
ggplot2::ggsave("tutorial/figures/17_confounding_strength.png", p_all,
                width = 11, height = 4.6, dpi = 150)

# 把未调整差值一并写进 csv，页面那张 ATE 偏差表的首列才算「可自行复算」。
out <- bind_rows(
  summ |> select(strength, learner, cor_test, bias, rmse),
  naive_tab |> mutate(cor_test = NA_real_, rmse = NA_real_) |>
    select(strength, learner, cor_test, bias, rmse)
) |> arrange(strength, learner)
readr::write_csv(out, "tutorial/figures/17_confounding_strength.csv")

# 6 关键数字 ----
# RCT（strength = 0）与最强混杂（strength = 2）两端的对照表
ends <- summ |> filter(strength %in% c(0, 2)) |>
  select(strength, learner, cor_test, bias) |>
  mutate(across(c(cor_test, bias), ~ round(.x, 3))) |>
  arrange(learner, strength)
ends

cli::cli_alert_info("读图要点：S/T/X 的 CATE 相关随强度基本是平线；R 从强度 1.5 起退化，收紧 PS 截断后仍未回到 RCT 水平。")
cli::cli_alert_info("R/DR 一律开交叉拟合并传 ps_bounds = c(0.05, 0.95)；配对诊断见 dev/_diag17_ps_bounds.R。")

# 99 收尾 ----
cli::cli_alert_success("图与汇总表已写入 tutorial/figures/")
