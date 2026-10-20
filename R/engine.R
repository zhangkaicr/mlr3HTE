# =====================================================================
# engine.R —— 内部算法引擎（单一事实来源）
#
# 核心抽象：五种 metalearner 的公式与结局类型无关，它们只跟「结局模型」打交道。
# 结局模型是一个 list，自带 predict(newX)，返回：
#     连续结局   -> E[Y | X]
#     二分类结局 -> P(Y = 1 | X)
#     生存结局   -> S(t0 | X)（t0 时点的生存概率）
# 于是同一个公式骨架同时服务三类结局：
#     S-Learner  = 把 A 当普通特征的结局模型，两个反事实预测相减
#     T-Learner  = 两个分组各自的结局模型，预测相减
#     X-Learner  = 插补个体治疗效应，再按倾向得分 g(X) 加权融合
#     R-Learner  = Robinson 残差化：结局与处理都对 X 取残差后回归
#     DR-Learner = 双重稳健伪结果（Kennedy 2020）后回归
#
# 生存结局的个体尺度分析结局取 I(T > t0)，并用 IPCW 校正删失（权重已含在
# 基础权重 w 里）；S/T 的结局模型自身已正确处理删失。
#
# 约定：内部函数名一律以 . 开头；基学习器用 mlr3 Learner（生存分支可为
# 原生名字符串，见 survival_base.R）；每次拟合前 clone(deep = TRUE)，
# 避免同一个 learner 对象多次 $train 互相覆盖。
# 权重落地：mlr3 1.8 的 Task/Learner 不接收 case weights，统一用
# learner-agnostic 的重要性重采样（按权重有放回抽样行），对任意基学习器生效。
# 注意重采样会引入蒙特卡洛噪声，需要复现时请在调用前 set.seed()。
#
# 生存结局有两套引擎（engine 参数，默认 "native"）：
#   "native"      原生 coxph/ranger 实现（survival_base.R），五族齐全、
#                 支持 RMST、支持任意 mlr3 基学习器，零额外依赖；
#   "survlearners" 委托 survlearners 包（surv_survlearners.R，GitHub-only，
#                 装没装都会给明确提示），只有 S/T/X/R 与 S(t0) 差尺度，
#                 但它自带 IPCW 与 R 族的交叉拟合，适合做方法学对照。
# =====================================================================

# 1 识别基学习器种类 -----------------------------------------------------------
# 生存结局的基学习器用字符串指定（原生实现，不依赖 mlr3proba）。
# 传 mlr3 的 lrn("surv.*") 会被明确拒绝——那需要 mlr3proba，本包不引入这个依赖。
.lb_kind <- function(lb) {
  if (is.character(lb)) {
    if (length(lb) != 1L || !lb %in% c("coxph", "ranger")) {
      stop('生存结局的基学习器只支持 "coxph" 与 "ranger"（原生实现，不依赖 mlr3proba）。')
    }
    return("surv_native")
  }
  if (inherits(lb, "LearnerRegr"))    return("regr")
  if (inherits(lb, "LearnerClassif")) return("classif")
  if (inherits(lb, "LearnerSurv")) {
    stop('生存结局请用原生基学习器 "coxph" 或 "ranger"；mlr3 的 lrn("surv.*") 需要 mlr3proba，本包不依赖它。')
  }
  stop('learner_base 必须是 mlr3 Learner（regr/classif），或生存结局的原生基学习器名字符串（"coxph"/"ranger"）。')
}

# 2 结局类型判定 ---------------------------------------------------------------
.resolve_outcome <- function(outcome, Y) {
  outcome <- match.arg(outcome, c("auto", "continuous", "binary", "survival"))
  if (outcome != "auto") return(outcome)
  if (inherits(Y, "Surv")) return("survival")
  if (is.factor(Y)) {
    if (nlevels(Y) != 2L) stop("二分类结局的因子必须恰好两个水平。")
    return("binary")
  }
  yv <- suppressWarnings(as.numeric(Y))
  if (all(!is.na(yv)) && length(unique(yv)) <= 2L && all(yv %in% c(0, 1))) return("binary")
  "continuous"
}

