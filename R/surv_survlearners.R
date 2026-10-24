# =====================================================================
# surv_survlearners.R —— 生存结局的 survlearners 引擎（可选后端）
#
# 背景：survlearners（Shah Lab，som-shahlab/survlearners，GPL-3）为生存结局
# 实现了 S/T/X/R/M 五种 metalearner，自带 IPCW 删失校正与（R 族的）交叉拟合，
# 基学习器固定为 coxph / grf（随机生存森林）/ lasso 三种，
# 效应尺度是 t0 时点生存概率差 tau(X) = P(Y(1)>t0|X) - P(Y(0)>t0|X)，
# 与 mlr3HTE 的 effect = "survdiff" 定义一致。
#
# 该包只发布在 GitHub（不在 CRAN），所以 mlr3HTE 不把它放进 Imports，
# 而是作为 Suggests 提供第二套引擎：engine = "survlearners" 时，
# 生存分支把估计整体委托给它；未安装时给出一条明确的安装提示。
#
# 与原生引擎（survival_base.R）的能力差异，务必如实告知用户：
#   survlearners 没有 DR-learner（只有 S/T/X/R/M）
#   survlearners 只有 S(t0) 差一种效应尺度（没有 RMST）
#   survlearners 的基学习器固定三种（不支持任意 mlr3 learner）
# 因此这两类需求会被明确拒绝并提示改用 engine = "native"。
#
# 倾向得分 W.hat 的来源（survlearners 的 X/R 族需要它）：与原生引擎一致，由
# learner_ps 给出——mlr3 分类学习器（默认 classif.log_reg，观察性数据）、
# 常数标量（RCT 已知随机化概率，如 0.5）或 function(newX)。
# 它只服务 X/R 族的算法定义（X 的 g(x) 融合、R 的 Robinson 中心化），
# 不是可开关的去混杂加权（v0.40 起移除了 weighting / weights / stabilize）。
# 另有一处权重：S-coxph 签名接受 weights，用来传生存删矢 IPCW，
# 与原生引擎对 effect = "survdiff" 的处理保持一致。
# =====================================================================

# 1 可用性检查 -----------------------------------------------------------------
.survlearners_require <- function() {
  if (!requireNamespace("survlearners", quietly = TRUE)) {
    stop(
      'engine = "survlearners" 需要 survlearners 包（只发布在 GitHub，不在 CRAN）：\n',
      '  remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")\n',
      '或改用 engine = "native"（原生 coxph/ranger 引擎，无需额外安装）。'
    )
  }
  invisible(TRUE)
}

# 2 基学习器种类映射 -----------------------------------------------------------
#  survlearners 的三种基学习器：coxph / grf（随机生存森林）/ lasso。
#  接受 "ranger" 作为 "grf" 的别名——原生引擎里 ranger 就是随机生存森林，
#  换引擎时用户不必改字符串。
.survlearners_kind <- function(lb) {
  if (is.character(lb) && length(lb) == 1L) {
    k <- switch(lb,
      coxph  = "coxph",
      grf    = "grf",
      ranger = "grf",     # 别名：ranger 生存森林即 RSF
      lasso  = "lasso",
      NULL
    )
    if (!is.null(k)) return(k)
  }
  stop(
    'engine = "survlearners" 的基学习器只支持字符串 "coxph" / "grf" / "lasso"',
    '（"ranger" 是 "grf" 的别名）；survlearners 不接受任意 mlr3 learner。',
    '要用 mlr3 基学习器请换回 engine = "native"。'
  )
}

# 3 精确屏蔽 glmnet 的一条上游提示 -------------------------------------------
# lasso 族内部反复调用 glmnet 的 Cox 路径，glmnet 5.x 对每个拟合都发一条
# "Cox tie-handling 默认值将要改变" 的提示（R-learner 一次能发 200+ 条），
# 会淹没教学输出。只屏蔽这一条固定文本，其余警告原样抛出。
.quiet_glmnet_ties <- function(expr) {
  withCallingHandlers(
    expr,
    warning = function(w) {
      if (grepl("Cox tie-handling", conditionMessage(w), fixed = TRUE)) {
        invokeRestart("muffleWarning")
      }
    }
  )
}

