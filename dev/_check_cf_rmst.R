Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)

set.seed(1)
d <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")

cli::cli_h1("cross-fitting: R / DR")
for (L in c("R", "DR")) {
  f0 <- metalearner(L, d$X, d$A, d$Y, weighting = "iptw", cross_fitting = FALSE)
  f1 <- metalearner(L, d$X, d$A, d$Y, weighting = "iptw",
                    cross_fitting = TRUE, n_folds = 5)
  cli::cli_alert_info(
    "{L} in-fold ate={round(f0$ate,3)} bias={round(f0$ate-d$ate,3)} cor={round(cor(f0$cate_train,d$tau),3)}"
  )
  cli::cli_alert_success(
    "{L} OOF     ate={round(f1$ate,3)} bias={round(f1$ate-d$ate,3)} cor={round(cor(f1$cate_train,d$tau),3)}"
  )
}

cli::cli_h1("RMST vs survdiff: survival")
s <- mlr3HTE_bench("obs_nonlin_lin_sharedT", "survival")
for (ef in c("survdiff", "rmst")) {
  fit <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph",
                     weighting = "iptw", t0 = s$t0, effect = ef)
  truth <- if (ef == "rmst") s$ate_rmst else s$ate
  cli::cli_alert_info(
    "{ef}: est={round(fit$ate,4)} truth={round(truth,4)} bias={round(fit$ate-truth,4)}"
  )
}
