# =====================================================================
# 07_五种metalearner横向对比.R
# 目的：一个脚本跑完"三类结局 × 五种 learner"的全部对比，
#       输出对账表 + 一张"相关/RMSE"热图，回答"我的数据该选哪个 learner"。
# 输入：无（三类结局各用对应的演示数据；DGP 与 DAG 见 tutorial/00）
# 输出：三张对账表 + 总表 + 热图；data/output/ 下的 CSV（可选）
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, tidyr, ggplot2, cli
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
  library(tidyr)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 700, type = "cairo"))
}

types <- c("S", "T", "X", "R", "DR")

# 1 对比用的统一打分函数 ----
# 指标约定：ATE 看人群平均水平是否对得上；相关看是否捕捉到异质性；
#           RMSE 综合看逐人估计误差。抽成函数因为下面 6 次调用（超过 3 次重复）。
score_row <- function(fit, tau) {
  tibble(
    平均CATE = fit$ate,
    与真相关 = cor(fit$cate_train, tau),
    估计SD   = sd(fit$cate_train),
    RMSE     = sqrt(mean((fit$cate_train - tau)^2))
  )
}

# 2 连续结局 × RCT（DAG: rct / continuous）----
dc <- mlr3HTE_demo_data(n = 3000, seed = 1201)
lb_c <- lrn("regr.ranger", num.trees = 300, seed = 1)
tab_c <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("连续结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, dc$X, dc$A, dc$Y, learner_base = lb_c), dc$tau)
})) |>
  mutate(方法 = types, 真实ATE = dc$ate, .before = 1)
cli::cli_h1("连续结局 × RCT（真实 ATE = {round(dc$ate, 4)}）")
print(tab_c |> mutate(across(where(is.double), \(x) round(x, 4))))

# 3 二分类结局 × RCT（DAG: rct / binary）----
db <- mlr3HTE_demo_binary(n = 3000, seed = 1202)
lb_b <- lrn("classif.ranger", num.trees = 300, seed = 1)
tab_b <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("二分类结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, db$X, db$A, db$Y, learner_base = lb_b), db$tau)
})) |>
  mutate(方法 = types, 真实ATE = db$ate, .before = 1)
cli::cli_h1("二分类结局 × RCT（真实 ATE = {round(db$ate, 4)}，风险差尺度）")
print(tab_b |> mutate(across(where(is.double), \(x) round(x, 4))))

# 4 生存结局 × RCT（DAG: rct / survival）----
t0 <- 2
ds <- mlr3HTE_demo_surv(n = 3000, t0 = t0, seed = 1203)
tab_s <- bind_rows(lapply(types, function(tp) {
  cli::cli_alert_info("生存结局：拟合 {tp}-learner ...")
  score_row(metalearner(tp, ds$X, ds$A, ds$Y, learner_base = "coxph", t0 = t0), ds$tau)
})) |>
  mutate(方法 = types, 真实ATE = ds$ate, .before = 1)
cli::cli_h1("生存结局 × RCT（真实 ATE = {round(ds$ate, 4)}，t0 = {t0} 生存概率差）")
print(tab_s |> mutate(across(where(is.double), \(x) round(x, 4))))

# 5 三张表拼成一张总表（tidyverse）----
all_tab <- bind_rows(
  连续   = tab_c,
  二分类 = tab_b,
  生存   = tab_s,
  .id = "结局类型"
)
print(all_tab |> mutate(across(c(平均CATE, 与真相关, 估计SD, RMSE), \(x) round(x, 4))))

## 5.1 按 RMSE 排序找每种结局的最优 learner ----
print(
  all_tab |>
    group_by(结局类型) |>
    slice_min(RMSE, n = 1) |>
    select(结局类型, 方法, 与真相关, RMSE) |>
    ungroup() |>
    mutate(across(c(与真相关, RMSE), \(x) round(x, 3)))
)

# 6 热图：一眼看出每种结局下哪个 learner 最准 ----
# 两个面板：与真相关（越高越好）、RMSE（越低越好）。
plot_tab <- all_tab |>
  select(结局类型, 方法, 与真相关, RMSE) |>
  pivot_longer(c(与真相关, RMSE), names_to = "指标", values_to = "值")

ggplot(plot_tab, aes(x = 方法, y = 结局类型, fill = 值)) +
  geom_tile(color = "white", linewidth = 0.8) +
  geom_text(aes(label = round(值, 2)), color = "white", fontface = "bold", size = 3.5) +
  facet_wrap(~ 指标, scales = "free_x") +
  scale_fill_gradient(low = "#4C78A8", high = "#E45756") +
  labs(title = "五种 metalearner 横向对比（RCT）",
       subtitle = "左：与真相关（越高越好）  右：RMSE（越低越好）",
       x = NULL, y = NULL) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")

# 7 观察性：混杂全进 X 下的横向对比（连续 + 二分类 + 生存）----
## 7.1 连续观察性 ----
do_c <- mlr3HTE_demo_obs(n = 3000, seed = 1204)
tab_oc <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_c$X, do_c$A, do_c$Y, learner_base = lb_c,
              cross_fitting = tp %in% c("R", "DR")) |> score_row(do_c$tau))) |>
  mutate(方法 = types, 真实ATE = do_c$ate, .before = 1)
cli::cli_h1("连续结局 × 观察性（混杂全进 X；真实 ATE = {round(do_c$ate, 4)}）")
print(tab_oc |> mutate(across(c(平均CATE, 与真相关, 估计SD, RMSE), \(x) round(x, 4))))

## 7.2 二分类观察性 ----
do_b <- mlr3HTE_demo_obs_binary(n = 3000, seed = 1205)
tab_ob <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_b$X, do_b$A, do_b$Y, learner_base = lb_b,
              cross_fitting = tp %in% c("R", "DR")) |> score_row(do_b$tau))) |>
  mutate(方法 = types, 真实ATE = do_b$ate, .before = 1)
cli::cli_h1("二分类结局 × 观察性（混杂全进 X；真实 ATE = {round(do_b$ate, 4)}）")
print(tab_ob |> mutate(across(c(平均CATE, 与真相关, 估计SD, RMSE), \(x) round(x, 4))))

## 7.3 生存观察性 ----
do_s <- mlr3HTE_demo_obs_surv(n = 3000, t0 = t0, seed = 1206)
tab_os <- bind_rows(lapply(types, function(tp)
  metalearner(tp, do_s$X, do_s$A, do_s$Y, learner_base = "coxph",
              cross_fitting = tp %in% c("R", "DR"), t0 = t0) |> score_row(do_s$tau))) |>
  mutate(方法 = types, 真实ATE = do_s$ate, .before = 1)
cli::cli_h1("生存结局 × 观察性（混杂全进 X；真实 ATE = {round(do_s$ate, 4)}）")
print(tab_os |> mutate(across(c(平均CATE, 与真相关, 估计SD, RMSE), \(x) round(x, 4))))

# 8 结论提示 ----
cli::cli_alert_info(
  "一般规律：X-learner 在组间不均衡时最好；T 稳健；DR 有双重稳健保障；
   R 对二阶段学习器最敏感（需正则化）；S 在基学习器不建模交互时会退化成常数。"
)

# 99 收尾 ----
cli::cli_alert_success("脚本 07 完成：五种 meta-learner 横向对比")
