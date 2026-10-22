# =====================================================================
# 02_连续结局_观察性研究.R
# 目的：演示观察性数据里的混杂偏倚，以及 IPTW / 外部权重如何把它拉回来。
#       核心对照：未调整差分（有偏） vs IPTW 校正（无偏）。
# 输入：无（数据由 mlr3HTE_demo_obs() 现场生成，含真实 PS）
# 输出：DAG、真值卡、偏倚对照表、估计 vs 真实 CATE 散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli
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
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP：结局机制与 01 完全相同，唯一区别是处理分配不再随机：
#   e  = plogis(-0.5 + 0.8*z1 + 0.4*z2)   # 病情越重（z1）越易接受治疗
#   A  ~ Bern(e)                           # A 依赖 X → confounding by indication
# 因果结构：X → e → A 打开后门 A<-e<-X->mu->Y（红线），A 与 Y 都被 X 影响。
# 所以"处理组均值 - 对照组均值"会混进病情的影响，必须校正。
print(mlr3HTE_dag("obs", "continuous"))

## 1.1 生成数据 ----
d <- mlr3HTE_demo_obs(n = 4000, seed = 1204)

## 1.2 真值卡 + 未调整差（tidyverse）----
naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
tibble(
  指标 = c("真实 ATE", "未调整差分", "未调整偏倚", "处理率"),
  值   = round(c(d$ate, naive, naive - d$ate, mean(d$A)), 4)
) |> print()

# 2 先看混杂有多严重：组间基线不平衡 ----
# 处理组的 lac（病情）明显高于对照组——这正是偏倚的来源。
d$X |>
  mutate(A = d$A) |>
  group_by(A) |>
  summarise(n = n(), 平均lac = mean(lac), 平均tumor = mean(tumor),
            平均age = mean(age), .groups = "drop") |>
  mutate(across(c(平均lac, 平均tumor, 平均age), \(x) round(x, 3))) |>
  print()
cli::cli_alert_warning("两组基线的 lac/tumor 明显不同——不校正就会把'病情效应'误当成'治疗效应'")

# 3 IPTW 校正（内部训 PS 模型）----
# 引擎内部用分类器拟合 e(X)=P(A=1|X)，再构造 1/e 与 1/(1-e) 的权重，
# 让加权后的处理组与对照组在协变量上可比。
lb <- lrn("regr.ranger", num.trees = 300, seed = 1)
fit_iptw <- metalearner("X", d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")

## 3.1 稳定化权重版本 ----
# 稳定化权重把权重均值拉回 1，方差更小、更稳。
fit_stab <- metalearner("X", d$X, d$A, d$Y, learner_base = lb,
                        weighting = "iptw", stabilize = TRUE)

# 4 外部权重（用真实 PS，教学时用来验证）----
# 直接喂入数据生成时的真实倾向得分，验证"权重对了、估计就该对"。
w_true <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
fit_ext <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb,
                       weighting = "external", weights = w_true)

# 5 偏倚对照表（tidyverse）----
# 对账四件套：ATE 偏差（平均对不对）/ CATE 相关（异质性抓没抓到）/
#           RMSE（逐人误差）/ 估计SD vs 真实SD（有没有被压平）
cate_cols <- list(
  未调整            = rep(NA_real_, 3),
  `IPTW + X`       = c(cor(fit_iptw$cate_train, d$tau),
                       sqrt(mean((fit_iptw$cate_train - d$tau)^2)),
                       sd(fit_iptw$cate_train)),
  `IPTW稳定化 + X` = c(cor(fit_stab$cate_train, d$tau),
                       sqrt(mean((fit_stab$cate_train - d$tau)^2)),
                       sd(fit_stab$cate_train)),
  `真实PS + DR`    = c(cor(fit_ext$cate_train, d$tau),
                       sqrt(mean((fit_ext$cate_train - d$tau)^2)),
                       sd(fit_ext$cate_train))
)
tibble(
  方法     = c("未调整差分", "IPTW + X-learner", "IPTW(稳定化) + X-learner",
               "真实PS外部权重 + DR"),
  估计     = c(naive, fit_iptw$ate, fit_stab$ate, fit_ext$ate),
  真实ATE  = d$ate,
  偏差     = c(naive, fit_iptw$ate, fit_stab$ate, fit_ext$ate) - d$ate,
  与真相关 = vapply(cate_cols, \(x) x[1], numeric(1)),
  RMSE     = vapply(cate_cols, \(x) x[2], numeric(1)),
  估计SD   = vapply(cate_cols, \(x) x[3], numeric(1)),
  真实SD   = sd(d$tau)
) |>
  mutate(across(c(估计, 真实ATE, 偏差, 与真相关, RMSE, 估计SD, 真实SD),
                \(x) round(x, 4))) |>
  print()

# 6 偏倚可视化：一眼看出"未调整 vs 校正" ----
# 虚线 = 真实 ATE。未调整那根明显偏高，校正后都落回真实值附近。
tibble(
  方法 = c("未调整", "IPTW+X", "IPTW稳定+X", "真实PS+DR"),
  估计 = c(naive, fit_iptw$ate, fit_stab$ate, fit_ext$ate)
) |>
  ggplot(aes(x = 方法, y = 估计)) +
  geom_col(fill = "#4C78A8", width = 0.6) +
  geom_hline(yintercept = d$ate, linetype = "dashed", color = "#E45756",
             linewidth = 0.9) +
  labs(title = "混杂偏倚：未调整差分 vs 校正后的 ATE",
       subtitle = sprintf("红色虚线 = 真实 ATE = %.3f；未调整那根明显偏高", d$ate),
       x = NULL, y = "ATE 估计") +
  theme_minimal(base_size = 12)

# 7 五种 learner 在 IPTW 下的表现（tidyverse）----
# 校正的不是某个 learner，而是"权重"；权重对了，五种 learner 都该接近真值。
types <- c("S", "T", "X", "R", "DR")
iptw_fits <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb, weighting = "iptw"))
names(iptw_fits) <- types

tibble(
  方法     = types,
  IPTW_ATE = vapply(iptw_fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  偏差     = vapply(iptw_fits, \(f) f$ate, numeric(1)) - d$ate,
  与真相关 = vapply(iptw_fits, \(f) cor(f$cate_train, d$tau), numeric(1)),
  RMSE     = vapply(iptw_fits, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1)),
  估计SD   = vapply(iptw_fits, \(f) sd(f$cate_train), numeric(1)),
  真实SD   = sd(d$tau)
) |>
  mutate(across(c(IPTW_ATE, 真实ATE, 偏差, 与真相关, RMSE, 估计SD, 真实SD),
                \(x) round(x, 4))) |>
  print()

# 8 一个重要的提醒 ----
# 观察性研究里，加权/双重稳健只能校正【已测量】的混杂。
# 本演示数据的混杂全部由 X 中的协变量造成，所以能完全校正；
# 真实研究里若存在未测量混杂，任何方法都救不回来——这是设计层面的问题。
cli::cli_alert_info(
  "提示：本数据的混杂全部来自已测量协变量，故 IPTW 可完全校正；真实研究需自行论证可交换性。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 02 完成：连续结局 × 观察性研究")
