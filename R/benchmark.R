#' Benchmark multiple meta-learners on randomized trial (RCT) data
#'
#' \strong{This benchmark does not rely on the true CATE, so it is equally usable on
#' real-world RCT data} — it asks only one question: how well does the model rank
#' "who benefits more" to the front. This is a different thing from the reconciliation
#' (correlation / RMSE) that \code{\link{metalearner}} does on simulated data with a
#' built-in truth: the true \eqn{\tau} exists only in simulated data and is never
#' available in real studies.
#'
#' All three metrics are built on the exchangeability brought by \strong{randomization}
#' and need no propensity score:
#' \describe{
#'   \item{Qini coefficient}{\code{\link{qini_coefficient}}: the area between the curve
#'     and the "random targeting line". The larger it is, the more extra gain the
#'     model's ranking brings over random allocation.}
#'   \item{TOC gain}{The area between the TOC curve (\code{\link{toc_curve}}) and the
#'     full-sample ATE horizontal line; its unit is the outcome unit. A positive value
#'     means "prioritizing the people the model ranks first" is on average better than
#'     random targeting.}
#'   \item{c-for-benefit}{\code{\link{c_for_benefit}}: the C-statistic after gain-matching
#'     the treated group by predicted benefit against the control group; 0.5 = random
#'     ranking.}
#' }
#'
#' @section Why cross-fitting is mandatory:
#' Each meta-learner is fit on the \strong{training folds} of K folds and predicted on
#' the \strong{held-out folds}, and finally the out-of-fold predictions are stitched
#' into one CATE. If the full sample is fit and then fed back to itself (in-fold), the
#' model also ranks its training noise, and Qini is visibly inflated. On this package's
#' demo data, in-fold c-for-benefit actually shows the inversion "model CATE 0.754 >
#' true tau 0.717", which recovers to "0.662 <= 0.669" after cross-fitting.
#'
#' @section What can be reported when:
#' \itemize{
#'   \item \strong{Simulated data} (with built-in \eqn{\tau}): can additionally report
#'     CATE correlation / RMSE — just pass \code{tau}, and two extra columns appear in
#'     the output.
#'   \item \strong{Real RCT data}: without \eqn{\tau}, only Qini / TOC / c-for-benefit
#'     can be reported. These three columns are designed exactly for this situation.
#' }
#'
#' @param X A data.frame of covariates.
#' @param A Treatment indicator (0/1 or logical).
#' @param Y Outcome: continuous numeric, 0/1 binary, or \code{survival::Surv(time, status)}.
#' @param t0 The effect time point for survival outcomes; ignored for continuous / binary.
#'   Defaults to the median event time.
#' @param learners The meta-learners to compare, defaulting to all five families.
#' @param learner_base The base learner; by default chosen automatically by outcome type
#'   (continuous / binary use \code{regr.ranger}, survival uses \code{"coxph"}). All
#'   learners share the same one, so the compared differences are attributed to the
#'   meta-learner rather than the base learner.
#' @param metrics The metrics to compute, defaulting to all three.
#' @param n_folds The number of cross-fitting folds, default 5.
#' @param tau \strong{Optional} true CATE, available only for simulated data. If given,
#'   the two extra columns \code{tau_cor} and \code{tau_rmse} are output.
#' @param propensity,mu1,mu0 \strong{Optional} triple for observational data (see
#'   \code{\link{dr_pseudo_outcome}}). Leave all empty under an RCT.
#' @param effect The scale of the survival effect, \code{"survdiff"} (default, S(t0)
#'   difference) or \code{"rmst"}.
#' @param seed Random seed used for fold assignment; fix it for reproducibility.
#'
#' @return A list:
#'   \describe{
#'     \item{table}{A tidy summary table (tibble) with one row per learner.}
#'     \item{cate}{A long table: \code{.row} / \code{learner} / \code{cate}, i.e. the
#'       cross-fitted out-of-fold predictions, usable for your own plotting or further
#'       analysis.}
#'     \item{curves}{A named list: \code{qini} and \code{toc} each contain a data.frame
#'       of every learner's curve, directly feedable to ggplot2.}
#'     \item{truth}{Present only when \code{tau} is passed: a long table \code{.row} /
#'       \code{tau}.}
#'     \item{setup}{Run parameters such as number of folds, seed, effect scale, t0,
#'       sample size.}
#'   }
#'
#' @seealso \code{\link{qini_coefficient}} \code{\link{toc_curve}}
#'   \code{\link{c_for_benefit}} \code{\link{dr_pseudo_outcome}}
#' @export
#' @examples
#' \donttest{
#' # Simulated data: can report the Qini triple as well as correlation / RMSE (because
#' # a truth is available)
#' d <- mlr3HTE_demo_data(n = 1500, seed = 1)
#' bm <- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 1)
#' bm$table
#'
#' # Real RCT data: without tau, only the Qini / TOC / c-for-benefit columns are shown
#' # hte_benchmark(X, A, Y, seed = 1)$table
#' }
hte_benchmark <- function(X, A, Y, t0 = NULL,
                          learners = c("S", "T", "X", "R", "DR"),
                          learner_base = NULL,
                          metrics = c("qini", "toc", "c_for_benefit"),
                          n_folds = 5L,
                          tau = NULL,
                          propensity = NULL, mu1 = NULL, mu0 = NULL,
                          effect = c("survdiff", "rmst"),
                          seed = NULL) {
  effect <- match.arg(effect)
  metrics <- match.arg(metrics, c("qini", "toc", "c_for_benefit"), several.ok = TRUE)
  learners <- match.arg(learners, c("S", "T", "X", "R", "DR"), several.ok = TRUE)
  n_folds <- as.integer(n_folds)
  if (n_folds < 2L) stop("n_folds must be at least 2.", call. = FALSE)

  X <- as.data.frame(X)
  A <- as.integer(A)
  n <- nrow(X)
  if (length(A) != n) stop("The length of A must match the number of rows in X.", call. = FALSE)
  if (n < 4L) stop("Sample size too small for cross-fitting.", call. = FALSE)

  # 结局类型判定：Surv 对象或两列矩阵都算生存
  is_surv <- inherits(Y, "Surv") || (is.matrix(Y) && ncol(Y) == 2L)
  if (is_surv && is.null(t0)) {
    tt <- Y[, 1L][Y[, 2L] == 1L]
    t0 <- if (length(tt)) stats::median(tt) else stats::median(Y[, 1L])
  }

  # 基学习器默认值：连续用 ranger 回归，二分类用 ranger 分类（predict_type 必须在
  # train 之前设好，否则 $prob 为 NULL），生存用原生 coxph。
  # 所有 learner 共用同一个，比出来的差异才归因于 meta-learner 本身。
  if (is.null(learner_base)) {
    is_binary <- !is_surv && all(stats::na.omit(as.numeric(Y)) %in% c(0, 1))
    learner_base <- if (is_surv) {
      "coxph"
    } else if (is_binary) {
      mlr3::lrn("classif.ranger", predict_type = "prob", num.trees = 300, seed = 1L)
    } else {
      mlr3::lrn("regr.ranger", num.trees = 300, seed = 1L)
    }
  }

  if (!is.null(tau) && length(tau) != n) {
    stop("The length of tau must match the number of rows in X.", call. = FALSE)
  }

  # 折的划分：按处理组分层，保证每折里两个臂都有样本。
  # 不分层的话某一折可能全是同一个臂，该折的效应估计直接失效。
  if (!is.null(seed)) set.seed(seed)
  fold_id <- integer(n)
  for (a in sort(unique(A))) {
    ii <- which(A == a)
    if (length(ii) < n_folds) {
      stop(sprintf("Treatment arm A = %d has only %d observations, not enough observations to form %d folds.",
                   a, length(ii), n_folds), call. = FALSE)
    }
    fold_id[ii] <- sample(rep_len(seq_len(n_folds), length(ii)))
  }
  folds <- split(seq_len(n), fold_id)
  all_rows <- seq_len(n)

  # 逐 learner 逐折拟合，收集留出预测 ----------------------------------------
  cate_list <- vector("list", length(learners))
  names(cate_list) <- learners
  for (tp in learners) {
    cate_oof <- rep(NA_real_, n)
    for (k in seq_along(folds)) {
      te <- folds[[k]]
      tr <- setdiff(all_rows, te)
      Ytr <- if (is.matrix(Y)) Y[tr, , drop = FALSE] else Y[tr]
      Yte <- if (is.matrix(Y)) Y[te, , drop = FALSE] else Y[te]
      fit <- metalearner(tp, X[tr, , drop = FALSE], A[tr], Ytr,
                         learner_base = learner_base, t0 = t0, effect = effect)
      cate_oof[te] <- fit$predict(X[te, , drop = FALSE])
    }
    if (anyNA(cate_oof)) {
      stop(sprintf("%s-learner: %d observations did not receive a held-out prediction; please check the data.",
                   tp, sum(is.na(cate_oof))), call. = FALSE)
    }
    cate_list[[tp]] <- cate_oof
  }

  # 指标：全部算在拼接起来的 out-of-fold CATE 上 ------------------------------
  # Qini 的绝对系数与归一化系数共用同一条曲线，只算一次
  qres <- lapply(cate_list, function(cc)
    qini_coefficient(cc, A, Y, propensity = propensity, t0 = t0,
                     X = X, effect = effect))
  toc_gain <- vapply(cate_list, function(cc) {
    cv <- toc_curve(cc, A, Y, propensity = propensity, t0 = t0, X = X, effect = effect)
    d  <- cv$toc - attr(cv, "overall_ate")
    f  <- cv$fraction
    sum(diff(f) * (d[-length(d)] + d[-1]) / 2)
  }, numeric(1))
  cfb <- vapply(cate_list, function(cc)
    c_for_benefit(cc, A, Y, propensity = propensity, mu1 = mu1, mu0 = mu0,
                  t0 = t0, X = X, effect = effect)$c_for_benefit,
    numeric(1))

  tab <- tibble::tibble(
    learner = learners,
    ate     = vapply(cate_list, mean, numeric(1))
  )
  if ("qini" %in% metrics) {
    tab$qini_coefficient <- vapply(qres, \(r) r$qini_coefficient, numeric(1))
    tab$qini_normalized  <- vapply(qres, \(r) r$qini_normalized, numeric(1))
  }
  if ("toc" %in% metrics) tab$toc_gain <- toc_gain
  if ("c_for_benefit" %in% metrics) tab$c_for_benefit <- cfb
  if (!is.null(tau)) {
    tab$tau_cor  <- vapply(cate_list, \(cc) stats::cor(cc, tau), numeric(1))
    tab$tau_rmse <- vapply(cate_list, \(cc) sqrt(mean((cc - tau)^2)), numeric(1))
  }
  tab <- tab |>
    dplyr::mutate(dplyr::across(dplyr::where(is.double), \(x) round(x, 4)))

  # 曲线：留着给画图用 --------------------------------------------------------
  curves <- list()
  if ("qini" %in% metrics) {
    curves$qini <- lapply(cate_list, function(cc)
      qini_curve(cc, A, Y, propensity = propensity, t0 = t0, X = X, effect = effect))
  }
  if ("toc" %in% metrics) {
    curves$toc <- lapply(cate_list, function(cc)
      toc_curve(cc, A, Y, propensity = propensity, t0 = t0, X = X, effect = effect))
  }

  # 长表：data.frame 拼列比 tibble 的 !!! 更稳，列名就是 learner 名
  cate_wide <- as.data.frame(cate_list, check.names = FALSE)
  cate_wide <- cbind(data.frame(.row = all_rows), cate_wide)
  cate_long <- tidyr::pivot_longer(cate_wide, cols = -.row,
                                   names_to = "learner", values_to = "cate")

  list(
    table  = tab,
    cate   = cate_long,
    curves = curves,
    truth  = if (is.null(tau)) NULL else
               tibble::tibble(.row = all_rows, tau = tau),
    setup  = list(n = n, n_folds = n_folds, seed = seed, effect = effect,
                  t0 = t0, learners = learners,
                  learner_base = if (is.character(learner_base)) learner_base else class(learner_base)[1],
                  has_truth = !is.null(tau))
  )
}

