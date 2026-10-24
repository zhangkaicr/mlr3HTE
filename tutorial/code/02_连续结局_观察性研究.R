# =====================================================================
# 02_连续结局_观察性研究.R
# 目的：演示观察性数据里的混杂偏倚，以及"把混杂变量放进 X 条件化"如何把它拉回来。
#       核心对照：未调整差分（有偏） vs 混杂全进 X（无偏） vs 漏掉一个混杂因子（有偏）。
# 输入：无（数据由 mlr3HTE_demo_obs() 现场生成，含真实 ATE 与逐人 CATE）
# 输出：DAG、真值卡、基线不平衡表、偏倚对照表、估计 vs 真实 CATE 散点图
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
options(pillar.sigfig = 6)  # 表格默认只显示 3 位有效数字，这里要看到 4 位小数
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

# 3 v0.40 起不再提供 IPTW 加权选项 ----
# 经典 metalearner 文献（Künzel et al. 2019 PNAS）与 CausalML 的 BaseS/BaseT/BaseX
# 都不给结局模型套 IPTW。本包的权重只保留两类"算法定义自带"的用法：
#   (a) R-learner 的 Robinson 权重 (A-e)^2 —— 残差化估计量的组成部分，不可选；
#   (b) 生存分支的删矢 IPCW —— 处理信息删矢，同属估计量组成部分。
# 去混杂的主路径是：把混杂变量放进 X，让结局模型条件化；R/DR 另自带倾向得分。
cli::cli_alert_info("去混杂 = 把混杂变量放进 X 条件化；R/DR 的倾向得分是算法定义的一部分")

# 4 主路径：把全部混杂变量放进 X 条件化 ----
# X 里本来就有全部混杂（lac / tumor / age），S/T/X 靠结局模型条件化，
# R 靠残差化，DR 两个都做。R/DR 涉及"用同一批数据估干扰参数又估 tau"的问题，
# 必须开交叉拟合，否则高弹性学习器会把 tau 系统性衰减。
lb <- lrn("regr.ranger", num.trees = 300, seed = 1)
types <- c("S", "T", "X", "R", "DR")

## 4.1 五族各跑一次（交叉拟合只对 R/DR 有意义）----
# 交叉拟合是为了让干扰参数（mu / m1 / m0 / e）与 tau 不同批数据，
# 只对 R/DR 这类"先估干扰参数再估 tau"的结构生效；S/T/X 没有这个需求。
fits_full <- lapply(types, function(tp)
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR")))
names(fits_full) <- types

## 4.2 偏倚对照表（tidyverse）----
# 对账四件套：ATE 偏差（平均对不对）/ CATE 相关（异质性抓没抓到）/
#           RMSE（逐人误差）/ 估计SD vs 真实SD（有没有被压平）
tibble(
  方法     = c("未调整差分", types),
  估计     = c(naive, vapply(fits_full, \(f) f$ate, numeric(1))),
  真实ATE  = d$ate,
  偏差     = c(naive, vapply(fits_full, \(f) f$ate, numeric(1))) - d$ate,
  与真相关 = c(NA_real_, vapply(fits_full, \(f) cor(f$cate_train, d$tau), numeric(1))),
  RMSE     = c(NA_real_, vapply(fits_full, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1))),
  估计SD   = c(NA_real_, vapply(fits_full, \(f) sd(f$cate_train), numeric(1))),
  真实SD   = sd(d$tau)
) |>
  mutate(across(c(估计, 真实ATE, 偏差, 与真相关, RMSE, 估计SD, 真实SD),
                \(x) round(x, 4))) |>
  print()

## 4.3 挑一个看逐人估计质量：X-learner ----
# 相关性是"标量摘要"，散点才看得出是否整条对角线贴合。
tibble(tau_hat = fits_full$X$cate_train, tau_true = d$tau) |>
  ggplot(aes(x = tau_true, y = tau_hat)) +
  geom_point(alpha = 0.25, size = 1.2, color = "#4C78A8") +
  geom_abline(intercept = 0, slope = 1, linetype = "dashed", color = "#E45756") +
  coord_equal() +
  labs(title = "X-learner：逐人 CATE 估计 vs 真实 CATE",
       subtitle = sprintf("相关 = %.3f，ATE 偏差 = %+.3f",
                          cor(fits_full$X$cate_train, d$tau),
                          fits_full$X$ate - d$ate),
       x = "真实 CATE", y = "估计 CATE") +
  theme_minimal(base_size = 12)

