# 回归测试：lrn() 必须能从本包直接调用
#
# 背景：文档站与 README 的示例一律只写 library(mlr3HTE) 就用 lrn()，
# 曾真实出现过消费者照抄后报「没有 lrn 这个函数」。这里把「再导出」这件事
# 钉成测试：NAMESPACE 里既有 export(lrn) 也有 importFrom(mlr3, lrn)，
# 且本包环境里的 lrn() 能真的造出 Learner。

# 1 NAMESPACE 声明 ------------------------------------------------------------
test_that("lrn 同时被 export 与 importFrom(mlr3)", {
  ns <- readLines(test_path("..", "..", "NAMESPACE"))
  expect_true(any(grepl("^export\\(lrn\\)$", ns)))
  expect_true(any(grepl("^importFrom\\(mlr3,lrn\\)$", ns)))
})

# 2 实际可用性 ----------------------------------------------------------------
test_that("library(mlr3HTE) 之后 lrn() 可直接造学习器", {
  lb <- lrn("regr.ranger", num.trees = 10, seed = 1)
  expect_s3_class(lb, "Learner")
  expect_equal(lb$id, "regr.ranger")

  # 与 mlr3 自己导出的必须是同一个函数，避免 attach 顺序引发混淆
  expect_identical(lrn, mlr3::lrn)
})
