# 回归测试：lrn() 必须能从本包直接调用
#
# 背景：文档站与 README 的示例一律只写 library(mlr3HTE) 就用 lrn()，
# 曾真实出现过消费者照抄后报「没有 lrn 这个函数」。这里把「再导出」这件事
# 钉成测试：NAMESPACE 里既有 export(lrn) 也有 importFrom(mlr3, lrn)，
# 且本包环境里的 lrn() 能真的造出 Learner。

# 1 NAMESPACE 声明 ------------------------------------------------------------
test_that("lrn 同时被 export 与 importFrom(mlr3)", {
  # 坑：不能写 test_path("..", "..", "NAMESPACE")。那个相对路径只在「从包源码根」
  # 跑 devtools::test()/test_dir() 时成立；R CMD check 里测试的运行目录是
  # <pkg>.Rcheck/tests/，../../NAMESPACE 并不存在——曾因此在 GitHub CI 上报
  # "cannot open the connection" 直接判红。已安装包的目录里必定带 NAMESPACE，
  # 用 system.file(package=...) 取，源码 / 已安装 / check 三种上下文都成立。
  ns_file <- file.path(system.file(package = "mlr3HTE"), "NAMESPACE")
  expect_true(file.exists(ns_file))
  ns <- readLines(ns_file)
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