# 3 结局类型与基学习器是否匹配 -------------------------------------------------
.check_outcome_kind <- function(outcome, kind) {
  ok <- switch(outcome,
    continuous = kind == "regr",
    binary     = kind == "classif",
    survival   = kind == "surv_native"
  )
  if (!isTRUE(ok)) {
    stop(sprintf(
      '结局类型 "%s" 与基学习器种类 "%s" 不匹配：连续结局用 regr.*，二分类用 classif.*，生存结局用 "coxph" 或 "ranger"。',
      outcome, kind
    ))
  }
}

# 4 分析尺度的结局数值（X/R/DR 的个体尺度结局）---------------------------------
# 连续/二分类：就是 Y 本身（二分类取 0/1）
# 生存：按 effect 取 —— "survdiff" 为 I(T > t0)，"rmst" 为 IPCW 修正的
#       ξ = δ·min(X, τ)/Ĝ(X)（见 .surv_analysis_outcome）
.analysis_outcome <- function(Y, outcome, t0, effect = "survdiff", X = NULL) {
  if (outcome == "survival") {
    .surv_analysis_outcome(Y[, 1L], Y[, 2L], X, t0, effect)
  } else if (is.factor(Y)) {
    as.integer(Y == levels(Y)[2L])
  } else {
    as.numeric(Y)
  }
}

# 5 按行子集取结局 -------------------------------------------------------------
.subset_Y <- function(Y, idx) {
  if (inherits(Y, "Surv")) Y[idx, , drop = FALSE] else Y[idx]
}

# 6 按权重做重要性重采样（mlr3 无 case weights 的通用替代）---------------------
.resample_by_weights <- function(X, y, weights) {
  if (is.null(weights) || diff(range(weights)) <= 1e-12) {
    return(list(X = X, y = y))
  }
  idx <- sample.int(length(y), size = length(y), replace = TRUE, prob = weights / sum(weights))
  list(X = X[idx, , drop = FALSE], y = y[idx])
}

# 7 拟合一个回归基学习器 -------------------------------------------------------
.fit_regr <- function(X, y, learner_base, weights = NULL) {
  l <- learner_base$clone(deep = TRUE)
  rs <- .resample_by_weights(X, y, weights)
  data <- data.frame(rs$X, y_response = rs$y, stringsAsFactors = FALSE)
  task <- mlr3::as_task_regr(data, target = "y_response")
  l$train(task)
  l
}

# 8 拟合一个分类基学习器（二分类结局）------------------------------------------
# 注意：classif 学习器默认 predict_type = "response"，拿不到概率；
# 必须在 $train() 之前把 predict_type 切成 "prob"（训练后再改会触发
# check_prediction_data 的断言错误）。
.fit_classif <- function(X, y, learner_base, weights = NULL) {
  l <- learner_base$clone(deep = TRUE)
  if ("prob" %in% l$predict_types) l$predict_type <- "prob"
  yf <- factor(ifelse(as.integer(y) == 1L, "yes", "no"), levels = c("no", "yes"))
  rs <- .resample_by_weights(X, yf, weights)
  data <- data.frame(rs$X, y_response = rs$y, stringsAsFactors = FALSE)
  task <- mlr3::as_task_classif(data, target = "y_response")
  l$train(task)
  l
}

# 9 预测 ---------------------------------------------------------------------
.pred_regr <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$response)
}
.pred_classif <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$prob[, "yes"])
}

# 10 拟合倾向得分模型，返回 g(newX) = P(A = 1 | X) -----------------------------
# predict_type 同样要在 $train() 之前切成 "prob"（见 .fit_classif 的说明）
.fit_ps <- function(X, A, learner_ps) {
  l <- learner_ps$clone(deep = TRUE)
  if ("prob" %in% l$predict_types) l$predict_type <- "prob"
  Af <- factor(ifelse(A == 1L, "yes", "no"), levels = c("no", "yes"))
  data <- data.frame(X, a_trt = Af, stringsAsFactors = FALSE)
  task <- mlr3::as_task_classif(data, target = "a_trt")
  l$train(task)
  function(newX) {
    p <- l$predict_newdata(as.data.frame(newX))$prob[, "yes"]
    pmin(pmax(p, 1e-3), 1 - 1e-3)          # 截断，避免逆概率权重爆炸
  }
}

