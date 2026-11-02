# =====================================================================
# explain.R — Interpretability for CATE models (DALEX framework + kernelshap + shapviz)
#
# Purpose: the CATE produced by a metalearner is a black-box function tau_hat(X).
#          Methodologically two questions must be answered:
#            (1) Which covariates drive CATE heterogeneity? (global: permutation
#                importance, PDP, ALE)
#            (2) Why does a specific individual have this CATE value? (local: SHAP)
#
# Key design: the "model" being explained is the CATE predictor, and the "response"
#             being explained is not the raw Y but the **doubly robust pseudo-outcome**
#             Y* (which satisfies E[Y*|X] = tau(X)).
#             Using Y directly as the response is wrong — Y contains the baseline
#             prognosis mu(X) and noise, so permutation importance degenerates into
#             "who predicts prognosis" rather than "who predicts effect heterogeneity".
#
# The three dependencies each handle one task, all loaded on demand from Suggests:
#   DALEX        permutation importance (model_parts), PDP / ALE (model_profile)
#   kernelshap  exact Kernel SHAP values (usable when p is small; switches to
#               sampling automatically when p is large)
#   shapviz     SHAP visualization (importance / beeswarm / dependence / waterfall)
#
# Relationship with mlr3: mlr3 does the fitting, DALEX does the explanation, and the
# two are connected through the single interface
# predict_function = function(model, newdata)
# =====================================================================

# 1 依赖守卫 -------------------------------------------------------------------
# ggplot2 的 aes() 里用到 .data 代词（避免 R CMD check 的 no-visible-binding NOTE）
utils::globalVariables(".data")

`%||%` <- function(x, y) if (is.null(x)) y else x

.need <- function(pkg, why) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    stop(sprintf("%s 需要 %s 包，请先安装：install.packages('%s')", why, pkg, pkg), call. = FALSE)
  }
}

# 2 把任意带 $predict 的对象包成统一的 CATE 预测器 -----------------------------
# metalearner() 的返回对象、hte_surrogate() 的返回对象都满足这个约定。
.as_cate_predictor <- function(x) {
  if (is.function(x)) return(x)
  if (is.list(x) && is.function(x$predict)) {
    return(function(newdata) as.numeric(x$predict(as.data.frame(newdata))))
  }
  stop("需要一个带 $predict(newX) 的 metalearner 对象、hte_surrogate() 结果，或预测函数。",
       call. = FALSE)
}

