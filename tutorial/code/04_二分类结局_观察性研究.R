# =====================================================================
# 04_二分类结局_观察性研究.R
# 目的：二分类结局 + 混杂。对照未调整风险差与 IPTW 校正后的风险差。
# 输入：无（数据由 mlr3HTE_demo_obs_binary() 现场生成，含真实 PS）
# 输出：DAG、真值卡、偏倚对照表、偏倚柱状图、估计 vs 真实风险差散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/04_二分类结局_观察性研究.R
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
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP：结局机制同 03（二分类），处理分配同 02（混杂）：
#   p0 = plogis(-1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex)
#   p1 = plogis(qlogis(p0) + 0.6 + 0.5*z1 - 0.4*z2)
#   tau = p1 - p0;  e = plogis(-0.5 + 0.8*z1 + 0.4*z2);  A ~ Bern(e)
#   Y ~ Bern(if A==1 then p1 else p0)
print(mlr3HTE_dag("obs", "binary"))

## 1.1 生成数据 ----
d <- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)

## 1.2 组间基线差异（tidyverse）----
d$X |>
  mutate(A = d$A, Y = d$Y) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = mean(lac), 事件率 = mean(Y), .groups = "drop") |>
  mutate(across(c(平均lac, 事件率), \(x) round(x, 3))) |>
  print()

## 1.3 真值卡 + 未调整风险差 ----
naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
tibble(
  指标 = c("真实 ATE（风险差）", "未调整风险差", "未调整偏倚", "处理率"),
  值   = round(c(d$ate, naive, naive - d$ate, mean(d$A)), 4)
) |> print()
cli::cli_alert_warning("未调整风险差明显偏离真实 ATE——混杂把病情效应混了进来")

# 2 IPTW 校正 ----
lb <- lrn("classif.ranger", num.trees = 300, seed = 1)
fit <- metalearner("X", d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")
cli::cli_alert_success(
  "IPTW + X-learner = {round(fit$ate, 4)}，偏差 = {round(fit$ate - d$ate, 4)}"
)

# 3 偏倚柱状图（tidyverse）----
tibble(
  方法 = c("未调整", "IPTW + X"),
  估计 = c(naive, fit$ate)
) |>
  ggplot(aes(x = 方法, y = 估计)) +
  geom_col(fill = "#F58518", width = 0.5) +
  geom_hline(yintercept = d$ate, linetype = "dashed", color = "#E45756",
             linewidth = 0.9) +
  labs(title = "混杂偏倚：未调整风险差 vs IPTW 校正（二分类）",
       subtitle = sprintf("红色虚线 = 真实风险差 = %.3f", d$ate),
       x = NULL, y = "风险差") +
  theme_minimal(base_size = 12)

# 4 五种 learner 在 IPTW 下的表现（tidyverse）----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw"))
names(fits) <- types

tibble(
  方法     = types,
  IPTW_ATE = vapply(fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  偏差     = vapply(fits, \(f) f$ate, numeric(1)) - d$ate,
  与真相关 = vapply(fits, \(f) cor(f$cate_train, d$tau), numeric(1))
) |>
  mutate(across(c(IPTW_ATE, 真实ATE, 偏差, 与真相关), \(x) round(x, 4))) |>
  print()

# 5 用真实 PS 走外部权重（验证）----
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true)
tibble(
  方法    = c("未调整", "IPTW + X", "真实PS外部权重 + DR"),
  估计    = c(naive, fit$ate, fit_ext$ate),
  真实ATE = d$ate,
  偏差    = c(naive, fit$ate, fit_ext$ate) - d$ate
) |>
  mutate(across(c(估计, 真实ATE, 偏差), \(x) round(x, 4))) |>
  print()

# 6 估计 vs 真实风险差（IPTW 下，tidyverse 散点）----
bind_rows(lapply(types, function(tp) {
  tibble(方法 = tp, 真实风险差 = d$tau, 估计风险差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实风险差, 估计风险差)) +
  geom_point(alpha = 0.12, size = 0.7, color = "#F58518") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 2) +
  labs(title = "IPTW 下估计风险差 vs 真实风险差（二分类 × 观察性）",
       x = "真实风险差（tau）", y = "估计风险差") +
  theme_minimal(base_size = 11)

# 99 收尾 ----
cli::cli_alert_success("脚本 04 完成：二分类结局 × 观察性研究")