# 11 由 A 与倾向得分 e 计算 IPTW 权重 -----------------------------------------
.iptw_weights <- function(A, e, stabilize = FALSE) {
  ps <- if (stabilize) mean(A) else 1
  ifelse(A == 1L, ps / e, ps / (1 - e))
}

# 12 结局模型：统一入口 --------------------------------------------------------
# 返回 list(predict = function(newX) -> 结局尺度预测值, kind = ..., model = ...)
.fit_outcome <- function(X, Y, lb, w, t0, outcome, effect) {
  kind <- .lb_kind(lb)
  .check_outcome_kind(outcome, kind)
  if (kind == "regr") {
    m <- .fit_regr(X, .analysis_outcome(Y, outcome, t0, effect, X), lb, w)
    list(kind = "regr", model = m, predict = function(newX) .pred_regr(m, newX))
  } else if (kind == "classif") {
    m <- .fit_classif(X, .analysis_outcome(Y, outcome, t0, effect, X), lb, w)
    list(kind = "classif", model = m, predict = function(newX) .pred_classif(m, newX))
  } else {
    # 生存结局：lb 是 "coxph" / "ranger" 字符串，走原生实现
    # effect 决定 predict 返回 S(t0) 还是 RMST(t0)
    m <- .fit_surv(X, Y[, 1L], Y[, 2L], lb, t0, w, effect = effect)
    list(kind = "surv", effect = effect, model = m,
         predict = function(newX) as.numeric(m$predict(newX)))
  }
}

# 13 S-Learner：一个模型，处理当普通特征，两次反事实预测相减 -------------------
.fit_S <- function(X, A, Y, lb, lb_tau, g_fn, w, t0, outcome, effect) {
  m <- .fit_outcome(data.frame(X, a_trt = A), Y, lb, w, t0, outcome, effect)
  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    m$predict(data.frame(nd, a_trt = 1L)) - m$predict(data.frame(nd, a_trt = 0L))
  }
  list(models = list(m = m), predict = pred_fn)
}

# 14 T-Learner：两组各一个模型，相减 ------------------------------------------
.fit_T <- function(X, A, Y, lb, lb_tau, g_fn, w, t0, outcome, effect) {
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w)) NULL else w[i1]
  w0 <- if (is.null(w)) NULL else w[i0]
  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    m1$predict(nd) - m0$predict(nd)
  }
  list(models = list(m1 = m1, m0 = m0), predict = pred_fn)
}

# 15 X-Learner：两阶段插补 + 倾向得分加权融合 --------------------------------
# 插补的个体效应 D1 = Y1 - mu0(X1)，D0 = mu1(X0) - Y0，再分别回归出
# tau1 / tau0，最后按 g(X) 加权融合（Kunzel et al. 2019, PNAS）
.fit_X <- function(X, A, Y, lb, lb_tau, g_fn, w, t0, outcome, effect) {
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w)) NULL else w[i1]
  w0 <- if (is.null(w)) NULL else w[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)

  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)

  D1 <- Yv[i1] - m0$predict(X[i1, , drop = FALSE])     # 治疗组：实际 - 若未治
  D0 <- m1$predict(X[i0, , drop = FALSE]) - Yv[i0]     # 对照组：若治 - 实际
  tau1 <- .fit_regr(X[i1, , drop = FALSE], D1, lb_tau)
  tau0 <- .fit_regr(X[i0, , drop = FALSE], D0, lb_tau)

  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    g <- g_fn(nd)
    g * .pred_regr(tau0, nd) + (1 - g) * .pred_regr(tau1, nd)
  }
  list(models = list(m1 = m1, m0 = m0, tau1 = tau1, tau0 = tau0), predict = pred_fn)
}

# 16 R-Learner：残差对残差（Robinson 变换）------------------------------------
# mu(X) = E[Y|X]（不含 A），处理对倾向得分取残差 A - e(X)，
# 目标 (Y - mu)/(A - e)，以 (A - e)^2 为权重回归得 tau（Nie & Wager 2021）
.fit_R <- function(X, A, Y, lb, lb_tau, g_fn, w, t0, outcome, effect) {
  mu <- .fit_outcome(X, Y, lb, w, t0, outcome, effect)
  mu_hat <- mu$predict(as.data.frame(X))
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  e <- g_fn(as.data.frame(X))
  tildeA <- A - e
  target <- (Yv - mu_hat) / tildeA
  wt <- if (is.null(w)) tildeA^2 else w * tildeA^2
  tau <- .fit_regr(X, target, lb_tau, weights = wt)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(mu = mu, tau = tau), predict = pred_fn)
}

