# =====================================================================
# 06_生存结局_观察性研究.R
# 目的：生存结局 + 混杂。这里有两层权重相乘：
#       混杂校正的 IPTW  ×  删失校正的 IPCW。
# 输入：无（数据由 mlr3HTE_demo_obs_surv() 现场生成，含真实 PS）
# 输出：控制台打印的偏倚对照表 + 两层权重说明
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/06_生存结局_观察性研究.R
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

# 1 生成有混杂的生存观察性数据 ----
# 混杂结构同 mlr3HTE_demo_obs：病情越重越容易接受处理
t0 <- 2
d <- mlr3HTE_demo_obs_surv(n = 4000, t0 = t0, seed = 1206)

## 1.1 组间基线差异与删失情况 ----
print(d$X |>
  mutate(A = d$A, 时间 = d$Y[, 1], 事件 = d$Y[, 2]) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = round(mean(lac), 3),
            中位随访 = round(median(时间), 3),
            事件率 = round(mean(事件), 3), .groups = "drop"))

cli::cli_alert_info(
  "真实 ATE（S1({t0}) - S0({t0})）= {round(d$ate, 4)}；处理率 = {round(mean(d$A), 3)}；删失 = {round(100 * mean(d$Y[, 2] == 0), 1)}%"
)

# 2 未调整的"粗"对照：t0 处生存概率差 ----
# 用 Kaplan-Meier 分别在两组估计 S(t0)，直接相减（不做任何协变量校正）
km <- survfit(Surv(d$Y[, 1], d$Y[, 2]) ~ d$A)
s_at <- summary(km, times = t0)$surv
naive <- s_at[2] - s_at[1]
cli::cli_alert_warning(
  "未调整 KM 生存概率差 = {round(naive, 4)}，偏差 = {round(naive - d$ate, 4)}"
)

# 3 IPTW 校正（混杂）× IPCW（删失）----
# 引擎会把两层权重相乘：w = IPTW × IPCW，X/R/DR 的个体尺度分析直接受益；
# S/T 的生存模型自身处理删失，只用 IPTW 部分。
lb <- "coxph"
fit <- metalearner("X", d$X, d$A, d$Y, learner_base = lb,
                   weighting = "iptw", t0 = t0)
cli::cli_alert_success(
  "IPTW + X-learner = {round(fit$ate, 4)}，偏差 = {round(fit$ate - d$ate, 4)}"
)

# 4 五种 learner 在 IPTW 下的表现 ----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw", t0 = t0))
names(fits) <- types

print(data.frame(
  方法     = types,
  IPTW_ATE = round(vapply(fits, function(f) f$ate, numeric(1)), 4),
  真实ATE  = round(d$ate, 4),
  偏差     = round(vapply(fits, function(f) f$ate, numeric(1)) - d$ate, 4),
  与真相关 = round(vapply(fits, function(f) cor(f$cate_train, d$tau), numeric(1)), 3)
))

# 5 两层权重分别长什么样 ----
## 5.1 混杂 IPTW（由内部 PS 模型算出的那部分）----
ps_l <- lrn("classif.log_reg", predict_type = "prob")
g <- mlr3HTE:::.fit_ps(d$X, d$A, ps_l)
e_hat <- g(d$X)
iptw <- mlr3HTE:::.iptw_weights(d$A, e_hat, stabilize = FALSE)

## 5.2 删失 IPCW ----
ipcw <- mlr3HTE:::.surv_ipcw(d$Y[, 1], d$Y[, 2], d$X)

print(data.frame(
  权重      = c("IPTW（混杂）", "IPCW（删失）", "相乘后"),
  最小值    = round(c(min(iptw), min(ipcw), min(iptw * ipcw)), 4),
  中位数    = round(c(median(iptw), median(ipcw), median(iptw * ipcw)), 4),
  最大值    = round(c(max(iptw), max(ipcw), max(iptw * ipcw)), 4)
))

# 6 用真实 PS 走外部权重 ----
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true, t0 = t0)
print(data.frame(
  方法    = c("未调整 KM 差", "IPTW + X", "真实PS外部权重 + DR"),
  估计    = round(c(naive, fit$ate, fit_ext$ate), 4),
  真实ATE = round(d$ate, 4),
  偏差    = round(c(naive, fit$ate, fit_ext$ate) - d$ate, 4)
))

# 99 收尾 ----
cli::cli_alert_success("脚本 06 完成：生存结局 × 观察性研究")
