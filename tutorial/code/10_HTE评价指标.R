# =====================================================================
# 10_HTE评价指标.R
# 目的：用 mlr3HTE 拟合 metalearner 后，在测试集上评价"治疗效应异质性"
#       模型的判别力——Qini 曲线/系数、c-for-benefit、TOC 曲线，
#       并和信息性排序 vs 随机排序对照，附带与真值 tau 的对账。
# 运行：在 mlr3HTE/ 目录下  Rscript tutorial/code/10_HTE评价指标.R
# 依赖：mlr3HTE, mlr3, mlr3learners, ranger, ggplot2
# =====================================================================

# 0 环境与依赖 -------------------------------------------------------------
# 开发期用 pkgload::load_all 直接吃当前源码（含最新的 R/metrics.R）；
# 若已安装包也可用 library(mlr3HTE)。
if (requireNamespace("pkgload", quietly = TRUE)) {
  pkgload::load_all(".")
} else {
  library(mlr3HTE)
}
suppressWarnings({library(mlr3); library(mlr3learners); library(ggplot2)})

set.seed(2024)

# 1 生成带真值的演示数据，并切分训练 / 测试集 -------------------------------
d <- mlr3HTE_demo_data(n = 4000, seed = 1)
n <- nrow(d$X)
idx <- sample.int(n, size = n %/% 2)
tr  <- setdiff(seq_len(n), idx)          # 训练下标
Xtr <- d$X[tr, ];  Atr <- d$A[tr];  Ytr <- d$Y[tr]
Xte <- d$X[idx, ]; Ate <- d$A[idx]; Yte <- d$Y[idx]; tau_te <- d$tau[idx]

# 2 拟合 T-learner，在测试集上预测逐人 CATE ---------------------------------
fit <- metalearner("T", Xtr, Atr, Ytr,
                   learner_base = mlr3::lrn("regr.ranger", num.trees = 300, seed = 1))
cate_te <- fit$predict(Xte)

# 与真值对账：模型 CATE 与真 tau 的相关性（信息性排序的来源）
cat_info <- cor(cate_te, tau_te)
if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("cor(cate_test, tau_test) = {round(cat_info, 3)}")
}

# 3 在测试集上计算三指标 ----------------------------------------------------
q_inf <- qini_coefficient(cate_te, Ate, Yte)
c_inf <- c_for_benefit(cate_te, Ate, Yte)
t_inf <- toc_curve(cate_te, Ate, Yte)

# 4 对照：把 CATE 打乱作为"无信息排序" --------------------------------------
cate_rand <- sample(cate_te)
q_rand <- qini_coefficient(cate_rand, Ate, Yte)
c_rand <- c_for_benefit(cate_rand, Ate, Yte)

# 5 打印对账表 --------------------------------------------------------------
res <- data.frame(
  metric = c("Qini coefficient", "c-for-benefit"),
  informative = c(q_inf$qini_coefficient, c_inf$c_for_benefit),
  random      = c(q_rand$qini_coefficient, c_rand$c_for_benefit)
)
print(res)

# 6 画 Qini 与 TOC 曲线并保存 -------------------------------------------------
fig_dir <- "tutorial/figures"
dir.create(fig_dir, recursive = TRUE, showWarnings = FALSE)

crv <- qini_curve(cate_te, Ate, Yte, n_bins = 60)
p_qini <- ggplot(crv, aes(x = fraction, y = qini)) +
  geom_line(color = "#1B6CA8", linewidth = 0.9) +
  geom_abline(slope = attr(crv, "qini_at_full"), intercept = 0,
              linetype = "dashed", color = "grey50") +
  labs(title = "Qini curve (IPW cumulative gain)",
       subtitle = sprintf("Qini coefficient = %.3f (random %.3f)",
                          q_inf$qini_coefficient, q_rand$qini_coefficient),
       x = "Fraction targeted", y = "Cumulative gain") +
  theme_minimal(base_size = 12)
ggsave(file.path(fig_dir, "10_qini.png"), p_qini, width = 6, height = 4.2, dpi = 150)

p_toc <- ggplot(t_inf, aes(x = fraction, y = toc)) +
  geom_line(color = "#54A24B", linewidth = 0.9) +
  geom_hline(yintercept = attr(t_inf, "overall_ate"), linetype = "dashed",
             color = "grey50") +
  labs(title = "TOC curve (avg treatment effect among top-targeted)",
       subtitle = sprintf("dashed line = overall ATE = %.3f", attr(t_inf, "overall_ate")),
       x = "Fraction targeted", y = "Estimated ATE in top fraction") +
  theme_minimal(base_size = 12)
ggsave(file.path(fig_dir, "10_toc.png"), p_toc, width = 6, height = 4.2, dpi = 150)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_success("figures saved to {fig_dir}/10_qini.png and 10_toc.png")
}

# 7 要点提示 ----------------------------------------------------------------
# - Qini / TOC 曲线越早抬升、前段越高于总体 ATE，模型越能把获益者排前。
# - c-for-benefit > 0.5 表示有判别力，越接近 1 越好；随机排序约等于 0.5。
# - 这些是"判别性"评价，不替代对 ATE 的无偏估计（后者靠 weighting / DR）。
# - 生存结局暂不支持（需删失 IPCW），详见 metrics-spec.md。

# 99 收尾 ------------------------------------------------------------------
