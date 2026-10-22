# 绘图接口契约：所有 plot_* 返回 ggplot 对象，且绘图数据可单独取出

test_that("plot_qini 返回 ggplot，数据就是 qini_curve 的返回值", {
  set.seed(2)
  n <- 300
  A <- stats::rbinom(n, 1, 0.5)
  tau <- stats::rnorm(n)
  Y <- 1 + A * tau + stats::rnorm(n)
  q <- qini_curve(tau, A, Y)
  p <- plot_qini(q)
  expect_s3_class(p, "ggplot")
  # 绘图数据就是 curve 本身（ggplot 把它存在 plot 级的 data 里）
  expect_equal(nrow(p$data), nrow(q))
  expect_true(all(c("fraction", "qini") %in% names(p$data)))
  # 第二层必须是随机靶向参考线
  expect_s3_class(p$layers[[2]]$geom, "GeomAbline")
  expect_error(plot_qini(data.frame(a = 1)), "qini_curve")
})

test_that("plot_qini 可继续叠加图层", {
  set.seed(3)
  n <- 200
  A <- stats::rbinom(n, 1, 0.5)
  tau <- stats::rnorm(n)
  Y <- A * tau + stats::rnorm(n)
  p <- plot_qini(qini_curve(tau, A, Y)) + ggplot2::theme_bw()
  expect_s3_class(p, "ggplot")
})

test_that("hte_benchmark_data 导出绘图数据与参考线", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 400, seed = 1)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "T"),
                      learner_base = mlr3::lrn("regr.ranger", num.trees = 100),
                      n_folds = 3, seed = 1)

  qd <- hte_benchmark_data(bm, "qini")
  expect_true(all(c("learner", "fraction", "qini") %in% names(qd)))
  expect_setequal(levels(qd$learner), c("S", "T"))
  ref <- attr(qd, "reference")
  expect_true(all(c("learner", "intercept", "slope") %in% names(ref)))
  expect_equal(nrow(ref), 2L)

  td <- hte_benchmark_data(bm, "toc")
  expect_true(all(c("learner", "fraction", "toc") %in% names(td)))
  expect_true(all(attr(td, "reference")$slope == 0))   # TOC 参考线是水平的

  # min_fraction 生效
  qd0 <- hte_benchmark_data(bm, "qini", min_fraction = 0)
  expect_lte(min(qd0$fraction), min(qd$fraction))
})

test_that("hte_benchmark_data 对未计算的指标报错", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 300, seed = 1)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = "S",
                      learner_base = mlr3::lrn("regr.lm"),
                      metrics = "qini", n_folds = 2, seed = 1)
  expect_error(hte_benchmark_data(bm, "toc"), "没有算 toc")
})
