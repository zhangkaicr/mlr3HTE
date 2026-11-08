# =====================================================================
# metrics.R — Discriminative evaluation of heterogeneous treatment effect (HTE) models
#
# The three outcome types (continuous / binary / survival) share the same set of metrics:
#   1. Qini curve / Qini coefficient — a gain curve based on "targeted treatment
#      after ranking by effect"
#   2. TOC curve — the average treatment effect among the top-k targeted individuals
#   3. c-for-benefit — the C-statistic for the model's prediction of "treatment benefit"
#
# The unified approach first reduces the outcome to an "individual-level numeric
# outcome y + weight w" (see .hte_outcome):
#   continuous / binary : y = Y,                    w = 1
#   survival survdiff   : y = I(T > t0),            w = I(observed)/G(min(T,t0))
#   survival rmst       : y = delta*min(T,t0)/G(T), w = 1 (IPCW already in y)
# All metrics then use the weighted IPW score
#   s_i = w_i*(A_i y_i/e_i - (1-A_i) y_i/(1-e_i));
# with no censoring w == 1, which coincides exactly with the classic formula.
#
# Reference implementations:
#   - Qini: the IPW estimator of Sverdrup, Wu, Athey & Wager (2025)
#   - c-for-benefit: van Klaveren, Steyerberg, Serruys & Kent (2018)
#   - TOC: Yadlowsky, Fleming, Shah, Brunskill & Wager (2025)
# =====================================================================

# ---------------------------------------------------------------------
# 内部：结局降维 —— 把三类结局统一成 (y, w)
#
# 生存结局必须落在与包内 CATE 相同的标尺上，否则排序对不上：
# metalearner 的生存效应默认是 S(t0) 差，所以指标默认也用 I(T > t0)。
# 删失由完整病例 IPCW 处理：在 t0 之前被删失的人，I(T > t0) 无从得知，
# 权重取 0；其余人权重 = 1/G(min(T, t0))，G 为删失生存函数。
# ---------------------------------------------------------------------
.hte_is_surv <- function(Y) {
  inherits(Y, "Surv") || (is.matrix(Y) && ncol(Y) == 2L)
}

.hte_outcome <- function(Y, t0 = NULL, X = NULL,
                         effect = c("survdiff", "rmst")) {
  effect <- match.arg(effect)

  if (.hte_is_surv(Y)) {
    Ym <- if (inherits(Y, "Surv")) unclass(Y) else Y
    time <- as.numeric(Ym[, 1L])
    status <- as.integer(Ym[, 2L])
    if (anyNA(time) || anyNA(status)) {
      stop("Survival outcome contains NA in time or status.", call. = FALSE)
    }
    # t0 缺省与 metalearner 一致：取事件时间中位数（无事件时取随访时间中位数）
    if (is.null(t0)) {
      tt <- time[status == 1L]
      t0 <- if (length(tt)) stats::median(tt) else stats::median(time)
    }
    if (identical(effect, "rmst")) {
      # ξ = δ·min(T,τ)/Ĝ(T)，E[ξ] = RMST(τ)，删失校正已含在里面
      G <- .surv_ipcw(time, status, X, at = time)
      y <- as.numeric(status * pmin(time, t0) / G)
      w <- rep(1, length(y))
    } else {
      G <- .surv_ipcw(time, status, X, at = pmin(time, t0))
      y <- as.numeric(time > t0)
      obs <- (time > t0) | (status == 1L)      # t0 前删失者结局不可知
      w <- as.numeric(obs) / G
    }
    return(list(y = y, w = w, kind = "survival", t0 = t0, effect = effect))
  }

  if (is.factor(Y)) {
    if (nlevels(Y) != 2L) {
      stop("Factor outcome must have exactly two levels (binary).", call. = FALSE)
    }
    Y <- as.numeric(Y) - 1                     # 第一水平=0，第二水平=1
  }
  y <- as.numeric(Y)
  if (anyNA(y)) stop("Y contains NA; please handle missing outcomes first.", call. = FALSE)
  binary <- all(y %in% c(0, 1))
  list(y = y, w = rep(1, length(y)),
       kind = if (binary) "binary" else "continuous",
       t0 = NULL, effect = NULL)
}

# ---------------------------------------------------------------------
# 内部：加权 IPW 评分（Sverdrup et al. 2025 的 Q 曲线估计核）
#   s_i = w_i · (A_i y_i / e_i - (1 - A_i) y_i / (1 - e_i))
# w 为删失 IPCW 权重；无删失时 w ≡ 1，退化为经典 IPW 评分。
# ---------------------------------------------------------------------
.hte_ipw_score <- function(A, y, propensity, w = NULL) {
  e <- pmin(pmax(as.numeric(propensity), 1e-6), 1 - 1e-6)
  if (is.null(w)) w <- rep(1, length(A))
  w * (A * y / e - (1 - A) * y / (1 - e))
}

