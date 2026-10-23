# 目的：为 surv_effect_curve() 的帮助页与教程生成实跑图（两种效应尺度各一张）。
# 输入：无（用 mlr3HTE_demo_surv 现场拟合）
# 输出：docs/assets/img/surv/curve_survdiff.png、curve_rmst.png
# 依赖：pkgload::load_all()、ggplot2；区域须 en_US.UTF-8
# 注意：种子固定，重复运行结果一致。

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  pkgload::load_all(".", quiet = TRUE)
})

out_dir <- "docs/assets/img/surv"
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

# 1 数据与两条曲线 -------------------------------------------------------------
# n = 800、T-learner、coxph：够稳定又不至于让文档构建太慢。
d <- mlr3HTE_demo_surv(n = 800, t0 = 2, seed = 103)
set.seed(1)

cv_s <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 12, effect = "survdiff")
cv_r <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 12, effect = "rmst")

# 2 导出 -----------------------------------------------------------------------
ggsave(file.path(out_dir, "curve_survdiff.png"),
       plot_surv_effect_curve(cv_s), width = 7, height = 4.5, dpi = 110, bg = "white")
ggsave(file.path(out_dir, "curve_rmst.png"),
       plot_surv_effect_curve(cv_r), width = 7, height = 4.5, dpi = 110, bg = "white")

# 3 打印实际数值，供文档页粘贴 -------------------------------------------------
print(cv_s)
print(cv_r)

# 99 收尾 ----
cli::cli_alert_success("两张效应曲线图已生成")
