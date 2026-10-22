# CATE 解释性模块：DALEX 全局解释 + kernelshap/shapviz 局部解释

skip_if_not_installed("DALEX")
skip_if_not_installed("kernelshap")
skip_if_not_installed("shapviz")

.make_fit <- function(n = 300, seed = 1) {
  d <- mlr3HTE_scenario("obs_lin_lin_sharedT", "continuous", n = n, seed = seed)
  fit <- metalearner("T", d$X, d$A, d$Y,
                     learner_base = mlr3::lrn("regr.ranger", num.trees = 120),
                     weighting = "iptw")
  list(d = d, fit = fit)
}

test_that("hte_explainer 用双重稳健伪结局作响应", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  expect_s3_class(ex, "hte_explainer")
  expect_length(ex$pseudo, nrow(o$d$X))
  expect_true(all(is.finite(ex$pseudo)))
  # 伪结局是 tau 的无偏估计，与真值应有正相关（噪声大，门槛放低）
  expect_gt(stats::cor(ex$pseudo, o$d$tau), 0.15)
  expect_identical(ex$label, "T-Learner")
})

test_that("hte_explainer 支持直接给 pseudo，跳过 A/Y", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, pseudo = o$d$tau, label = "oracle")
  expect_equal(ex$pseudo, as.numeric(o$d$tau))
  expect_identical(ex$label, "oracle")
})

test_that("hte_explainer 缺 pseudo 又缺 A/Y 时报错", {
  o <- .make_fit()
  expect_error(hte_explainer(o$fit, o$d$X), "pseudo")
})

test_that("置换重要性返回排序后的完整表", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  imp <- hte_feature_importance(ex, B = 3, N = 200, seed = 1)
  expect_true(all(c("variable", "dropout_loss", "baseline", "dropout",
                    "dropout_pct") %in% names(imp)))
  expect_equal(nrow(imp), ncol(o$d$X))
  expect_false(any(grepl("^_", imp$variable)))       # 不留下 _baseline_ 等内部行
  expect_true(all(diff(imp$dropout) <= 1e-8))        # 已按 dropout 降序
  expect_equal(imp$baseline[1], unique(imp$baseline))
})

test_that("重要性排序能识别真实效应修饰变量", {
  # 场景 obs_lin_lin_sharedT 里 lac（z1）同时进入 e 与 tau，是主导变量
  o <- .make_fit(n = 600)
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  imp <- hte_feature_importance(ex, B = 5, N = 400, seed = 1)
  expect_identical(imp$variable[1], "lac")
})

test_that("hte_pdp 返回网格数据，PDP 与 ALE 都可算", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  pd <- hte_pdp(ex, variables = c("lac", "tumor"), grid_points = 30)
  expect_true(all(c("variable", "x", "yhat", "type") %in% names(pd)))
  expect_equal(sort(unique(pd$variable)), c("lac", "tumor"))
  expect_identical(unique(pd$type), "partial")

  al <- hte_pdp(ex, variables = "lac", grid_points = 30, type = "accumulated")
  expect_identical(unique(al$type), "accumulated")
})

test_that("hte_surrogate 能高精度重建 CATE 曲面", {
  o <- .make_fit()
  tau_hat <- as.numeric(o$fit$predict(o$d$X))
  sur <- hte_surrogate(o$d$X, tau_hat)
  expect_gt(stats::cor(sur$predict(o$d$X), tau_hat), 0.85)
  expect_true(is.character(sur$learner_id))
})

test_that("hte_shap 返回 shapviz 对象且可加性成立", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  sv <- hte_shap(ex, n_background = 40, seed = 1)
  expect_s3_class(sv, "shapviz")

  ld <- hte_shap_data(sv)
  expect_true(all(c("id", "variable", "value", "shap") %in% names(ld)))
  expect_equal(nrow(ld), nrow(o$d$X) * ncol(o$d$X))

  # SHAP 可加性：baseline + 各变量贡献 = 模型预测
  S <- as.matrix(sv$S)
  pred <- as.numeric(o$fit$predict(o$d$X))
  recon <- as.numeric(sv$baseline) + rowSums(S)
  expect_lt(max(abs(recon - pred)), 1e-6)
})

test_that("SHAP 的重要性排序与置换重要性方向一致（首位相同）", {
  o <- .make_fit(n = 500)
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  sv <- hte_shap(ex, n_background = 50, seed = 1)
  S <- as.matrix(sv$S)
  top_shap <- names(sort(colMeans(abs(S)), decreasing = TRUE))[1]
  imp <- hte_feature_importance(ex, B = 5, N = 400, seed = 1)
  expect_identical(top_shap, imp$variable[1])
})

test_that("三个绘图函数都返回 ggplot", {
  o <- .make_fit()
  ex <- hte_explainer(o$fit, o$d$X, o$d$A, o$d$Y, seed = 1)
  imp <- hte_feature_importance(ex, B = 3, N = 200, seed = 1)
  pd  <- hte_pdp(ex, variables = "lac", grid_points = 25)
  sv  <- hte_shap(ex, n_background = 40, seed = 1)

  expect_s3_class(plot_hte_importance(imp), "ggplot")
  expect_s3_class(plot_hte_importance(imp, metric = "dropout"), "ggplot")
  expect_s3_class(plot_hte_pdp(pd), "ggplot")
  expect_s3_class(plot_hte_shap(sv, "importance"), "ggplot")
  expect_s3_class(plot_hte_shap(sv, "beeswarm"), "ggplot")
  expect_s3_class(plot_hte_shap(sv, "dependence", variable = "lac"), "ggplot")
  expect_s3_class(plot_hte_shap(sv, "waterfall", variable = 1), "ggplot")
})

test_that("绘图函数对错误输入给出明确报错", {
  expect_error(plot_hte_importance(data.frame(a = 1)), "importance")
  expect_error(plot_hte_pdp(data.frame(a = 1)), "pdp")
  expect_error(plot_hte_shap(list()), "shapviz")
  expect_error(hte_shap_data(data.frame()), "shapviz")
})
