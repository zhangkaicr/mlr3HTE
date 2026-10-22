# =====================================================================
# 14_RCT基准测试_Qini指标.R
# 目的：在随机化试验数据上，用 Qini / TOC / c-for-benefit 三个不依赖真实 CATE
#       的指标，对五种 meta-learner 做基准测试。这是现实 RCT 数据上唯一可行的
#       模型比较方式——真实 tau 只有模拟数据才有。
# 输入：无（数据由 mlr3HTE_demo_*() 现场生成）
# 输出：基准对比表、Qini / TOC 曲线对比图、in-fold vs out-of-fold 虚高对照
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, tidyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行
#       Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8");
#                  source("tutorial/code/14_RCT基准测试_Qini指标.R", encoding="UTF-8")'
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
  library(tidyr)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 620, type = "cairo"))
}

# 1 先说清楚：什么时候能报什么 ----
# 真实 CATE（tau）只有模拟数据才有。所以：
#   模拟数据  -> 可以报 CATE 相关 / RMSE（教程 01-07 就是这么做的）
#   现实 RCT  -> 没有 tau，只能报 Qini / TOC / c-for-benefit
# 本脚本演示后者，并在最后附上"有真值时两套指标怎么对照着看"。
cli::cli_alert_info("三个指标都建立在随机化带来的可交换性上，RCT 下不需要倾向得分")

# 2 造数据并建立"标尺" ----
# 没有标尺就没法判断一个指标值是好是坏。两条标尺：
#   随机 CATE  -> 指标应贴近 0（Qini）/ 0.5（c-for-benefit）
#   真实 tau   -> 指标的上界参考
d <- mlr3HTE_demo_data(n = 1500, seed = 1201)
n <- nrow(d$X)

set.seed(2)
rnd <- rnorm(n)

scale_tbl <- tibble(
  排序来源 = c("随机 CATE", "真实 tau"),
  qini_normalized = c(qini_coefficient(rnd, d$A, d$Y)$qini_normalized,
                      qini_coefficient(d$tau, d$A, d$Y)$qini_normalized),
  c_for_benefit   = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,
                      c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit)
) |>
  mutate(across(where(is.double), \(x) round(x, 3)))
print(scale_tbl)

# 3 为什么必须交叉拟合 ----
# 在自己训练过的数据上算指标，模型会把训练噪声也排进序里，指标虚高。
# 这里把 X-learner 的三种做法并排看：in-fold（回代自己）/ out-of-fold（交叉拟合）
# / 真实 tau（上界参考）。
lb <- lrn("regr.ranger", num.trees = 300, seed = 1L)

infold_cate <- metalearner("X", d$X, d$A, d$Y, learner_base = lb)$cate_train
bm_x <- hte_benchmark(d$X, d$A, d$Y, learners = "X", n_folds = 5L, seed = 42)
oof_cate <- bm_x$cate$cate

cf_tbl <- tibble(
  做法 = c("in-fold（回代训练数据）", "out-of-fold（5 折交叉拟合）", "真实 tau（参考上界）"),
  qini_normalized = c(qini_coefficient(infold_cate, d$A, d$Y)$qini_normalized,
                      qini_coefficient(oof_cate, d$A, d$Y)$qini_normalized,
                      qini_coefficient(d$tau, d$A, d$Y)$qini_normalized),
  c_for_benefit   = c(c_for_benefit(infold_cate, d$A, d$Y)$c_for_benefit,
                      c_for_benefit(oof_cate, d$A, d$Y)$c_for_benefit,
                      c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit)
) |>
  mutate(across(where(is.double), \(x) round(x, 3)))
print(cf_tbl)
cli::cli_alert_warning(
  "in-fold 的 c-for-benefit 可能超过真实 tau —— 那不是模型好，是把噪声也排序了"
)

# 4 五族基准测试（连续结局 × RCT）----
bm <- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)
print(bm$table)

# 读表要点（tidyverse）：
#   ate            交叉拟合的 ATE，可和真实 ATE 对账
#   qini_*         排序增益；random ≈ 0，越大越好
#   toc_gain       优先处理前排人群的平均超额效应，量纲 = 结局单位
#   c_for_benefit  增益匹配后的 C 统计量；random = 0.5
#   tau_cor/rmse   只有模拟数据才有——现实 RCT 数据这两列不会出现
best_q <- bm$table$learner[which.max(bm$table$qini_normalized)]
cli::cli_alert_success("归一化 Qini 最高的是 {best_q}-learner")

# 5 曲线对比 ----
p_q <- plot_hte_benchmark(bm, "qini")
p_t <- plot_hte_benchmark(bm, "toc")
print(p_q)
print(p_t + labs(subtitle = "灰色虚线 = 全样本 ATE"))

# 6 三类结局都能跑 ----
cli::cli_alert_info("二分类：默认基学习器自动换成 classif.ranger")
db <- mlr3HTE_demo_binary(n = 1500, seed = 1203)
print(as.data.frame(
  hte_benchmark(db$X, db$A, db$Y, tau = db$tau, seed = 42)$table))

cli::cli_alert_info("生存：默认基学习器自动换成 coxph，t0 取事件时间中位数")
ds <- mlr3HTE_demo_surv(n = 1500, seed = 1205)
bm_s <- hte_benchmark(ds$X, ds$A, ds$Y, tau = ds$tau, t0 = ds$t0, seed = 42)
print(as.data.frame(bm_s$table))
print(plot_hte_benchmark(bm_s, "qini"))

# 7 观察性数据 ----
# 随机化不再成立，必须把倾向得分和结局模型一起交进来（DR 三件套）。
# 三个指标的算法不变，只是"观测获益"换成交叉拟合的 DR 伪结局。
cli::cli_alert_info("观察性数据：先算 DR 三件套，再交给 hte_benchmark")
do <- mlr3HTE_demo_obs(n = 1500, seed = 1204)
dr <- dr_pseudo_outcome(do$X, do$A, do$Y, seed = 1)
bm_o <- hte_benchmark(do$X, do$A, do$Y, learners = c("S", "X", "DR"),
                      propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0,
                      tau = do$tau, seed = 42)
print(as.data.frame(bm_o$table))

# 8 现实 RCT 数据的形态 ----
# 没有 tau，输出里就不会有 tau_cor / tau_rmse 两列——这正是真实研究的样子。
bm_real <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "T", "X"),
                         n_folds = 5L, seed = 42)
print(bm_real$table)
cli::cli_alert_info("真实 tau 只有模拟数据才有；现实 RCT 数据请只看 Qini / TOC / c-for-benefit 三列")

# 99 收尾 ----
cli::cli_alert_success("脚本 14 完成：RCT 基准测试（Qini / TOC / c-for-benefit）")
