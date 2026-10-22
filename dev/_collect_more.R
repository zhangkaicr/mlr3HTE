Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

out <- function(tag, code) {
  cat("\n@@@ ", tag, "\n", sep = "")
  con <- textConnection("buf", "w", local = TRUE)
  sink(con); print(force(code)); sink(); close(con)
  cat(paste(buf, collapse = "\n"), "\n", sep = "")
}

out("bench_c", {
  b <- mlr3HTE_bench("rct_lin", "continuous")
  c(n = nrow(b$X), ate = b$ate, half = all(b$ps_true == 0.5))
})

out("scenario_two", {
  s <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)
  c(ate = s$ate, ate_rmst = s$ate_rmst)
})

out("bench_index", {
  idx <- mlr3HTE_bench_index()
  print(dim(idx))
  print(utils::head(idx, 4))
})

out("benchdata", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 400, seed = 1)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "T"),
                      learner_base = mlr3::lrn("regr.lm"), n_folds = 2, seed = 1)
  qd <- hte_benchmark_data(bm, "qini")
  print(utils::head(qd[, c("learner", "fraction", "qini")], 3))
  print(attr(qd, "reference"))
})

out("shap_sv", {
  d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
  fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger", num.trees = 200))
  ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
  sv <- hte_shap(ex, n_background = 50, seed = 1)
  print(utils::head(hte_shap_data(sv), 4))
  cat("baseline =", attr(hte_shap_data(sv), "baseline"), "\n")
})
