# 目的：钉住 mlr3HTE_dag() 的接口契约（输入校验 + 可渲染）
# 输入：无（纯函数测试）
# 输出：testthat 报告
# 依赖：testthat, ggplot2, mlr3HTE

test_that("dag 拒绝非法输入", {
  expect_error(mlr3HTE_dag("weird", "continuous"), '"rct", "obs"')      # design 不合法
  expect_error(mlr3HTE_dag("rct", "weird"), '"continuous", "binary"')   # outcome 不合法
})

test_that("dag 六种组合都返回 ggplot 对象", {
  for (dsgn in c("rct", "obs")) {
    for (oc in c("continuous", "binary", "survival")) {
      p <- mlr3HTE_dag(dsgn, oc)
      expect_s3_class(p, "ggplot")
      # 标题里应含设计类型与结局类型
      expect_true(grepl(oc, p$labels$title, fixed = TRUE))
    }
  }
})

test_that("dag 能在设备上渲染（中文标题不炸）", {
  f <- tempfile(fileext = ".png")
  grDevices::png(f, width = 800, height = 520, type = "cairo")
  expect_silent(print(mlr3HTE_dag("obs", "survival")))
  grDevices::dev.off()   # 必须先关设备，文件才落盘
  expect_gt(file.size(f), 5000)
})
