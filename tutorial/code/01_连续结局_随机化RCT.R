# =====================================================================
# 01_连续结局_随机化RCT.R
# 目的：在连续结局的 RCT 数据上，用五种 meta-learner 估计 CATE，并与真实
#       CATE 逐人对账（演示数据生成时已知真值）。
# 输入：无（数据由 mlr3HTE_demo_data() 现场生成）
# 输出：控制台打印的对账表（方法 / ATE / 与真相关 / RMSE）
# 依赖：mlr3, mlr3learners, mlr3HTE, cli
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
  library(cli)
})
set.seed(2026)

# 1 生成演示数据 ----
# 真实 CATE: tau = 1.0 + 0.8*z1 - 0.5*z2 + 0.6*(z1>1 & z2<0)
# 真实基线均值: mu = 6 + 0.4*z1 + 0.5*z2 - 0.02*(age-60) + 0.3*sex
## 1.1 数据长什么样 ----
d <- mlr3HTE_demo_data(n = 4000, treat_frac = 0.5, seed = 1201)
glimpse(d$X)

cli::cli_alert_info("真实 ATE = {round(d$ate, 4)}；真实 tau 标准差 = {round(sd(d$tau), 4)}")
cli::cli_alert_info("处理率 = {mean(d$A)}；协变量 = {paste(names(d$X), collapse = ', ')}")

# 2 设定基学习器 ----
# 连续结局必须配 regr.* 学习器；这里用随机森林
lb <- lrn("regr.ranger", num.trees = 300, seed = 1)

# 3 逐个拟合五种 meta-learner 并对账 ----
## 3.1 拟合 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
})
names(fits) <- types

## 3.2 组装对账表 ----
# RMSE 用真实 tau 作参照；相关衡量是否捕捉到了异质性
tab <- data.frame(
  方法     = types,
  平均CATE = round(vapply(fits, function(f) f$ate, numeric(1)), 4),
  真实ATE  = round(d$ate, 4),
  与真相关 = round(vapply(fits, function(f) cor(f$cate_train, d$tau), numeric(1)), 3),
  估计SD   = round(vapply(fits, function(f) sd(f$cate_train), numeric(1)), 4),
  RMSE     = round(vapply(fits, function(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1)), 4)
)
print(tab)

# 4 看最好的那个的 CATE 分布 ----
## 4.1 取 RMSE 最小的 learner ----
best <- types[which.min(tab$RMSE)]
cli::cli_alert_success("本数据上 RMSE 最小的是 {best}-learner")

## 4.2 CATE 分位数与真实 tau 分位数对照 ----
print(data.frame(
  分位数 = c("0%", "25%", "50%", "75%", "100%"),
  估计值 = round(quantile(fits[[best]]$cate_train, c(0, .25, .5, .75, 1)), 3),
  真实值 = round(quantile(d$tau, c(0, .25, .5, .75, 1)), 3)
))

# 5 用新数据预测 ----
## 5.1 造一批"新病人" ----
newX <- d$X[1:5, ]
print(data.frame(newX, CATE = round(fits[[best]]$predict(newX), 3)))

# 6 二阶段学习器正则化的影响 ----
# R 的伪结果噪声很大；ranger 回归默认 min.node.size = 5 时树太深，
# 会把噪声也拟合进去。引擎默认改成 50，这里显式对比两种设置。
r_reg <- metalearner("R", d$X, d$A, d$Y, learner_base = lb,
                     learner_tau = lrn("regr.ranger", num.trees = 500,
                                       min.node.size = 50, seed = 1))
r_raw <- metalearner("R", d$X, d$A, d$Y, learner_base = lb,
                     learner_tau = lrn("regr.ranger", num.trees = 500,
                                       min.node.size = 5, seed = 1))
print(data.frame(
  设置     = c("min.node.size = 50（引擎默认）", "min.node.size = 5（ranger 默认）"),
  ATE      = round(c(r_reg$ate, r_raw$ate), 4),
  与真相关 = round(c(cor(r_reg$cate_train, d$tau),
                     cor(r_raw$cate_train, d$tau)), 3),
  RMSE     = round(c(sqrt(mean((r_reg$cate_train - d$tau)^2)),
                     sqrt(mean((r_raw$cate_train - d$tau)^2))), 4)
))

# 99 收尾 ----
cli::cli_alert_success("脚本 01 完成：连续结局 × RCT")
