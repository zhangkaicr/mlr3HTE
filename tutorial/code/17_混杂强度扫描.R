# =====================================================================
# 17_混杂强度扫描.R
# 目的：v0.40 移除了 IPTW 加权选项（weighting / weights / stabilize）之后，
#       用一份「只有混杂强度在变」的模拟网格回答两个问题：
#         (1) 五族 learner 估计的 CATE 与真实 CATE 的相关性，随混杂强度怎么变？
#         (2) 它们的 ATE 偏差随混杂强度怎么变？
#       关键对照：strength = 0 就是 RCT（处理与协变量独立），strength 越大混杂越强。
#       未调整差值作为参照线——它随强度线性变差，而五族 learner 在强度变化下
#       只要把混杂因子放进了 X，就基本保持稳定。这正是「去混杂靠条件化，
#       不靠给结局模型加权」的量化证据。
# 输入：无（全部现场生成；mlr3HTE_demo_obs 的 strength 参数控制混杂强度）
# 输出：tibble 形式的扫描结果；图 tutorial/figures/17_confounding_strength.png
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, tidyr, cli
# 运行：在 mlr3HTE/ 目录下执行
#       Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8");
#                  source("tutorial/code/17_混杂强度扫描.R", encoding="UTF-8")'
# =====================================================================

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
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 620, type = "cairo"))
}

# 1 扫描设计 ----
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

cli::cli_alert_info("扫描设计：{length(strengths)} 档强度 × {length(learners)} 族 × {n_rep} 次重复，n = {n_size}")

# 2 单次（强度 × learner × 种子）的估计 -------------------------------------
# 返回 cor / ate / bias / rmse，cor 与 rmse 都在 30% 留出集上算。
# 形参名与 expand.grid 的列名一致，pmap_dfr 才能按名对齐。
one_run <- function(strength, learner, seed) {
  d <- mlr3HTE_demo_obs(n = n_size, strength = strength, seed = seed)
  tr <- sample(seq_len(nrow(d$X)), size = floor(0.7 * nrow(d$X)))
  te <- setdiff(seq_len(nrow(d$X)), tr)
  need_cf <- learner %in% c("R", "DR")
  fit <- suppressMessages(
    metalearner(learner, d$X[tr, , drop = FALSE], d$A[tr], d$Y[tr],
                learner_base = lb, cross_fitting = need_cf, n_folds = 5)
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

# 未调整差值作为参照：它没有 CATE（只是单个 ATE），单独算。
# 真值 ATE 与 strength 无关（Y 的生成式里 mu 与 tau 都不随强度变，只有 e 变），
# 因此取 strength = 0 那份的 d$ate 作为共同真值。
d0 <- mlr3HTE_demo_obs(n = n_size, strength = 0, seed = 1)
naive_tab <- purrr::map_dfr(strengths, function(s) {
  b <- purrr::map_dbl(seq_len(n_rep), function(k) {
    d <- mlr3HTE_demo_obs(n = n_size, strength = s, seed = k)
    mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
  })
  data.frame(strength = s, learner = "未调整差值", bias = mean(b) - d0$ate)
})

# 4 汇总：每个（强度 × learner）取重复的均值 ----
summ <- res |>
  group_by(strength, learner) |>
  summarise(cor_test = mean(cor_test),
            bias     = mean(bias),
            rmse     = mean(rmse),
            .groups = "drop")

cli::cli_alert_success("扫描完成：{nrow(res)} 次拟合")
summ

# 5 画图：左 = CATE 相关，右 = ATE 偏差 ----
# 左图画「估计 CATE 与真实 CATE 的相关」——随强度变化五族基本是一条平线，
# 说明只要混杂因子在 X 里，估计质量不随强度退化；右图的未调整差值一路下坠。
learner_cols <- c("S" = "#1B6CA8", "T" = "#2E8B57", "X" = "#B5651D",
                  "R" = "#7B3FA0", "DR" = "#C0392B")

p_cor <- ggplot(summ |> filter(learner != "未调整差值"),
                aes(x = strength, y = cor_test, colour = learner)) +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  scale_colour_manual(values = learner_cols) +
  scale_y_continuous(limits = c(0, 1)) +
  labs(x = "混杂强度（0 = RCT）", y = "cor(估计 CATE, 真实 CATE)",
       title = "留出集上 CATE 与真值的相关：不随混杂强度退化") +
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

ggplot2::ggsave("tutorial/figures/17_confounding_strength.png", p_all,
                width = 11, height = 4.6, dpi = 150)
# 汇总表一并落盘，方便不进 R 也能核对数字（沿用 15_shap_values.csv 的惯例）
readr::write_csv(summ, "tutorial/figures/17_confounding_strength.csv")

# 6 关键数字 ----
# RCT（strength = 0）与最强混杂（strength = 2）两端的对照表
ends <- summ |> filter(strength %in% c(0, 2)) |>
  select(strength, learner, cor_test, bias) |>
  mutate(across(c(cor_test, bias), ~ round(.x, 3))) |>
  arrange(learner, strength)
ends

cli::cli_alert_info("读图要点：五族的 CATE 相关随强度基本是平线（去混杂靠条件化）；未调整差值的偏差随强度线性放大。")
cli::cli_alert_info("R/DR 在此一律开了交叉拟合；若关掉，R-Learner 的 mu 会样本内过拟合、ATE 被衰减。")