# 17 DR-Learner：双重稳健伪结果 ------------------------------------------------
# psi = mu1 - mu0 + A(Y - mu1)/e - (1 - A)(Y - mu0)/(1 - e)，
# 只要 (mu1, mu0) 或 e 之一正确，ATE 估计就一致（Kennedy 2020）
.fit_DR <- function(X, A, Y, lb, lb_tau, g_fn, w, t0, outcome, effect) {
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w)) NULL else w[i1]
  w0 <- if (is.null(w)) NULL else w[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)

  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
  mu1 <- m1$predict(as.data.frame(X))
  mu0 <- m0$predict(as.data.frame(X))
  e <- g_fn(as.data.frame(X))
  psi <- mu1 - mu0 + A * (Yv - mu1) / e - (1 - A) * (Yv - mu0) / (1 - e)
  tau <- .fit_regr(X, psi, lb_tau, weights = w)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(m1 = m1, m0 = m0, tau = tau), predict = pred_fn)
}

# 17b 交叉拟合（cross-fitting）-------------------------------------------------
# R/DR 的伪结果依赖干扰参数（R 的 mu；DR 的 m1 / m0 与倾向得分 e）。
# 如果这些干扰参数是在同一批数据上拟合、又在同一批数据上取伪结果，
# 过拟合会让伪结果带上系统性偏差，进而污染 tau。标准做法（Kennedy 2020）是：
#   第 k 折的伪结果用「其余 K-1 折拟合的干扰参数」算出，
#   全部折拼齐后再回归一次 tau。
# 本实现同时把倾向得分也做折内重估，所以是完整的交叉拟合。

# 两个权重向量相乘（任一为 NULL 就取另一个），供混杂权重 × 删失权重使用
.combine_w <- function(a, b) {
  if (is.null(a) && is.null(b)) return(NULL)
  if (is.null(a)) return(as.numeric(b))
  if (is.null(b)) return(as.numeric(a))
  as.numeric(a) * as.numeric(b)
}

# 折划分：随机打乱后尽量均分
.cv_folds <- function(n, k) {
  k <- max(2L, min(as.integer(k), n))
  idx <- sample.int(n)
  split(idx, cut(seq_len(n), breaks = k, labels = FALSE))
}

# 某个训练折内部的权重：外部权重直接取子集；IPTW 则折内重训 PS
.cf_weights <- function(X_tr, A_tr, learner_ps, stabilize, w_ext_tr) {
  if (!is.null(w_ext_tr)) return(as.numeric(w_ext_tr))
  if (is.null(learner_ps)) return(NULL)
  g <- .fit_ps(X_tr, A_tr, learner_ps)
  .iptw_weights(A_tr, g(X_tr), stabilize)
}

# 某个训练折内部的倾向得分函数（非 IPTW 时退化为常数 = 处理比例）
.cf_g_fn <- function(X_tr, A_tr, learner_ps) {
  if (is.null(learner_ps)) {
    return(function(newX) rep(mean(A_tr), nrow(as.data.frame(newX))))
  }
  g <- .fit_ps(X_tr, A_tr, learner_ps)
  function(newX) g(newX)
}