# 3 构建解释器 -------------------------------------------------------------
#' Construct an explainer for CATE models (DALEX)
#'
#' @description
#' Wrap the fitted result of \code{\link{metalearner}} into a \code{DALEX::explain}
#' explainer, for use by \code{\link{hte_feature_importance}} and \code{\link{hte_pdp}}.
#'
#' **The response variable is the doubly robust pseudo-outcome, not the raw Y.**
#' This is the key difference from the "directly explain the predictions" approach
#' in the methodology literature: the CATE model's prediction target is
#' \eqn{\tau(X)}, whereas \eqn{E[Y \mid X]} contains the baseline prognosis
#' \eqn{\mu(X)}. If Y is used as the response, permutation importance measures
#' "the variable's importance for prognosis", which is unrelated to effect
#' heterogeneity. The doubly robust pseudo-outcome \eqn{Y^*} satisfies
#' \eqn{E[Y^* \mid X] = \tau(X)}, so when it is used as the response, the
#' importance, PDP and SHAP all answer questions about **effect heterogeneity**.
#'
#' @param fit The return object of \code{\link{metalearner}}, or any object with
#'   \code{$predict(newX)} (e.g. the result of \code{\link{hte_surrogate}}).
#' @param X A data.frame of covariates, the sample on which the explanation is based
#'   (usually the training set).
#' @param A Treatment indicator; used to compute the pseudo-outcome when \code{pseudo}
#'   is not supplied.
#' @param Y Outcome; used to compute the pseudo-outcome when \code{pseudo} is not
#'   supplied.
#' @param pseudo A precomputed per-individual pseudo-outcome vector. When supplied,
#'   \code{A} / \code{Y} are ignored, which is convenient for reusing the result of
#'   \code{\link{dr_pseudo_outcome}} to avoid repeated computation.
#' @param t0 The effect evaluation time point for survival outcomes, passed to
#'   \code{\link{dr_pseudo_outcome}}.
#' @param effect The effect scale for survival outcomes, \code{"survdiff"} or
#'   \code{"rmst"}.
#' @param label The display name of the explainer, defaulting to the metalearner's
#'   type label.
#' @param verbose Whether to print DALEX progress information.
#' @param ... Additional arguments passed to \code{\link{dr_pseudo_outcome}}
#'   (\code{learner_ps}, \code{learner_base}, \code{cross_fitting}, \code{seed}, etc.).
#' @return A \code{hte_explainer} object containing \code{$explainer} (the DALEX
#'   explainer), \code{$fit}, \code{$pseudo}, \code{$X}, \code{$t0}, \code{$effect}.
#' @references
#' Biecek P, Burzykowski T. \emph{Explanatory Model Analysis: Explore, Explain,
#' and Examine Predictive Models}. Chapman & Hall/CRC, 2021.
#' \url{https://ema.drwhy.ai/}
#'
#' Molnar C. \emph{Interpretable Machine Learning}. 2nd ed. 2022.
#' @seealso \code{\link{hte_feature_importance}}, \code{\link{hte_pdp}},
#'   \code{\link{hte_shap}}, \code{\link{dr_pseudo_outcome}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_scenario("obs_lin_lin_sharedT", "continuous", n = 600, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"))
#' ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
#' hte_feature_importance(ex, B = 5)
#' }
hte_explainer <- function(fit, X, A = NULL, Y = NULL, pseudo = NULL,
                          t0 = NULL, effect = c("survdiff", "rmst"),
                          label = NULL, verbose = FALSE, ...) {
  .need("DALEX", "构造 CATE 解释器")
  effect <- match.arg(effect)
  X <- as.data.frame(X)

  if (is.null(pseudo)) {
    if (is.null(A) || is.null(Y)) {
      stop("请提供 pseudo，或同时提供 A 与 Y 以便计算双重稳健伪结局。", call. = FALSE)
    }
    dr <- dr_pseudo_outcome(X, A, Y, t0 = t0, effect = effect, ...)
    pseudo <- dr$pseudo
    if (is.null(t0)) t0 <- dr$t0
  }
  pseudo <- as.numeric(pseudo)
  if (length(pseudo) != nrow(X)) {
    stop("pseudo 的长度与 X 的行数不一致。", call. = FALSE)
  }

  pred <- .as_cate_predictor(fit)
  if (is.null(label)) {
    label <- if (is.list(fit) && !is.null(fit$type)) {
      paste0(fit$type, "-Learner")
    } else {
      "CATE model"
    }
  }

  e <- DALEX::explain(
    model = fit,
    data = X,
    y = pseudo,
    predict_function = function(model, newdata) pred(newdata),
    label = label,
    verbose = verbose
  )

  structure(
    list(explainer = e, fit = fit, pseudo = pseudo, X = X,
         t0 = t0, effect = effect, label = label),
    class = "hte_explainer"
  )
}

# 内部：接受 hte_explainer 或裸 DALEX 解释器
.as_dalex <- function(x) {
  if (inherits(x, "hte_explainer")) return(x$explainer)
  if (inherits(x, "explainer")) return(x)
  stop("请传入 hte_explainer() 的结果或 DALEX 解释器。", call. = FALSE)
}

