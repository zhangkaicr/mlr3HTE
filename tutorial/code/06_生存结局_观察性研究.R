# =====================================================================
# 06_生存结局_观察性研究.R
# 目的：生存结局 + 混杂。这里有两类"权重"在引擎内部起作用，但性质完全不同：
#       (a) 删矢 IPCW —— 处理信息删矢，估计量的组成部分，自动计算，不可选；
#       (b) R/DR 的倾向得分 —— 算法定义的一部分（tildeA = A - e），也不可选。
#       去混杂的主路径仍然是：把混杂变量放进 X 条件化。
# 输入：无（数据由 mlr3HTE_demo_obs_surv() 现场生成，含真实 ATE）
# 输出：DAG、真值卡、偏倚对照表、引擎内部三类权重分布表、散点图
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
options(pillar.sigfig = 6)  # 表格默认只显示 3 位有效数字，这里要看到 4 位小数
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
# 因果结构：X→τ、X→μ、X→e→A（红），打开后门；A→Y。两层问题：混杂 + 删矢。
print(mlr3HTE_dag("obs", "survival"))

## 1.1 生成数据 ----
t0 <- 2
d <- mlr3HTE_demo_obs_surv(n = 4000, t0 = t0, seed = 1206)

## 1.2 组间基线差异与删矢情况（tidyverse）----
d$X |>
  mutate(A = d$A, 时间 = d$Y[, 1], 事件 = d$Y[, 2]) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = mean(lac), 中位随访 = median(时间),
            事件率 = mean(事件), .groups = "drop") |>
  mutate(across(c(平均lac, 中位随访, 事件率), \(x) round(x, 3))) |>
  print()

## 1.3 真值卡 ----
tibble(
  项目 = c("真实 ATE（S(t0) 差）", "真实 ATE（RMST 差）", "处理率", "删矢比例"),
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

# 3 主路径：把全部混杂变量放进 X 条件化 ----
# v0.40 起不给 S/T/X 套 IPTW。这里五族都在"混杂全进 X"下跑；
# 交叉拟合只对 R/DR 有意义；删矢 IPCW 由引擎按估计量定义自动加到结局模型上。
lb <- "coxph"
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR"), t0 = t0))
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

# 4 反面对照：漏掉一个混杂因子会怎样 ----
X_miss <- d$X |> select(-lac)
fits_miss <- lapply(types, function(tp)
  metalearner(tp, X_miss, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR"), t0 = t0))
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

# 5 引擎内部的三类"权重"分别长什么样（tidyverse）----
# v0.40 之后权重只剩这三类，且都不是用户可选项：
#   (a) 倾向得分 e(X) —— R/DR 的 tildeA = A - e 用它；survlearners 的 X/R 也用它；
#   (b) R-learner 的结构权重 (A-e)^2 —— Robinson 残差化估计量的组成部分；
#   (c) 删矢 IPCW —— 生存分支处理信息删矢，S 的 coxph 结局模型用它。

## 5.1 倾向得分（内部用 log_reg 估）----
g <- mlr3HTE:::.fit_ps(d$X, d$A, lrn("classif.log_reg", predict_type = "prob"))
e_hat <- g(d$X)

## 5.2 R-learner 的结构权重 ----
w_rob <- (d$A - e_hat)^2

## 5.3 删矢 IPCW ----
ipcw <- mlr3HTE:::.surv_ipcw(d$Y[, 1], d$Y[, 2], d$X)

tibble(
  权重   = c("e(X)（倾向得分）", "(A-e)^2（R 结构权重）", "IPCW（删矢）"),
  最小值 = c(min(e_hat), min(w_rob), min(ipcw)),
  中位数 = c(median(e_hat), median(w_rob), median(ipcw)),
  最大值 = c(max(e_hat), max(w_rob), max(ipcw))
) |>
  mutate(across(c(最小值, 中位数, 最大值), \(x) round(x, 4))) |>
  print()
cli::cli_alert_info("这三类权重都是估计量/算法定义的组成部分，不是可切换的'校正开关'")

# 6 偏倚柱状图（tidyverse）----
tibble(
  方法 = c("未调整 KM", rep("混杂全进X", 5), rep("漏掉lac", 5)),
  估计 = c(naive,
           vapply(fits, \(f) f$ate, numeric(1)),
           vapply(fits_miss, \(f) f$ate, numeric(1)))
) |>
  ggplot(aes(x = 方法, y = 估计, fill = 方法)) +
  geom_col(width = 0.6) +
  geom_hline(yintercept = d$ate, linetype = "dashed", color = "#E45756",
             linewidth = 0.9) +
  scale_fill_manual(values = c("未调整 KM" = "#F58518",
                               "混杂全进X" = "#4C78A8",
                               "漏掉lac" = "#E45756")) +
  labs(title = "生存结局：混杂全进 X 拉回真实值，漏掉 lac 又偏出去",
       subtitle = sprintf("红色虚线 = 真实 S(t0) 差 = %.3f（t0 = %g）", d$ate, t0),
       x = NULL, y = "S(t0) 差") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")

# 7 估计 vs 真实 S(t0) 差（tidyverse 散点图）----
bind_rows(lapply(c("T", "X", "DR"), function(tp) {
  tibble(方法 = tp, 真实S差 = d$tau, 估计S差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实S差, 估计S差)) +
  geom_point(alpha = 0.15, size = 0.7, color = "#54A24B") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 1) +
  labs(title = "混杂全进 X 下估计 S(t0) 差 vs 真实 S(t0) 差（生存 × 观察性，t0 = 2）",
       x = "真实 S(t0) 差（tau）", y = "估计 S(t0) 差") +
  theme_minimal(base_size = 11)

# 99 收尾 ----
cli::cli_alert_success("脚本 06 完成：生存结局 × 观察性研究")
