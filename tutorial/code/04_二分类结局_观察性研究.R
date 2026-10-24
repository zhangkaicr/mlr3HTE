# =====================================================================
# 04_二分类结局_观察性研究.R
# 目的：二分类结局 + 混杂。对照未调整风险差、混杂全进 X 条件化、漏掉混杂因子三种情形。
# 输入：无（数据由 mlr3HTE_demo_obs_binary() 现场生成，含真实 ATE 与逐人风险差）
# 输出：DAG、真值卡、基线表、偏倚对照表、偏倚柱状图、估计 vs 真实风险差散点图
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
options(pillar.sigfig = 6)  # 表格默认只显示 3 位有效数字，这里要看到 4 位小数
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

# 2 主路径：把全部混杂变量放进 X 条件化 ----
# v0.40 起不再提供 IPTW 加权选项（详见脚本 02 第 3 节）。去混杂靠的是：
#   S/T/X —— 结局模型 E[Y|A,X] 条件化；R —— 残差化；DR —— 两者都做。
# 交叉拟合只对 R/DR 这类"先估干扰参数再估 tau"的结构有意义，S/T/X 不需要。
lb <- lrn("classif.ranger", num.trees = 300, seed = 1)
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR")))
names(fits) <- types

tibble(
  方法     = types,
  估计     = vapply(fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  偏差     = vapply(fits, \(f) f$ate, numeric(1)) - d$ate,
  与真相关 = vapply(fits, \(f) cor(f$cate_train, d$tau), numeric(1)),
  RMSE     = vapply(fits, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1)),
  估计SD   = vapply(fits, \(f) sd(f$cate_train), numeric(1)),
  真实SD   = sd(d$tau)
) |>
  mutate(across(c(估计, 真实ATE, 偏差, 与真相关, RMSE, 估计SD, 真实SD),
                \(x) round(x, 4))) |>
  print()

# 3 反面对照：漏掉一个混杂因子会怎样 ----
X_miss <- d$X |> select(-lac)
fits_miss <- lapply(types, function(tp)
  metalearner(tp, X_miss, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR")))
names(fits_miss) <- types

tibble(
  方法     = types,
  全进X    = vapply(fits, \(f) f$ate, numeric(1)),
  漏掉lac  = vapply(fits_miss, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  偏差_漏lac = vapply(fits_miss, \(f) f$ate, numeric(1)) - d$ate
) |>
  mutate(across(c(全进X, 漏掉lac, 真实ATE, 偏差_漏lac), \(x) round(x, 4))) |>
  print()
cli::cli_alert_warning("漏掉 lac 后五族一起偏回去——变量没选对时，换 learner、换方法都救不回来")

# 4 偏倚柱状图（tidyverse）----
tibble(
  方法 = c("未调整", rep("混杂全进X", 5), rep("漏掉lac", 5)),
  估计 = c(naive,
           vapply(fits, \(f) f$ate, numeric(1)),
           vapply(fits_miss, \(f) f$ate, numeric(1)))
) |>
  ggplot(aes(x = 方法, y = 估计, fill = 方法)) +
  geom_col(width = 0.6) +
  geom_hline(yintercept = d$ate, linetype = "dashed", color = "#E45756",
             linewidth = 0.9) +
  scale_fill_manual(values = c("未调整" = "#F58518",
                               "混杂全进X" = "#4C78A8",
                               "漏掉lac" = "#E45756")) +
  labs(title = "二分类：去混杂靠的是变量选对，不是方法换高级",
       subtitle = sprintf("红色虚线 = 真实风险差 = %.3f", d$ate),
       x = NULL, y = "风险差") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")

# 5 估计 vs 真实风险差（混杂全进 X 下，tidyverse 散点）----
bind_rows(lapply(types, function(tp) {
  tibble(方法 = tp, 真实风险差 = d$tau, 估计风险差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实风险差, 估计风险差)) +
  geom_point(alpha = 0.12, size = 0.7, color = "#F58518") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 2) +
  labs(title = "混杂全进 X 下估计风险差 vs 真实风险差（二分类 × 观察性）",
       x = "真实风险差（tau）", y = "估计风险差") +
  theme_minimal(base_size = 11)

# 99 收尾 ----
cli::cli_alert_success("脚本 04 完成：二分类结局 × 观察性研究")
