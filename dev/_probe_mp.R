Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

d <- mlr3HTE_scenario("rct_lin", "continuous", n = 300, seed = 1)
fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"))
ex <- hte_explainer(fit, d$X, pseudo = d$tau, label = "T")
e <- ex$explainer

r <- DALEX::model_parts(e, loss_function = DALEX::loss_root_mean_square,
                        type = "variable_importance", N = 200)
cli::cli_alert_info("names(r): {paste(names(r), collapse = ', ')}")
str(r, max.level = 1)
cli::cli_alert_info("as.data.frame:")
print(as.data.frame(r))

cli::cli_h1("model_profile")
p <- DALEX::model_profile(e, variables = c("lac", "tumor"), grid_points = 20,
                          type = "partial")
cli::cli_alert_info("names(p): {paste(names(p), collapse = ', ')}")
print(head(as.data.frame(p), 4))
