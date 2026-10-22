# 目的：把 15 个新增函数文档页里写的示例代码原样跑一遍，拿到真实输出
# 输出：以 @@@ <tag> 分段，直接贴进 dev/_gen_api_v34.py
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
suppressMessages(library(mlr3))

tag <- function(name, expr) {
  cat("\n@@@ ", name, "\n", sep = "")
  con <- textConnection("buf", "w", local = TRUE)
  sink(con)
  r <- try(force(expr), silent = TRUE)
  sink()
  close(con)
  cat(paste(buf, collapse = "\n"), "\n", sep = "")
  if (inherits(r, "try-error")) cat("!! ERROR: ", conditionMessage(attr(r, "condition")), "\n")
  invisible(NULL)
}

tag("scenarios", print(mlr3HTE_scenarios()))

tag("scenario", {
  s <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)
  c(ate = s$ate, ate_rmst = s$ate_rmst)
})

tag("bench", {
  b <- mlr3HTE_bench("rct_lin", "continuous")
  list(n = nrow(b$X), ate = b$ate, all_ps_half = all(b$ps_true == 0.5))
})

tag("benchindex", {
  idx <- mlr3HTE_bench_index()
  cat("dim:", dim(idx), "\n")
  print(head(idx, 4))
})

# 下面几页共用同一份数据
d  <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 200))
ex  <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)

tag("explainer", {
  c(n = length(ex$pseudo), cor_pseudo_tau = round(cor(ex$pseudo, d$tau), 3))
})

tag("surrogate", {
  sur <- hte_surrogate(d$X, fit$predict(d$X))
  list(learner = sur$learner_id,
       cor = round(cor(sur$predict(d$X), fit$predict(d$X)), 3))
})

tag("importance", print(hte_feature_importance(ex, B = 5, N = 400, seed = 1)))

tag("pdp", print(hte_pdp(ex, variables = "lac", grid_points = 20)))

sv <- hte_shap(ex, n_background = 50, seed = 1)

tag("shap", {
  S <- as.matrix(sv$S)
  cat("baseline =", round(as.numeric(sv$baseline), 6), "\n")
  cat("max|baseline + rowSums(S) - predict| =",
      format(max(abs(as.numeric(sv$baseline) + rowSums(S) - fit$predict(d$X))),
             digits = 3), "\n")
})

tag("shapdata", print(head(hte_shap_data(sv), 4)))

tag("plotimp", {
  imp <- hte_feature_importance(ex, B = 3, N = 300, seed = 1)
  p <- plot_hte_importance(imp)
  c(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))
})

tag("plotpdp", {
  pd <- hte_pdp(ex, variables = "lac", grid_points = 20)
  p <- plot_hte_pdp(pd)
  c(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))
})

tag("plotshap", {
  p1 <- plot_hte_shap(sv, "importance")
  p2 <- plot_hte_shap(sv, "dependence", variable = "lac")
  p3 <- plot_hte_shap(sv, "waterfall", variable = 1)
  c(imp = inherits(p1, "ggplot"), dep = inherits(p2, "ggplot"),
    wf = inherits(p3, "ggplot"))
})

tag("dagdata", {
  dd <- mlr3HTE_dag_data("rct", "continuous")
  print(dd$edges[, c("from", "to", "type", "curve")])
})

tag("benchdata", {
  db <- mlr3HTE_scenario("rct_lin", "continuous", n = 400, seed = 1)
  bm <- hte_benchmark(db$X, db$A, db$Y, learners = c("S", "T"),
                      learner_base = lrn("regr.lm"), n_folds = 2, seed = 1)
  qd <- hte_benchmark_data(bm, "qini")
  print(head(qd[qd$learner == "T", c("learner", "fraction", "qini")], 3))
  print(attr(qd, "reference"))
})