# 内部：生存结局时把通知打出来（t0 是解释结果的关键，不能默默选）
.hte_surv_note <- function(oc) {
  if (!identical(oc$kind, "survival")) return(invisible(NULL))
  cli::cli_alert_info(
    "Survival outcome: effect scale = {oc$effect}, t0 = {signif(oc$t0, 4)}; censoring corrected with complete-case IPCW."
  )
}

#' Qini curve: cumulative treatment gain ranked by estimated CATE
#'
#' Sort the samples by estimated CATE from high to low, and under the budget
#' constraint of "targeting the top-k individuals", use inverse probability
#' weighting (IPW) to estimate the cumulative treatment gain, yielding the Qini
#' curve (also known as the uplift curve). The earlier and higher the curve rises,
#' the better the model ranks the truly benefiting individuals to the front.
#'
#' Estimator (Sverdrup et al. 2025):
#' \deqn{Q(f_k) = \frac{1}{n}\sum_{i \in \text{top-}k}
#'   \left(\frac{A_i Y_i}{e_i} - \frac{(1-A_i) Y_i}{1-e_i}\right)}
#' where \eqn{f_k = k/n} is the targeting fraction and \eqn{e_i} is the propensity
#' score.
#'
#' @param cate Per-individual estimated CATE (numeric vector), i.e. the model's
#'   ranking score.
#' @param A Treatment indicator (0/1 or logical).
#' @param Y Outcome: continuous numeric, 0/1 binary, or a survival object
#'   (\code{survival::Surv(time, status)}; a two-column matrix is also accepted).
#' @param propensity The propensity score \eqn{e(X)}; \code{NULL} (default) uses
#'   \code{mean(A)}, suitable for randomized trials. For observational data, pass
#'   an estimated propensity score.
#' @param n_bins How many points the curve takes (bin endpoints of equal-sized
#'   bins); \code{NULL} means using all sample points.
#' @param t0 The key time point for survival outcomes; \code{NULL} (default) uses
#'   the median event time. Ignored for continuous / binary outcomes.
#' @param X A data.frame of covariates; needed only for survival outcomes when
#'   censoring depends on covariates, used to model the censoring distribution with
#'   Cox. \code{NULL} (default) uses the marginal Kaplan--Meier, assuming censoring
#'   is independent of covariates.
#' @param effect The effect scale for survival outcomes: \code{"survdiff"} (default)
#'   is the survival probability difference at \eqn{t0}, matching the default CATE
#'   of \code{metalearner()}; \code{"rmst"} is the restricted mean survival time
#'   difference. Ignored for continuous / binary outcomes.
#' @section How the three outcome types are handled:
#' Continuous and binary outcomes use the raw values directly; survival outcomes
#' are first reduced to the \strong{milestone survival indicator} \eqn{I(T > t_0)}.
#' This scale must be chosen because \code{metalearner()}'s survival CATE is defined
#' as \eqn{S_1(t_0) - S_0(t_0)} — if the metric and the CATE are not on the same
#' scale, the ranking becomes incomparable.
#'
#' Censoring is corrected with \strong{complete-case IPCW}: for individuals
#' censored before \eqn{t_0}, \eqn{I(T > t_0)} is unknown and the weight is set to
#' 0; the others get weight \eqn{1/G(\min(T, t_0))}, where \eqn{G} is the censoring
#' survival function (Cox modeling is used if \code{X} is given, otherwise the
#' marginal Kaplan--Meier). This correction is not optional: in a demo dataset with
#' a true ATE of 0.148 and 30% censoring, skipping IPCW drops \eqn{Q(1)} from 0.151
#' to 0.115, and to 0.062 under 58% censoring, while after IPCW it returns to 0.151
#' and 0.144 respectively.
#'
#' \code{effect = "rmst"} switches to the restricted mean survival time scale
#' (\eqn{\xi = \delta\min(T,t_0)/\hat G(T)}, with the censoring correction already
#' contained in \eqn{\xi}). Its weight is taken from \eqn{\hat G(T_i)}; when
#' censoring is heavy the weight is truncated at 100, underestimating the effect
#' (0.043 measured under 58% censoring vs. a true value of 0.184),
#' so \strong{use the default \code{"survdiff"} when censoring is heavy}.
#'
#' @return A data.frame containing \code{fraction} (targeting fraction, from 0 to 1)
#'   and \code{qini} (the corresponding cumulative gain), with the attribute
#'   \code{qini_at_full}.
#' @references
#' Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment
#' Rules. \emph{Journal of Computational and Graphical Statistics}, 2025.
#' arXiv:2306.11979.
#'
#' Radcliffe NJ. Using control groups to target on predicted lift: Building and
#' assessing uplift models. \emph{Direct Marketing Analytics Journal}, 2007.
#' @seealso \code{\link{qini_coefficient}}, \code{\link{c_for_benefit}}
#' @export
#' @examples
#' set.seed(1)
#' n <- 300
#' A <- rbinom(n, 1, 0.5)
#' tau <- rnorm(n)
#' Y <- 1 + A * tau + rnorm(n)
#' head(qini_curve(tau, A, Y))
#'
#' # Survival outcome: effect scale = survival probability difference at t0
#' d <- mlr3HTE_demo_surv(n = 600)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = d$t0)
#' head(qini_curve(fit$cate_train, d$A, d$Y, t0 = d$t0))
qini_curve <- function(cate, A, Y, propensity = NULL, n_bins = NULL,
                       t0 = NULL, X = NULL,
                       effect = c("survdiff", "rmst")) {
  oc <- .hte_outcome(Y, t0 = t0, X = X, effect = effect)
  .hte_surv_note(oc)
  Y <- oc$y
  cate <- as.numeric(cate)
  A <- as.numeric(A)
  n <- length(cate)
  if (length(A) != n || length(Y) != n) {
    stop("cate, A and Y must have the same length.", call. = FALSE)
  }
  if (n < 2L) stop("Need at least two observations.", call. = FALSE)
  if (is.null(propensity)) propensity <- rep(mean(A), n)

  score <- .hte_ipw_score(A, Y, propensity, oc$w)
  ord   <- order(cate, decreasing = TRUE)
  q     <- cumsum(score[ord]) / n
  frac  <- seq_len(n) / n

  if (!is.null(n_bins) && n_bins < n) {
    idx  <- unique(round(seq(1, n, length.out = n_bins)))
    frac <- frac[idx]
    q    <- q[idx]
  }

  out <- data.frame(fraction = c(0, frac), qini = c(0, q))
  attr(out, "qini_at_full") <- q[length(q)]
  out
}