# 4 派发到 survlearners 的对应函数 ---------------------------------------------
# 返回 survlearners 的 fit 对象；各函数的参数签名（0.0.1）：
#   surv_sl_coxph(X, Y, W, D, t0, weights)      surv_sl_grf(X, Y, W, D, t0)
#   surv_sl_lasso(X, Y, W, D, t0, ...)
#   surv_tl_coxph(X, Y, W, D, t0)               surv_tl_grf / surv_tl_lasso(...)
#   surv_xl_grf(X, Y, W, D, t0, W.hat, ...)     surv_xl_lasso(...)
#   surv_rl_grf(X, Y, W, D, t0, W.hat, ...)     surv_rl_grf_lasso / surv_rl_lasso(...)
# 注意：T 族没有 W.hat 参数（T-learner 不需要倾向得分）；S 族只有 coxph 接受
# weights（用于删矢 IPCW）。grf/lasso 的其余超参一律走包内默认，保证教学场景可复现。
.fit_survlearners <- function(type, X, A, Y, kind, t0, W.hat, w_cens) {
  # survlearners 的 X-learner 只有 grf / lasso 两种实现，没有 coxph 版
  if (identical(type, "X") && identical(kind, "coxph")) {
    stop('survlearners 的 X-learner 只有 "grf" 与 "lasso" 两种基学习器，没有 coxph 版；',
         '请把 learner_base 换成 "grf" 或 "lasso"，或换用 S / T / R。')
  }
  sl <- asNamespace("survlearners")
  Xm  <- as.matrix(X)
  tt  <- as.numeric(Y[, 1L])
  dd  <- as.integer(Y[, 2L])
  ww  <- as.integer(A)
  fn_name <- switch(
    type,
    S  = paste0("surv_sl_", if (kind == "grf") "grf" else kind),
    T  = paste0("surv_tl_", if (kind == "grf") "grf" else kind),
    X  = paste0("surv_xl_", kind),
    R  = switch(kind, grf = "surv_rl_grf", lasso = "surv_rl_lasso", "surv_rl_grf_lasso")
  )
  fn <- get(fn_name, envir = sl)

  # T 族签名里没有 W.hat；S 族只有 coxph 接受 weights（删矢 IPCW）
  args <- list(X = Xm, Y = tt, W = ww, D = dd, t0 = t0)
  fmls <- names(formals(fn))
  if ("W.hat" %in% fmls) args$W.hat <- W.hat
  if (identical(type, "S") && identical(kind, "coxph") &&
      "weights" %in% fmls && !is.null(w_cens)) {
    args$weights <- w_cens
  }
  # 固定随机森林种子：survlearners 把超参透传给 grf，而 grf 默认 seed = NULL
  # （每次不同），教学场景必须可复现。各函数包装 grf 的参数名不统一
  # （new.args.grf.nuisance / args.grf.nuisance / new.args.cf），按形参名匹配。
  grf_args <- grep("^(new\\.)?args\\.(grf|cf)\\.nuisance$", fmls, value = TRUE)
  for (a in grf_args) args[[a]] <- list(seed = 1L)
  fit <- .quiet_glmnet_ties(do.call(fn, args))

  list(
    fit = fit,
    predict = function(newX) {
      as.numeric(stats::predict(fit, as.matrix(as.data.frame(newX))))
    }
  )
}

# 5 引擎总入口：校验 -> 算 W.hat 与删矢权重 -> 派发 -> 组装标准返回 -------------
# 返回结构与 ml_fit() 完全一致（predict / cate_train / ate / type / outcome / ...），
# 这样 metalearner() 与 R6 Learner 的上层代码无需任何改动。
.ml_fit_survlearners <- function(type, X, A, Y, learner_base, learner_ps, t0, effect) {
  .survlearners_require()
  if (!type %in% c("S", "T", "X", "R")) {
    stop(sprintf(
      'survlearners 引擎未实现 "%s"-learner（该包只提供 S/T/X/R/M，没有 DR）。',
      type[1L]),
      '生存场景的 DR 请用 engine = "native"。')
  }
  if (!identical(effect, "survdiff")) {
    stop('engine = "survlearners" 只实现 S(t0) 差一种效应尺度，不支持 effect = "rmst"；',
         'RMST 请用 engine = "native"。')
  }
  kind <- .survlearners_kind(learner_base)
  X <- as.data.frame(X)
  A <- as.integer(A)
  if (is.null(t0)) {
    tt <- Y[, 1L][Y[, 2L] == 1L]
    t0 <- if (length(tt)) stats::median(tt) else stats::median(Y[, 1L])
    message("t0 未指定，默认取事件时间中位数：", signif(t0, 4))
  }

  # W.hat：survlearners 的 X/R 族按个体倾向得分做处理校正。
  # 与原生引擎同源——learner_ps 给学习器 / 常数 / function，默认 classif.log_reg。
  # 它服务 X/R 族的算法定义，不是可开关的去混杂加权。
  W.hat <- NULL
  if (type %in% c("X", "R")) {
    if (is.null(learner_ps)) learner_ps <- mlr3::lrn("classif.log_reg")
    W.hat <- .fit_ps(X, A, learner_ps)(X)
  }

  # 删矢 IPCW：与原生引擎对 effect = "survdiff" 的处理一致，
  # 只喂给 S-coxph（survlearners 里唯一接受 weights 的签名）。
  w_cens <- .surv_ipcw(Y[, 1L], Y[, 2L], X)

  res <- .fit_survlearners(type, X, A, Y, kind, t0, W.hat, w_cens)

  # 诚实提示：survlearners 的 S-grf / S-lasso 签名里既没有 weights 也没有 W.hat，
  # 删矢 IPCW 对这两个组合不起作用（S-coxph 有 weights，X/R 族有 W.hat）。
  if (identical(type, "S") && !identical(kind, "coxph")) {
    cli::cli_alert_warning(
      "survlearners 的 S-learner 只有 coxph 版接受 weights；S-{kind} 已忽略删矢 IPCW。"
    )
  }

  out <- list(
    type = type,
    outcome = "survival",
    effect = effect,
    engine = "survlearners",
    cross_fitting = FALSE,       # survlearners 的 R 族内部自带 K 折交叉拟合
    t0 = t0,
    models = res$fit,
    predict = res$predict
  )
  out$cate_train <- out$predict(X)
  out$ate <- mean(out$cate_train)
  out
}
