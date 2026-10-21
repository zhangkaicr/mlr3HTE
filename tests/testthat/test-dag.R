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

test_that("dag 的边必须缩短，否则箭头被 geom_label 吞掉", {
  # 回归测试：arrow 参数一直都在，但边终止在节点中心，而 geom_label 是不透明底色
  # 且画在更上层，箭头整个被盖住，看上去像"没有箭头"。
  # 修法是把终点朝起点回退 shrink，本测试钉住这个距离。
  shrink <- 0.45
  for (dsgn in c("rct", "obs")) {
    p   <- mlr3HTE_dag(dsgn, "continuous")
    seg <- p$layers[[1]]$data      # geom_segment 的边（已缩短）
    lab <- p$layers[[2]]$data      # geom_label 的节点

    # 箭头参数必须真的传进去了
    expect_false(is.null(p$layers[[1]]$geom_params$arrow))

    # 每条边的终点到"目标节点中心"的距离应恰为 shrink，而不是 0
    d <- mapply(function(to, xe, ye) {
      i <- which(lab$id == to)
      sqrt((lab$x[i] - xe)^2 + (lab$y[i] - ye)^2)
    }, seg$to, seg$xend, seg$yend)
    expect_false(anyNA(d))
    expect_true(all(abs(d - shrink) < 1e-8))

    # 起点必须仍在原节点上（只缩终点，不动起点）
    d0 <- mapply(function(fr, xs, ys) {
      i <- which(lab$id == fr)
      sqrt((lab$x[i] - xs)^2 + (lab$y[i] - ys)^2)
    }, seg$from, seg$x, seg$y)
    expect_true(all(d0 < 1e-8))
  }
})
