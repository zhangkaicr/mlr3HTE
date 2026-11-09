# 目的：A 方案诊断——收紧 ps_bounds 能否修复教程 17 在高混杂下 R-learner 的退化
# 输入：无（现场用 mlr3HTE_demo_continuous(setting = "obs") 生成观察性 DGP）
# 输出：控制台配对对账表 + tutorial/figures/17_confounding_strength_ps_diag.csv
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, tidyr, purrr, cli, readr

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
  library(purrr)
  library(cli)
  library(readr)
})

# 1 诊断设计 ----
## 1.1 配对而非两个独立组 ----
# 同一 (strength, learner, seed) 下用完全相同的数据与训练/留出划分，只改 ps_bounds；
# 这样两组差异只来自截断本身，不掺 Monte Carlo 噪声，也不需要跑满 10 次重复。
## 1.2 网格范围 ----
# 只跑会经过 .fit_ps 的 X / R / DR。S / T 不拟合倾向得分，收紧对它们无影响，省掉。
# 强度取 0（RCT 对照）、1、1.5、2（页面结论被推翻的那一端）。
n_size    <- 2000
strengths <- c(0, 1, 1.5, 2)
learners  <- c("X", "R", "DR")
seeds     <- 1:3
bounds    <- list(default = c(0.01, 0.99), tight = c(0.05, 0.95))
lb        <- mlr3::lrn("regr.ranger", num.trees = 200, seed = 1)

cli::cli_alert_info("配对诊断：{length(strengths)} 档强度 x {length(learners)} 族 x {length(seeds)} 种子 x {length(bounds)} 种截断")

# 2 先看倾向得分有没有收紧空间 ----
## 2.1 真实 PS 的极值占比 ----
# 若极少数个体 PS 落在 0.05 以下，收紧才有作用空间；否则 A 方案在这个 DGP 上
# 大概率无效，需要换别的解释。
ps_tab <- purrr::map_dfr(strengths, function(s) {
  d <- mlr3HTE_demo_continuous(setting = "obs", n = n_size, strength = s, seed = 1)
  data.frame(strength = s,
             ps_min     = round(min(d$ps_true), 4),
             ps_max     = round(max(d$ps_true), 4),
             frac_lt_005 = round(mean(d$ps_true < 0.05), 4),
             frac_gt_095 = round(mean(d$ps_true > 0.95), 4),
             frac_lt_001 = round(mean(d$ps_true < 0.01), 4))
})
cli::cli_alert_info("真实倾向得分分布（每档取 seed = 1 的那份）：")
print(ps_tab)

# 3 单次配对估计 ----
## 3.1 为什么抽这一个函数 ----
# 网格里「生成数据 → 划分 → 两种截断各拟合一次 → 留出集算指标」要重复 36 次，
# 抽一个 one_pair 避免复制粘贴；除此之外全脚本保持直线流程，不再抽象。
one_pair <- function(strength, learner, seed) {
  d <- mlr3HTE_demo_continuous(setting = "obs", n = n_size,
                               strength = strength, seed = seed)
  set.seed(seed + 9000L)   # 固定划分，保证两种截断用的是同一批训练/留出个体
  tr <- sample(seq_len(nrow(d$X)), size = floor(0.7 * nrow(d$X)))
  te <- setdiff(seq_len(nrow(d$X)), tr)
  need_cf <- learner %in% c("R", "DR")

  fit_one <- function(b) {
    f <- suppressMessages(
      metalearner(learner, d$X[tr, , drop = FALSE], d$A[tr], d$Y[tr],
                  learner_base = lb, cross_fitting = need_cf, n_folds = 5,
                  ps_bounds = b)
    )
    cate <- f$predict(d$X[te, , drop = FALSE])
    data.frame(cor_test = cor(cate, d$tau[te]),
               bias     = f$ate - d$ate,
               rmse     = sqrt(mean((cate - d$tau[te])^2)))
  }

  dplyr::bind_rows(default = fit_one(bounds$default),
                   tight   = fit_one(bounds$tight), .id = "bound") |>
    mutate(strength = strength, learner = learner, seed = seed)
}

# 4 跑完整配对网格 ----
grid <- tidyr::crossing(strength = strengths, learner = learners, seed = seeds)
res  <- purrr::pmap_dfr(grid, one_pair)
cli::cli_alert_success("完成 {nrow(res)} 行（{nrow(grid)} 组配对 x 2 种截断）")

# 5 结果对账 ----
## 5.1 每个（强度 x 族 x 截断）取重复均值 ----
summ <- res |>
  group_by(strength, learner, bound) |>
  summarise(cor_test = mean(cor_test),
            bias     = mean(bias),
            rmse     = mean(rmse),
            .groups  = "drop")

## 5.2 转宽表：直接读收紧带来的变化 ----
wide <- summ |>
  pivot_wider(names_from = bound, values_from = c(cor_test, bias, rmse)) |>
  mutate(d_cor      = cor_test_tight - cor_test_default,
         d_bias_abs = abs(bias_tight) - abs(bias_default),
         d_rmse     = rmse_tight - rmse_default) |>
  arrange(learner, strength) |>
  mutate(across(where(is.numeric), ~ round(.x, 3)))

cli::cli_alert_info("收紧 [0.05,0.95] 相对默认 [0.01,0.99]：d_cor > 0 / d_rmse < 0 / d_bias_abs < 0 为改善")
print(as.data.frame(wide))
readr::write_csv(wide, "tutorial/figures/17_confounding_strength_ps_diag.csv")

# 99 收尾 ----
cli::cli_alert_success("诊断表已写入 tutorial/figures/17_confounding_strength_ps_diag.csv")
