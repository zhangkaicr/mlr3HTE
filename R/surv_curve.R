# =====================================================================
# surv_curve.R -- "effect-over-time" curves for survival outcomes
#
# Why it is needed: metalearner()'s survival effect is defined at only a single
# time point t0 (survdiff: S(t0) difference; rmst: restricted mean survival time
# difference truncated at tau=t0). But clinical interpretation often needs to
# answer "how does the effect change over time" -- the survival benefit one month
# after surgery differs from that at three years.
#
# Implementation (user decision: uniform pointwise refitting):
#   call metalearner(t0 = t) once in full for each t; the five families
#   (S/T/X/R/DR) behave exactly the same, with no "fit the whole curve at once"
#   special case.
#
# Why no special case for S/T: S/T's outcome models are survival models
# themselves, so in principle one fit can evaluate at any t, one to two orders of
# magnitude faster. But then the interface behavior would branch on learner type,
# forcing users to remember "am I S or DR" to know what the function does. Here
# we prefer slower-but-single-semantics: every point on the curve is a complete,
# independent metalearner estimate.
#
# Cost (must be stated clearly in the docs): G time points = G full fits, and the
# propensity-score model is retrained G times. Default n_times = 20.
# =====================================================================

# 0 环境与依赖 ----

#' Effect-over-time curve for survival outcomes (pointwise refitting)
#'
#' @description
#' Refit the same metalearner independently at each time point, turning "how the
#' effect changes over time" into a curve. The g-th point on the curve is exactly
#' the estimate of `metalearner(type, X, A, Y, t0 = times[g])` -- no approximation
#' or reuse; all five learner families behave identically.
#'
#' The two effect scales are set by `effect`, fully aligned with
#' \code{\link{metalearner}}:
#' \itemize{
#'   \item \code{"survdiff"}: \eqn{\Delta S(t) = S_1(t) - S_0(t)}, the survival
#'     probability difference at time t;
#'   \item \code{"rmst"}: \eqn{\Delta \mathrm{RMST}(\tau)}, the difference in
#'     restricted mean survival time truncated at \eqn{\tau}. Each \eqn{\tau} is
#'     refit separately (the pseudo-outcome
#'     \eqn{\xi = \delta\min(T,\tau)/\hat G(T)} itself varies with \eqn{\tau}).
#' }
#'
#' @section Computational cost:
#' G time points mean G full fits, and the propensity-score model is retrained G
#' times. Default \code{n_times = 20}; if the base learner is changed to
#' \code{"ranger"}, 20 points will be noticeably slower -- try a smaller
#' \code{n_times} first.
#'
#' @param type metalearner type: S / T / X / R / DR.
#' @param X covariate data.frame (excluding treatment and outcome).
#' @param A treatment indicator (0/1 or logical).
#' @param Y survival outcome, a \code{survival::Surv} object. Other outcome types
#'   error out -- continuous / binary effects do not vary over time, so there is
#'   no curve to draw.
#' @param times vector of time points. \code{NULL} (default) uses the 10%--90%
#'   quantiles of the event times, \code{n_times} of them -- the tails are
#'   avoided because few events there make the estimate unstable.
#' @param n_times number of time points when \code{times = NULL}, default 20.
#' @param effect effect scale, \code{"survdiff"} (default) or \code{"rmst"}.
#' @param learner_base native base learner for survival outcomes, \code{"coxph"}
#'   (default, fast and interpretable) or \code{"ranger"} (non-linear). Note that
#'   survival outcomes **cannot** use \code{lrn("regr.*")}.
#' @param newX covariates for pointwise CATE; defaults to the training set \code{X}.
#'   The curve's \code{ate} is always the ATE over the training population and
#'   independent of \code{newX}.
#' @param ... other arguments passed to \code{\link{metalearner}} (\code{learner_tau},
#'   \code{learner_ps}, \code{cross_fitting}, \code{engine}, etc.).
#'
#' @return a data.frame with two columns: \code{time} and \code{ate}; with
#'   attributes:
#'   \itemize{
#'     \item \code{cate}: a \code{nrow(newX) x length(times)} matrix, whose j-th
#'       column is the CATE of each sample at the j-th time point;
#'     \item \code{type} / \code{effect} / \code{learner_base}: this fit's
#'       configuration;
#'     \item \code{n_fits}: the actual number of refits (= number of time points).
#'   }
#' @seealso \code{\link{plot_surv_effect_curve}}, \code{\link{metalearner}}
#' @export
#'
#' @examples
#' d <- mlr3HTE_demo_surv(n = 400, t0 = 2, seed = 103)
#' cv <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 5)
#' cv
#' dim(attr(cv, "cate"))
surv_effect_curve <- function(type, X, A, Y,
                              times = NULL, n_times = 20L,
                              effect = c("survdiff", "rmst"),
                              learner_base = "coxph",
                              newX = NULL, ...) {
  # 1 输入校验与归一化 ---------------------------------------------------------
  type <- match.arg(type, c("S", "T", "X", "R", "DR"))
  effect <- match.arg(effect)

  X <- as.data.frame(X)
  A <- as.integer(A)
  n <- nrow(X)

  if (!inherits(Y, "Surv")) {
    stop("surv_effect_curve() is meaningful only for survival outcomes; Y must be a survival::Surv object.",
         call. = FALSE)
  }
  if (length(A) != n) {
    stop(sprintf("Length of A (%d) does not match the number of rows in X (%d).", length(A), n),
         call. = FALSE)
  }
  if (nrow(Y) != n) {
    stop(sprintf("Number of rows in Y (%d) does not match the number of rows in X (%d).", nrow(Y), n),
         call. = FALSE)
  }

  newX <- if (is.null(newX)) X else as.data.frame(newX)

  # 2 时点网格 -----------------------------------------------------------------
  # 默认取事件时间的 10%-90% 分位：两端事件数少，S(t) 的估计不稳，
  # 把曲线画到那里只会放大噪声、不增加信息。
  if (is.null(times)) {
    tt <- as.numeric(Y[, 1L])
    ev <- as.integer(Y[, 2L]) == 1L
    ev_times <- if (any(ev)) tt[ev] else tt
    n_times <- max(as.integer(n_times), 2L)
    times <- stats::quantile(ev_times,
                             probs = seq(0.1, 0.9, length.out = n_times),
                             names = FALSE)
  } else {
    times <- sort(unique(as.numeric(times)))
  }
  if (length(times) < 2L) {
    stop("At least 2 time points are required to form a curve.", call. = FALSE)
  }

  # 超出随访范围的时点不会报错，但 S(t) 只能靠模型外推，提醒一句。
  max_obs <- max(as.numeric(Y[, 1L]))
  if (max(times) > max_obs) {
    warning(sprintf(
      "%d time point(s) exceed the longest follow-up time %.3g; effects at these points are model extrapolations, interpret with caution.",
      sum(times > max_obs), max_obs), call. = FALSE)
  }

  # 3 交叉拟合参数：避免同一个 warning 在循环里刷 G 遍 --------------------------
  # engine 里对非 R/DR 学习器会 warning 说交叉拟合未实现；逐点重拟合会把这条
  # 警告放大 G 倍，所以这里提前拦一次、改成单次警告后关掉。
  dots <- list(...)
  if (isTRUE(dots$cross_fitting) && !type %in% c("R", "DR")) {
    warning("Cross-fitting is currently implemented only for R / DR learners; to avoid repeating this warning at every time point, it has been disabled in this function.",
            call. = FALSE)
    dots$cross_fitting <- FALSE
  }

  # 4 逐点重拟合 ---------------------------------------------------------------
  G <- length(times)
  ate <- numeric(G)
  cate <- matrix(NA_real_, nrow = nrow(newX), ncol = G)

  cli::cli_progress_bar("Refitting metalearner pointwise", total = G, type = "iterator")
  for (g in seq_len(G)) {
    fit <- do.call(
      metalearner,
      c(list(type = type, X = X, A = A, Y = Y,
             learner_base = learner_base, t0 = times[g], effect = effect),
        dots)
    )
    # ate 取训练集人群上的 ATE，与 newX 无关，保证曲线口径一致
    ate[g] <- fit$ate
    cate[, g] <- as.numeric(fit$predict(newX))
    cli::cli_progress_update()
  }
  cli::cli_progress_done()

  # 5 组装返回 -----------------------------------------------------------------
  out <- data.frame(time = times, ate = ate)
  attr(out, "cate") <- cate
  attr(out, "type") <- type
  attr(out, "effect") <- effect
  attr(out, "learner_base") <- learner_base
  attr(out, "newX") <- newX
  attr(out, "n_fits") <- G
  class(out) <- c("mlr3HTE_surv_effect_curve", class(out))
  out
}

