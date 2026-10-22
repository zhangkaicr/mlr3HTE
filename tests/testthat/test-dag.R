# 目的：钉住 mlr3HTE_dag() / mlr3HTE_dag_data() 的接口契约
#       （输入校验、可渲染、每对节点只有一条箭头、边不穿节点）
# 输入：无（纯函数测试）
# 输出：testthat 报告
# 依赖：testthat, ggplot2, mlr3HTE

test_that("dag 拒绝非法输入", {
  expect_error(mlr3HTE_dag("weird", "continuous"), '"rct", "obs"')      # design 不合法
  expect_error(mlr3HTE_dag("rct", "weird"), '"continuous", "binary"')   # outcome 不合法
  expect_error(mlr3HTE_dag_data("weird", "continuous"), '"rct", "obs"')
})

test_that("dag 六种组合都返回 ggplot 对象", {
  for (dsgn in c("rct", "obs")) {
    for (oc in c("continuous", "binary", "survival")) {
      p <- mlr3HTE_dag(dsgn, oc)
      expect_s3_class(p, "ggplot")
      expect_true(grepl(oc, p$labels$title, fixed = TRUE))
    }
  }
})

test_that("dag 能在设备上渲染（中文标题不炸）", {
  f <- tempfile(fileext = ".png")
  grDevices::png(f, width = 800, height = 520, type = "cairo")
  expect_silent(print(mlr3HTE_dag("obs", "survival")))
  grDevices::dev.off()
  expect_gt(file.size(f), 5000)
})

test_that("任意两个节点之间只有一条有向边", {
  # 回归测试：用户报「有的图两个节点之间画了两个箭头」。
  # 成因有两类：(1) 同一对 (from, to) 被重复写进边表；
  #            (2) 某条边从第三个节点身上穿过，视觉上像多出一条。
  for (dsgn in c("rct", "obs")) {
    dd <- mlr3HTE_dag_data(dsgn, "continuous")
    key <- paste(dd$edges$from, dd$edges$to, sep = "->")
    expect_false(any(duplicated(key)))
    # 也不允许同一对节点双向都有边（无向意义上仍算两条）
    und <- vapply(strsplit(key, "->"), function(v) paste(sort(v), collapse = "|"), character(1))
    expect_false(any(duplicated(und)))
  }
})

test_that("边的终点回退到标签盒外，起点仍在源节点中心", {
  shrink <- 0.55
  for (dsgn in c("rct", "obs")) {
    dd  <- mlr3HTE_dag_data(dsgn, "continuous")
    seg <- dd$edges
    lab <- dd$nodes

    d1 <- mapply(function(to, xe, ye) {
      i <- which(lab$id == to)
      sqrt((lab$x[i] - xe)^2 + (lab$y[i] - ye)^2)
    }, seg$to, seg$xe, seg$ye)
    expect_true(all(abs(d1 - shrink) < 1e-8))

    d0 <- mapply(function(fr, xs, ys) {
      i <- which(lab$id == fr)
      sqrt((lab$x[i] - xs)^2 + (lab$y[i] - ys)^2)
    }, seg$from, seg$xs, seg$ys)
    expect_true(all(abs(d0 - shrink) < 1e-8))
  }
})

test_that("边不从第三个节点身上穿过", {
  # 用与画图相同的二次贝塞尔公式重采样路径，检查是否落进任何非端点节点的标签盒
  bezier <- function(x0, y0, x1, y1, cv, n = 120L) {
    mx <- (x0 + x1) / 2; my <- (y0 + y1) / 2
    cxp <- mx + 0.5 * cv * (y1 - y0)
    cyp <- my - 0.5 * cv * (x1 - x0)
    t <- seq(0, 1, length.out = n)
    cbind((1 - t)^2 * x0 + 2 * (1 - t) * t * cxp + t^2 * x1,
          (1 - t)^2 * y0 + 2 * (1 - t) * t * cyp + t^2 * y1)
  }
  for (dsgn in c("rct", "obs")) {
    dd <- mlr3HTE_dag_data(dsgn, "continuous")
    for (i in seq_len(nrow(dd$edges))) {
      e <- dd$edges[i, ]
      pts <- bezier(e$xs, e$ys, e$xe, e$ye, e$curve)
      others <- setdiff(dd$nodes$id, c(e$from, e$to))
      for (nd in others) {
        j <- which(dd$nodes$id == nd)
        hit <- any(abs(pts[, 1] - dd$nodes$x[j]) < 0.9 &
                     abs(pts[, 2] - dd$nodes$y[j]) < 0.45)
        expect_false(hit, info = sprintf("%s: %s->%s 穿过 %s", dsgn, e$from, e$to, nd))
      }
    }
  }
})

test_that("dag_data 返回结构完整", {
  dd <- mlr3HTE_dag_data("obs", "binary")
  expect_named(dd, c("nodes", "edges", "subtitle", "outcome_zh", "outcome_en"))
  expect_true(all(c("id", "x", "y", "label", "role") %in% names(dd$nodes)))
  expect_true(all(c("from", "to", "type", "xs", "ys", "xe", "ye", "curve") %in%
                    names(dd$edges)))
  # obs 图必须有 e 节点与两条红色混杂边
  expect_true("e" %in% dd$nodes$id)
  expect_equal(sum(dd$edges$type == "conf"), 2L)
  # rct 图不允许有混杂边
  expect_equal(sum(mlr3HTE_dag_data("rct", "binary")$edges$type == "conf"), 0L)
})