# R-Learner 的交叉拟合版
.fit_R_cf <- function(X, A, Y, lb, lb_tau, learner_ps, stabilize, w_ext,
                      w_cens, t0, outcome, effect, folds) {
  n <- nrow(X)
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  target <- numeric(n)
  for (f in folds) {
    tr <- setdiff(seq_len(n), f)
    w_tr <- .combine_w(
      .cf_weights(X[tr, , drop = FALSE], A[tr], learner_ps, stabilize,
                  if (is.null(w_ext)) NULL else w_ext[tr]),
      if (is.null(w_cens)) NULL else w_cens[tr]
    )
    mu <- .fit_outcome(X[tr, , drop = FALSE], .subset_Y(Y, tr), lb, w_tr,
                       t0, outcome, effect)
    g_k <- .cf_g_fn(X[tr, , drop = FALSE], A[tr], learner_ps)
    target[f] <- (Yv[f] - mu$predict(X[f, , drop = FALSE])) /
                 (A[f] - g_k(X[f, , drop = FALSE]))
  }
  g_all <- .cf_g_fn(X, A, learner_ps)
  tildeA <- A - g_all(X)
  base_w <- .combine_w(w_ext, w_cens)
  wt <- if (is.null(base_w)) tildeA^2 else base_w * tildeA^2
  tau <- .fit_regr(X, target, lb_tau, weights = wt)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# DR-Learner 的交叉拟合版
.fit_DR_cf <- function(X, A, Y, lb, lb_tau, learner_ps, stabilize, w_ext,
                       w_cens, t0, outcome, effect, folds) {
  n <- nrow(X)
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  psi <- numeric(n)
  for (f in folds) {
    tr <- setdiff(seq_len(n), f)
    i1 <- tr[A[tr] == 1L]
    i0 <- tr[A[tr] == 0L]
    w_tr <- .combine_w(
      .cf_weights(X[tr, , drop = FALSE], A[tr], learner_ps, stabilize,
                  if (is.null(w_ext)) NULL else w_ext[tr]),
      if (is.null(w_cens)) NULL else w_cens[tr]
    )
    w1 <- if (is.null(w_tr)) NULL else w_tr[A[tr] == 1L]
    w0 <- if (is.null(w_tr)) NULL else w_tr[A[tr] == 0L]
    m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
    m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
    mu1 <- m1$predict(X[f, , drop = FALSE])
    mu0 <- m0$predict(X[f, , drop = FALSE])
    g_k <- .cf_g_fn(X[tr, , drop = FALSE], A[tr], learner_ps)
    e <- g_k(X[f, , drop = FALSE])
    psi[f] <- mu1 - mu0 + A[f] * (Yv[f] - mu1) / e -
              (1 - A[f]) * (Yv[f] - mu0) / (1 - e)
  }
  tau <- .fit_regr(X, psi, lb_tau, weights = .combine_w(w_ext, w_cens))
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# 18 调度器：归一化输入 -> 组装权重 -> 分派到五种 learner ----------------------
ml_fit <- function(type, X, A, Y, learner_base = NULL, learner_tau = NULL,
                   learner_ps = NULL,
                   weighting = c("none", "iptw", "external"), weights = NULL,
                   stabilize = FALSE, t0 = NULL, outcome = "auto",
                   effect = c("survdiff", "rmst"),
                   cross_fitting = FALSE, n_folds = 5L,
                   engine = c("native", "survlearners")) {
  type <- match.arg(type, c("S", "T", "X", "R", "DR"))
  weighting <- match.arg(weighting)
  effect <- match.arg(effect)
  engine <- match.arg(engine)
  if (is.null(learner_base)) learner_base <- mlr3::lrn("regr.ranger")
  if (cross_fitting && !type %in% c("R", "DR")) {
    warning("交叉拟合目前只对 R / DR 学习器实现；其他 learner 忽略该参数。")
    cross_fitting <- FALSE
  }

  X <- as.data.frame(X)
  A <- as.integer(A)
  n <- nrow(X)

  outcome <- .resolve_outcome(outcome, Y)

  # survlearners 引擎：只服务生存结局，整体委托 survlearners 包实现
  # （S/T/X/R 四族；DR 与 RMST 它没有，里面会给明确报错）。
  # 放在 .lb_kind 校验之前——它的基学习器是 coxph/grf/lasso 字符串，
  # 与原生引擎的 "coxph"/"ranger" 不是同一套取值。
  if (identical(engine, "survlearners")) {
    if (!identical(outcome, "survival")) {
      stop('engine = "survlearners" 只支持生存结局；连续 / 二分类请用 engine = "native"。')
    }
    return(.ml_fit_survlearners(type, X, A, Y, learner_base, weighting, weights,
                                learner_ps, stabilize, t0, effect))
  }

  kind <- .lb_kind(learner_base)
  .check_outcome_kind(outcome, kind)
  # RMST 只在生存结局下有定义（必须在 outcome 解析之后检查）
  if (!identical(outcome, "survival") && identical(effect, "rmst")) {
    stop('effect = "rmst" 只对生存结局有意义。')
  }

  # 效应阶段的回归学习器：X/R/DR 要对「伪结果」做回归，噪声结构与结局模型
  # 完全不同（R/DR 的目标含 1/(A-e) 放大，DR 的 psi 是残差型伪结果）。
  # ranger 回归默认 min.node.size = 5，树会长得很深、把伪结果里的噪声也拟合进去，
  # 实测会让 R/DR 的 CATE 相关从 0.9 掉到 0.2。因此这里不沿用结局模型的
  # learner_base，而是单独建一个偏正则化的 ranger（min.node.size = 50）。
  # 用户可用 learner_tau 显式覆盖（例如 regr.lm 在生存 R/DR 上表现更好）。
  if (is.null(learner_tau)) {
    learner_tau <- mlr3::lrn("regr.ranger", num.trees = 500, min.node.size = 50, seed = 1)
  }

  # t0：生存结局必填，默认取观测事件时间的中位数
  if (outcome == "survival" && is.null(t0)) {
    tt <- Y[, 1L][Y[, 2L] == 1L]
    t0 <- if (length(tt)) stats::median(tt) else stats::median(Y[, 1L])
    message("t0 未指定，默认取事件时间中位数：", signif(t0, 4))
  }

  # 基础权重：RCT 不给权重；观察性数据可内部训 PS 做 IPTW，或直接用外部权重
  if (weighting == "iptw") {
    if (is.null(learner_ps)) learner_ps <- mlr3::lrn("classif.log_reg")
    g_fn <- .fit_ps(X, A, learner_ps)
    w <- .iptw_weights(A, g_fn(X), stabilize)
  } else if (weighting == "external") {
    if (is.null(weights)) stop("weighting = \"external\" 必须提供 weights。")
    w <- as.numeric(weights)
    g_fn <- function(newX) rep(mean(A), nrow(as.data.frame(newX)))
  } else {
    w <- NULL
    g_fn <- function(newX) rep(mean(A), nrow(as.data.frame(newX)))
  }

  # 生存结局的删失校正：
  #   effect = "survdiff" —— 个体结局是 I(T > t0)，需要乘删失 IPCW 1/G(Tᵢ⁻)
  #   effect = "rmst"     —— 个体结局 ξ 本身已含 IPCW，不再额外乘
  w_cens <- NULL
  if (outcome == "survival" && identical(effect, "survdiff")) {
    w_cens <- .surv_ipcw(Y[, 1L], Y[, 2L], X)
  }

  # 交叉拟合：R/DR 的干扰参数（mu 或 m1/m0 + e）在 K 折的训练折上拟合，
  # 伪结果在留出折上计算，最后统一回归一次。这样能避免 in-sample 过拟合
  # 把伪结果的系统性偏差带进 tau。
  if (cross_fitting) {
    folds <- .cv_folds(n, n_folds)
    w_ext <- if (identical(weighting, "external")) w else NULL
    cf_args <- list(X = X, A = A, Y = Y, lb = learner_base, lb_tau = learner_tau,
                    learner_ps = learner_ps, stabilize = stabilize, w_ext = w_ext,
                    w_cens = w_cens, t0 = t0, outcome = outcome, effect = effect,
                    folds = folds)
    res <- if (type == "R") do.call(.fit_R_cf, cf_args) else do.call(.fit_DR_cf, cf_args)
  } else {
    w <- .combine_w(w, w_cens)
    res <- switch(type,
      S  = .fit_S(X, A, Y, learner_base, learner_tau, g_fn, w, t0, outcome, effect),
      T  = .fit_T(X, A, Y, learner_base, learner_tau, g_fn, w, t0, outcome, effect),
      X  = .fit_X(X, A, Y, learner_base, learner_tau, g_fn, w, t0, outcome, effect),
      R  = .fit_R(X, A, Y, learner_base, learner_tau, g_fn, w, t0, outcome, effect),
      DR = .fit_DR(X, A, Y, learner_base, learner_tau, g_fn, w, t0, outcome, effect)
    )
  }

  res$type <- type
  res$outcome <- outcome
  res$weighting <- weighting
  res$effect <- effect
  res$engine <- engine
  res$cross_fitting <- cross_fitting
  res$t0 <- t0
  res$cate_train <- res$predict(X)
  res$ate <- mean(res$cate_train)
  res
}
