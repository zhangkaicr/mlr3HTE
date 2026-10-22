# 测试目标：hte_benchmark() 在随机化数据上不依赖真实 tau 就能比较 learner，
# 且交叉拟合真的把 in-fold 的虚高压了回来。

test_that("随机 CATE 给出基线：Qini ≈ 0、c-for-benefit ≈ 0.5", {
  d <- mlr3HTE_demo_data(n = 1500, seed = 101)
  set.seed(2)
  rnd <- rnorm(nrow(d$X))
  # 随机排序的归一化 Qini 只是"约为 0"，样本量小时波动不小，阈值放宽
  expect_lt(abs(qini_coefficient(rnd, d$A, d$Y)$qini_normalized), 0.3)
  expect_lt(abs(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit - 0.5), 0.1)
})

test_that("真实 tau 的 Qini 高于随机基线", {
  d <- mlr3HTE_demo_data(n = 800, seed = 102)
  set.seed(3)
  rnd <- rnorm(nrow(d$X))
  q_truth <- qini_coefficient(d$tau, d$A, d$Y)$qini_normalized
  q_rand  <- qini_coefficient(rnd,  d$A, d$Y)$qini_normalized
  expect_gt(q_truth, q_rand)
})

test_that("hte_benchmark 返回结构与口径", {
  d <- mlr3HTE_demo_data(n = 600, seed = 103)
  bm <- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, learners = c("S", "X"),
                      n_folds = 3L, seed = 7)
  # table：一行一个 learner，列名固定
  expect_equal(bm$table$learner, c("S", "X"))
  expect_true(all(c("ate", "qini_coefficient", "qini_normalized",
                    "toc_gain", "c_for_benefit", "tau_cor", "tau_rmse")
                  %in% names(bm$table)))
  # cate 长表：n × learner 行
  expect_equal(nrow(bm$cate), 600L * 2L)
  expect_equal(names(bm$cate), c(".row", "learner", "cate"))
  expect_false(anyNA(bm$cate$cate))
  # curves 与 truth
  expect_equal(names(bm$curves$qini), c("S", "X"))
  expect_equal(nrow(bm$truth), 600L)
  expect_equal(bm$setup$n_folds, 3L)
  expect_true(bm$setup$has_truth)
})

test_that("不给 tau 时不出真值列（现实 RCT 数据的形态）", {
  d <- mlr3HTE_demo_data(n = 600, seed = 104)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "T"), n_folds = 3L, seed = 7)
  expect_false(any(c("tau_cor", "tau_rmse") %in% names(bm$table)))
  expect_null(bm$truth)
  expect_false(bm$setup$has_truth)
})

test_that("交叉拟合压住 in-fold 虚高：OOF 的 c-for-benefit 不超过真值表现", {
  skip_on_cran()
  d <- mlr3HTE_demo_data(n = 900, seed = 105)
  lb <- lrn("regr.ranger", num.trees = 200, seed = 1L)

  infold <- metalearner("X", d$X, d$A, d$Y, learner_base = lb)$cate_train
  cfb_infold <- c_for_benefit(infold, d$A, d$Y)$c_for_benefit
  cfb_truth  <- c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit

  bm <- hte_benchmark(d$X, d$A, d$Y, learners = "X", n_folds = 3L, seed = 11)
  cfb_oof <- bm$table$c_for_benefit

  # in-fold 明显超过真值（模型在自己数据上虚高）
  expect_gt(cfb_infold, cfb_truth)
  # 交叉拟合后回落到真值附近
  expect_lt(cfb_oof, cfb_infold)
  expect_lt(abs(cfb_oof - cfb_truth), 0.1)
})

test_that("三类结局都能跑", {
  # 连续
  d1 <- mlr3HTE_demo_data(n = 500, seed = 106)
  b1 <- hte_benchmark(d1$X, d1$A, d1$Y, learners = c("S", "X"),
                      n_folds = 3L, seed = 7)
  expect_equal(nrow(b1$table), 2L)

  # 二分类：默认基学习器必须自动换成 classif.*
  d2 <- mlr3HTE_demo_binary(n = 500, seed = 107)
  b2 <- hte_benchmark(d2$X, d2$A, d2$Y, learners = c("S", "X"),
                      n_folds = 3L, seed = 7)
  expect_equal(nrow(b2$table), 2L)
  expect_true(all(b2$table$c_for_benefit > 0.4))

  # 生存
  d3 <- mlr3HTE_demo_surv(n = 500, seed = 108)
  b3 <- hte_benchmark(d3$X, d3$A, d3$Y, learners = c("S", "T"),
                      t0 = d3$t0, n_folds = 3L, seed = 7)
  expect_equal(nrow(b3$table), 2L)
  expect_equal(b3$setup$t0, d3$t0)
  # 不给 t0 时应自动落到事件时间中位数
  b3b <- hte_benchmark(d3$X, d3$A, d3$Y, learners = "S", n_folds = 2L, seed = 7)
  expect_equal(b3b$setup$t0, median(d3$Y[d3$Y[, 2L] == 1L, 1L]))
})

test_that("固定种子可复现，换种子会变", {
  d <- mlr3HTE_demo_data(n = 500, seed = 109)
  a <- hte_benchmark(d$X, d$A, d$Y, learners = "S", n_folds = 3L, seed = 5)
  b <- hte_benchmark(d$X, d$A, d$Y, learners = "S", n_folds = 3L, seed = 5)
  c <- hte_benchmark(d$X, d$A, d$Y, learners = "S", n_folds = 3L, seed = 6)
  expect_equal(a$table$qini_normalized, b$table$qini_normalized)
  expect_equal(a$cate$cate, b$cate$cate)
  expect_false(identical(a$cate$cate, c$cate$cate))
})

test_that("参数校验：折数、单臂样本量、tau 长度", {
  d <- mlr3HTE_demo_data(n = 200, seed = 110)
  expect_error(hte_benchmark(d$X, d$A, d$Y, n_folds = 1L), "至少为 2")
  expect_error(hte_benchmark(d$X, d$A, d$Y, n_folds = 500L), "凑不齐")
  expect_error(hte_benchmark(d$X, d$A, d$Y, tau = d$tau[-1]), "的长度必须与")
})

test_that("观察性数据：传 DR 三件套即可", {
  d <- mlr3HTE_demo_obs(n = 600, seed = 111)
  dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), n_folds = 3L,
                      propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0,
                      seed = 7)
  expect_equal(nrow(bm$table), 2L)
  # 未调整的粗差分在这里看不到（ATE 列是各 learner 的），但 ATE 应接近真值
  expect_lt(abs(bm$table$ate[bm$table$learner == "X"] - d$ate), 0.25)
})

test_that("plot_hte_benchmark 能出图", {
  skip_if_not_installed("ggplot2")
  d <- mlr3HTE_demo_data(n = 400, seed = 112)
  bm <- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "T"),
                      metrics = c("qini", "toc"), n_folds = 2L, seed = 7)
  expect_s3_class(plot_hte_benchmark(bm, "qini"), "ggplot")
  expect_s3_class(plot_hte_benchmark(bm, "toc"), "ggplot")
  # 只算 qini 时 toc 曲线不存在，应明确报错
  bm2 <- hte_benchmark(d$X, d$A, d$Y, learners = "S", metrics = "qini",
                       n_folds = 2L, seed = 7)
  expect_error(plot_hte_benchmark(bm2, "toc"), "没有算 toc")
})
