# =====================================================================
# 02_连续结局_观察性研究.R
# 目的：演示观察性数据里的混杂偏倚，以及 IPTW / 外部权重如何把它拉回来。
#       核心对照：未调整差分（有偏） vs IPTW 校正（无偏）。
# 输入：无（数据由 mlr3HTE_demo_obs() 现场生成，含真实 PS）
# 输出：控制台打印的偏倚对照表
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/02_连续结局_观察性研究.R
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

# 1 生成有混杂的观察性数据 ----
# 混杂结构：病情越重（z1 高）越容易接受处理，而病情本身又影响结局。
# 所以"处理组 - 对照组"的粗差分会同时混进病情的影响。
d <- mlr3HTE_demo_obs(n = 4000, seed = 1204)

## 1.1 先看混杂有多严重 ----
# 处理组与对照组的基线协变量分布差异（用 lac 作代表）
print(d$X |>
  mutate(A = d$A) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = round(mean(lac), 3), 平均age = round(mean(age), 1),
            .groups = "drop"))

cli::cli_alert_info(
  "真实 ATE = {round(d$ate, 4)}；处理率 = {round(mean(d$A), 3)}"
)

# 2 未调整差分：有偏的基线 ----
## 2.1 粗差分 ----
naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
cli::cli_alert_warning(
  "未调整差分 = {round(naive, 4)}，偏差 = {round(naive - d$ate, 4)}"
)

# 3 IPTW 校正（内部训 PS 模型）----
## 3.1 基学习器与拟合 ----
lb <- lrn("regr.ranger", num.trees = 300, seed = 1)
fit_iptw <- metalearner("X", d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")

## 3.2 稳定化权重版本 ----
# 稳定化权重把权重均值拉回 1，方差更小、更稳
fit_stab <- metalearner("X", d$X, d$A, d$Y, learner_base = lb,
                        weighting = "iptw", stabilize = TRUE)

# 4 外部权重（用真实 PS，教学时用来验证）----
## 4.1 真实 PS 构造的 IPTW ----
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true)

# 5 偏倚对照表 ----
print(data.frame(
  方法           = c("未调整差分", "IPTW + X-learner", "IPTW(稳定化) + X-learner",
                     "真实PS外部权重 + DR"),
  估计           = round(c(naive, fit_iptw$ate, fit_stab$ate, fit_ext$ate), 4),
  真实ATE        = round(d$ate, 4),
  偏差           = round(c(naive, fit_iptw$ate, fit_stab$ate, fit_ext$ate) - d$ate, 4),
  与真相关       = round(c(NA, cor(fit_iptw$cate_train, d$tau),
                           cor(fit_stab$cate_train, d$tau),
                           cor(fit_ext$cate_train, d$tau)), 3)
))

# 6 五种 learner 在 IPTW 下的表现 ----
## 6.1 逐一拟合 ----
types <- c("S", "T", "X", "R", "DR")
tab <- data.frame(
  方法     = types,
  IPTW_ATE = round(vapply(types, function(tp)
    metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")$ate,
    numeric(1)), 4),
  真实ATE  = round(d$ate, 4),
  与真相关 = round(vapply(types, function(tp)
    cor(metalearner(tp, d$X, d$A, d$Y, learner_base = lb,
                    weighting = "iptw")$cate_train, d$tau), numeric(1)), 3)
)
print(tab)

# 7 一个重要的提醒 ----
# 观察性研究里，加权/双重稳健只能校正【已测量】的混杂。
# 本演示数据的混杂全部由 X 中的协变量造成，所以能完全校正；
# 真实研究里若存在未测量混杂，任何方法都救不回来——这是设计层面的问题。
cli::cli_alert_info(
  "提示：本数据的混杂全部来自已测量协变量，故 IPTW 可完全校正；真实研究需自行论证可交换性。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 02 完成：连续结局 × 观察性研究")
