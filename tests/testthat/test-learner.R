# =====================================================================
# test-learner.R —— R6 Learner 测试
#
# 覆盖三类结局的 train/predict/score，以及 resample 集成。
# resample 是重点：历史上这里出过段错误（truth=NULL 导致 measure 断言失败），
# 必须守住。
# =====================================================================

# 1 三类结局的 train / predict -------------------------------------------------
test_that("R6 Learner 三类结局均可训练与预测", {
  dc <- mlr3HTE_demo_data(n = 400, seed = 301)
  db <- mlr3HTE_demo_binary(n = 400, seed = 302)
  ds <- mlr3HTE_demo_surv(n = 400, t0 = 2, seed = 303)

  l_c <- mlr3::lrn("regr.metalearner", metalearner = "T")
  l_c$learner_base <- mlr3::lrn("regr.ranger", num.trees = 50, seed = 1)
  l_c$train(ml_task(dc$X, dc$A, dc$Y))
  p_c <- l_c$predict(ml_task(dc$X, dc$A, dc$Y))
  expect_s3_class(p_c, "PredictionRegr")
  expect_equal(length(p_c$response), nrow(dc$X))
  expect_true(abs(mean(p_c$response) - dc$ate) < 0.8)

  l_b <- mlr3::lrn("regr.metalearner", metalearner = "X")
  l_b$learner_base <- mlr3::lrn("classif.ranger", num.trees = 50, seed = 1)
  l_b$train(ml_task(db$X, db$A, db$Y))
  p_b <- l_b$predict(ml_task(db$X, db$A, db$Y))
  expect_equal(length(p_b$response), nrow(db$X))
  expect_true(abs(mean(p_b$response) - db$ate) < 0.2)

  l_s <- mlr3::lrn("regr.metalearner", metalearner = "T")
  l_s$learner_base <- "coxph"
  l_s$train(ml_task(ds$X, ds$A, ds$Y, t0 = 2))
  p_s <- l_s$predict(ml_task(ds$X, ds$A, ds$Y, t0 = 2))
  expect_equal(length(p_s$response), nrow(ds$X))
  expect_true(abs(mean(p_s$response) - ds$ate) < 0.25)
})

# 2 打分可用（曾因 truth=NULL 崩溃）--------------------------------------------
test_that("预测结果可以打分", {
  dc <- mlr3HTE_demo_data(n = 300, seed = 304)
  task <- ml_task(dc$X, dc$A, dc$Y)
  l <- mlr3::lrn("regr.metalearner", metalearner = "T")
  l$learner_base <- mlr3::lrn("regr.ranger", num.trees = 50, seed = 1)
  l$train(task)
  p <- l$predict(task)
  expect_true(is.finite(p$score(mlr3::msr("regr.mse"))))
})

# 3 resample 三类结局 ---------------------------------------------------------
test_that("resample 在三类结局下都能跑完并给出分数", {
  dc <- mlr3HTE_demo_data(n = 300, seed = 305)
  db <- mlr3HTE_demo_binary(n = 300, seed = 306)
  ds <- mlr3HTE_demo_surv(n = 300, t0 = 2, seed = 307)

  mk <- function(task, metalearner, lb) {
    l <- mlr3::lrn("regr.metalearner", id = paste0("mm_", metalearner),
                   metalearner = metalearner)
    l$learner_base <- lb
    l
  }
  cases <- list(
    list(task = ml_task(dc$X, dc$A, dc$Y),
         l = mk(NULL, "T", mlr3::lrn("regr.ranger", num.trees = 50, seed = 1))),
    list(task = ml_task(db$X, db$A, db$Y),
         l = mk(NULL, "X", mlr3::lrn("classif.ranger", num.trees = 50, seed = 1))),
    list(task = ml_task(ds$X, ds$A, ds$Y, t0 = 2),
         l = mk(NULL, "T", "coxph"))
  )
  for (cs in cases) {
    rr <- mlr3::resample(cs$task, cs$l, mlr3::rsmp("cv", folds = 3))
    expect_equal(nrow(rr$score()), 3)
    expect_true(all(is.finite(rr$score()$regr.mse)))
  }
})

# 4 benchmark 需要唯一 id -----------------------------------------------------
test_that("benchmark_grid 中多个 metalearner 需给不同 id", {
  dc <- mlr3HTE_demo_data(n = 200, seed = 308)
  task <- ml_task(dc$X, dc$A, dc$Y)
  lb <- mlr3::lrn("regr.ranger", num.trees = 30, seed = 1)
  expect_error(
    mlr3::benchmark(mlr3::benchmark_grid(
      task,
      list(
        mlr3::lrn("regr.metalearner", metalearner = "T"),
        mlr3::lrn("regr.metalearner", metalearner = "X")
      ),
      mlr3::rsmp("cv", folds = 2)
    )),
    "unique IDs"
  )
  bm <- mlr3::benchmark(mlr3::benchmark_grid(
    task,
    list(
      mlr3::lrn("regr.metalearner", id = "a", metalearner = "T"),
      mlr3::lrn("regr.metalearner", id = "b", metalearner = "X")
    ),
    mlr3::rsmp("cv", folds = 2)
  ))
  expect_equal(nrow(bm$score()), 4)
})

# 5 可调参数 ------------------------------------------------------------------
test_that("metalearner 是可调参数（weighting 已移除）", {
  l <- mlr3::lrn("regr.metalearner")
  expect_setequal(l$param_set$ids(), c("metalearner", "engine"))
  l$param_set$values <- list(metalearner = "DR")
  expect_equal(l$param_set$values$metalearner, "DR")
})
