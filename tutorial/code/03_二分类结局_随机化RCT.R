# =====================================================================
# 03_二分类结局_随机化RCT.R
# 目的：二分类结局的 CATE 估计。效应度量是【风险差】
#       P(Y(1)=1|X) - P(Y(0)=1|X)，不是对数比也不是比值比。
# 输入：无（数据由 mlr3HTE_demo_binary() 现场生成）
# 输出：控制台打印的对账表
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/03_二分类结局_随机化RCT.R
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

# 1 生成二分类结局的 RCT 数据 ----
# logit P(Y=1|A=0) = -1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex
# 治疗在对数几率尺度上加 tau_logit = 0.6 + 0.5*z1 - 0.4*z2
# 风险差尺度的真实 CATE 由基线概率换算，随数据返回
d <- mlr3HTE_demo_binary(n = 4000, treat_frac = 0.5, seed = 1202)

## 1.1 结局与真值概览 ----
glimpse(d$X)
print(table(结局Y = d$Y, 处理A = d$A))
cli::cli_alert_info(
  "真实 ATE（风险差）= {round(d$ate, 4)}；结局事件率 = {round(mean(d$Y), 3)}"
)

# 2 基学习器必须是分类学习器 ----
# 引擎按 learner_base 的类型自动判定 outcome = "binary"，
# 结局模型返回 P(Y=1|X)，所以 CATE 天然落在风险差尺度上
lb <- lrn("classif.ranger", num.trees = 300, seed = 1)

## 2.1 类型判定的结果 ----
fit0 <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)
cli::cli_alert_info("引擎判定的结局类型 = {fit0$outcome}")
stopifnot(identical(fit0$outcome, "binary"))

# 3 五种 learner 对账 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
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

# 4 风险差 vs 对数比：为什么用风险差 ----
## 4.1 同一个病人，两种尺度给出的人群排序可能不同 ----
# 风险差直接回答"多治好几个"，临床沟通更直观；
# 对数比是常数尺度，异质性只体现在风险差上。
# 这里演示：真实 tau 在风险差尺度上的分布
print(data.frame(
  分位数 = c("0%", "25%", "50%", "75%", "100%"),
  真实风险差 = round(quantile(d$tau, c(0, .25, .5, .75, 1)), 4)
))
cli::cli_alert_info(
  "本 DGP 的治疗效应在对数比尺度上是异质的，因此风险差尺度上也有异质性（如上表）。"
)

# 5 基学习器类型不匹配会报错 ----
## 5.1 用 regr.* 配二分类结局 ----
res <- tryCatch(
  metalearner("T", d$X, d$A, d$Y, learner_base = lrn("regr.ranger")),
  error = function(e) conditionMessage(e)
)
print(res)

# 99 收尾 ----
cli::cli_alert_success("脚本 03 完成：二分类结局 × RCT")
