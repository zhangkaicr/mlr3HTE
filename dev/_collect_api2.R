# 目的：补采上一段里没有自动打印的标签（返回 list / 命名向量的表达式块）
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
suppressMessages(library(mlr3))

show <- function(name, value) {
  cat("\n@@@ ", name, "\n", sep = "")
  con <- textConnection("buf", "w", local = TRUE)
  sink(con); print(value); sink(); close(con)
  cat(paste(buf, collapse = "\n"), "\n", sep = "")
}

s <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)
show("scenario", c(ate = s$ate, ate_rmst = s$ate_rmst))

b <- mlr3HTE_bench("rct_lin", "continuous")
show("bench", list(n = nrow(b$X), ate = b$ate, all_ps_half = all(b$ps_true == 0.5)))

d   <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 200))
ex  <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
show("explainer", c(n = length(ex$pseudo),
                    cor_pseudo_tau = round(cor(ex$pseudo, d$tau), 3)))

sur <- hte_surrogate(d$X, fit$predict(d$X))
show("surrogate", list(learner = sur$learner_id,
                       cor = round(cor(sur$predict(d$X), fit$predict(d$X)), 3)))

imp <- hte_feature_importance(ex, B = 3, N = 300, seed = 1)
p1 <- plot_hte_importance(imp)
show("plotimp", list(classes = paste(class(p1), collapse = "/"),
                     is_ggplot = inherits(p1, "ggplot")))

pd <- hte_pdp(ex, variables = "lac", grid_points = 20)
p2 <- plot_hte_pdp(pd)
show("plotpdp", list(classes = paste(class(p2), collapse = "/"),
                     is_ggplot = inherits(p2, "ggplot")))

sv <- hte_shap(ex, n_background = 50, seed = 1)
p3 <- plot_hte_shap(sv, "importance")
p4 <- plot_hte_shap(sv, "dependence", variable = "lac")
p5 <- plot_hte_shap(sv, "waterfall", variable = 1)
show("plotshap", c(imp = inherits(p3, "ggplot"), dep = inherits(p4, "ggplot"),
                   wf = inherits(p5, "ggplot")))