# 4 代理模型：用任意 mlr3 学习器重拟合 CATE 曲面 -------------------------------
#' Fit a surrogate model for the CATE surface using an mlr3 learner
#'
#' @description
#' The CATE prediction from a metalearner may be a multi-stage, weighted,
#' cross-fitted composite process, and explaining it directly may not correspond
#' to a single readable function. The approach is to first obtain per-individual
#' CATE estimates \eqn{\hat\tau(X_i)} and then refit them with a **single** mlr3
#' learner, yielding a structurally simple, interpretable surrogate model for use
#' in PDP, SHAP and subsequent rule extraction. This is the \emph{model
#' distillation} approach in Explanatory Model Analysis.
#'
#' @param X A data.frame of covariates.
#' @param tau_hat Per-individual CATE estimates (usually from \code{fit$predict(X)}).
#' @param learner The mlr3 regression learner used for refitting, defaulting to
#'   \code{regr.ranger} (\code{num.trees = 500}, \code{min.node.size = 20}).
#' @return A list with \code{$predict(newX)} and \code{$model}, which can be passed
#'   directly to \code{\link{hte_explainer}}.
#' @seealso \code{\link{hte_explainer}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_scenario("rct_lin", "continuous", n = 500, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"))
#' sur <- hte_surrogate(d$X, fit$predict(d$X))
#' cor(sur$predict(d$X), d$tau)
#' }
hte_surrogate <- function(X, tau_hat,
                          learner = mlr3::lrn("regr.ranger", num.trees = 500,
                                              min.node.size = 20, seed = 1)) {
  X <- as.data.frame(X)
  tau_hat <- as.numeric(tau_hat)
  if (length(tau_hat) != nrow(X)) stop("tau_hat 的长度与 X 的行数不一致。", call. = FALSE)

  d <- data.frame(X, .tau = tau_hat, check.names = FALSE)
  task <- mlr3::as_task_regr(d, target = ".tau")
  l <- learner$clone(deep = TRUE)
  l$train(task)
  list(
    model = l,
    predict = function(newX) as.numeric(l$predict_newdata(as.data.frame(newX))$response),
    learner_id = l$id
  )
}

