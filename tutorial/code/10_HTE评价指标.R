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
# learner_tau 是引擎单独建的 ranger（默认 min.node.size = 50，避免二阶段过拟合
# 伪结果噪声）；两个 ranger 都显式给 seed，保证文档里引用的数值可复现。
fit <- metalearner("T", Xtr, Atr, Ytr,
                   learner_base = mlr3::lrn("regr.ranger", num.trees = 300, seed = 1),
                   learner_tau  = mlr3::lrn("regr.ranger", num.trees = 500,
                                            min.node.size = 50, seed = 1))
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
# - 这些是"判别性"评价，不替代对 ATE 的无偏估计（后者靠混杂进 X 条件化 / DR）。
# - 生存结局暂不支持（需删失 IPCW），详见 metrics-spec.md。

# 8 观察性数据：三个指标各自要补什么 ----------------------------------------
# 随机化下"观测获益 = 处理者结局 − 对照者结局"无偏；观察性数据里两者基线预后
# 不同，这个差被混杂污染。三指标的两条修正路径：
#   Qini / TOC  —— 传 propensity，IPW 估计式自己去混杂；
#   c-for-benefit —— 传 propensity + mu1 + mu0，用双重稳健伪结局当观测获益。
d_obs <- mlr3HTE_demo_obs(n = 4000, seed = 11)
dr    <- dr_pseudo_outcome(d_obs$X, d_obs$A, d_obs$Y, seed = 1)
cate_obs <- dr$mu1 - dr$mu0

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("obs data: true ATE = {round(mean(d_obs$tau), 3)}, ",
                      "DR ATE = {round(dr$ate, 3)}")
}

# 8.1 Qini / TOC：不给 propensity 会把混杂当成效应，Qini 与 ATE 双双虚高
q_obs_ps <- qini_coefficient(cate_obs, d_obs$A, d_obs$Y, propensity = dr$propensity)
q_obs_nv <- qini_coefficient(cate_obs, d_obs$A, d_obs$Y)
t_obs_ps <- toc_curve(cate_obs, d_obs$A, d_obs$Y, propensity = dr$propensity)
t_obs_nv <- toc_curve(cate_obs, d_obs$A, d_obs$Y)

# 8.2 c-for-benefit：三件套缺一不可，只给 propensity 会报错
c_obs       <- c_for_benefit(cate_obs, d_obs$A, d_obs$Y, propensity = dr$propensity,
                             mu1 = dr$mu1, mu0 = dr$mu0)
c_obs_oracle <- c_for_benefit(d_obs$tau, d_obs$A, d_obs$Y, propensity = dr$propensity,
                              mu1 = dr$mu1, mu0 = dr$mu0)
set.seed(99)
c_obs_rand  <- c_for_benefit(rnorm(nrow(d_obs$X)), d_obs$A, d_obs$Y,
                             propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)

res_obs <- data.frame(
  metric = c("Qini coefficient", "TOC overall ATE", "c-for-benefit"),
  naive_no_ps = c(q_obs_nv$qini_coefficient, attr(t_obs_nv, "overall_ate"), NA),
  with_ps_dr  = c(q_obs_ps$qini_coefficient, attr(t_obs_ps, "overall_ate"),
                  c_obs$c_for_benefit),
  reference   = c(NA, mean(d_obs$tau), c_obs_oracle$c_for_benefit)
)
print(res_obs)
if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("c-for-benefit: model {round(c_obs$c_for_benefit, 3)} / ",
                      "oracle tau {round(c_obs_oracle$c_for_benefit, 3)} / ",
                      "random {round(c_obs_rand$c_for_benefit, 3)}")
}

# 8.3 为什么 mu1/mu0 必须交叉拟合：in-fold 会让模型给自己的 CATE 打高分
# 把 dr_pseudo_outcome(cross_fitting = FALSE) 的三件套喂进去，会出现
# "模型 CATE 反超真 tau"的倒挂（本数据实测 0.754 vs 0.717）；
# 交叉拟合后恢复正确次序（0.662 vs 0.668）。
#   dr_in <- dr_pseudo_outcome(d_obs$X, d_obs$A, d_obs$Y, cross_fitting = FALSE)
#   c_for_benefit(dr_in$mu1 - dr_in$mu0, d_obs$A, d_obs$Y,
#                 propensity = dr_in$propensity, mu1 = dr_in$mu1, mu0 = dr_in$mu0)

# 99 收尾 ------------------------------------------------------------------
