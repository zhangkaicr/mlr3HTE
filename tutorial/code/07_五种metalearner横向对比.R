# =====================================================================
# 07_五种metalearner横向对比.R
# 目的：一个脚本跑完"三类结局 × 五种 learner"的全部对比，
#       输出三张对账表，用来判断"我的数据该选哪个 learner"。
# 输入：无（三类结局各用对应的演示数据）
# 输出：控制台打印的三张对账表；data/output/ 下的 CSV（可选）
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/07_五种metalearner横向对比.R
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

types <- c("S", "T", "X", "R", "DR")

# 1 对比用的统一打分函数 ----
# 指标约定：ATE 看人群平均水平是否对得上；相关看是否捕捉到异质性；
#           RMSE 综合看逐人估计误差。
score_row <- function(fit, tau) {
  data.frame(
    平均CATE = round(fit$ate, 4),
    与真相关 = round(cor(fit$cate_train, tau), 3),
    估计SD   = round(sd(fit$cate_train), 4),
    RMSE     = round(sqrt(mean((fit$cate_train - tau)^2)), 4)
  )
}

# 2 连续结局 × RCT ----
## 2.1 拟合五次并汇总 ----
dc <- mlr3HTE_demo_data(n = 3000, seed = 1201)
lb_c <- lrn("regr.ranger", num.trees = 300, seed = 1)
tab_c <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("连续结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, dc$X, dc$A, dc$Y, learner_base = lb_c), dc$tau)
}))
tab_c <- bind_cols(方法 = types, tab_c, 真实ATE = round(dc$ate, 4))
cli::cli_h1("连续结局 × RCT（真实 ATE = {round(dc$ate, 4)}）")
print(tab_c)

# 3 二分类结局 × RCT ----
## 3.1 拟合五次并汇总 ----
db <- mlr3HTE_demo_binary(n = 3000, seed = 1202)
lb_b <- lrn("classif.ranger", num.trees = 300, seed = 1)
tab_b <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("二分类结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, db$X, db$A, db$Y, learner_base = lb_b), db$tau)
}))
tab_b <- bind_cols(方法 = types, tab_b, 真实ATE = round(db$ate, 4))
cli::cli_h1("二分类结局 × RCT（真实 ATE = {round(db$ate, 4)}，风险差尺度）")
print(tab_b)

# 4 生存结局 × RCT ----
## 4.1 拟合五次并汇总 ----
t0 <- 2
ds <- mlr3HTE_demo_surv(n = 3000, t0 = t0, seed = 1203)
tab_s <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("生存结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, ds$X, ds$A, ds$Y, learner_base = "coxph", t0 = t0), ds$tau)
}))
tab_s <- bind_cols(方法 = types, tab_s, 真实ATE = round(ds$ate, 4))
cli::cli_h1("生存结局 × RCT（真实 ATE = {round(ds$ate, 4)}，t0 = {t0} 生存概率差）")
print(tab_s)

# 5 三张表拼成一张总表 ----
## 5.1 加结局类型列后合并 ----
all_tab <- bind_rows(
  连续   = tab_c,
  二分类 = tab_b,
  生存   = tab_s,
  .id = "结局类型"
)
print(all_tab)

## 5.2 按 RMSE 排序找每种结局的最优 learner ----
print(all_tab |>
  group_by(结局类型) |>
  slice_min(RMSE, n = 1) |>
  select(结局类型, 方法, 与真相关, RMSE) |>
  ungroup())

# 6 观察性：IPTW 下的横向对比（连续 + 二分类 + 生存）----
## 6.1 连续观察性 ----
do_c <- mlr3HTE_demo_obs(n = 3000, seed = 1204)
tab_oc <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_c$X, do_c$A, do_c$Y, learner_base = lb_c,
              weighting = "iptw") |> score_row(do_c$tau)))
tab_oc <- bind_cols(方法 = types, tab_oc, 真实ATE = round(do_c$ate, 4))
cli::cli_h1("连续结局 × 观察性（IPTW；真实 ATE = {round(do_c$ate, 4)}）")
print(tab_oc)

## 6.2 二分类观察性 ----
do_b <- mlr3HTE_demo_obs_binary(n = 3000, seed = 1205)
tab_ob <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_b$X, do_b$A, do_b$Y, learner_base = lb_b,
              weighting = "iptw") |> score_row(do_b$tau)))
tab_ob <- bind_cols(方法 = types, tab_ob, 真实ATE = round(do_b$ate, 4))
cli::cli_h1("二分类结局 × 观察性（IPTW；真实 ATE = {round(do_b$ate, 4)}）")
print(tab_ob)

## 6.3 生存观察性 ----
do_s <- mlr3HTE_demo_obs_surv(n = 3000, t0 = t0, seed = 1206)
tab_os <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_s$X, do_s$A, do_s$Y, learner_base = "coxph",
              weighting = "iptw", t0 = t0) |> score_row(do_s$tau)))
tab_os <- bind_cols(方法 = types, tab_os, 真实ATE = round(do_s$ate, 4))
cli::cli_h1("生存结局 × 观察性（IPTW；真实 ATE = {round(do_s$ate, 4)}）")
print(tab_os)

# 7 结论提示 ----
cli::cli_alert_info(
  "一般规律：X-learner 在组间不均衡时最好；T 稳健；DR 有双重稳健保障；
   R 对二阶段学习器最敏感（需正则化）；S 在基学习器不建模交互时会退化成常数。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 07 完成：五种 meta-learner 横向对比")
