# =====================================================================
# 06_生存结局_观察性研究.R
# 目的：生存结局 + 混杂。这里有【两层权重相乘】：
#       混杂校正的 IPTW  ×  删失校正的 IPCW。
# 输入：无（数据由 mlr3HTE_demo_obs_surv() 现场生成，含真实 PS）
# 输出：DAG、真值卡、偏倚对照表、两层权重分布表、散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, ggplot2, cli
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
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP：结局机制同 05（生存），处理分配同 02（混杂）：
#   tau = 0.5 + 0.4*z1 - 0.3*z2
#   base_rate = exp(-1.0 + 0.3*z1 + 0.2*z2 + 0.1*(age-60)/12 + 0.15*sex)
#   e = plogis(-0.5 + 0.8*z1 + 0.4*z2);  A ~ Bern(e)
#   rate = base_rate * exp(-A*tau);  T ~ Exp(rate);  C ~ Exp(0.12)
# 因果结构：X→τ、X→μ、X→e→A（红），打开后门；A→Y。两层偏倚：混杂 + 删失。
print(mlr3HTE_dag("obs", "survival"))

## 1.1 生成数据 ----
t0 <- 2
d <- mlr3HTE_demo_obs_surv(n = 4000, t0 = t0, seed = 1206)

## 1.2 组间基线差异与删失情况（tidyverse）----
d$X |>
  mutate(A = d$A, 时间 = d$Y[, 1], 事件 = d$Y[, 2]) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = mean(lac), 中位随访 = median(时间),
            事件率 = mean(事件), .groups = "drop") |>
  mutate(across(c(平均lac, 中位随访, 事件率), \(x) round(x, 3))) |>
  print()

## 1.3 真值卡 ----
tibble(
  项目 = c("真实 ATE（S(t0) 差）", "真实 ATE（RMST 差）", "处理率", "删失比例"),
  值   = round(c(d$ate, d$ate_rmst, mean(d$A), 100 * mean(d$Y[, 2] == 0)), 4)
) |> print()

# 2 未调整的"粗"对照：t0 处生存概率差 ----
# 用 Kaplan-Meier 分别在两组估计 S(t0)，直接相减（不做任何协变量校正）。
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

# 4 五种 learner 在 IPTW 下的表现（tidyverse）----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw", t0 = t0))
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

# 5 两层权重分别长什么样（tidyverse）----
## 5.1 混杂 IPTW（由内部 PS 模型算出的那部分）----
ps_l <- lrn("classif.log_reg", predict_type = "prob")
g <- mlr3HTE:::.fit_ps(d$X, d$A, ps_l)
e_hat <- g(d$X)
iptw <- mlr3HTE:::.iptw_weights(d$A, e_hat, stabilize = FALSE)

## 5.2 删失 IPCW ----
ipcw <- mlr3HTE:::.surv_ipcw(d$Y[, 1], d$Y[, 2], d$X)

tibble(
  权重   = c("IPTW（混杂）", "IPCW（删失）", "相乘后"),
  最小值 = c(min(iptw), min(ipcw), min(iptw * ipcw)),
  中位数 = c(median(iptw), median(ipcw), median(iptw * ipcw)),
  最大值 = c(max(iptw), max(ipcw), max(iptw * ipcw))
) |>
  mutate(across(c(最小值, 中位数, 最大值), \(x) round(x, 4))) |>
  print()

# 6 用真实 PS 走外部权重（验证）----
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true, t0 = t0)
tibble(
  方法    = c("未调整 KM 差", "IPTW + X", "真实PS外部权重 + DR"),
  估计    = c(naive, fit$ate, fit_ext$ate),
  真实ATE = d$ate,
  偏差    = c(naive, fit$ate, fit_ext$ate) - d$ate
) |>
  mutate(across(c(估计, 真实ATE, 偏差), \(x) round(x, 4))) |>
  print()

# 7 估计 vs 真实 S(t0) 差（tidyverse 散点图）----
bind_rows(lapply(c("T", "X", "DR"), function(tp) {
  tibble(方法 = tp, 真实S差 = d$tau, 估计S差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实S差, 估计S差)) +
  geom_point(alpha = 0.15, size = 0.7, color = "#54A24B") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 1) +
  labs(title = "IPTW 下估计 S(t0) 差 vs 真实 S(t0) 差（生存 × 观察性，t0 = 2）",
       x = "真实 S(t0) 差（tau）", y = "估计 S(t0) 差") +
  theme_minimal(base_size = 11)

# 99 收尾 ----
cli::cli_alert_success("脚本 06 完成：生存结局 × 观察性研究")
