# =====================================================================
# 04_二分类结局_观察性研究.R
# 目的：二分类结局 + 混杂。对照未调整风险差与 IPTW 校正后的风险差。
# 输入：无（数据由 mlr3HTE_demo_obs_binary() 现场生成，含真实 PS）
# 输出：控制台打印的偏倚对照表
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, cli
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
  library(cli)
})
set.seed(2026)

# 1 生成有混杂的二分类观察性数据 ----
# 混杂结构同 mlr3HTE_demo_obs：病情越重越容易接受处理
d <- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)

## 1.1 组间基线差异 ----
print(d$X |>
  mutate(A = d$A, Y = d$Y) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = round(mean(lac), 3),
            事件率 = round(mean(Y), 3), .groups = "drop"))

cli::cli_alert_info(
  "真实 ATE（风险差）= {round(d$ate, 4)}；处理率 = {round(mean(d$A), 3)}"
)

# 2 未调整风险差 ----
naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
cli::cli_alert_warning(
  "未调整风险差 = {round(naive, 4)}，偏差 = {round(naive - d$ate, 4)}"
)

# 3 IPTW 校正 ----
lb <- lrn("classif.ranger", num.trees = 300, seed = 1)
fit <- metalearner("X", d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")
cli::cli_alert_success(
  "IPTW + X-learner = {round(fit$ate, 4)}，偏差 = {round(fit$ate - d$ate, 4)}"
)

# 4 五种 learner 在 IPTW 下的表现 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw"))
names(fits) <- types

print(data.frame(
  方法     = types,
  IPTW_ATE = round(vapply(fits, function(f) f$ate, numeric(1)), 4),
  真实ATE  = round(d$ate, 4),
  偏差     = round(vapply(fits, function(f) f$ate, numeric(1)) - d$ate, 4),
  与真相关 = round(vapply(fits, function(f) cor(f$cate_train, d$tau), numeric(1)), 3)
))

# 5 用真实 PS 走外部权重 ----
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true)
print(data.frame(
  方法    = c("未调整", "IPTW + X", "真实PS外部权重 + DR"),
  估计    = round(c(naive, fit$ate, fit_ext$ate), 4),
  真实ATE = round(d$ate, 4),
  偏差    = round(c(naive, fit$ate, fit_ext$ate) - d$ate, 4)
))

# 99 收尾 ----
cli::cli_alert_success("脚本 04 完成：二分类结局 × 观察性研究")
