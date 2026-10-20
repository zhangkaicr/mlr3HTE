# =====================================================================
# 01_连续结局_随机化RCT.R
# 目的：在连续结局的 RCT 数据上，用五种 meta-learner 估计 CATE，并与真实
#       CATE 逐人对账（演示数据生成时已知真值）。效应度量 = 均值差。
# 输入：无（数据由 mlr3HTE_demo_data() 现场生成）
# 输出：DAG 图、真值卡、五种 learner 的对账表、估计 vs 真实 CATE 散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/01_连续结局_随机化RCT.R
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
# Rscript 默认 pdf 设备编码不支持中文，DAG 标题会报 mbcsToSbcs；换 cairo png。
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP（与 tutorial/00 一致，逐行照抄 R/api.R）：
#   z1 = scale(lac), z2 = scale(tumor)
#   tau = 1.0 + 0.8*z1 - 0.5*z2 + 0.6*(z1>1 & z2<0)     # 真实 CATE
#   mu  = 6 + 0.4*z1 + 0.5*z2 - 0.02*(age-60) + 0.3*sex  # 基线结局
#   A   ~ Bern(0.5)                                       # 随机化，与 X 无关
#   Y   = mu + A*tau + N(0,1)
# 因果结构：X 同时驱动 tau 与 mu；A 随机化（无父节点）；tau、mu、A → Y。无混杂。
print(mlr3HTE_dag("rct", "continuous"))

## 1.1 生成数据并打印真值卡 ----
d <- mlr3HTE_demo_data(n = 4000, treat_frac = 0.5, seed = 1201)
glimpse(d$X)

tibble(
  项目 = c("真实 ATE", "CATE 标准差", "CATE 最小", "CATE 最大", "处理率"),
  值   = round(c(d$ate, sd(d$tau), min(d$tau), max(d$tau), mean(d$A)), 4)
) |> print()

# 2 设定基学习器 ----
# 连续结局必须配 regr.* 学习器（配 classif.* 引擎会报"结局类型不匹配"）；
# 这里用随机森林：能自动捕捉 z1、z2 与 tau 的非线性/交互关系。
lb <- lrn("regr.ranger", num.trees = 300, seed = 1)

# 3 逐个拟合五种 meta-learner 并对账 ----
## 3.1 拟合 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
})
names(fits) <- types

## 3.2 组装对账表（tidyverse）----
# 指标约定：ATE 看人群平均是否对得上；相关看是否捕捉到异质性；
#           RMSE 综合看逐人估计误差。全部用 tibble 组织。
tab <- tibble(
  方法     = types,
  平均CATE = vapply(fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  与真相关 = vapply(fits, \(f) cor(f$cate_train, d$tau), numeric(1)),
  估计SD   = vapply(fits, \(f) sd(f$cate_train), numeric(1)),
  RMSE     = vapply(fits, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1))
) |>
  mutate(across(where(is.double), \(x) round(x, 4)))
print(tab)

# 4 结果可视化：估计 CATE vs 真实 CATE ----
# 每个点是一个病人。点越贴近 45° 红线，说明个体效应估计越准。
## 4.1 取 RMSE 最小的 learner ----
best <- types[which.min(tab$RMSE)]
cli::cli_alert_success("本数据上 RMSE 最小的是 {best}-learner")

## 4.2 散点图（tidyverse）----
bind_rows(lapply(types, function(tp) {
  tibble(方法 = tp, 真实CATE = d$tau, 估计CATE = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实CATE, 估计CATE)) +
  geom_point(alpha = 0.12, size = 0.7, color = "#4C78A8") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 2) +
  labs(title = "五种 metalearner：估计 CATE vs 真实 CATE（连续 × RCT）",
       subtitle = "点贴 45° 红线越紧越好；撒得越开说明个体效应没学准",
       x = "真实 CATE（tau）", y = "估计 CATE") +
  theme_minimal(base_size = 11)

# 5 CATE 分位数对照（tidyverse）----
# 把估计与真实的分位数并排放，看整体分布有没有被压平（S-learner 常压平）。
tibble(
  分位数 = c("0%", "25%", "50%", "75%", "100%"),
  估计值 = quantile(fits[[best]]$cate_train, c(0, .25, .5, .75, 1)),
  真实值 = quantile(d$tau, c(0, .25, .5, .75, 1))
) |>
  mutate(across(c(估计值, 真实值), \(x) round(x, 3))) |>
  print()

# 6 用新数据预测 ----
## 6.1 造一批"新病人"，直接给出 CATE ----
newX <- d$X[1:5, ]
bind_cols(newX, CATE = round(fits[[best]]$predict(newX), 3)) |> print()

# 7 二阶段学习器正则化的影响 ----
# R-learner 的伪结果噪声很大；ranger 回归默认 min.node.size = 5 时树太深，
# 会把噪声也拟合进去。引擎默认改成 50，这里显式对比两种设置。
r_reg <- metalearner("R", d$X, d$A, d$Y, learner_base = lb,
                     learner_tau = lrn("regr.ranger", num.trees = 500,
                                       min.node.size = 50, seed = 1))
r_raw <- metalearner("R", d$X, d$A, d$Y, learner_base = lb,
                     learner_tau = lrn("regr.ranger", num.trees = 500,
                                       min.node.size = 5, seed = 1))
tibble(
  设置     = c("min.node.size = 50（引擎默认）", "min.node.size = 5（ranger 默认）"),
  ATE      = c(r_reg$ate, r_raw$ate),
  与真相关 = c(cor(r_reg$cate_train, d$tau), cor(r_raw$cate_train, d$tau)),
  RMSE     = c(sqrt(mean((r_reg$cate_train - d$tau)^2)),
               sqrt(mean((r_raw$cate_train - d$tau)^2)))
) |>
  mutate(across(c(ATE, 与真相关, RMSE), \(x) round(x, 4))) |>
  print()

# 99 收尾 ----
cli::cli_alert_success("脚本 01 完成：连续结局 × RCT")