#' Qini coefficient: area between the Qini curve and the random targeting line
#'
#' Building on \code{\link{qini_curve}}, compute the area between the curve (trapezoidal
#' rule) and the "random targeting line" (connecting (0,0) to (1, Q(1))). The larger
#' the area, the more extra gain the model's ranking brings over random allocation.
#'
#' A normalized version is also returned: the area divided by the area under the
#' random line \eqn{0.5\,Q(1)}. A random model has a Qini coefficient near 0; a
#' perfect ranking is positive.
#'
#' @inheritParams qini_curve
#' @return A list containing \code{qini_coefficient} (absolute area),
#'   \code{qini_normalized} (normalized to the random-line area), \code{auc} (area
#'   under the curve) and \code{qini_at_full} (\eqn{Q(1)}).
#' @references
#' Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment
#' Rules. \emph{Journal of Computational and Graphical Statistics}, 2025.
#' arXiv:2306.11979.
#' @seealso \code{\link{qini_curve}}
#' @export
#' @examples
#' set.seed(1)
#' n <- 300
#' A <- rbinom(n, 1, 0.5)
#' tau <- rnorm(n)
#' Y <- 1 + A * tau + rnorm(n)
#' qini_coefficient(tau, A, Y)$qini_coefficient
qini_coefficient <- function(cate, A, Y, propensity = NULL,
                             t0 = NULL, X = NULL,
                             effect = c("survdiff", "rmst")) {
  df <- qini_curve(cate, A, Y, propensity = propensity, n_bins = NULL,
                   t0 = t0, X = X, effect = effect)
  f  <- df$fraction
  q  <- df$qini
  auc <- sum(diff(f) * (q[-length(q)] + q[-1]) / 2)
  q_full      <- q[length(q)]
  area_random <- 0.5 * q_full
  qc <- auc - area_random
  qn <- if (isTRUE(all.equal(area_random, 0))) NA_real_ else qc / area_random
  list(qini_coefficient = qc, qini_normalized = qn,
       auc = auc, qini_at_full = q_full)
}