# 1 绘制度量曲型的曲线 ---------------------------------------------------------
#' Plot the effect-over-time curve for survival outcomes
#'
#' @description
#' Plot the result of \code{\link{surv_effect_curve}} as a ggplot: time on the
#' x-axis and effect on the y-axis, with a horizontal 0 reference line (zero
#' effect = no difference between treatment and control). By default an additional
#' **25%--75% quantile band of individual CATE** is overlaid, visually showing how
#' heterogeneity changes over time: a wider band means greater spread of individual
#' effects at that time point.
#'
#' @param curve the return value of \code{\link{surv_effect_curve}}.
#' @param ribbon whether to overlay the 25%--75% quantile band of individual CATE,
#'   default \code{TRUE}.
#' @param main plot title; auto-generated from \code{type} and \code{effect} when
#'   \code{NULL}.
#' @param color curve color.
#' @param ... no longer used, kept for backward compatibility.
#'
#' @return a \code{ggplot} object, customizable with \code{+} or exportable via
#'   \code{ggsave()}.
#' @seealso \code{\link{surv_effect_curve}}
#' @export
#'
#' @examples
#' d <- mlr3HTE_demo_surv(n = 400, t0 = 2, seed = 103)
#' p <- plot_surv_effect_curve(surv_effect_curve("T", d$X, d$A, d$Y, n_times = 5))
#' class(p)
plot_surv_effect_curve <- function(curve, ribbon = TRUE, main = NULL,
                                   color = "#1B6CA8", ...) {
  if (!inherits(curve, "mlr3HTE_surv_effect_curve")) {
    stop("curve must be the return value of surv_effect_curve().", call. = FALSE)
  }

  d <- as.data.frame(curve)
  is_rmst <- identical(attr(curve, "effect"), "rmst")

  if (is.null(main)) {
    main <- sprintf("%s-learner: effect over time (%s)",
                    attr(curve, "type"), attr(curve, "effect"))
  }
  ylab <- if (is_rmst) {
    "RMST difference (treated - control)"
  } else {
    "Survival difference S1(t) - S0(t)"
  }

  p <- ggplot2::ggplot(d, ggplot2::aes(x = .data$time, y = .data$ate))

  if (isTRUE(ribbon)) {
    cate <- attr(curve, "cate")
    if (!is.null(cate) && ncol(cate) == nrow(d)) {
      # apply 按列取分位，结果转置回「行 = 时点」
      qq <- t(apply(cate, 2L, function(col) {
        stats::quantile(col, c(0.25, 0.75), na.rm = TRUE)
      }))
      band <- data.frame(time = d$time, lo = qq[, 1L], hi = qq[, 2L])
      p <- p + ggplot2::geom_ribbon(
        data = band,
        ggplot2::aes(x = .data$time, ymin = .data$lo, ymax = .data$hi),
        fill = color, alpha = 0.18, inherit.aes = FALSE
      )
    }
  }

  p +
    ggplot2::geom_line(linewidth = 1.05, color = color) +
    ggplot2::geom_hline(yintercept = 0, linetype = 2, colour = "grey50") +
    ggplot2::labs(
      x = "Time", y = ylab, title = main,
      subtitle = if (isTRUE(ribbon)) {
        "Shaded band: 25%-75% quantile range of individual CATE"
      } else {
        "Dashed line: zero effect"
      }
    ) +
    ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(panel.grid.minor = ggplot2::element_blank(),
                   plot.title = ggplot2::element_text(face = "bold"))
}

# 99 收尾 ----
