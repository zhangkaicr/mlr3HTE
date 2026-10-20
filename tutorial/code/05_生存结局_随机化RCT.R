# =====================================================================
# 05_生存结局_随机化RCT.R
# 目的：生存结局的 CATE 估计。效应度量是【t0 时点生存概率差】
#       S1(t0|X) - S0(t0|X)。重点讲清删失的两层处理。
# 输入：无（数据由 mlr3HTE_demo_surv() 现场生成）
# 输出：控制台打印的对账表 + 删失处理说明
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/05_生存结局_随机化RCT.R
# =====================================================================

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(mlr3)
  library(mlr3learners)
  library(survival)
  library(dplyr)
  library(cli)
})
set.seed(2026)

# 1 生成生存结局的 RCT 数据 ----
# 指数基线风险，治疗把风险乘以 exp(-tau)，tau 随协变量变化；含随机关闭
t0 <- 2
d <- mlr3HTE_demo_surv(n = 4000, treat_frac = 0.5, t0 = t0, seed = 1203)

## 1.1 数据结构：Y 是 Surv 对象（时间 + 事件指示两列）----
print(head(d$Y))
cli::cli_alert_info(
  "真实 ATE（S1({t0}) - S0({t0})）= {round(d$ate, 4)}；删失比例 = {round(100 * mean(d$Y[, 2] == 0), 1)}%"
)
cli::cli_alert_info("中位随访时间 = {round(median(d$Y[, 1]), 3)}")

# 2 基学习器：原生生存模型（不依赖 mlr3proba）----
# "coxph"（默认，线性，可解释）或 "ranger"（非线性，需装 ranger 包）
# 注意：mlr3 的 lrn("surv.*") 不能用——那需要 mlr3proba，本包不引入这个依赖
lb <- "coxph"

## 2.1 三种基学习器都试试 ----
print(data.frame(
  基学习器 = c("coxph", "ranger"),
  ATE = round(vapply(c("coxph", "ranger"), function(k)
    metalearner("T", d$X, d$A, d$Y, learner_base = k, t0 = t0)$ate, numeric(1)), 4),
  真实ATE = round(d$ate, 4)
))

# 3 t0 的选择 ----
## 3.1 不指定 t0 时取事件时间中位数 ----
fit_auto <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)
cli::cli_alert_info(
  "未指定 t0 时引擎取事件时间中位数 = {round(fit_auto$t0, 4)}，对应 ATE = {round(fit_auto$ate, 4)}"
)

## 3.2 换 t0 看效应怎么变 ----
# 生存概率差是【时间点依赖】的：同样的治疗，在不同 t0 上效应不同。
# 这一点和连续/二分类结局很不一样，报告时必须写清 t0。
print(data.frame(
  t0   = c(1, 2, 4),
  ATE  = round(vapply(c(1, 2, 4), function(tt)
    metalearner("T", d$X, d$A, d$Y, learner_base = lb, t0 = tt)$ate, numeric(1)), 4)
))

# 4 五种 learner 对账 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, t0 = t0)
})
names(fits) <- types

print(data.frame(
  方法     = types,
  平均CATE = round(vapply(fits, function(f) f$ate, numeric(1)), 4),
  真实ATE  = round(d$ate, 4),
  与真相关 = round(vapply(fits, function(f) cor(f$cate_train, d$tau), numeric(1)), 3),
  估计SD   = round(vapply(fits, function(f) sd(f$cate_train), numeric(1)), 4),
  RMSE     = round(vapply(fits, function(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1)), 4)
))

# 5 为什么 S-learner 的相关接近 0 ----
# Cox 是比例风险 + 线性预测结构，A 作为普通协变量进模型后
# 只能表达一个常数对数风险比，无法表达 A × X 的交互，
# 所以 CATE 退化成常数（与真相关≈0）。这不是 bug，是模型结构限制。
cli::cli_alert_warning(
  "S-learner 与真相关 ≈ 0 是 Cox 结构所致：要捕捉异质性请用 T 或 X。"
)

# 6 删失的两层处理 ----
# S / T：结局模型本身就是生存模型（Cox 偏似然），删失已在似然里正确处理。
# X / R / DR：需要个体尺度的结局，取 I(T > t0)，此时乘上删失 IPCW 权重
#             1 / G(Ti-)，G 由对删失指示拟合的 Cox 模型得到。
## 6.1 看删失 IPCW 权重的分布 ----
ipcw <- mlr3HTE:::.surv_ipcw(d$Y[, 1], d$Y[, 2], d$X)
print(data.frame(
  分位数 = c("0%", "25%", "50%", "75%", "100%"),
  权重   = round(quantile(ipcw, c(0, .25, .5, .75, 1)), 4)
))
cli::cli_alert_info(
  "权重下界已被截断到 0.01，避免极端权重把估计搅坏；无删失时权重全为 1。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 05 完成：生存结局 × RCT")