# 5 全局解释：置换重要性 -------------------------------------------------------
#' Variable importance for CATE models (permutation method)
#'
#' @description
#' Compute permutation importance based on \code{DALEX::model_parts}: for each
#' covariate, shuffle its values and observe how much the loss of \eqn{\hat\tau}
#' relative to the doubly robust pseudo-outcome increases. The larger the increase,
#' the more that variable contributes to CATE heterogeneity.
#'
#' Note that this is an **explanation of the model**, not a causal-effect
#' decomposition: a high importance only means the model uses the variable, not
#' that the variable truly modifies the treatment effect. Establishing the latter
#' requires design-level evidence (e.g. interaction tests or stratified analysis
#' under randomization).
#'
#' @param explainer The result of \code{\link{hte_explainer}}.
#' @param loss The loss function, defaulting to \code{"rmse"}; \code{"mse"} is also
#'   accepted, or you may pass a function object of the form
#'   \code{function(observed, predicted)}. DALEX 2.5 does not export MAE, so
#'   \code{"mae"} is not offered here. Note that a function object must be passed
#'   rather than a string: when a string is passed, DALEX looks up \code{loss_*}
#'   by name within its own framework, and cross-package calls will fail.
#' @param B The number of permutations, default 10. Larger B is more stable at the
#'   cost of B times the prediction overhead.
#' @param variables Only evaluate these variables (all by default).
#' @param seed Random seed.
#' @param N The number of sampled rows used to compute the loss; \code{NULL}
#'   (default) uses DALEX's default (1000 rows or the full data, whichever is
#'   smaller). Explicitly setting N on large samples can substantially speed things up.
#' @return A data.frame with \code{variable} / \code{dropout_loss} /
#'   \code{baseline} (full-model loss) / \code{dropout} (relative increase) /
#'   \code{dropout_pct} (relative increase in percent), sorted by \code{dropout}
#'   in descending order.
#' @seealso \code{\link{hte_explainer}}, \code{\link{plot_hte_importance}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"))
#' ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
#' hte_feature_importance(ex, B = 5)
#' }
hte_feature_importance <- function(explainer, loss = "rmse", B = 10L,
                                   variables = NULL, seed = NULL, N = NULL) {
  .need("DALEX", "计算变量重要性")
  e <- .as_dalex(explainer)
  if (!is.null(seed)) set.seed(seed)

  # DALEX 的 loss 参数必须传函数对象：传字符串时它会在自己的调用框架里
  # 按名字去找 loss_*()，跨包调用时找不到（实测报 could not find function
  # "loss_function"）。DALEX 2.5 只导出这几个，均方误差就叫
  # loss_root_mean_square，不叫 loss_rmse。
  loss_fn <- if (is.function(loss)) {
    loss
  } else {
    switch(loss,
      rmse = DALEX::loss_root_mean_square,
      mse  = DALEX::loss_sum_of_squares,
      stop("loss 只支持 function 或 \"rmse\" / \"mse\"（DALEX 2.5 未提供 MAE）。",
           call. = FALSE)
    )
  }

  args <- list(explainer = e, loss_function = loss_fn, B = B,
               variables = variables, type = "variable_importance")
  if (!is.null(N)) args$N <- N
  res <- as.data.frame(do.call(DALEX::model_parts, args),
                       stringsAsFactors = FALSE)

  # _full_model_ = 未打乱时的损失（基准），_baseline_ = 打乱全部变量时的损失；
  # 每个变量在 B 次置换上取均值，避免单次置换的蒙特卡洛噪声。
  base <- mean(res$dropout_loss[res$variable == "_full_model_"], na.rm = TRUE)
  keep <- !res$variable %in% c("_baseline_", "_full_model_")
  res  <- res[keep, , drop = FALSE]
  agg  <- stats::aggregate(dropout_loss ~ variable, data = res, FUN = mean)
  agg  <- data.frame(
    variable     = agg$variable,
    dropout_loss = agg$dropout_loss,
    baseline     = base,
    dropout      = agg$dropout_loss - base,
    stringsAsFactors = FALSE, row.names = NULL
  )
  agg$dropout_pct <- 100 * agg$dropout / agg$baseline
  agg <- agg[order(-agg$dropout), , drop = FALSE]
  attr(agg, "loss") <- if (is.function(loss)) "custom" else loss
  attr(agg, "label") <- e$label
  attr(agg, "B") <- B
  agg
}

# 6 全局解释：PDP / ALE -------------------------------------------------------
#' Partial dependence (PDP) and accumulated local effects (ALE) for CATE models
#'
#' @description
#' Based on \code{DALEX::model_profile}: fix a covariate on a grid point by point,
#' keep the remaining variables at their observed distribution, and see how the
#' average of \eqn{\hat\tau} changes accordingly. \code{type = "partial"} is the
#' classic PDP and \code{type = "accumulated"} is ALE (ALE is more robust than PDP
#' when variables are correlated, because PDP extrapolation drifts away from the
#' observed support).
#'
#' @param explainer The result of \code{\link{hte_explainer}}.
#' @param variables A vector of variable names to compute, defaulting to all
#'   covariates.
#' @param grid_points The number of grid points, default 101.
#' @param type \code{"partial"} (PDP, default) or \code{"accumulated"} (ALE).
#' @param center Whether to subtract the mean prediction from the curve, default
#'   \code{FALSE}. In the CATE context the vertical axis should be the **absolute
#'   average predicted CATE** (the magnitude itself is clinically meaningful), and
#'   a curve fluctuating around 0 would mask the effect level. Here the value is
#'   passed explicitly rather than relying on DALEX's version-dependent default.
#' @param ... Passed to \code{DALEX::model_profile}.
#' @return A data.frame with \code{variable} / \code{x} (the covariate value) /
#'   \code{yhat} (the average CATE at that point) / \code{type}.
#' @seealso \code{\link{hte_explainer}}, \code{\link{plot_hte_pdp}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"))
#' ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
#' head(hte_pdp(ex, variables = "lac"))
#' }
hte_pdp <- function(explainer, variables = NULL, grid_points = 101L,
                    type = c("partial", "accumulated"), center = FALSE, ...) {
  .need("DALEX", "计算偏依赖")
  type <- match.arg(type)
  e <- .as_dalex(explainer)
  if (is.null(variables)) variables <- names(e$data)

  mp <- DALEX::model_profile(e, variables = variables, grid_points = grid_points,
                             type = type, center = center, ...)
  # DALEX 2.5：type = "partial" 收在 $agr_profiles（各变量在网格上的平均预测），
  # "accumulated" 同理。整体对象不能直接 as.data.frame()。
  res <- as.data.frame(mp$agr_profiles, stringsAsFactors = FALSE)
  out <- data.frame(
    variable = res[["_vname_"]],
    x        = res[["_x_"]],
    yhat     = res[["_yhat_"]],
    type     = type,
    stringsAsFactors = FALSE, row.names = NULL
  )
  # 因子型变量的 _x_ 是字符，统一成字符列，避免 rbind 时类型冲突
  out$x <- if (is.factor(out$x)) as.character(out$x) else out$x
  attr(out, "label") <- e$label
  out
}