#' Doubly robust pseudo-outcome: the entry point for HTE evaluation on observational data
#'
#' Compute \eqn{Y^*} (the AIPW / doubly robust pseudo-outcome):
#' \deqn{Y^*_i = (\hat\mu_1(X_i) - \hat\mu_0(X_i)) +
#'   \frac{A_i(Y_i - \hat\mu_1(X_i))}{e_i} -
#'   \frac{(1-A_i)(Y_i - \hat\mu_0(X_i))}{1-e_i}}
#' It satisfies \eqn{E[Y^*_i \mid X_i] = \tau(X_i)}, and is \strong{unbiased as long
#' as either the outcome model or the propensity-score model is correct}. The mean
#' of \eqn{Y^*} is the DR estimate of the ATE.
#'
#' It also returns the three "nuisance parameters" (propensity score \eqn{e},
#' \eqn{\hat\mu_1}, \eqn{\hat\mu_0}) together, which is exactly the input that
#' \code{\link{c_for_benefit}} needs under observational data; the \code{propensity}
#' element can also be fed directly to \code{\link{qini_curve}} /
#' \code{\link{qini_coefficient}} / \code{\link{toc_curve}}.
#'
#' @section Why cross-fitting is necessary:
#' By default \code{cross_fitting = TRUE}: the propensity score and outcome models
#' are both fit on the \strong{training folds} of K folds and predicted on the held-out
#' folds. If the full sample is fit and then fed back to itself (in-fold), the
#' \eqn{\hat\mu_1-\hat\mu_0} in \eqn{Y^*} and the evaluated CATE come from the same
#' model, and when matching by nearest neighbor on that CATE, the "observed benefit"
#' is artificially aligned with the "predicted benefit", inflating c-for-benefit —
#' on this package's demo data, in-fold actually produces the inversion "model CATE
#' 0.754 > true tau 0.717", which recovers to "model 0.659 <= true tau 0.669" after
#' cross-fitting.
#'
#' @param X A data.frame of covariates. For survival outcomes it is also used to
#'   model the censoring distribution (IPCW weights).
#' @param A Treatment indicator (0/1 or logical).
#' @param Y Outcome: continuous numeric, 0/1 binary, or a survival object
#'   (\code{survival::Surv(time, status)}).
#' @param cross_fitting Whether to cross-fit the nuisance parameters, default
#'   \code{TRUE}.
#' @param n_folds The number of cross-fitting folds, default 5.
#' @param learner_ps The propensity-score learner (classif), default
#'   \code{classif.log_reg}.
#' @param learner_base The base learner for the outcome model. For continuous /
#'   binary outcomes this is an mlr3 Learner, defaulting to \code{regr.ranger}
#'   (continuous) or \code{classif.log_reg} (binary); for survival outcomes a
#'   character string \code{"coxph"} (default) or \code{"ranger"} is used, taking
#'   the same value as the survival branch of \code{metalearner()}.
#' @param seed The random seed for fold assignment; \code{NULL} means none is set
#'   (provide explicitly for reproducibility).
#' @param t0 The key time point for survival outcomes; \code{NULL} (default) uses
#'   the median event time.
#' @param effect The effect scale for survival outcomes, \code{"survdiff"} (default)
#'   or \code{"rmst"}.
#' @param ps_bounds Length-2 numeric bounds used to clip the propensity score before it
#'   enters the DR pseudo-outcome; default \code{c(0.01, 0.99)}. Must satisfy 0 < lo < hi < 1.
#' @return A list with \code{pseudo} (the DR pseudo-outcome vector), \code{mu1},
#'   \code{mu0}, \code{propensity}, \code{ate} (\code{mean(pseudo)}), \code{t0},
#'   \code{effect} (provided for survival outcomes, to align with the CATE scale).
#' @references
#' Yadlowsky S, Fleming T, Shah N, Brunskill E, Wager S. Evaluating treatment
#' prioritization rules via rank-weighted average treatment effects.
#' \emph{Journal of the American Statistical Association}, 2025.
#' arXiv:2111.07966.
#' @seealso \code{\link{c_for_benefit}}, \code{\link{qini_curve}}
#' @export
#' @examples
#' set.seed(1)
#' d <- mlr3HTE_demo_obs(n = 800)
#' dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
#' dr$ate
#' c_for_benefit(dr$mu1 - dr$mu0, d$A, d$Y,
#'               propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)
dr_pseudo_outcome <- function(X, A, Y, cross_fitting = TRUE, n_folds = 5L,
                              ps_bounds = c(0.01, 0.99),
                              learner_ps = NULL, learner_base = NULL,
                              seed = NULL, t0 = NULL,
                              effect = c("survdiff", "rmst")) {
  effect <- match.arg(effect)
  X <- as.data.frame(X)
  # 先降维：生存结局取 I(T>t0)（或 RMST 伪值）并配好删失 IPCW 权重。
  # 原始 Y 要留住——拟合生存模型需要 time/status，而 oc 里只剩降维后的 y。
  Y_raw <- Y
  oc <- .hte_outcome(Y_raw, t0 = t0, X = X, effect = effect)
  .hte_surv_note(oc)
  Y <- oc$y
  w <- oc$w
  surv <- identical(oc$kind, "survival")
  t0 <- oc$t0

  A <- as.numeric(A)
  n <- nrow(X)
  if (length(A) != n) {
    stop("X and A must have the same number of rows.", call. = FALSE)
  }
  if (n < 4L) stop("Need at least four observations.", call. = FALSE)

  time <- status <- NULL
  if (surv) {
    Ym <- if (inherits(Y_raw, "Surv")) unclass(Y_raw) else Y_raw
    time <- as.numeric(Ym[, 1L]); status <- as.integer(Ym[, 2L])
  }

  if (is.null(learner_ps)) learner_ps <- mlr3::lrn("classif.log_reg")
  binary <- !surv && all(Y %in% c(0, 1))
  if (is.null(learner_base)) {
    learner_base <- if (surv) {
      "coxph"
    } else if (binary) {
      mlr3::lrn("classif.log_reg")
    } else {
      mlr3::lrn("regr.ranger", num.trees = 300L)
    }
  }
  if (surv && !is.character(learner_base)) {
    stop('Survival outcomes require learner_base to be "coxph" or "ranger" ',
         "(a character string), not an mlr3 Learner.", call. = FALSE)
  }

  if (!is.null(seed)) set.seed(seed)
  fold <- if (isTRUE(cross_fitting)) {
    sample(rep(seq_len(n_folds), length.out = n))
  } else {
    rep(1L, n)
  }

  mu1 <- rep(NA_real_, n)
  mu0 <- rep(NA_real_, n)
  e   <- rep(NA_real_, n)

  for (k in unique(fold)) {
    te <- which(fold == k)
    tr <- which(fold != k)
    if (!length(tr)) { tr <- te }                 # 折数 >= n 时的兜底
    e[te] <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps, ps_bounds)(X[te, , drop = FALSE])

    tr1 <- tr[A[tr] == 1]
    tr0 <- tr[A[tr] == 0]
    if (surv) {
      # 生存：mu = S(t0|X) 或 RMST(t0)，用与 metalearner 相同的原生基学习器
      if (length(tr1)) {
        m1 <- .fit_surv(X[tr1, , drop = FALSE], time[tr1], status[tr1],
                        kind = learner_base, t0 = t0, effect = effect)
        mu1[te] <- m1$predict(X[te, , drop = FALSE])
      }
      if (length(tr0)) {
        m0 <- .fit_surv(X[tr0, , drop = FALSE], time[tr0], status[tr0],
                        kind = learner_base, t0 = t0, effect = effect)
        mu0[te] <- m0$predict(X[te, , drop = FALSE])
      }
    } else {
      if (length(tr1)) {
        m1 <- .fit_regr_or_classif(X[tr1, , drop = FALSE], Y[tr1],
                                   learner_base, binary)
        mu1[te] <- .pred_regr_or_classif(m1, X[te, , drop = FALSE], binary)
      }
      if (length(tr0)) {
        m0 <- .fit_regr_or_classif(X[tr0, , drop = FALSE], Y[tr0],
                                   learner_base, binary)
        mu0[te] <- .pred_regr_or_classif(m0, X[te, , drop = FALSE], binary)
      }
    }
  }

  ee <- pmin(pmax(e, 1e-6), 1 - 1e-6)
  # w 是删失 IPCW 权重：无删失时恒为 1，公式退化为经典 DR 伪结局
  pseudo <- (mu1 - mu0) + w * (A * (Y - mu1) / ee - (1 - A) * (Y - mu0) / (1 - ee))
  list(pseudo = pseudo, mu1 = mu1, mu0 = mu0, propensity = e,
       ate = mean(pseudo), t0 = t0, effect = effect)
}