#' Extract the curve plotting data of hte_benchmark()
#'
#' @description
#' The long-format data used by \code{\link{plot_hte_benchmark}} for plotting, provided
#' separately to facilitate exporting to CSV or redrawing with ggplot2 on your own.
#'
#' @param x The object returned by \code{\link{hte_benchmark}}.
#' @param metric \code{"qini"} or \code{"toc"}.
#' @param min_fraction From which targeting fraction to keep, with the same meaning as
#'   in \code{\link{plot_hte_benchmark}}.
#' @return A data.frame with \code{learner} / \code{fraction} / the metric column
#'   (\code{qini} or \code{toc}), plus the attribute \code{reference} (the intercept
#'   and slope of each learner's reference line).
#' @seealso \code{\link{plot_hte_benchmark}}
#' @export
hte_benchmark_data <- function(x, metric = c("qini", "toc"), min_fraction = 0.05) {
  metric <- match.arg(metric)
  curves <- x$curves[[metric]]
  if (is.null(curves)) {
    stop(sprintf("hte_benchmark: %s was not computed (it was not selected in the metrics argument).", metric),
         call. = FALSE)
  }
  nms <- names(curves)
  df <- do.call(rbind, lapply(nms, function(nm) {
    d <- as.data.frame(curves[[nm]])
    d <- d[d$fraction >= min_fraction, , drop = FALSE]
    d$learner <- nm
    d
  }))
  df$learner <- factor(df$learner, levels = nms)

  # 参考线：Qini 用「从原点到该 learner Q(1)」的随机靶向线；
  # TOC 用全样本 ATE 的水平线。
  ref <- if (metric == "qini") {
    data.frame(learner = nms, intercept = 0,
               slope = vapply(curves, function(d) d$qini[nrow(d)], numeric(1)))
  } else {
    data.frame(learner = nms,
               intercept = vapply(curves, function(d) attr(d, "overall_ate"), numeric(1)),
               slope = 0)
  }
  ref$learner <- factor(ref$learner, levels = nms)
  attr(df, "reference") <- ref
  attr(df, "metric") <- metric
  df
}

