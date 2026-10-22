Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)

set.seed(1)
d <- mlr3HTE_scenario("obs_lin_lin_sharedT", "continuous", n = 800, seed = 1)
fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"),
                   weighting = "iptw")

ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
cli::cli_h1("explainer")
cli::cli_alert_info("label = {ex$label}; n = {nrow(ex$X)}; pseudo 与真 tau 的相关 = {round(cor(ex$pseudo, d$tau), 3)}")

imp <- hte_feature_importance(ex, B = 5, seed = 1, N = 400)
print(imp)

pd <- hte_pdp(ex, variables = c("lac", "tumor"), grid_points = 40)
print(utils::head(pd, 4))

sv <- hte_shap(ex, n_background = 60, seed = 1)
cli::cli_h1("shap")
print(hte_shap_data(sv)[1:4, ])
print(class(plot_hte_shap(sv, "importance")))

g1 <- plot_hte_importance(imp)
g2 <- plot_hte_pdp(pd)
cli::cli_alert_success("ggplot: {class(g1)[1]} / {class(g2)[1]}")
ggsave_png <- function(g, f) ggplot2::ggsave(f, g, width = 6, height = 4, dpi = 110)
ggsave_png(g1, "dev/_imp.png")
ggsave_png(g2, "dev/_pdp.png")
ggsave_png(plot_hte_shap(sv, "beeswarm"), "dev/_shap.png")

# 代理模型
sur <- hte_surrogate(d$X, fit$predict(d$X))
cli::cli_alert_success("surrogate cor(tau_hat, tau_hat) = {round(cor(sur$predict(d$X), fit$predict(d$X)), 3)}")
ex2 <- hte_explainer(sur, d$X, pseudo = ex$pseudo, label = "surrogate")
print(hte_feature_importance(ex2, B = 3, seed = 1))
