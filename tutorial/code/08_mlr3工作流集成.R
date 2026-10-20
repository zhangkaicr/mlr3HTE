# =====================================================================
# 08_mlr3工作流集成.R
# 目的：演示 R6 Learner 接口——把 metalearner 塞进 mlr3 的
#       resample() / benchmark()，三类结局统一处理。
# 输入：无（数据由演示函数现场生成）
# 输出：控制台打印的重抽样与基准对比结果
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/08_mlr3工作流集成.R
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

# 1 ml_task()：把原始数据编码成 mlr3 Task ----
# mlr3 的 Task 目标列装不下 Surv 对象，所以约定：
#   连续/二分类：目标列 .outcome = Y
#   生存：目标列 .outcome = 随访时间，另加特征列 .status = 事件指示
# 结局类型 / 状态列名 / t0 都记在 task$extra_args 里
## 1.1 三种结局各建一个 Task ----
dc <- mlr3HTE_demo_data(n = 1500, seed = 1201)
db <- mlr3HTE_demo_binary(n = 1500, seed = 1202)
ds <- mlr3HTE_demo_surv(n = 1500, t0 = 2, seed = 1203)

task_c <- ml_task(dc$X, dc$A, dc$Y)
task_b <- ml_task(db$X, db$A, db$Y)
task_s <- ml_task(ds$X, ds$A, ds$Y, t0 = 2)

print(task_c)
print(task_s)

## 1.2 看 Task 里携带的元数据 ----
# 这些元数据在 clone(deep=TRUE)$filter() 与序列化后都保留，
# 所以 resample 分折时不会丢
print(task_s$extra_args)

# 2 直接训练与预测 ----
## 2.1 连续结局 ----
l_c <- lrn("regr.metalearner", metalearner = "T")
l_c$learner_base <- lrn("regr.ranger", num.trees = 200, seed = 1)
l_c$train(task_c)
p_c <- l_c$predict(task_c)
cli::cli_alert_info(
  "连续：CATE 均值 = {round(mean(p_c$response), 4)}（真实 ATE = {round(dc$ate, 4)}）"
)

## 2.2 二分类结局 ----
l_b <- lrn("regr.metalearner", metalearner = "X")
l_b$learner_base <- lrn("classif.ranger", num.trees = 200, seed = 1)
l_b$train(task_b)
p_b <- l_b$predict(task_b)
cli::cli_alert_info(
  "二分类：CATE 均值 = {round(mean(p_b$response), 4)}（真实 ATE = {round(db$ate, 4)}）"
)

## 2.3 生存结局 ----
l_s <- lrn("regr.metalearner", metalearner = "T")
l_s$learner_base <- "coxph"
l_s$train(task_s)
p_s <- l_s$predict(task_s)
cli::cli_alert_info(
  "生存：CATE 均值 = {round(mean(p_s$response), 4)}（真实 ATE = {round(ds$ate, 4)}）"
)

# 3 打分（measure）可用 ----
## 3.1 注意：这里的 mse 是"预测 CATE vs 真实 Y"的误差，不是 CATE 误差 ----
# CATE 是个体效应，没有个体真值可比对，所以 mse 只作流程检查用；
# 真正衡量 CATE 质量要用模拟数据的已知 tau（见脚本 01/03/05）。
print(data.frame(
  结局   = c("连续", "二分类", "生存"),
  regr.mse = round(c(p_c$score(msr("regr.mse")),
                     p_b$score(msr("regr.mse")),
                     p_s$score(msr("regr.mse"))), 4)
))

# 4 resample：三类结局各跑 3 折 CV ----
## 4.1 逐个跑 ----
# 注意：mlr3 的 learner id 只允许字母数字与 . _ -，不能用中文
cases <- list(
  list(nm = "连续",   id = "mm_cont", task = task_c, tp = "T",
       lb = lrn("regr.ranger", num.trees = 100, seed = 1)),
  list(nm = "二分类", id = "mm_bin",  task = task_b, tp = "X",
       lb = lrn("classif.ranger", num.trees = 100, seed = 1)),
  list(nm = "生存",   id = "mm_surv", task = task_s, tp = "T", lb = "coxph")
)
for (cs in cases) {
  l <- lrn("regr.metalearner", id = cs$id, metalearner = cs$tp)
  l$learner_base <- cs$lb
  rr <- resample(cs$task, l, rsmp("cv", folds = 3))
  cli::cli_alert_success(
    "{cs$nm} resample 完成：mse = {paste(round(rr$score()$regr.mse, 4), collapse = ', ')}"
  )
}

# 5 benchmark：多个 learner 横向比较 ----
## 5.1 注意 benchmark 要求 learner 的 id 唯一 ----
grid <- benchmark_grid(
  task_c,
  list(
    lrn("regr.metalearner", id = "metalearner_S", metalearner = "S"),
    lrn("regr.metalearner", id = "metalearner_T", metalearner = "T"),
    lrn("regr.metalearner", id = "metalearner_X", metalearner = "X")
  ),
  rsmp("cv", folds = 3)
)
bm <- benchmark(grid)
# bm$score() 返回 data.table；这里没显式加载 data.table，
# 直接用 [.data.table 的 .() 语法不生效，故先转成 data.frame
print(as.data.frame(bm$score())[, c("learner_id", "regr.mse")])

# 6 可调参数与字段 ----
## 6.1 param_set（可进 tune）----
l <- lrn("regr.metalearner")
print(l$param_set)

## 6.2 字段（R6 public field，不是 param）----
# learner_base / learner_tau / learner_ps / treatment_col / t0 / stabilize
cli::cli_alert_info(
  "可调字段：learner_base, learner_tau, learner_ps, treatment_col, t0, stabilize"
)

## 6.3 自定义处理列名 ----
task_trt <- ml_task(dc$X, dc$A, dc$Y, treatment_col = "trt")
cli::cli_alert_info("自定义处理列名：{task_trt$extra_args$ml_treatment_col}")
l_trt <- lrn("regr.metalearner", metalearner = "T")
l_trt$learner_base <- lrn("regr.ranger", num.trees = 100, seed = 1)
l_trt$train(task_trt)
cli::cli_alert_success(
  "自定义列名下也能训练：CATE 均值 = {round(mean(l_trt$predict(task_trt)$response), 4)}"
)

# 7 切换 metalearner 不需要重建 Learner ----
## 7.1 直接改 param_set 的值 ----
l <- lrn("regr.metalearner")
l$learner_base <- lrn("regr.ranger", num.trees = 100, seed = 1)
for (tp in c("S", "T", "X", "R", "DR")) {
  l$param_set$values$metalearner <- tp
  l$train(task_c)
  cli::cli_alert_info(
    "metalearner = {tp}：CATE 均值 = {round(mean(l$predict(task_c)$response), 4)}"
  )
}

## 7.2 关于 tune 的说明 ----
# metalearner 是 p_fct 参数，理论上可以交给 mlr3tuning 搜索；
# 但 tune 优化的是 task 的 target（即 Y）上的指标，而 CATE 没有个体真值可比对，
# 所以 tune 无法直接选"哪个 learner 的 CATE 最准"。
# 实际选型建议：用脚本 07 的模拟对账（已知真值 tau）来判断。
cli::cli_alert_info(
  "提示：tune 只能优化 Y 上的预测指标，无法直接优化 CATE 误差；\n            选型请用脚本 07 的模拟对账方式（mlr3tuning 本机未安装，故不演示）。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 08 完成：mlr3 工作流集成")
