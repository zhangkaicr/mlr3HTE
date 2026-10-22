# R / DR 的交叉拟合 与 生存 RMST 效应尺度
# 这两项在 engine.R 里已实现，这里固化为回归测试，防止以后改动悄悄退化。

# 1 交叉拟合 -------------------------------------------------------------------
test_that("R / DR 支持 cross_fitting 且结果可复现", {
  d <- mlr3HTE_scenario("obs_lin_lin_sharedT", "continuous", n = 600, seed = 4)
  for (L in c("R", "DR")) {
    set.seed(1)
    a <- metalearner(L, d$X, d$A, d$Y, weighting = "iptw",
                     cross_fitting = TRUE, n_folds = 4)
    set.seed(1)
    b <- metalearner(L, d$X, d$A, d$Y, weighting = "iptw",
                     cross_fitting = TRUE, n_folds = 4)
    expect_true(isTRUE(a$cross_fitting))
    expect_equal(a$ate, b$ate, tolerance = 1e-8)
    expect_length(a$cate_train, nrow(d$X))
  }
})

test_that("交叉拟合对 R-Learner 的 in-fold 过拟合有矫正作用", {
  # R-Learner 的目标是 (Y-mu)/(A-e)，分母接近 0 时放大噪声；
  # 干扰参数在同一批数据上拟合会让 mu_hat 过拟合、残差被系统性压缩，
  # 表现为 ATE 被大幅低估。交叉拟合应把偏差拉回来。
  d <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "continuous", n = 1500, seed = 1)
  set.seed(1)
  f_in  <- metalearner("R", d$X, d$A, d$Y, weighting = "iptw", cross_fitting = FALSE)
  set.seed(1)
  f_oof <- metalearner("R", d$X, d$A, d$Y, weighting = "iptw",
                       cross_fitting = TRUE, n_folds = 5)
  expect_gt(abs(f_in$ate - d$ate), abs(f_oof$ate - d$ate))
})

test_that("交叉拟合只对 R / DR 生效，其他 learner 给出警告并忽略", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 300, seed = 2)
  expect_warning(
    metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"),
                cross_fitting = TRUE),
    "交叉拟合"
  )
})

test_that("n_folds 非法取值会被夹到合法范围", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 200, seed = 2)
  # n_folds 大于样本量时应退化为「每折一个观测」而不是报错
  expect_silent(
    metalearner("DR", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"),
                cross_fitting = TRUE, n_folds = 999)
  )
})

# 2 RMST -----------------------------------------------------------------------
test_that("生存结局的 RMST 尺度可估计并接近真值", {
  s <- mlr3HTE_scenario("rct_lin", "survival", n = 1500, seed = 6, t0 = 2)
  set.seed(1)
  fit <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0,
                     effect = "rmst")
  expect_identical(fit$effect, "rmst")
  expect_equal(fit$ate, mean(fit$cate_train))
  # RMST 是时间尺度，真值约 0.2，容许 0.06 的抽样与模型误差
  expect_lt(abs(fit$ate - s$ate_rmst), 0.06)
})

test_that("RMST 与生存概率差是两个不同的尺度", {
  s <- mlr3HTE_scenario("rct_lin", "survival", n = 800, seed = 6, t0 = 2)
  set.seed(1)
  f_s <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0,
                     effect = "survdiff")
  set.seed(1)
  f_r <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0,
                     effect = "rmst")
  expect_false(isTRUE(all.equal(f_s$ate, f_r$ate)))
  expect_identical(f_s$effect, "survdiff")
})

test_that("effect = 'rmst' 用在非生存结局上直接报错", {
  d <- mlr3HTE_scenario("rct_lin", "continuous", n = 200, seed = 2)
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"),
                effect = "rmst"),
    "rmst"
  )
})

test_that("评价指标也接受 RMST 尺度", {
  s <- mlr3HTE_scenario("rct_lin", "survival", n = 600, seed = 8, t0 = 2)
  set.seed(1)
  fit <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0,
                     effect = "rmst")
  cate <- as.numeric(fit$predict(s$X))
  q <- qini_curve(cate, s$A, s$Y, t0 = s$t0, X = s$X, effect = "rmst")
  expect_true(all(c("fraction", "qini") %in% names(q)))
  qc <- qini_coefficient(cate, s$A, s$Y, t0 = s$t0, X = s$X, effect = "rmst")
  expect_true(is.finite(qc$qini_coefficient))
  expect_true(is.finite(qc$qini_normalized))
})
