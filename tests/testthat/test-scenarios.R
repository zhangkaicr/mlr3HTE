# 基准模拟场景：结构标签、真值自洽、可复现性
test_that("场景清单覆盖四个设计维度的全部组合", {
  s <- mlr3HTE_scenarios()
  expect_equal(nrow(s), 10L)
  expect_setequal(unique(s$design), c("rct", "obs"))
  expect_setequal(unique(s$confounding), c("none", "linear", "nonlinear"))
  expect_setequal(unique(s$hte), c("linear", "nonlinear"))
  expect_true(all(c(TRUE, FALSE) %in% s$shared))
  # RCT 两个场景必须没有混杂
  expect_true(all(s$confounding[s$design == "rct"] == "none"))
  # 观察性 8 个场景 = 混杂 2 种 × HTE 2 种 × shared 2 种
  expect_equal(sum(s$design == "obs"), 8L)
})

test_that("单个场景返回结构完整、真值自洽", {
  d <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "continuous", n = 400, seed = 7)
  expect_named(d, c("X", "A", "Y", "tau", "ate", "ps_true", "t0",
                    "meta", "tau_rmst", "ate_rmst"), ignore.order = TRUE)
  expect_equal(nrow(d$X), 400L)
  expect_equal(length(d$A), 400L)
  expect_equal(length(d$tau), 400L)
  expect_equal(d$ate, mean(d$tau))
  expect_true(all(d$ps_true > 0 & d$ps_true < 1))
  expect_identical(d$meta$shared, TRUE)
  expect_null(d$tau_rmst)
})

test_that("同一 id + outcome + seed 完全可复现", {
  a <- mlr3HTE_scenario("obs_lin_lin_sharedF", "continuous", n = 300, seed = 11)
  b <- mlr3HTE_scenario("obs_lin_lin_sharedF", "continuous", n = 300, seed = 11)
  expect_identical(a$Y, b$Y)
  expect_identical(a$tau, b$tau)
  # 默认种子按场景派生：不同场景的数据必须不同
  c1 <- mlr3HTE_scenario("rct_lin", "continuous", n = 300)
  c2 <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 300)
  expect_false(identical(c1$Y, c2$Y))
})

test_that("RCT 场景无混杂，观察性场景有混杂", {
  for (id in c("rct_lin", "rct_nonlin")) {
    d <- mlr3HTE_scenario(id, "continuous", n = 3000, seed = 3)
    expect_true(all(d$ps_true == 0.5))
    naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
    expect_lt(abs(naive - d$ate), 0.2)          # 随机化下粗暴差分无偏
  }
  for (id in c("obs_lin_lin_sharedT", "obs_nonlin_nonlin_sharedT")) {
    d <- mlr3HTE_scenario(id, "continuous", n = 3000, seed = 3)
    naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
    expect_gt(abs(naive - d$ate), 0.2)          # 有混杂时明显偏离
  }
})

test_that("shared = TRUE 的混杂强度大于 shared = FALSE", {
  bias <- function(id) {
    d <- mlr3HTE_scenario(id, "continuous", n = 3000, seed = 5)
    abs(mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0]) - d$ate)
  }
  expect_gt(bias("obs_lin_lin_sharedT"), bias("obs_lin_lin_sharedF"))
  expect_gt(bias("obs_nonlin_nonlin_sharedT"), bias("obs_nonlin_nonlin_sharedF"))
})

test_that("非线性 HTE 场景的 tau 确实非线性", {
  d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 2000, seed = 9)
  # 对 z1 做线性回归，残差平方和应明显大于线性场景
  z1 <- as.numeric(scale(d$X$lac))
  rss <- function(y) sum(stats::residuals(stats::lm(y ~ z1))^2)
  dl <- mlr3HTE_scenario("rct_lin", "continuous", n = 2000, seed = 9)
  expect_gt(rss(d$tau), rss(dl$tau))
})

test_that("二分类与生存结局的真值落在合法区间", {
  b <- mlr3HTE_scenario("rct_lin", "binary", n = 800, seed = 2)
  expect_true(all(b$tau > -1 & b$tau < 1))      # 风险差
  expect_identical(b$Y, as.integer(b$Y))

  s <- mlr3HTE_scenario("rct_lin", "survival", n = 800, seed = 2, t0 = 2)
  expect_s3_class(s$Y, "Surv")
  expect_true(all(s$tau >= -1 & s$tau <= 1))    # 生存概率差
  # RMST 差可正可负（治疗也可能有害），但绝对值不会超过整个积分区间 t0
  expect_true(all(is.finite(s$tau_rmst)))
  expect_true(all(abs(s$tau_rmst) <= s$t0))
  expect_equal(s$ate_rmst, mean(s$tau_rmst))
  expect_equal(s$t0, 2)
})

test_that("未知场景 id 报错", {
  expect_error(mlr3HTE_scenario("no_such_id", "continuous"), "未知场景 id")
})

test_that("随包基准数据可读且索引完整", {
  skip_if_not(dir.exists("../../data") || dir.exists("data"))
  ix <- mlr3HTE_bench_index()
  expect_equal(nrow(ix), 30L)
  expect_true(all(c("continuous", "binary", "survival") %in% ix$outcome))
  d <- mlr3HTE_bench("rct_lin", "continuous")
  expect_equal(nrow(d$X), 2000L)
  expect_equal(d$ate, mean(d$tau))
})