# 5 反面对照：漏掉一个混杂因子会怎样 ----
# 这是"设计层面"的失败：任何统计方法都补不回来。把 lac（病情）从 X 里拿掉，
# 处理分配仍依赖它，后门路径 A<-e<-lac->Y 重新打开。
X_miss <- d$X |> select(-lac)
fits_miss <- lapply(types, function(tp)
  metalearner(tp, X_miss, d$A, d$Y, learner_base = lb,
              cross_fitting = tp %in% c("R", "DR")))
names(fits_miss) <- types

tibble(
  方法     = types,
  全进X    = vapply(fits_full, \(f) f$ate, numeric(1)),
  漏掉lac  = vapply(fits_miss, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate
) |>
  mutate(偏差_漏lac = 漏掉lac - 真实ATE) |>
  mutate(across(c(全进X, 漏掉lac, 真实ATE, 偏差_漏lac), \(x) round(x, 4))) |>
  print()
cli::cli_alert_warning("漏掉 lac 后五族一起偏回 +0.65 量级，与未调整的 +0.69 几乎重合——去混杂靠的是'变量选对'，不是'方法换高级'")

# 6 偏倚可视化：三种情形一眼看清 ----
tibble(
  方法 = c("未调整", rep("混杂全进X", 5), rep("漏掉lac", 5)),
  估计 = c(naive,
           vapply(fits_full, \(f) f$ate, numeric(1)),
           vapply(fits_miss, \(f) f$ate, numeric(1)))
) |>
  ggplot(aes(x = 方法, y = 估计, fill = 方法)) +
  geom_col(width = 0.6) +
  geom_hline(yintercept = d$ate, linetype = "dashed", color = "#E45756",
             linewidth = 0.9) +
  scale_fill_manual(values = c("未调整" = "#F58518",
                               "混杂全进X" = "#4C78A8",
                               "漏掉lac" = "#E45756")) +
  labs(title = "去混杂靠的是变量选对，不是方法换高级",
       subtitle = sprintf("红色虚线 = 真实 ATE = %.3f；蓝色五根是五族在混杂全进 X 下的估计", d$ate),
       x = NULL, y = "ATE 估计") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")

# 7 交叉拟合的必要性（R-learner 最容易踩的坑）----
# R-learner 的 tau 回归以残差 (Y-mu) 为伪结局；mu 若在同一批数据上估，
# 高弹性学习器（ranger 默认 min.node.size=5）会过拟合把残差压向 0，
# tau 整体被砍掉一截。交叉拟合让 mu 在别的折上估，残差保持"外样本"。
fit_r_nocf <- metalearner("R", d$X, d$A, d$Y, learner_base = lb, cross_fitting = FALSE)
tibble(
  情形   = c("R 无交叉拟合", "R 交叉拟合"),
  估计   = c(fit_r_nocf$ate, fits_full$R$ate),
  真实ATE = d$ate,
  偏差   = c(fit_r_nocf$ate, fits_full$R$ate) - d$ate
) |>
  mutate(across(c(估计, 真实ATE, 偏差), \(x) round(x, 4))) |>
  print()
cli::cli_alert_info("R/DR 的干扰参数与 tau 同批数据时，柔性学习器会把 tau 衰减——cross_fitting = TRUE 是默认建议")

# 8 一个重要的提醒 ----
# 条件化只能校正【已测量】的混杂。
# 本演示数据的混杂全部由 X 中的协变量造成，所以能完全校正；
# 真实研究里若存在未测量混杂，任何方法都救不回来——这是设计层面的问题。
cli::cli_alert_info(
  "提示：本数据的混杂全部来自已测量协变量，故条件化可完全校正；真实研究需自行论证可交换性。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 02 完成：连续结局 × 观察性研究")