# 7 局部解释：Kernel SHAP ------------------------------------------------------
#' SHAP values for CATE models (Kernel SHAP)
#'
#' @description
#' Compute exact Kernel SHAP values with \code{kernelshap}, then wrap them into a
#' plottable \code{shapviz} object with \code{shapviz}. SHAP decomposes each
#' individual's prediction into the sum of "a baseline value + each covariate's
#' contribution", and the contributions are additive:
#' \deqn{\hat\tau(x) = \phi_0 + \sum_j \phi_j(x)}
#' Compared with permutation importance, SHAP additionally provides the
#' **direction** (whether the variable pushes CATE up or down) and the
#' **locality** (how much it contributes for this particular individual), which PDP
#' cannot do.
#'
#' When the number of covariates p is small, Kernel SHAP uses exact enumeration
#' (\eqn{2^p} coalitions); when p is large, kernelshap automatically switches to
#' sampling approximation.
#'
#' @param object The result of \code{\link{hte_explainer}}, or any object with
#'   \code{$predict(newX)}.
#' @param X The sample for which SHAP is computed; defaults to \code{X} in the
#'   explainer.
#' @param bg_X Background data (used to estimate the marginal expectation of
#'   coalitions); by default \code{n_background} rows are randomly drawn from
#'   \code{X}. A larger background set is more stable but slower.
#' @param n_background The background sample size, default 100.
#' @param seed Random seed (used to draw the background set).
#' @param verbose Whether to show the kernelshap progress bar, default
#'   \code{FALSE}.
#' @param ... Additional arguments passed to \code{kernelshap::kernelshap}.
#' @return A \code{shapviz} object, which can be passed to \code{\link{plot_hte_shap}}
#'   or to the \code{sv_*()} functions provided by \code{shapviz}.
#' @references
#' Lundberg SM, Lee SI. A Unified Approach to Interpreting Model Predictions.
#' \emph{NeurIPS}, 2017.
#'
#' Covert I, Lee SI. Improving KernelSHAP: Practical Shapley Value Estimation
#' Using Linear Regression. \emph{AISTATS}, 2021.
#' @seealso \code{\link{hte_shap_data}}, \code{\link{plot_hte_shap}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"))
#' ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)
#' sv <- hte_shap(ex, n_background = 50, seed = 1)
#' hte_shap_data(sv)
#' }
hte_shap <- function(object, X = NULL, bg_X = NULL, n_background = 100L,
                     seed = NULL, verbose = FALSE, ...) {
  .need("kernelshap", "计算 SHAP 值")
  .need("shapviz", "包装 SHAP 结果")

  pred <- .as_cate_predictor(if (inherits(object, "hte_explainer")) object$fit else object)
  if (is.null(X)) {
    if (!inherits(object, "hte_explainer")) {
      stop("未提供 X 时必须传入 hte_explainer() 的结果。", call. = FALSE)
    }
    X <- object$X
  }
  X <- as.data.frame(X)

  if (is.null(bg_X)) {
    if (!is.null(seed)) set.seed(seed)
    m <- min(as.integer(n_background), nrow(X))
    bg_X <- X[sample.int(nrow(X), m), , drop = FALSE]
  } else {
    bg_X <- as.data.frame(bg_X)
  }

  # kernelshap 的约定：pred_fun(object, newdata, ...)，object 原样传回
  ks <- kernelshap::kernelshap(
    object = pred,
    X = X,
    bg_X = bg_X,
    pred_fun = function(object, newdata, ...) as.numeric(object(as.data.frame(newdata))),
    verbose = verbose,
    ...
  )
  shapviz::shapviz(ks, X = X)
}

