# =====================================================================
# 05_生存结局_随机化RCT.R
# 目的：生存结局的 CATE 估计。效应度量是【t0 时点生存概率差】
#       S1(t0|X) - S0(t0|X)。重点讲清删失的两层处理与 t0 的时间依赖性。
# 输入：无（数据由 mlr3HTE_demo_surv() 现场生成）
# 输出：DAG、真值卡（含 RMST）、五种 learner 对账表、t0 敏感性表、散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, ggplot2, cli
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
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP：
#   tau = 0.5 + 0.4*z1 - 0.3*z2                              # 对数风险尺度的效应
#   base_rate = exp(-1.0 + 0.3*z1 + 0.2*z2 + 0.1*(age-60)/12 + 0.15*sex)
#   rate = base_rate * exp(-A*tau)                            # 治疗把风险乘以 exp(-tau)
#   T ~ Exp(rate);  C ~ Exp(0.12)（独立删失）;  time = min(T,C), status = I(T<=C)
#   真实 S(t0|A=1,X)=exp(-base_rate*exp(-tau)*t0)；S(t0|A=0,X)=exp(-base_rate*t0)
#   tau = S1(t0) - S0(t0)；RMST(τ)=(1-exp(-λτ))/λ
print(mlr3HTE_dag("rct", "survival"))

## 1.1 生成数据并打印真值卡 ----
t0 <- 2
d <- mlr3HTE_demo_surv(n = 4000, treat_frac = 0.5, t0 = t0, seed = 1203)
head(d$Y)   # Surv 对象：time + status 两列

tibble(
  项目 = c("真实 ATE（S(t0) 差）", "真实 ATE（RMST 差）", "CATE 标准差",
           "处理率", "删失比例", "中位随访"),
  值   = round(c(d$ate, d$ate_rmst, sd(d$tau), mean(d$A),
                 100 * mean(d$Y[, 2] == 0), median(d$Y[, 1])), 4)
) |> print()

# 2 基学习器：原生生存模型（不依赖 mlr3proba）----
# "coxph"（默认，线性，可解释）或 "ranger"（非线性，需装 ranger 包）。
# 注意：mlr3 的 lrn("surv.*") 不能用——那需要 mlr3proba，本包不引入这个依赖。
lb <- "coxph"

## 2.1 两种基学习器都试试 ----
tibble(
  基学习器 = c("coxph", "ranger"),
  ATE = vapply(c("coxph", "ranger"), function(k)
    metalearner("T", d$X, d$A, d$Y, learner_base = k, t0 = t0)$ate, numeric(1)),
  真实ATE = d$ate
) |>
  mutate(across(c(ATE, 真实ATE), \(x) round(x, 4))) |>
  print()

# 3 t0 的选择：生存概率差是时间点依赖的 ----
## 3.1 不指定 t0 时取事件时间中位数 ----
fit_auto <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)
cli::cli_alert_info(
  "未指定 t0 时引擎取事件时间中位数 = {round(fit_auto$t0, 4)}，对应 ATE = {round(fit_auto$ate, 4)}"
)

## 3.2 换 t0 看效应怎么变 ----
# 同样的治疗，在不同 t0 上生存概率差不同——报告时必须写清 t0。
tibble(
  t0  = c(1, 2, 4),
  ATE = vapply(c(1, 2, 4), function(tt)
    metalearner("T", d$X, d$A, d$Y, learner_base = lb, t0 = tt)$ate, numeric(1))
) |>
  mutate(ATE = round(ATE, 4)) |>
  print()
cli::cli_alert_info("注意：本真值卡里的 d$ate 只对应 t0 = {t0}；其它 t0 无真值对照，只观察趋势。")

# 4 五种 learner 对账（tidyverse）----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, t0 = t0)
})
names(fits) <- types

tibble(
  方法     = types,
  平均CATE = vapply(fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  与真相关 = vapply(fits, \(f) cor(f$cate_train, d$tau), numeric(1)),
  估计SD   = vapply(fits, \(f) sd(f$cate_train), numeric(1)),
  RMSE     = vapply(fits, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1))
) |>
  mutate(across(where(is.double), \(x) round(x, 4))) |>
  print()

# 5 估计 vs 真实生存概率差（tidyverse 散点图，取 T/X/DR）----
bind_rows(lapply(c("T", "X", "DR"), function(tp) {
  tibble(方法 = tp, 真实S差 = d$tau, 估计S差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实S差, 估计S差)) +
  geom_point(alpha = 0.15, size = 0.7, color = "#54A24B") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 1) +
  labs(title = "估计 S(t0) 差 vs 真实 S(t0) 差（生存 × RCT，t0 = 2）",
       x = "真实 S(t0) 差（tau）", y = "估计 S(t0) 差") +
  theme_minimal(base_size = 11)

# 6 为什么 S-learner 的相关接近 0 ----
# Cox 是比例风险 + 线性预测结构，A 作为普通协变量进模型后
# 只能表达一个常数对数风险比，无法表达 A × X 的交互，
# 所以 CATE 退化成常数（与真相关≈0）。这不是 bug，是模型结构限制。
cli::cli_alert_warning(
  "S-learner 与真相关 ≈ 0 是 Cox 结构所致：要捕捉异质性请用 T 或 X。"
)

# 7 删失的两层处理 ----
# S / T：结局模型本身就是生存模型（Cox 偏似然），删失已在似然里正确处理。
# X / R / DR：需要个体尺度的结局，取 I(T > t0)，此时乘上删失 IPCW 权重
#             1 / G(Ti-)，G 由对删失指示拟合的 Cox 模型得到。
## 7.1 看删失 IPCW 权重的分布 ----
ipcw <- mlr3HTE:::.surv_ipcw(d$Y[, 1], d$Y[, 2], d$X)
tibble(
  分位数 = c("0%", "25%", "50%", "75%", "100%"),
  权重   = round(quantile(ipcw, c(0, .25, .5, .75, 1)), 4)
) |> print()
cli::cli_alert_info(
  "权重下界已被截断到 0.01，避免极端权重把估计搅坏；无删失时权重全为 1。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 05 完成：生存结局 × RCT")
