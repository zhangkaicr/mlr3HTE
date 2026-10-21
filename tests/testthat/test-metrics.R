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

# ---- 观察性数据：Qini / TOC 走 propensity，c-for-benefit 走 DR 伪结局 --------
#
# 这些用例用 mlr3HTE_demo_obs()（带真实倾向得分与真实 tau 的混杂数据）。
# 基学习器刻意换成 regr.lm，保证测试跑得快。

.setup_obs_dr <- function(n = 1500, seed = 7) {
  d <- mlr3HTE_demo_obs(n = n, seed = seed)
  dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = seed,
                          learner_base = mlr3::lrn("regr.lm"),
                          learner_ps = mlr3::lrn("classif.log_reg"))
  list(d = d, dr = dr)
}

test_that("dr_pseudo_outcome recovers the ATE under confounding", {
  o <- .setup_obs_dr()
  expect_equal(o$dr$ate, mean(o$d$tau), tolerance = 0.25)
  expect_equal(length(o$dr$pseudo), nrow(o$d$X))
  expect_false(anyNA(o$dr$pseudo))
  expect_false(anyNA(o$dr$propensity))
  expect_true(all(o$dr$propensity > 0 & o$dr$propensity < 1))
})

test_that("dr_pseudo_outcome cross-fits: nuisance params are not constant per fold", {
  o <- .setup_obs_dr(n = 800)
  # 交叉拟合下 mu1 是留出折预测，不应与全样本拟合完全重合；
  # 这里用更弱的性质：mu1 与 mu0 都不是常向量，且 ATE 有限
  expect_gt(stats::sd(o$dr$mu1), 0)
  expect_gt(stats::sd(o$dr$mu0), 0)
  expect_true(is.finite(o$dr$ate))
})

test_that("qini and toc accept a propensity score and correct the confounding", {
  o    <- .setup_obs_dr(n = 1500)
  cate <- o$dr$mu1 - o$dr$mu0
  ps   <- o$dr$propensity
  toc_adj <- toc_curve(cate, o$d$A, o$d$Y, propensity = ps)
  toc_raw <- toc_curve(cate, o$d$A, o$d$Y)
  # 未校正的 overall ATE 被混杂抬高，校正后应回落到真实 ATE 附近
  expect_gt(attr(toc_raw, "overall_ate"), attr(toc_adj, "overall_ate"))
  expect_equal(attr(toc_adj, "overall_ate"), mean(o$d$tau), tolerance = 0.35)
  expect_true(is.finite(qini_coefficient(cate, o$d$A, o$d$Y,
                                         propensity = ps)$qini_coefficient))
})

test_that("c-for-benefit on observational data needs the full DR triple", {
  o    <- .setup_obs_dr(n = 800)
  cate <- o$dr$mu1 - o$dr$mu0
  expect_error(
    c_for_benefit(cate, o$d$A, o$d$Y, propensity = o$dr$propensity),
    "doubly-robust triple"
  )
  expect_error(
    c_for_benefit(cate, o$d$A, o$d$Y, propensity = o$dr$propensity[-1],
                  mu1 = o$dr$mu1, mu0 = o$dr$mu0),
    "same length"
  )
  expect_warning(
    c_for_benefit(cate, o$d$A, o$d$Y, mu1 = o$dr$mu1, mu0 = o$dr$mu0),
    "randomized design"
  )
})

test_that("c-for-benefit with DR pseudo-outcomes separates signal from noise", {
  o    <- .setup_obs_dr(n = 1500)
  cate <- o$dr$mu1 - o$dr$mu0
  cf <- function(sc) {
    c_for_benefit(sc, o$d$A, o$d$Y, propensity = o$dr$propensity,
                  mu1 = o$dr$mu1, mu0 = o$dr$mu0)$c_for_benefit
  }
  model  <- cf(cate)
  oracle <- cf(o$d$tau)
  set.seed(99)
  random <- cf(rnorm(length(cate)))
  expect_gt(model, 0.58)                  # 明显高于随机线
  expect_true(abs(random - 0.5) < 0.06)   # 随机排序回到 0.5
  # 交叉拟合后不应再出现"模型 CATE 明显反超真 tau"的自拟合膨胀
  expect_lt(model - oracle, 0.06)
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