# 内部：按结局类型分派结局模型的拟合 / 预测（伪结局的干扰参数用）-----------------
.fit_regr_or_classif <- function(X, y, learner_base, binary) {
  if (binary) .fit_classif(X, y, learner_base) else .fit_regr(X, y, learner_base)
}
.pred_regr_or_classif <- function(model, newX, binary) {
  if (binary) .pred_classif(model, newX) else .pred_regr(model, newX)
}

#' c-for-benefit: the C-statistic for predicting treatment benefit
#'
#' Following van Klaveren et al. (2018), pair treated and control individuals
#' **by predicted benefit** (greedy 1:1 nearest neighbor, based on the estimated
#' CATE); each pair yields an "observed benefit" (treated outcome minus control
#' outcome) and a "predicted benefit" (the pair's estimated CATE). Then compare
#' across all pairs: if the pair with the larger observed benefit also has the
#' larger predicted benefit, it counts as concordant. c-for-benefit is the
#' proportion of concordant pairs among all informative pairs (ties in predicted
#' benefit count as 0.5).
#'
#' Interpretation: c = 0.5 is equivalent to random ranking; the closer to 1, the
#' better the model distinguishes "who benefits more". Note: this is an
#' **approximate implementation** of van Klaveren's pairing idea (greedy pairing +
#' rank correlation between pairs), not the full matching procedure of the original
#' paper; for strict reproduction please refer to the \code{CforBenefit} package.
#'
#' @section Observational data — doubly robust is required, not just a propensity score:
#' The default "observed benefit = treated outcome - control outcome" is unbiased
#' only when treatment is randomized. In observational data the two groups have
#' different baseline prognoses, so this difference is confounded.
#' The correct approach is to replace the observed benefit with the
#' \strong{doubly robust (DR) pseudo-outcome}:
#' \deqn{Y^*_i = (\hat\mu_1(X_i) - \hat\mu_0(X_i)) +
#'   \frac{A_i(Y_i - \hat\mu_1(X_i))}{e_i} -
#'   \frac{(1-A_i)(Y_i - \hat\mu_0(X_i))}{1-e_i}}
#' It satisfies \eqn{E[Y^*_i \mid X_i] = \tau(X_i)}, and is \strong{unbiased as long
#' as either the outcome model or the propensity-score model is correct}. Within a
#' pair, the average of the two individuals' \eqn{Y^*} is taken as the observed
#' benefit.
#'
#' Why not just pass \code{propensity}: that is equivalent to using the
#' Horvitz--Thompson score \eqn{AY/e - (1-A)Y/(1-e)} as the observed benefit, whose
#' single-sample standard deviation is huge (about 15 on this package's demo data,
#' while the ATE is around 1), and the noise pushes the C-statistic below the random
#' line — even ranking by the true \code{tau} measures only 0.39, worse than random.
#' So passing only \code{propensity} errors out, forcing you to also supply the
#' outcome model.
#'
#' The three nuisance parameters can be obtained at once with
#' \code{\link{dr_pseudo_outcome}}, which cross-fits by default to avoid the
#' inflation from "the outcome model evaluating its own CATE".
#'
#' @inheritParams qini_curve
#' @param caliper The maximum allowed predicted-benefit difference when pairing;
#'   \code{NULL} (default) sets no caliper and always takes the nearest neighbor.
#'   Setting a caliper avoids forcibly pairing two people with very different benefits.
#' @param mu1 The outcome-model prediction for the treated group \eqn{\hat\mu_1(X)}
#'   (numeric vector, same length as \code{cate}). Under observational data, pass it
#'   together with \code{propensity} and \code{mu0} to enable DR correction;
#'   \code{NULL} (default) uses the raw outcome difference, unbiased only under
#'   randomization.
#' @param mu0 The outcome-model prediction for the control group \eqn{\hat\mu_0(X)}.
#'   Used the same way as \code{mu1}.
#' @param t0 The key time point for survival outcomes; \code{NULL} (default) uses
#'   the median event time.
#' @param X A data.frame of covariates; needed only for survival outcomes when
#'   censoring depends on covariates (Cox modeling of the censoring distribution).
#'   \code{NULL} (default) uses the marginal Kaplan--Meier.
#' @param effect The effect scale for survival outcomes, \code{"survdiff"} (default)
#'   or \code{"rmst"}.
#' @return A list containing \code{c_for_benefit} (the C-statistic), \code{n_pairs}
#'   (number of pairs), and the numbers of concordant / discordant / tied-prediction
#'   pairs.
#' @references
#' van Klaveren D, Steyerberg EW, Serruys PW, Kent DM. The proposed
#' 'concordance-statistic for benefit' provided a useful metric when modeling
#' heterogeneous treatment effects. \emph{Journal of Clinical Epidemiology}
#' 2018;94:59-68. doi:10.1016/j.jclinepi.2017.10.021.
#'
#' Maas CCHM, Kent DM, Hughes MC, Dekker R, Lingsma HF, van Klaveren D.
#' Performance metrics for models designed to predict treatment effect. 2022.
#' @seealso \code{\link{qini_curve}}
#' @export
#' @examples
#' set.seed(1)
#' n <- 400
#' A <- rbinom(n, 1, 0.5)
#' tau <- rnorm(n)
#' Y <- 1 + A * tau + rnorm(n)
#' c_for_benefit(tau, A, Y)$c_for_benefit
#'
#' # Observational data: use the cross-fitted DR pseudo-outcome as the observed benefit
#' set.seed(1)
#' d <- mlr3HTE_demo_obs(n = 800)
#' dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
#' c_for_benefit(dr$mu1 - dr$mu0, d$A, d$Y,
#'               propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)
#'
#' # Observational data: the DR-Learner fits the propensity score internally by default (doubly robust)
#' set.seed(1)
#' d <- mlr3HTE_demo_obs(n = 800)
#' fit <- metalearner("DR", d$X, d$A, d$Y)
#' dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
#' c_for_benefit(fit$cate_train, d$A, d$Y,
#'               propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)
c_for_benefit <- function(cate, A, Y, caliper = NULL,
                          propensity = NULL, mu1 = NULL, mu0 = NULL,
                          t0 = NULL, X = NULL,
                          effect = c("survdiff", "rmst")) {
  oc <- .hte_outcome(Y, t0 = t0, X = X, effect = effect)
  .hte_surv_note(oc)
  Y <- oc$y
  w <- oc$w
  cate <- as.numeric(cate)
  A <- as.numeric(A)
  n <- length(cate)
  if (length(A) != n || length(Y) != n) {
    stop("cate, A and Y must have the same length.", call. = FALSE)
  }
  tr <- which(A == 1)
  ct <- which(A == 0)
  if (!length(tr) || !length(ct)) {
    stop("Both treatment arms are required.", call. = FALSE)
  }

  # 观察性数据：把"观测获益"换成双重稳健伪结局。
  # 只给 propensity 不给结局模型是不行的（等价于 HT 评分，噪声把 C 统计量压到
  # 随机线以下），所以这里强制三件套同时给齐。
  use_dr <- !is.null(propensity) || !is.null(mu1) || !is.null(mu0)
  Ystar <- NULL
  if (use_dr) {
    if (is.null(propensity)) {
      cli::cli_warn(
        "mu1/mu0 supplied without propensity; assuming a randomized design ",
        "(e = mean(A)). For observational data pass an estimated propensity score."
      )
      propensity <- rep(mean(A), n)
    }
    if (is.null(mu1) || is.null(mu0)) {
      stop(
        "Observational data requires the full doubly-robust triple: ",
        "propensity, mu1 and mu0. Passing only the propensity score would fall ",
        "back on the Horvitz-Thompson score, whose sampling noise drives ",
        "c-for-benefit below the random baseline even with a perfect ranking. ",
        "See ?c_for_benefit.",
        call. = FALSE
      )
    }
    for (nm in c("propensity", "mu1", "mu0")) {
      v <- get(nm)
      if (length(v) != n) {
        stop(sprintf("%s must have the same length as cate (%d).", nm, n),
             call. = FALSE)
      }
    }
    if (anyNA(c(mu1, mu0, propensity))) {
      stop("propensity, mu1 and mu0 must not contain NA.", call. = FALSE)
    }
    e <- pmin(pmax(as.numeric(propensity), 1e-6), 1 - 1e-6)
    m1 <- as.numeric(mu1)
    m0 <- as.numeric(mu0)
    Ystar <- (m1 - m0) + w * (A * (Y - m1) / e - (1 - A) * (Y - m0) / (1 - e))
  }

  tr <- tr[order(cate[tr])]
  used <- rep(FALSE, length(ct))
  pred <- numeric(0)
  obs  <- numeric(0)

  for (t in tr) {
    avail <- which(!used)
    if (!length(avail)) break
    d <- abs(cate[ct[avail]] - cate[t])
    j <- avail[which.min(d)]
    if (!is.null(caliper) && abs(cate[ct[j]] - cate[t]) > caliper) next
    used[j] <- TRUE
    pred <- c(pred, cate[t])            # 预测获益
    o <- if (is.null(Ystar)) {
      # 观测获益：原始结局差（仅随机化下无偏）；生存下乘删失 IPCW 权重
      w[t] * Y[t] - w[ct[j]] * Y[ct[j]]
    } else {
      0.5 * (Ystar[t] + Ystar[ct[j]])   # 观测获益：DR 伪结局的配对内平均
    }
    obs <- c(obs, o)
  }

  P <- length(pred)
  if (P < 2L) {
    stop("Not enough matched pairs to compute c-for-benefit.", call. = FALSE)
  }

  conc <- 0; disc <- 0; tiep <- 0; info <- 0
  for (i in seq_len(P - 1)) {
    j  <- (i + 1):P
    do <- obs[i] - obs[j]
    dp <- pred[i] - pred[j]
    nz <- do != 0
    info <- info + sum(nz)
    conc <- conc + sum(nz & dp != 0 & (sign(do) == sign(dp)))
    disc <- disc + sum(nz & dp != 0 & (sign(do) != sign(dp)))
    tiep <- tiep + sum(nz & dp == 0)
  }

  cval <- if (info == 0) NA_real_ else (conc + 0.5 * tiep) / info
  list(c_for_benefit = cval, n_pairs = P,
       n_concordant = conc, n_discordant = disc, n_tied_pred = tiep)
}