#' Plot the curve comparison of hte_benchmark()
#'
#' Plot the Qini / TOC curves stored by \code{\link{hte_benchmark}} faceted by learner.
#' The gray dashed line in the Qini panel is the "random targeting" baseline; the gray
#' dashed line in the TOC panel is the full-sample ATE.
#'
#' Returns a \code{ggplot} object, which can be further augmented with \code{+} layers
#' or themes; the data used for plotting is provided separately by
#' \code{\link{hte_benchmark_data}}.
#'
#' @param x The object returned by \code{\link{hte_benchmark}}.
#' @param metric \code{"qini"} or \code{"toc"}.
#' @param title The main title, auto-generated by metric by default.
#' @param min_fraction From which targeting fraction to start drawing. At the far left,
#'   TOC / Qini correspond to only one or two observations, whose value is a single
#'   individual's effect and can stretch the y-axis to dozens of times the ATE, crushing
#'   the rest of the curve. Default \code{0.05} (the first 5% is not drawn); set
#'   \code{0} to see the full picture.
#' @return A \code{ggplot} object.
#' @seealso \code{\link{hte_benchmark_data}}
#' @export
plot_hte_benchmark <- function(x, metric = c("qini", "toc"), title = NULL,
                               min_fraction = 0.05) {
  metric <- match.arg(metric)
  df  <- hte_benchmark_data(x, metric = metric, min_fraction = min_fraction)
  ref <- attr(df, "reference")

  ylab <- if (metric == "qini") "Cumulative gain (Qini)" else "Average effect in top-k"
  if (is.null(title)) {
    title <- if (metric == "qini") "Qini 曲线对比 / Qini curves" else
             "TOC 曲线对比 / TOC curves"
  }

  ggplot2::ggplot(df, ggplot2::aes(x = .data$fraction, y = .data[[metric]])) +
    ggplot2::geom_line(ggplot2::aes(colour = .data$learner), linewidth = 0.9) +
    ggplot2::geom_abline(ggplot2::aes(intercept = .data$intercept, slope = .data$slope),
                         data = ref, linetype = 2, colour = "grey50") +
    ggplot2::facet_wrap(~ learner) +
    ggplot2::labs(title = title,
                  subtitle = sprintf("前 %.0f%% 未画出（只对应个别观测，纵轴会被拉爆）",
                                     100 * min_fraction),
                  x = "Fraction targeted", y = ylab,
                  colour = "learner") +
    ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(legend.position = "none",
                   plot.subtitle = ggplot2::element_text(colour = "grey40", size = 10))
}
