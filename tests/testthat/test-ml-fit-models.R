# 每阶段每算法都拟合一个 mlr3 模型，并经 $models 暴露
# 目的：证明 metalearner 的内部每个阶段确实训练了（且可取回）mlr3 模型，
#      这些模型正是最终 CATE 的来源，而非黑箱占位。
# 注意 $models 里有两种形态：
#   - 结局模型（S 的 m；T/X 的 m1/m0；R 的 mu；DR 的 m1/m0）由 .fit_outcome 包成
#     list(kind, model, predict)，predict(newX) 直接可用；
#   - 效应阶段回归（R/DR 的 tau；X 的 tau1/tau0）是裸的已训练 mlr3 Learner，
#     需走 $predict_newdata()。两者都是真正的 mlr3 模型。
# 输入：mlr3HTE_demo_data（RCT 连续结局）提供的 X/A/Y/tau
# 输出：断言（见各 test_that）
# 依赖：mlr3HTE、mlr3、testthat

# 兼容两种形态的读取器：返回 (learner = 已训练 mlr3 模型, predict = function(newX))
.get_comp <- function(comp) {
  if (is.list(comp) && "model" %in% names(comp) && inherits(comp$model, "Learner")) {
    list(learner = comp$model,
         predict = function(nd) as.numeric(comp$predict(as.data.frame(nd))))
  } else if (inherits(comp, "Learner")) {
    list(learner = comp,
         predict = function(nd) as.numeric(comp$predict_newdata(as.data.frame(nd))$response))
  } else {
    stop("unexpected $models component shape")
  }
}

test_that("$models 里每个组件都是已训练的 mlr3 模型且能出预测", {
  d <- mlr3HTE_demo_data(n = 800, seed = 1)
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)

  for (type in c("S", "T", "X", "R", "DR")) {
    fit <- metalearner(type, d$X, d$A, d$Y, learner_base = lb)

    # $models 必须是 list，且至少包含一个模型组件
    expect_type(fit$models, "list")
    expect_true(length(fit$models) >= 1)

    for (nm in names(fit$models)) {
      c <- .get_comp(fit$models[[nm]])
      # 是已训练的 mlr3 Learner（连续结局下为 LearnerRegr）
      expect_true(inherits(c$learner, "Learner"))
      expect_true(inherits(c$learner, "LearnerRegr"))
      # 训练后 $model 槽非空（区别于未训练占位）
      expect_false(is.null(c$learner$model))
      # 预测必须有限（说明它真的被训练过）。S-Learner 的结局模型把 a_trt 当特征，
      # 直接拿 X 预测会因缺列报错，此时补一列 a_trt 再试。
      nd <- as.data.frame(d$X)
      p <- tryCatch(c$predict(nd), error = function(e) {
        nd2 <- as.data.frame(d$X); nd2$a_trt <- 0L
        c$predict(nd2)
      })
      expect_true(all(is.finite(p)))
    }
  }
})

test_that("各 learner 的 $models 命名与文档 @@details 一致", {
  d <- mlr3HTE_demo_data(n = 800, seed = 1)
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)

  expect_named(metalearner("S", d$X, d$A, d$Y, learner_base = lb)$models, "m")
  expect_named(metalearner("T", d$X, d$A, d$Y, learner_base = lb)$models, c("m1", "m0"))
  expect_named(
    metalearner("X", d$X, d$A, d$Y, learner_base = lb)$models,
    c("m1", "m0", "tau1", "tau0"))
  expect_named(metalearner("R", d$X, d$A, d$Y, learner_base = lb)$models, c("mu", "tau"))
  expect_named(metalearner("DR", d$X, d$A, d$Y, learner_base = lb)$models, c("m1", "m0", "tau"))
})

test_that("S/T 的逐阶段模型直接复现 cate_train（演示这些模型就是 CATE 的来源）", {
  d <- mlr3HTE_demo_data(n = 800, seed = 1)
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)

  # S-Learner：一个模型，处理当普通特征，反事实相减
  fitS <- metalearner("S", d$X, d$A, d$Y, learner_base = lb)
  m <- fitS$models$m
  Xa1 <- data.frame(d$X, a_trt = 1L)
  Xa0 <- data.frame(d$X, a_trt = 0L)
  expect_equal(m$predict(Xa1) - m$predict(Xa0), fitS$cate_train, tolerance = 1e-8)

  # T-Learner：两组各一个模型，相减
  fitT <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)
  expect_equal(
    fitT$models$m1$predict(d$X) - fitT$models$m0$predict(d$X),
    fitT$cate_train, tolerance = 1e-8)
})

test_that("R/DR 的 tau 模型直接给出 cate_train", {
  d <- mlr3HTE_demo_data(n = 800, seed = 1)
  lb <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)

  fitR <- metalearner("R", d$X, d$A, d$Y, learner_base = lb)
  expect_equal(.get_comp(fitR$models$tau)$predict(d$X), fitR$cate_train, tolerance = 1e-8)

  fitDR <- metalearner("DR", d$X, d$A, d$Y, learner_base = lb)
  expect_equal(.get_comp(fitDR$models$tau)$predict(d$X), fitDR$cate_train, tolerance = 1e-8)
})

test_that("按角色命名 list 时，各组/各阶段确实用了不同的 mlr3 学习器", {
  d <- mlr3HTE_demo_data(n = 800, seed = 1)

  # T-Learner：治疗组用 lm，对照组用 ranger（m1/m0 是包装后的结局模型，取 $model$id）
  fitT <- metalearner("T", d$X, d$A, d$Y,
                      learner_base = list(
                        treated = mlr3::lrn("regr.lm"),
                        control  = mlr3::lrn("regr.ranger", num.trees = 100, seed = 1)))
  expect_equal(fitT$models$m1$model$id, "regr.lm")
  expect_equal(fitT$models$m0$model$id, "regr.ranger")

  # X-Learner：tau1/tau0 各自指定（tau1/tau0 是裸 Learner，取 $id）
  fitX <- metalearner("X", d$X, d$A, d$Y,
                      learner_base = list(
                        m1 = mlr3::lrn("regr.lm"),
                        m0 = mlr3::lrn("regr.lm")),
                      learner_tau = list(
                        tau1 = mlr3::lrn("regr.ranger", num.trees = 100, seed = 1),
                        tau0 = mlr3::lrn("regr.lm")))
  expect_equal(fitX$models$tau1$id, "regr.ranger")
  expect_equal(fitX$models$tau0$id, "regr.lm")
  # 两个效应回归是两个不同的模型对象
  expect_false(identical(fitX$models$tau1, fitX$models$tau0))
})
