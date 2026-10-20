# =====================================================================
# test-ml_task.R —— Task 编码测试
#
# 重点验证 extra_args 元数据在 clone(deep=TRUE)$filter() 与
# serialize()/unserialize() 之后仍然保留——这是 resample 能正确识别
# 生存结局的前提（mlr3 的 Task 没有 extra 字段，自定义 col_roles 也被拒）。
# =====================================================================

# 1 连续/二分类编码 ------------------------------------------------------------
test_that("连续与二分类：目标列即结局，协变量含处理列", {
  dc <- mlr3HTE_demo_data(n = 80, seed = 201)
  t1 <- ml_task(dc$X, dc$A, dc$Y)
  expect_s3_class(t1, "TaskRegr")
  expect_equal(t1$target_names, ".outcome")
  expect_setequal(t1$feature_names, c(names(dc$X), "A"))
  expect_equal(t1$extra_args$ml_outcome, "continuous")
  expect_true(is.null(t1$extra_args$ml_status_col))

  db <- mlr3HTE_demo_binary(n = 80, seed = 202)
  t2 <- ml_task(db$X, db$A, db$Y)
  expect_equal(t2$extra_args$ml_outcome, "binary")
  expect_setequal(unique(t2$truth()), c(0, 1))
})

# 2 生存编码 ------------------------------------------------------------------
test_that("生存：目标列为时间，另设 .status 列，t0 记入 extra_args", {
  ds <- mlr3HTE_demo_surv(n = 80, t0 = 2, seed = 203)
  t <- ml_task(ds$X, ds$A, ds$Y, t0 = 2)
  expect_equal(t$extra_args$ml_outcome, "survival")
  expect_equal(t$extra_args$ml_status_col, ".status")
  expect_equal(t$extra_args$ml_t0, 2)
  expect_true(".status" %in% t$feature_names)
  expect_equal(t$target_names, ".outcome")
  expect_equal(t$truth(), as.numeric(ds$Y[, 1]))
})

# 3 自定义处理列名 ------------------------------------------------------------
test_that("自定义 treatment_col 被记录且可从协变量中区分", {
  dc <- mlr3HTE_demo_data(n = 60, seed = 204)
  t <- ml_task(dc$X, dc$A, dc$Y, treatment_col = "trt")
  expect_equal(t$extra_args$ml_treatment_col, "trt")
  expect_true("trt" %in% t$feature_names)
})

# 4 处理列名冲突报错 ----------------------------------------------------------
test_that("treatment_col 与协变量列重名时报错", {
  dc <- mlr3HTE_demo_data(n = 60, seed = 205)
  dc$X$A <- 1
  expect_error(ml_task(dc$X, dc$A, dc$Y), "请换个 treatment_col")
})

# 5 元数据在分折后保留（resample 的关键前提）----------------------------------
test_that("extra_args 在 clone+filter 与序列化后保留", {
  ds <- mlr3HTE_demo_surv(n = 80, t0 = 2, seed = 206)
  t <- ml_task(ds$X, ds$A, ds$Y, t0 = 2)

  t_sub <- t$clone(deep = TRUE)$filter(1:40)
  expect_equal(t_sub$extra_args$ml_outcome, "survival")
  expect_equal(t_sub$extra_args$ml_t0, 2)

  t_ser <- unserialize(serialize(t, NULL))
  expect_equal(t_ser$extra_args$ml_outcome, "survival")
  expect_equal(t_ser$extra_args$ml_t0, 2)
})
