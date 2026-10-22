# 目的：为六个绘图函数各生成实跑 PNG，供 API 文档页与教程页内嵌。
# 输入：无（全部用 mlr3HTE_bench() 的固定基准数据现场拟合）。
# 输出：docs/assets/img/explain/*.png、docs/assets/img/metrics/qini_curve.png
# 依赖：pkgload::load_all()、ggplot2、ggsave；需 en_US.UTF-8 区域（图形标题为英文，
#       但 ggsave 设备与字体回退仍受区域影响）。
# 注意：所有种子固定，重复运行结果一致。

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
set.seed(1)
suppressMessages({library(ggplot2); pkgload::load_all(".", quiet = TRUE)})

dir.create("docs/assets/img/explain", showWarnings = FALSE, recursive = TRUE)
dir.create("docs/assets/img/metrics", showWarnings = FALSE, recursive = TRUE)

save <- function(p, path, w = 8, h = 5) {
  ggsave(path, p, width = w, height = h, dpi = 110, bg = "white")
  cli::cli_alert_info("写出 {path} ({round(file.size(path)/1024)} KB)")
  p
}

# 1 可解释性三件套 ----
d <- mlr3HTE_bench("rct_lin", "continuous")
fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 300))
ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)

# 1.1 置换重要性 ----
imp <- hte_feature_importance(ex, B = 5, N = 500, seed = 1)
save(plot_hte_importance(imp), "docs/assets/img/explain/importance.png", 7, 4)

# 1.2 偏依赖（两个变量各一张，合并为一张分面图） ----
pd <- hte_pdp(ex, variables = c("lac", "age"), grid_points = 41)
save(plot_hte_pdp(pd), "docs/assets/img/explain/pdp.png", 9, 4)

# 1.3 SHAP 三视图 ----
sv <- hte_shap(ex, n_background = 100, seed = 1)
save(plot_hte_shap(sv, "beeswarm"), "docs/assets/img/explain/shap_beeswarm.png", 8, 5)
save(plot_hte_shap(sv, "dependence", variable = "lac"),
     "docs/assets/img/explain/shap_dependence.png", 7, 5)
save(plot_hte_shap(sv, "waterfall", variable = 1),
     "docs/assets/img/explain/shap_waterfall.png", 8, 5)

# 2 Qini 曲线 ----
# 用基准数据现场算一条模型 Qini 与随机靶向参考线，与 plot_qini() 的默认输出一致。
qc <- qini_curve(fit$predict(d$X), d$A, d$Y)
save(plot_qini(qc), "docs/assets/img/metrics/qini_curve.png", 7, 5)

# 3 DAG 两种设计 ----
save(mlr3HTE_dag("rct", "continuous"), "docs/assets/img/dag/dag_rct_continuous.png", 8, 5)
save(mlr3HTE_dag("obs", "continuous"), "docs/assets/img/dag/dag_obs_continuous.png", 8, 5)

# 99 收尾 ----
cli::cli_alert_success("六个绘图函数的实跑图全部生成完毕")