#' Flatten a shapviz object into long-format data
#'
#' @description Convenient for exporting SHAP values to CSV or redrawing with
#'   ggplot2 on your own.
#' @param sv The \code{shapviz} object returned by \code{\link{hte_shap}}.
#' @return A data.frame with \code{id} (sample index) / \code{variable} /
#'   \code{value} (the covariate value for that sample) / \code{shap} (the SHAP
#'   value). The baseline value \eqn{\phi_0} is stored in the \code{baseline}
#'   attribute.
#' @seealso \code{\link{hte_shap}}
#' @export
hte_shap_data <- function(sv) {
  if (!inherits(sv, "shapviz")) stop("请传入 hte_shap() 返回的 shapviz 对象。", call. = FALSE)
  S <- as.matrix(sv$S)
  X <- as.data.frame(sv$X)
  out <- data.frame(
    id       = rep(seq_len(nrow(S)), times = ncol(S)),
    variable = rep(colnames(S), each = nrow(S)),
    value    = as.numeric(as.matrix(X[, colnames(S), drop = FALSE])),
    shap     = as.numeric(S),
    stringsAsFactors = FALSE, row.names = NULL
  )
  attr(out, "baseline") <- unname(sv$baseline)
  out
}

# 8 绘图 ---------------------------------------------------------------------
#' Plot CATE variable importance
#'
#' @param importance The data.frame returned by \code{\link{hte_feature_importance}}.
#' @param metric Which column to plot, default \code{"dropout_pct"} (relative
#'   increase in percent); \code{"dropout"} (absolute increase) is also available.
#' @param fill The bar fill color.
#' @return A \code{ggplot} object, which can be directly \code{print()}ed or further
#'   customized with \code{+}.
#' @seealso \code{\link{hte_feature_importance}}
#' @export
plot_hte_importance <- function(importance, metric = c("dropout_pct", "dropout"),
                                fill = "#1B6CA8") {
  metric <- match.arg(metric)
  d <- as.data.frame(importance)
  if (!all(c("variable", metric) %in% names(d))) {
    stop("importance 必须是 hte_feature_importance() 的返回值。", call. = FALSE)
  }
  d$variable <- stats::reorder(d$variable, d[[metric]])
  lab <- if (metric == "dropout_pct") "Loss increase (%)" else "Loss increase"
  ggplot2::ggplot(d, ggplot2::aes(x = .data$variable, y = .data[[metric]])) +
    ggplot2::geom_col(fill = fill, width = 0.68) +
    ggplot2::coord_flip() +
    ggplot2::labs(x = NULL, y = lab,
                  title = "Permutation importance for the CATE model",
                  subtitle = paste0("Loss = ", attr(importance, "loss") %||% "rmse",
                                    "; response = doubly robust pseudo-outcome")) +    ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(panel.grid.minor = ggplot2::element_blank(),
                   plot.title = ggplot2::element_text(face = "bold"))
}

