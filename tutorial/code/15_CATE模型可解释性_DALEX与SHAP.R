# =====================================================================
# 15_CATE模型可解释性_DALEX与SHAP.R
# 目的：把估计出来的 CATE 曲面当作一个"模型"来解释——哪些变量驱动了效应异质性、
#       效应随某个变量如何变化、单个个体的效应由哪些变量推高或拉低。
#       解释对象必须是双重稳健伪结局 Y*（E[Y*|X] = tau(X)），不能是原始 Y。
# 输入：无（数据由 mlr3HTE_scenario() 现场生成，或使用随包基准数据）
# 输出：置换重要性表与图、PDP/ALE 曲线与图、SHAP 蜂群/依赖/瀑布图、可加性校验
# 依赖：mlr3, mlr3learners, mlr3HTE, DALEX, kernelshap, shapviz, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行
#       Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8");
#                  source("tutorial/code/15_CATE模型可解释性_DALEX与SHAP.R", encoding="UTF-8")'
# =====================================================================

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(mlr3)
  library(mlr3learners)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 620, type = "cairo"))
}

need <- c("DALEX", "kernelshap", "shapviz")
miss <- need[vapply(need, function(p) !requireNamespace(p, quietly = TRUE), logical(1))]
if (length(miss)) {
  cli::cli_abort("本教程需要以下包：{paste(miss, collapse = ', ')}")
}

# 1 解释对象为什么必须是伪结局 ----
# 若把原始 Y 当作响应变量，置换重要性与偏依赖衡量的是"该变量对基线预后
# mu(X) 的贡献"，与治疗效应的异质性无关：一个强预后因子即使完全不修饰疗效，
# 也会排在重要性榜首。伪结局满足 E[Y*|X] = tau(X)，因此其条件期望就是 CATE，
# 解释的才是"谁更获益"而不是"谁的基线风险更高"。
cli::cli_alert_info("响应变量取双重稳健伪结局：E[Y*|X] = tau(X)")

# 2 拟合一个 CATE 模型 ----
d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)
fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 300))

# 先看估计质量：没有这一步，后面所有解释都无从谈起
tau_hat <- fit$predict(d$X)
c(ate_hat = mean(tau_hat), ate_true = d$ate,
  cor = round(cor(tau_hat, d$tau), 3))

# 3 包装为 DALEX 解释器 ----
ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
length(ex$pseudo)
# 伪结局是逐人的无偏估计，方差很大，与真值的相关通常不高
round(cor(ex$pseudo, d$tau), 3)

# 4 代理模型：把 CATE 曲面压成一棵可解释的树 ----
sur <- hte_surrogate(d$X, tau_hat)
sur$learner_id
round(cor(sur$predict(d$X), tau_hat), 3)

# 5 全局解释一：置换重要性 ----
imp <- hte_feature_importance(ex, B = 10, N = 600, seed = 1)
imp

p_imp <- plot_hte_importance(imp)
p_imp
ggplot2::ggsave("tutorial/figures/15_importance.png", p_imp,
                width = 7, height = 4, dpi = 150)

# 6 全局解释二：偏依赖与累积局部效应 ----
pd <- hte_pdp(ex, variables = "lac", grid_points = 40)
utils::head(pd, 6)

p_pdp <- plot_hte_pdp(pd)
p_pdp
ggplot2::ggsave("tutorial/figures/15_pdp.png", p_pdp,
                width = 7, height = 4, dpi = 150)

# 协变量相关时 PDP 会在观测支撑集之外外推，ALE 更稳健
pd_ale <- hte_pdp(ex, variables = "lac", grid_points = 40, type = "accumulated")
utils::head(pd_ale, 3)

# 7 局部解释：Kernel SHAP ----
sv <- hte_shap(ex, n_background = 100, seed = 1)
head(hte_shap_data(sv), 4)
attr(hte_shap_data(sv), "baseline")

# 可加性校验：phi_0 + sum(phi_j) 必须等于模型预测值，残差应在机器精度量级
S <- as.matrix(sv$S)
max(abs(as.numeric(sv$baseline) + rowSums(S) - tau_hat))

p_bee <- plot_hte_shap(sv, "beeswarm")
p_bee
ggplot2::ggsave("tutorial/figures/15_shap_beeswarm.png", p_bee,
                width = 7.5, height = 4.5, dpi = 150)

p_dep <- plot_hte_shap(sv, "dependence", variable = "lac")
p_dep
ggplot2::ggsave("tutorial/figures/15_shap_dependence.png", p_dep,
                width = 7, height = 4, dpi = 150)

p_wf <- plot_hte_shap(sv, "waterfall", variable = 1)
p_wf
ggplot2::ggsave("tutorial/figures/15_shap_waterfall.png", p_wf,
                width = 7, height = 4, dpi = 150)

# 8 图形与数据的分离：拿到数据自己画 ----
# 所有 plot_hte_*() 都返回 ggplot 对象，且绘图数据可单独取出落盘
qd <- hte_shap_data(sv)
utils::write.csv(qd, "tutorial/figures/15_shap_values.csv", row.names = FALSE)

ggplot2::ggplot(qd, ggplot2::aes(x = .data$value, y = .data$shap)) +
  ggplot2::geom_point(alpha = 0.5, colour = "#1B6CA8") +
  ggplot2::geom_hline(yintercept = 0, linetype = 2, colour = "grey60") +
  ggplot2::facet_wrap(~ variable, scales = "free_x") +
  ggplot2::labs(x = "协变量取值", y = "SHAP 贡献",
                title = "SHAP 依赖图（用导出数据自行绘制）") +
  ggplot2::theme_minimal(base_size = 12)

# 9 生存结局也可以同样解释 ----
s <- mlr3HTE_scenario("rct_lin", "survival", n = 400, seed = 1)
fit_s <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0)
ex_s <- hte_explainer(fit_s, s$X, s$A, s$Y, t0 = s$t0, effect = "survdiff", seed = 1)
length(ex_s$pseudo)
ex_s$t0
hte_feature_importance(ex_s, B = 5, N = 400, seed = 1)

# 10 一句话边界 ----
cli::cli_alert_warning(
  "重要性高只说明模型用到了该变量，不等于该变量真的修饰了疗效；后者需要设计层面的证据"
)
