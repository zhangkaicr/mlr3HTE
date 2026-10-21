# 灵活学习器规格：T-Learner 两组各用不同 learner、X-Learner 各阶段各用不同 learner
# 以及 S/R/DR 与 survlearners 引擎拒绝命名 list 的护栏。

test_that("T-Learner 支持按组指定不同学习器", {
  set.seed(1)
  d <- mlr3HTE_demo_data(n = 1500)

  # 单 learner（向后兼容）应当跑通
  fit_single <- metalearner("T", d$X, d$A, d$Y,
                            learner_base = lrn("regr.ranger", num.trees = 100, seed = 1))
  expect_length(fit_single$cate_train, nrow(d$X))
  expect_true(is.finite(fit_single$ate))

  # 命名 list：治疗组用 lm，对照组用 ranger
  fit_list <- metalearner("T", d$X, d$A, d$Y,
                          learner_base = list(
                            treated = lrn("regr.lm"),
                            control  = lrn("regr.ranger", num.trees = 100, seed = 1)))
  expect_length(fit_list$cate_train, nrow(d$X))
  expect_true(is.finite(fit_list$ate))
  # 两组不同算法不应让排序崩盘（与真 tau 相关仍应很高）
  expect_gt(cor(fit_list$cate_train, d$tau), 0.7)
})

test_that("X-Learner 支持 m1/m0 与 tau1/tau0 各自指定", {
  set.seed(2)
  d <- mlr3HTE_demo_data(n = 1500)

  fit <- metalearner("X", d$X, d$A, d$Y,
                     learner_base = list(
                       m1 = lrn("regr.lm"),
                       m0 = lrn("regr.ranger", num.trees = 100, seed = 1)),
                     learner_tau = list(
                       tau1 = lrn("regr.lm"),
                       tau0 = lrn("regr.lm")))
  expect_length(fit$cate_train, nrow(d$X))
  expect_true(is.finite(fit$ate))
  expect_gt(cor(fit$cate_train, d$tau), 0.7)
  # 两个 tau 回归应当是两个不同的模型对象
  expect_false(identical(fit$models$tau1, fit$models$tau0))
})

test_that("缺失角色 / 未知角色应给出明确报错", {
  set.seed(3)
  d <- mlr3HTE_demo_data(n = 800)
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = list(treated = lrn("regr.lm"))),
    "control"
  )
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = list(foo = lrn("regr.lm"), control = lrn("regr.lm"))),
    "foo"
  )
  expect_error(
    metalearner("X", d$X, d$A, d$Y, learner_tau = list(tau1 = lrn("regr.lm"))),
    "tau0"
  )
})

test_that("S / R / DR 拒绝按角色命名的 learner_base", {
  set.seed(4)
  d <- mlr3HTE_demo_data(n = 800)
  lb <- list(treated = lrn("regr.lm"), control = lrn("regr.lm"))
  for (tp in c("S", "R", "DR")) {
    expect_error(metalearner(tp, d$X, d$A, d$Y, learner_base = lb),
                 "T-Learner|X-Learner")
  }
})

test_that("tau1/tau0 的 list 只接受 X-Learner", {
  set.seed(5)
  d <- mlr3HTE_demo_data(n = 800)
  lt <- list(tau1 = lrn("regr.lm"), tau0 = lrn("regr.lm"))
  expect_error(metalearner("R", d$X, d$A, d$Y, learner_tau = lt),
               "X-Learner")
})

test_that("生存 X-Learner 可用原生字符串按组指定", {
  skip_if_not_installed("survival")
  set.seed(6)
  ds <- mlr3HTE_demo_surv(n = 1200, t0 = 2)
  fit <- metalearner("X", ds$X, ds$A, ds$Y, t0 = 2,
                     learner_base = list(m1 = "coxph", m0 = "ranger"),
                     learner_tau  = list(tau1 = lrn("regr.lm"), tau0 = lrn("regr.lm")))
  expect_length(fit$cate_train, nrow(ds$X))
  expect_true(is.finite(fit$ate))
  expect_gt(cor(fit$cate_train, ds$tau), 0.6)
})

test_that("R6 Learner 透传命名 list 同样生效", {
  set.seed(7)
  d <- mlr3HTE_demo_data(n = 1200)
  task <- ml_task(d$X, d$A, d$Y)
  lr <- lrn("regr.metalearner", metalearner = "T")
  lr$learner_base <- list(
    treated = lrn("regr.lm"),
    control  = lrn("regr.ranger", num.trees = 100, seed = 1))
  lr$train(task)
  pred <- lr$predict(task)$response
  expect_length(pred, nrow(d$X))
  expect_gt(cor(pred, d$tau), 0.7)
})