#' Plot the partial dependence curves of the CATE model
#'
#' @param pdp The data.frame returned by \code{\link{hte_pdp}}.
#' @param color The line color.
#' @param free_y Whether each facet uses its own y-axis scale (recommended TRUE when
#'   the CATE magnitudes of different variables differ substantially).
#' @return A \code{ggplot} object.
#' @seealso \code{\link{hte_pdp}}
#' @export
plot_hte_pdp <- function(pdp, color = "#1B6CA8", free_y = TRUE) {
  d <- as.data.frame(pdp)
  if (!all(c("variable", "x", "yhat") %in% names(d))) {
    stop("pdp 必须是 hte_pdp() 的返回值。", call. = FALSE)
  }
  ggplot2::ggplot(d, ggplot2::aes(x = .data$x, y = .data$yhat)) +
    ggplot2::geom_line(linewidth = 1.05, color = color) +
    ggplot2::facet_wrap(~variable, scales = if (free_y) "free_y" else "fixed") +
    ggplot2::labs(x = "Covariate value", y = "Average predicted CATE",
                  title = "Partial dependence of the CATE model",
                  subtitle = if (identical(attr(d, "type") %||% d$type[1], "accumulated"))
                    "Accumulated local effects" else "Partial dependence") +
    ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(panel.grid.minor = ggplot2::element_blank(),
                   plot.title = ggplot2::element_text(face = "bold"))
}

#' Plot SHAP explanation figures
#'
#' @description
#' Four common views, all returning a \code{ggplot} object:
#' \describe{
#'   \item{\code{"importance"}}{Bar plot of mean absolute SHAP values (global importance)}
#'   \item{\code{"beeswarm"}}{Beeswarm plot of per-sample SHAP values (importance + direction + value)}
#'   \item{\code{"dependence"}}{Scatter plot of a single variable's SHAP values against its values}
#'   \item{\code{"waterfall"}}{Waterfall plot for a single sample (from baseline to final prediction)}
#' }
#'
#' @param sv The \code{shapviz} object returned by \code{\link{hte_shap}}.
#' @param kind The view type, see above.
#' @param variable For \code{kind = "dependence"} specify the variable name;
#'   for \code{kind = "waterfall"} specify the sample row number.
#' @param max_vars The maximum number of variables to display, default 8.
#' @param ... Passed to the corresponding \code{shapviz::sv_*()} function.
#' @return A \code{ggplot} object.
#' @seealso \code{\link{hte_shap}}, \code{\link{hte_shap_data}}
#' @export
plot_hte_shap <- function(sv, kind = c("importance", "beeswarm", "dependence", "waterfall"),
                          variable = NULL, max_vars = 8L, ...) {
  .need("shapviz", "绘制 SHAP 图")
  if (!inherits(sv, "shapviz")) stop("请传入 hte_shap() 返回的 shapviz 对象。", call. = FALSE)
  kind <- match.arg(kind)
  g <- switch(kind,
    importance = shapviz::sv_importance(sv, kind = "bar", max_display = max_vars, ...),
    beeswarm   = shapviz::sv_importance(sv, kind = "beeswarm", max_display = max_vars, ...),
    dependence = {
      if (is.null(variable)) stop('kind = "dependence" 需要指定 variable。', call. = FALSE)
      shapviz::sv_dependence(sv, v = variable, ...)
    },
    waterfall  = {
      if (is.null(variable)) stop('kind = "waterfall" 需要指定 variable（样本行号）。', call. = FALSE)
      shapviz::sv_waterfall(sv, row_id = as.integer(variable), ...)
    }
  )
  g + ggplot2::labs(title = paste0("SHAP: ", kind)) +
    ggplot2::theme(plot.title = ggplot2::element_text(face = "bold"))
}
