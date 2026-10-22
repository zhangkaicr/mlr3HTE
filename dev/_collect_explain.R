Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

out <- function(tag, code) {
  cat("\n@@@ ", tag, "\n", sep = "")
  con <- textConnection("buf", "w", local = TRUE)
  sink(con)
  force(code)
  sink()
  close(con)
  cat(paste(buf, collapse = "\n"), "\n", sep = "")
}

set.seed(1)
d  <- mlr3HTE_scenario("obs_lin_lin_sharedT", "continuous", n = 600, seed = 1)
dv <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
fit <- metalearner("T", dv$X, dv$A, dv$Y,
                   learner_base = mlr3::lrn("regr.ranger", num.trees = 200))
ex <- hte_explainer(fit, dv$X, dv$A, dv$Y, seed = 1)

sc <- mlr3HTE_scenarios()
out("scenarios", print(sc))
out("scenario_meta", {
  s <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)
  str(s$meta)
  cat("ate =", s$ate, " ate_rmst =", s$ate_rmst, "\n")
})
out("bench_index", print(utils::head(mlr3HTE_bench_index(), 4)))
out("bench_one", {
  b <- mlr3HTE_bench("rct_lin", "continuous")
  cat("n =", nrow(b$X), " ate =", b$ate, " ps 全为 0.5:", all(b$ps_true == 0.5), "\n")
})

out("surrogate", {
  sur <- hte_surrogate(dv$X, fit$predict(dv$X))
  cat("learner:", sur$learner_id, " cor =", round(cor(sur$predict(dv$X), fit$predict(dv$X)), 3), "\n")
})
out("importance", print(hte_feature_importance(ex, B = 5, N = 400, seed = 1)))
out("pdp", print(utils::head(hte_pdp(ex, variables = "lac", grid_points = 20), 4)))
out("pdp_ale", print(utils::head(hte_pdp(ex, variables = "lac", grid_points = 20,
                                        type = "accumulated"), 3)))
sv <- hte_shap(ex, n_background = 50, seed = 1)
out("shap_data", print(utils::head(hte_shap_data(sv), 4)))
out("shap_baseline", cat("baseline =", attr(hte_shap_data(sv), "baseline"), "\n"))
out("shap_additivity", {
  S <- as.matrix(sv$S)
  cat("max |baseline + rowSums(S) - predict| =",
      signif(max(abs(as.numeric(sv$baseline) + rowSums(S) - fit$predict(dv$X))), 3), "\n")
})
out("plot_classes", {
  imp <- hte_feature_importance(ex, B = 3, N = 300, seed = 1)
  pd  <- hte_pdp(ex, variables = "lac", grid_points = 20)
  cat(class(plot_hte_importance(imp))[1], "|", class(plot_hte_pdp(pd))[1], "|",
      class(plot_hte_shap(sv, "beeswarm"))[1], "\n")
})

# 生存结局的解释器也走一遍，确认伪结局与 RMST 尺度都通
out("surv_explainer", {
  s <- mlr3HTE_scenario("rct_lin", "survival", n = 300, seed = 1)
  f <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0)
  e2 <- hte_explainer(f, s$X, s$A, s$Y, t0 = s$t0, effect = "survdiff", seed = 1)
  cat("n =", length(e2$pseudo), " t0 =", e2$t0, " pseudo 均值 =", round(mean(e2$pseudo), 4), "\n")
})
