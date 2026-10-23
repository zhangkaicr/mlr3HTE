# 目的：首次验证 surv_effect_curve() —— 五个关键点：
#   (1) 能跑通；(2) 与单点 metalearner 在 t0 处一致；
#   (3) rmst 尺度也跑得通；(4) 五族全通；(5) plot 返回 ggplot。
# 输入：无（用 mlr3HTE_demo_surv）
# 输出：控制台打印
# 依赖：pkgload::load_all()、ggplot2

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  pkgload::load_all(".", quiet = TRUE)
})

# 1 基本跑通 -------------------------------------------------------------------
d <- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)
cv <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 5)
print(cv)
print(dim(attr(cv, "cate")))
print(class(cv))

# 2 与单点 metalearner 对账 -----------------------------------------------------
# 用 coxph、weighting = "none"（无重采样 -> 确定性），单点曲线应完全等于单点拟合
for (tt in cv$time) {
  one <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = tt)
  cv1 <- surv_effect_curve("T", d$X, d$A, d$Y, times = tt + c(0, 0.01))
  print(sprintf("t=%.4f  单点 ATE=%.6f  曲线首点=%.6f  差=%.2e",
                tt, one$ate, cv1$ate[1], abs(one$ate - cv1$ate[1])))
}

# 3 RMST 尺度 -------------------------------------------------------------------
cv_rmst <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 5, effect = "rmst")
print(cv_rmst)

# 4 五族全通 -------------------------------------------------------------------
for (tp in c("S", "T", "X", "R", "DR")) {
  c1 <- surv_effect_curve(tp, d$X, d$A, d$Y, n_times = 4)
  print(sprintf("%-2s: %d 点，ATE 范围 [%.4f, %.4f]，全部有限=%s",
                tp, nrow(c1), min(c1$ate), max(c1$ate),
                all(is.finite(c1$ate))))
}

# 5 绘图 -----------------------------------------------------------------------
p <- plot_surv_effect_curve(cv)
print(class(p))
ggsave("dev/_curve_probe.png", p, width = 7, height = 4.5, dpi = 110, bg = "white")

# 99 收尾 ----
cli::cli_alert_success("surv_effect_curve 首次验证完成")
