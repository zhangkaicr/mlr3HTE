Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

set.seed(1)
dv <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
fit <- metalearner("T", dv$X, dv$A, dv$Y,
                   learner_base = mlr3::lrn("regr.ranger", num.trees = 200))
cate <- as.numeric(fit$predict(dv$X))
cli::cli_alert_info("平均预测 CATE = {round(mean(cate), 3)}；与真 tau 相关 = {round(cor(cate, dv$tau), 3)}")

ex <- hte_explainer(fit, dv$X, dv$A, dv$Y, seed = 1)
e  <- ex$explainer

# 手工 PDP：把 lac 固定到网格值，其余保持观测
grid <- stats::quantile(dv$X$lac, probs = c(0.05, 0.5, 0.95))
manual <- vapply(grid, function(v) {
  nd <- dv$X; nd$lac <- v; mean(as.numeric(fit$predict(nd)))
}, numeric(1))
print(data.frame(lac = as.numeric(grid), manual_pdp = round(manual, 3)))

# DALEX 的 PDP
pd <- hte_pdp(ex, variables = "lac", grid_points = 5)
print(pd)
cli::cli_alert_info("model_profile 的 center 默认值：{formals(DALEX::model_profile)$center}")
cli::cli_alert_info("explainer 里 y_hat 的均值：{round(mean(e$y_hat), 3)}")
