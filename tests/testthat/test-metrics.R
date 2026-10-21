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

# ---- 生存结局：指标要走里程碑生存指示 I(T > t0) + 删失 IPCW ------------------
#
# 自带模拟器而不用 mlr3HTE_demo_surv()，因为要能调删失率：
# 无删失时 Q(1) 必须等于真 ATE（权重恒为 1），有删失时靠 IPCW 仍然无偏。

setup_surv <- function(n = 3000, cens_rate = 1e-6, seed = 3, t0 = 2) {
  set.seed(seed)
  z1 <- rnorm(n); z2 <- rnorm(n)
  tau <- 0.5 + 0.4 * z1 - 0.3 * z2
  base <- exp(-1.0 + 0.3 * z1 + 0.2 * z2)
  A <- rbinom(n, 1, 0.5)
  T <- rexp(n, rate = base * exp(-A * tau))
  C <- rexp(n, rate = cens_rate)
  time <- pmin(T, C)
  status <- as.integer(T <= C)
  s1 <- exp(-base * exp(-tau) * t0)
  s0 <- exp(-base * t0)
  list(X = data.frame(z1 = z1, z2 = z2), A = A,
       Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0)
}

test_that("survival outcome: Qini Q(1) recovers the true S(t0) difference", {
  d <- setup_surv(n = 4000)                       # 近乎无删失
  q <- qini_coefficient(d$tau, d$A, d$Y, t0 = d$t0)
  expect_equal(q$qini_at_full, d$ate, tolerance = 0.03)
})

test_that("survival outcome: censoring IPCW keeps Q(1) unbiased", {
  d <- setup_surv(n = 8000, cens_rate = 0.25)     # 约 30% 删失
  q <- qini_coefficient(d$tau, d$A, d$Y, t0 = d$t0)
  expect_equal(q$qini_at_full, d$ate, tolerance = 0.05)
})

test_that("survival outcome: oracle ranks above a random score", {
  d <- setup_surv(n = 2500)
  q_or <- qini_coefficient(d$tau, d$A, d$Y, t0 = d$t0)$qini_coefficient
  set.seed(9)
  q_ra <- qini_coefficient(sample(d$tau), d$A, d$Y, t0 = d$t0)$qini_coefficient
  expect_gt(q_or, q_ra)

  cb_or <- c_for_benefit(d$tau, d$A, d$Y, t0 = d$t0)$c_for_benefit
  set.seed(9)
  cb_ra <- c_for_benefit(sample(d$tau), d$A, d$Y, t0 = d$t0)$c_for_benefit
  expect_gt(cb_or, cb_ra)
})

test_that("survival outcome: TOC overall ATE agrees with Qini Q(1)", {
  d <- setup_surv(n = 3000)
  tc <- toc_curve(d$tau, d$A, d$Y, t0 = d$t0)
  q  <- qini_coefficient(d$tau, d$A, d$Y, t0 = d$t0)$qini_at_full
  expect_equal(attr(tc, "overall_ate"), q, tolerance = 1e-8)
  expect_equal(tc$toc[nrow(tc)], q, tolerance = 1e-6)   # 末尾回到总体 ATE
})

test_that("survival outcome: rmst scale is available and finite", {
  d <- setup_surv(n = 3000)
  q <- qini_coefficient(d$tau, d$A, d$Y, t0 = d$t0, effect = "rmst")
  expect_true(is.finite(q$qini_at_full))
  expect_gt(q$qini_at_full, 0)
})

test_that("survival outcome: t0 defaults to the median event time", {
  d <- setup_surv(n = 800)
  oc <- mlr3HTE:::.hte_outcome(d$Y)
  expect_identical(oc$kind, "survival")
  expect_equal(oc$t0, median(d$Y[, 1L][d$Y[, 2L] == 1L]), tolerance = 1e-9)
})

test_that("dr_pseudo_outcome works on a survival outcome", {
  d <- setup_surv(n = 1200)
  dr <- dr_pseudo_outcome(d$X, d$A, d$Y, t0 = d$t0, seed = 5)
  expect_length(dr$pseudo, 1200)
  expect_equal(dr$ate, d$ate, tolerance = 0.08)
  cb <- c_for_benefit(dr$mu1 - dr$mu0, d$A, d$Y, t0 = d$t0,
                      propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)
  expect_gt(cb$c_for_benefit, 0.5)
})

test_that("survival outcome rejects an mlr3 learner as the base learner", {
  d <- setup_surv(n = 400)
  expect_error(
    dr_pseudo_outcome(d$X, d$A, d$Y, t0 = d$t0,
                      learner_base = mlr3::lrn("regr.ranger")),
    "coxph"
  )
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
