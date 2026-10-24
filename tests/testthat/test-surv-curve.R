# 生存效应曲线（surv_effect_curve / plot_surv_effect_curve）的回归测试。
#
# 重点守三件事：
#   1) 曲线上的每个点必须**等于**在同一个 t 上单独调用 metalearner() 的结果。
#      这是「逐点重拟合」这个设计的唯一契约，一旦有人为了性能改成
#      「一次拟合出整条曲线」，这条测试会立刻红。
#   2) 五族学习器行为一致：都能跑，返回结构相同。
#   3) 非生存结局必须明确报错，而不是默默返回一条没有意义的曲线。

d <- mlr3HTE_demo_surv(n = 300, t0 = 2, seed = 103)

test_that("单点曲线与 metalearner 在同一个 t 上完全一致", {
  # coxph + 无重采样，整条链路确定性，可以要求零误差
  tb <- c(0.8, 1.6, 3.0)
  for (tt in tb) {
    one <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = tt)
    cv <- surv_effect_curve("T", d$X, d$A, d$Y, times = c(tt, tt + 0.01))
    expect_equal(cv$ate[1L], one$ate, tolerance = 1e-12,
                 info = sprintf("t = %.3f 处曲线首点与单点拟合不一致", tt))
    expect_equal(cv$time[1L], tt)
  }
})

test_that("五族学习器都能产出结构相同的曲线", {
  for (tp in c("S", "T", "X", "R", "DR")) {
    cv <- surv_effect_curve(tp, d$X, d$A, d$Y, n_times = 3)
    expect_s3_class(cv, "mlr3HTE_surv_effect_curve")
    expect_equal(nrow(cv), 3L, info = tp)
    expect_equal(names(cv), c("time", "ate"), info = tp)
    expect_true(all(is.finite(cv$ate)), info = tp)
    expect_equal(dim(attr(cv, "cate")), c(nrow(d$X), 3L), info = tp)
    expect_equal(attr(cv, "n_fits"), 3L, info = tp)
    # 时点必须严格递增，否则曲线画出来会回头
    expect_true(all(diff(cv$time) > 0), info = tp)
  }
})

test_that("rmst 尺度的曲线随时间累积上升", {
  cv <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 4, effect = "rmst")
  expect_equal(attr(cv, "effect"), "rmst")
  expect_true(all(is.finite(cv$ate)))
  # ΔRMST(τ) 是 ΔS 在 [0, τ] 上的积分，处理组持续获益时必然随 τ 增大。
  # 这里只要求整体向上（首末相比），不要求逐点单调——估计噪声会让个别相邻点抖动。
  expect_gt(cv$ate[nrow(cv)], cv$ate[1L])
})

test_that("非生存结局明确报错", {
  dc <- mlr3HTE_demo_data(n = 200, seed = 101)
  expect_error(
    surv_effect_curve("T", dc$X, dc$A, dc$Y),
    "只对生存结局有意义"
  )
})

test_that("时点少于 2 个时报错", {
  expect_error(
    surv_effect_curve("T", d$X, d$A, d$Y, times = 1.5),
    "至少需要 2 个时点"
  )
})

test_that("超出随访范围的时点给出外推提醒", {
  expect_warning(
    surv_effect_curve("T", d$X, d$A, d$Y, times = c(1, max(d$Y[, 1L]) * 5)),
    "模型外推"
  )
})

test_that("A 或 Y 与 X 行数不符时报错", {
  expect_error(surv_effect_curve("T", d$X, d$A[-1], d$Y), "不一致")
  expect_error(surv_effect_curve("T", d$X, d$A, d$Y[-1, ]), "不一致")
})

test_that("plot_surv_effect_curve 返回 ggplot，且拒绝非本函数产物", {
  cv <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 3)
  expect_s3_class(plot_surv_effect_curve(cv), "ggplot")
  expect_s3_class(plot_surv_effect_curve(cv, ribbon = FALSE), "ggplot")
  expect_error(plot_surv_effect_curve(data.frame(time = 1, ate = 0)),
               "必须是 surv_effect_curve")
})

test_that("newX 只影响逐点 CATE，不影响 ate 曲线", {
  cv_all <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 3)
  cv_sub <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 3,
                              newX = d$X[1:10, , drop = FALSE])
  expect_equal(cv_sub$ate, cv_all$ate, tolerance = 1e-12)
  expect_equal(nrow(attr(cv_sub, "cate")), 10L)
})