#' Plot the Qini curve
#'
#' Plot the object returned by \code{\link{qini_curve}}, with an overlaid random
#' targeting reference line (dashed).
#'
#' Returns a \code{ggplot} object, which can be further augmented with \code{+}
#' layers or themes; the data used for plotting is exactly the return value of
#' \code{\link{qini_curve}} itself.
#'
#' @param curve The data.frame returned by \code{\link{qini_curve}}.
#' @param main The plot title.
#' @param color The curve color.
#' @param ... No longer used; kept for backward compatibility with old calls.
#' @return A \code{ggplot} object.
#' @references
#' Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment
#' Rules. \emph{Journal of Computational and Graphical Statistics}, 2025.
#' @seealso \code{\link{qini_curve}}
#' @export
#' @examples
#' set.seed(1)
#' n <- 400
#' A <- rbinom(n, 1, 0.5)
#' tau <- rnorm(n)
#' Y <- 1 + A * tau + rnorm(n)
#' p <- plot_qini(qini_curve(tau, A, Y))
#' class(p)
plot_qini <- function(curve, main = "Qini curve", color = "#1B6CA8", ...) {
  if (!all(c("fraction", "qini") %in% names(curve))) {
    stop("curve must be the data.frame returned by qini_curve().", call. = FALSE)
  }
  d <- as.data.frame(curve)
  q_full <- d$qini[nrow(d)]
  ggplot2::ggplot(d, ggplot2::aes(x = .data$fraction, y = .data$qini)) +
    ggplot2::geom_line(linewidth = 1.05, color = color) +
    ggplot2::geom_abline(intercept = 0, slope = q_full,
                         linetype = 2, colour = "grey50") +
    ggplot2::labs(x = "Fraction targeted", y = "Cumulative gain (Qini)",
                  title = main,
                  subtitle = "Dashed line: random targeting") +
    ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(panel.grid.minor = ggplot2::element_blank(),
                   plot.title = ggplot2::element_text(face = "bold"))
}

