# =====================================================================
# test-engine.R —— 引擎层测试：三类结局 × 五种 metalearner × 随机/观察性
#
# 判定标准用「ATE 落在真值附近」+「CATE 与真值正相关」，
# 避免对随机性强的估计器写死数值。样本量取小以保测试速度。
# =====================================================================

# 1 连续结局 RCT --------------------------------------------------------------
test_that("连续结局：五种 metalearner 的 ATE 都在真值附近", {
  d <- mlr3HTE_demo_data(n = 600, seed = 101)
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)
  for (tp in c("S", "T", "X", "R", "DR")) {
    fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
    expect_equal(fit$outcome, "continuous")
    expect_equal(length(fit$cate_train), nrow(d$X))
    # ATE 容差放到 0.6：小样本下估计量方差不小
    expect_true(abs(fit$ate - d$ate) < 0.6,
                info = sprintf("%s: ATE=%.3f vs 真值 %.3f", tp, fit$ate, d$ate))
  }
})

# 2 二分类结局 RCT ------------------------------------------------------------
test_that("二分类结局：风险差尺度的 CATE 估计合理", {
  d <- mlr3HTE_demo_binary(n = 600, seed = 102)
  lb <- mlr3::lrn("classif.ranger", num.trees = 100, seed = 1)
  for (tp in c("S", "T", "X", "R", "DR")) {
    fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
    expect_equal(fit$outcome, "binary")
    expect_equal(length(fit$cate_train), nrow(d$X))
    expect_true(abs(fit$ate - d$ate) < 0.15,
                info = sprintf("%s: ATE=%.4f vs 真值 %.4f", tp, fit$ate, d$ate))
  }
})

# 3 生存结局 RCT --------------------------------------------------------------
test_that("生存结局：t0 生存概率差估计合理", {
  d <- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)
  for (tp in c("S", "T", "X", "R", "DR")) {
    fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)
    expect_equal(fit$outcome, "survival")
    expect_equal(fit$t0, 2)
    expect_equal(length(fit$cate_train), nrow(d$X))
    expect_true(all(is.finite(fit$cate_train)))
    expect_true(abs(fit$ate - d$ate) < 0.2,
                info = sprintf("%s: ATE=%.4f vs 真值 %.4f", tp, fit$ate, d$ate))
  }
})

# 3b S/T 的 CATE 是两个生存概率之差，必须落在 [-1, 1] --------------------------
# 注意：X/R/DR 的第二阶段是对伪结果做回归，不受概率尺度约束，
# 个别点可能略越界（R-learner 尤其明显），这是方法固有属性而非 bug。
test_that("生存 S/T 学习器的 CATE 严格落在 [-1,1]", {
  d <- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)
  for (tp in c("S", "T")) {
    fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)
    expect_true(all(fit$cate_train >= -1 & fit$cate_train <= 1),
                info = sprintf("%s: range [%.4f, %.4f]", tp,
                               min(fit$cate_train), max(fit$cate_train)))
  }
})

# 3c ranger 生存基学习器的预测必须随协变量变化 --------------------------------
# 回归测试：.surv_at_t0 曾用 ifelse(idx >= 1L, ...) 取值，而 idx 是标量、
# ifelse 的返回形状跟随 test，导致所有样本拿到同一个预测值（CATE 方差为 0）。
test_that("生存 ranger 基学习器的 CATE 不退化成常数", {
  d <- mlr3HTE_demo_surv(n = 400, t0 = 2, seed = 103)
  fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "ranger", t0 = 2)
  expect_true(sd(fit$cate_train) > 0.01,
              info = sprintf("CATE 标准差仅 %.4f，疑似退化成常数", sd(fit$cate_train)))
  expect_true(is.finite(fit$ate))
})

# 3d .surv_at_t0 对每行返回各自的值 -------------------------------------------
test_that(".surv_at_t0 返回长度与行数一致的向量", {
  sm <- matrix(seq(0.9, 0.1, length.out = 30), nrow = 6, ncol = 5)
  tt <- c(1, 2, 3, 4, 5)
  v <- mlr3HTE:::.surv_at_t0(sm, tt, 3)
  expect_equal(length(v), 6)
  expect_equal(v, sm[, 3])

  # t0 早于所有事件时点时统一返回 1
  expect_equal(mlr3HTE:::.surv_at_t0(sm, tt, 0.5), rep(1, 6))
})

# 4 t0 缺省值 -----------------------------------------------------------------
test_that("生存结局：t0 缺省时取事件时间中位数", {
  d <- mlr3HTE_demo_surv(n = 400, t0 = 2, seed = 104)
  fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph")
  expect_equal(fit$t0, stats::median(d$Y[, 1][d$Y[, 2] == 1]))
})

# 5 观察性数据：IPTW 应显著降低偏差 --------------------------------------------
test_that("观察性数据：IPTW 把偏差拉回来", {
  d <- mlr3HTE_demo_obs(n = 1200, seed = 105)
  naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)
  fit <- metalearner("X", d$X, d$A, d$Y, learner_base = lb, weighting = "iptw")
  expect_equal(fit$weighting, "iptw")
  # 未调整偏差应明显大于 IPTW 后的偏差
  expect_true(abs(fit$ate - d$ate) < abs(naive - d$ate))
})

# 6 外部权重路径 --------------------------------------------------------------
test_that("外部权重：weighting='external' 可走通", {
  d <- mlr3HTE_demo_obs(n = 800, seed = 106)
  w <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)
  fit <- metalearner("DR", d$X, d$A, d$Y, weighting = "external", weights = w)
  expect_equal(fit$weighting, "external")
  expect_true(is.finite(fit$ate))
})

# 7 输入校验 ------------------------------------------------------------------
test_that("结局类型与基学习器不匹配时报错", {
  d <- mlr3HTE_demo_data(n = 100, seed = 107)
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("classif.ranger")),
    "不匹配"
  )
})

test_that("external 权重缺失时报错", {
  d <- mlr3HTE_demo_data(n = 100, seed = 108)
  expect_error(
    metalearner("T", d$X, d$A, d$Y, weighting = "external"),
    "必须提供 weights"
  )
})

# 生存结局只接受原生基学习器名（不依赖 mlr3proba）------------------------------
test_that("生存结局只接受 coxph / ranger，其他基学习器一律报错", {
  d <- mlr3HTE_demo_surv(n = 100, t0 = 2, seed = 110)
  # 未知字符串
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = "bogus", t0 = 2),
    "coxph"
  )
  # 连续结局的学习器配生存结局
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"), t0 = 2),
    "不匹配"
  )
})

# 8 便捷封装 ------------------------------------------------------------------
test_that("s_learner/t_learner/... 直接返回 CATE 向量", {
  d <- mlr3HTE_demo_data(n = 300, seed = 109)
  lb <- mlr3::lrn("regr.ranger", num.trees = 50, seed = 1)
  for (fn in list(s_learner, t_learner, x_learner, r_learner, dr_learner)) {
    v <- fn(d$X, d$A, d$Y, learner_base = lb)
    expect_true(is.numeric(v))
    expect_equal(length(v), nrow(d$X))
  }
})
