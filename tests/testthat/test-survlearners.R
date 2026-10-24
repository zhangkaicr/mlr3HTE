# 目的：验证 engine = "survlearners" 生存引擎的派发、数值合理性与错误路径
# 输入：无（演示数据现场生成）
# 输出：testthat 报告
# 依赖：testthat, survlearners（未装则整文件跳过）, mlr3HTE

skip_if_not_installed("survlearners")

# 小样本 + 固定种子：整个文件的断言容差来自 n=500 的实测
# （ATE 偏差 -0.042 ~ +0.065，CATE 相关 0.76 ~ 0.96）
new_surv <- function(n = 500L, seed = 1203L) {
  mlr3HTE_demo_surv(n = n, t0 = 2, seed = seed)
}

test_that("S/T/R 三族 × 三种基学习器都能跑通且数值合理", {
  d <- new_surv()
  for (tp in c("S", "T", "R")) {
    for (k in c("coxph", "grf", "lasso")) {
      fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = k,
                         t0 = 2, engine = "survlearners")
      # 返回契约与原生引擎一致
      expect_named(fit, c("type", "outcome", "effect", "engine",
                          "cross_fitting", "t0", "models", "predict",
                          "cate_train", "ate"))
      expect_identical(fit$engine, "survlearners")
      expect_identical(fit$outcome, "survival")
      expect_length(fit$cate_train, nrow(d$X))
      expect_equal(fit$ate, mean(fit$cate_train))
      # ATE 贴近真值（容差 0.1，见文件头实测）
      expect_lt(abs(fit$ate - d$ate), 0.1)
      # CATE 与真值相关（容差 0.5）
      expect_gt(cor(fit$cate_train, d$tau), 0.5)
      # predict 对新数据同样生效
      nd <- d$X[1:20, , drop = FALSE]
      expect_length(fit$predict(nd), 20L)
    }
  }
})

test_that("X-learner：grf/lasso 可用，coxph 明确报错", {
  d <- new_surv()
  for (k in c("grf", "lasso")) {
    fit <- metalearner("X", d$X, d$A, d$Y, learner_base = k,
                       t0 = 2, engine = "survlearners")
    expect_lt(abs(fit$ate - d$ate), 0.1)
    expect_gt(cor(fit$cate_train, d$tau), 0.5)
  }
  # survlearners 没有 surv_xl_coxph，必须给出可操作的提示
  expect_error(
    metalearner("X", d$X, d$A, d$Y, learner_base = "coxph",
                t0 = 2, engine = "survlearners"),
    "coxph"
  )
})

test_that("ranger 是 grf 的别名（换引擎不必改字符串）", {
  d <- new_surv()
  f1 <- metalearner("S", d$X, d$A, d$Y, learner_base = "ranger",
                    t0 = 2, engine = "survlearners")
  f2 <- metalearner("S", d$X, d$A, d$Y, learner_base = "grf",
                    t0 = 2, engine = "survlearners")
  expect_equal(f1$ate, f2$ate)
})

test_that("观察性数据：真实倾向得分经 function 喂给 W.hat", {
  d <- mlr3HTE_demo_obs_surv(n = 500L, t0 = 2, seed = 1206)
  for (tp in c("X", "R")) {
    fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = "grf", t0 = 2,
                       learner_ps = function(nx) d$ps_true,
                       engine = "survlearners")
    expect_lt(abs(fit$ate - d$ate), 0.1)
    expect_gt(cor(fit$cate_train, d$tau), 0.4)
  }
})

test_that("观察性数据：默认自拟 PS 作为 W.hat", {
  d <- mlr3HTE_demo_obs_surv(n = 500L, t0 = 2, seed = 1206)
  fit <- metalearner("R", d$X, d$A, d$Y, learner_base = "grf", t0 = 2,
                     engine = "survlearners")
  expect_lt(abs(fit$ate - d$ate), 0.15)
})

test_that("不支持的能力给出明确报错", {
  d <- new_surv()
  # survlearners 没有 DR-learner
  expect_error(
    metalearner("DR", d$X, d$A, d$Y, learner_base = "coxph",
                t0 = 2, engine = "survlearners"),
    "DR"
  )
  # 只有 S(t0) 差一种尺度
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = "coxph",
                t0 = 2, effect = "rmst", engine = "survlearners"),
    "rmst"
  )
  # 非生存结局（消息是中文，按既有约定匹配 ASCII 标记 "native"）
  dc <- mlr3HTE_demo_data(n = 300L, seed = 1)
  expect_error(
    metalearner("T", dc$X, dc$A, dc$Y, engine = "survlearners"),
    "native"
  )
  # 不认识的基学习器字符串
  expect_error(
    metalearner("S", d$X, d$A, d$Y, learner_base = "weird",
                t0 = 2, engine = "survlearners"),
    "coxph"
  )
  # engine 取值本身也受 match.arg 保护
  expect_error(
    metalearner("T", d$X, d$A, d$Y, learner_base = "coxph",
                t0 = 2, engine = "weird"),
    '"native", "survlearners"'
  )
})

test_that("默认引擎仍是 native：老代码零变化", {
  d <- new_surv()
  fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)
  expect_identical(fit$engine, "native")
  expect_lt(abs(fit$ate - d$ate), 0.1)
  expect_gt(cor(fit$cate_train, d$tau), 0.9)
})

test_that("R6 Learner 也能切到 survlearners 引擎", {
  d <- new_surv()
  task <- ml_task(d$X, d$A, d$Y, t0 = 2)
  l <- mlr3::lrn("regr.metalearner", metalearner = "S", engine = "survlearners")
  l$learner_base <- "grf"                 # survlearners 引擎要字符串基学习器
  l$train(task)
  p <- l$predict(task)
  expect_length(p$response, nrow(d$X))
  expect_lt(abs(mean(p$response) - d$ate), 0.1)
})