#' TOC curve: average treatment effect by quantile after ranking by effect
#'
#' Sort the samples by estimated CATE from high to low, and look at how the average
#' treatment effect (estimated with the same IPW score) within the subgroup of
#' "top-k targeted individuals" changes with the targeting fraction, compared with
#' the overall ATE of the full sample (horizontal reference line). An informative
#' model should be clearly above the overall ATE in the front segment, indicating
#' that the more-benefiting individuals are ranked to the front; a flat curve hugging
#' the overall line means there is no heterogeneity to exploit.
#'
#' @inheritParams qini_curve
#' @return A data.frame containing \code{fraction} and \code{toc}, with the attribute
#'   \code{overall_ate} (the full-sample IPW-estimated ATE, as the horizontal reference).
#' @references
#' Yadlowsky S, Fleming S, Shah N, Brunskill E, Wager S. Evaluating Treatment
#' Prioritization Rules via Rank-Weighted Average Treatment Effects.
#' \emph{Journal of the American Statistical Association} 120(549), 2025.
#' arXiv:2111.07966.
#'
#' Radcliffe NJ. Using control groups to target on predicted lift: Building and
#' assessing uplift models. \emph{Direct Marketing Analytics Journal}, 2007.
#' @seealso \code{\link{qini_curve}}
#' @export
#' @examples
#' set.seed(1)
#' n <- 300
#' A <- rbinom(n, 1, 0.5)
#' tau <- rnorm(n)
#' Y <- 1 + A * tau + rnorm(n)
#' head(toc_curve(tau, A, Y))
toc_curve <- function(cate, A, Y, propensity = NULL, n_bins = NULL,
                      t0 = NULL, X = NULL,
                      effect = c("survdiff", "rmst")) {
  oc <- .hte_outcome(Y, t0 = t0, X = X, effect = effect)
  .hte_surv_note(oc)
  Y <- oc$y
  cate <- as.numeric(cate)
  A <- as.numeric(A)
  n <- length(cate)
  if (length(A) != n || length(Y) != n) {
    stop("cate, A and Y must have the same length.", call. = FALSE)
  }
  if (n < 2L) stop("Need at least two observations.", call. = FALSE)
  if (is.null(propensity)) propensity <- rep(mean(A), n)

  score   <- .hte_ipw_score(A, Y, propensity, oc$w)
  ord     <- order(cate, decreasing = TRUE)
  s       <- score[ord]
  cum     <- cumsum(s)
  k       <- seq_len(n)
  # 分母用有效样本量 Σw 而不是 k：生存下 t0 前删失者权重为 0，
  # 用 k 会把平均效应稀释。无删失时 Σw = k，与经典 TOC 一致。
  sw      <- cumsum(oc$w[ord])
  toc     <- cum / pmax(sw, 1e-12)       # top-k 子群的平均（IPW）效应
  frac    <- k / n
  overall <- mean(score)

  if (!is.null(n_bins) && n_bins < n) {
    idx  <- unique(round(seq(1, n, length.out = n_bins)))
    frac <- frac[idx]
    toc  <- toc[idx]
  }

  out <- data.frame(fraction = frac, toc = toc)
  attr(out, "overall_ate") <- overall
  out
}
