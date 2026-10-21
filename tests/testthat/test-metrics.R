# =====================================================================
# test-metrics.R —— HTE 评价指标（Qini / c-for-benefit）的测试
# =====================================================================
context("HTE evaluation metrics")

setup_cont <- function(seed = 1, n = 1500) {
  set.seed(seed)
  A   <- rbinom(n, 1, 0.5)
  tau <- rnorm(n)
  Y   <- 1 + A * tau + rnorm(n)
  list(A = A, tau = tau, Y = Y)
}

test_that("qini_coefficient is positive for true CATE and near zero for a random score", {
  d    <- setup_cont()
  info <- qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient
  rand <- qini_coefficient(sample(d$tau), d$A, d$Y)$qini_coefficient
  expect_true(info > 0)
  expect_lt(abs(rand), abs(info))
})

test_that("qini_curve starts at (0,0) and ends at fraction 1", {
  d   <- setup_cont()
  crv <- qini_curve(d$tau, d$A, d$Y)
  expect_equal(crv$fraction[1], 0)
  expect_equal(crv$qini[1], 0)
  expect_equal(crv$fraction[nrow(crv)], 1)
  expect_true(all(diff(crv$fraction) > 0))     # fraction 单调递增
})

test_that("c-for-benefit ranks true CATE above a random score", {
  d    <- setup_cont()
  info <- c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit
  rand <- c_for_benefit(sample(d$tau), d$A, d$Y)$c_for_benefit
  expect_true(info > 0.5)                       # 有判别力
  expect_gt(info, rand)                         # 明显优于随机
  expect_true(rand > 0.4 && rand < 0.6)         # 随机近似 0.5
})

test_that("binary outcome works for both metrics", {
  set.seed(2)
  n   <- 1200
  A   <- rbinom(n, 1, 0.5)
  tau <- rnorm(n)
  Y   <- rbinom(n, 1, plogis(0.1 + A * tau))
  expect_true(qini_coefficient(tau, A, Y)$qini_coefficient > 0)
  expect_true(c_for_benefit(tau, A, Y)$c_for_benefit > 0.5)
})

test_that("survival outcome raises a clear, informative error", {
  set.seed(3)
  n  <- 50
  A  <- rbinom(n, 1, 0.5)
  Ys <- survival::Surv(rexp(n), rbinom(n, 1, 0.8))
  expect_error(qini_curve(rnorm(n), A, Ys), "not supported")
})

test_that("toc_curve lifts above overall ATE for true CATE, matches it for random", {
  d  <- setup_cont()
  ti <- toc_curve(d$tau, d$A, d$Y)
  tr <- toc_curve(sample(d$tau), d$A, d$Y)
  top_i <- ti$toc[which.max(ti$fraction >= 0.1)]
  top_r <- tr$toc[which.max(tr$fraction >= 0.1)]
  expect_gt(top_i, attr(ti, "overall_ate"))     # 信息性：前段明显高于总体
  expect_lt(abs(top_r - attr(tr, "overall_ate")),
            abs(top_i - attr(ti, "overall_ate")))  # 随机：贴近总体线
})
