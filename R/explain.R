# =====================================================================
# explain.R —— CATE 模型的可解释性（DALEX 体系 + kernelshap + shapviz）
#
# 目的：metalearner 输出的 CATE 是一个黑箱函数 tau_hat(X)。
#       方法学上需要回答两个问题：
#         (1) 哪些协变量在驱动 CATE 的异质性？（全局：置换重要性、PDP、ALE）
#         (2) 某个具体个体的 CATE 为什么是这个数？（局部：SHAP）
#
# 关键设计：被解释的「模型」是 CATE 预测器，被解释的「响应」不是原始 Y，
# 而是**双重稳健伪结局** Y*（满足 E[Y*|X] = tau(X)）。
# 直接用 Y 做响应是错的——Y 里含基线预后 mu(X) 与噪声，
# 置换重要性会退化成「谁在预测预后」，而不是「谁在预测效应异质性」。
#
# 三条依赖各自负责一件事，全部放在 Suggests 里按需加载：
#   DALEX       置换重要性（model_parts）、PDP / ALE（model_profile）
#   kernelshap  Kernel SHAP 精确值（p 不大时可用；p 大时自动切换采样）
#   shapviz     SHAP 的可视化（importance / beeswarm / dependence / waterfall）
#
# 与 mlr3 的关系：mlr3 负责拟合，DALEX 负责解释，两者通过
# predict_function = function(model, newdata) 这一个接口衔接。
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
#' 构造 CATE 模型的解释器（DALEX）
#'
#' @description
#' 把 \code{\link{metalearner}} 的拟合结果包装成 \code{DALEX::explain} 解释器，
#' 供 \code{\link{hte_feature_importance}} 与 \code{\link{hte_pdp}} 使用。
#'
#' **响应变量是双重稳健伪结局，不是原始 Y。** 这是本函数与方法学文献里
#' 「直接解释预测值」做法的关键差别：CATE 模型的预测目标是 \eqn{\tau(X)}，
#' 而 \eqn{E[Y \mid X]} 含基线预后 \eqn{\mu(X)}。若用 Y 作响应，
#' 置换重要性衡量的是「该变量对预后的重要性」，与效应异质性无关。
#' 双重稳健伪结局 \eqn{Y^*} 满足 \eqn{E[Y^* \mid X] = \tau(X)}，
#' 因此用它作响应时，重要性、PDP 与 SHAP 回答的都是**效应异质性**的问题。
#'
#' @param fit \code{\link{metalearner}} 的返回对象，或任何带
#'   \code{$predict(newX)} 的对象（例如 \code{\link{hte_surrogate}} 的结果）。
#' @param X 协变量 data.frame，解释所依据的样本（通常就是训练集）。
#' @param A 处理指示；当 \code{pseudo} 未提供时用于计算伪结局。
#' @param Y 结局；当 \code{pseudo} 未提供时用于计算伪结局。
#' @param pseudo 已经算好的逐人伪结局向量。给出时忽略 \code{A} / \code{Y}，
#'   适合复用 \code{\link{dr_pseudo_outcome}} 的结果以省去重复计算。
#' @param t0 生存结局的效应评估时点，传给 \code{\link{dr_pseudo_outcome}}。
#' @param effect 生存结局的效应尺度，\code{"survdiff"} 或 \code{"rmst"}。
#' @param label 解释器的显示名，默认沿用 metalearner 的类型标签。
#' @param verbose 是否打印 DALEX 的进度信息。
#' @param ... 传给 \code{\link{dr_pseudo_outcome}} 的其他参数
#'   （\code{learner_ps}、\code{learner_base}、\code{cross_fitting}、\code{seed} 等）。
#' @return \code{hte_explainer} 对象：含 \code{$explainer}（DALEX 解释器）、
#'   \code{$fit}、\code{$pseudo}、\code{$X}、\code{$t0}、\code{$effect}。
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
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.ranger"),
#'                    weighting = "iptw")
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
#' 用 mlr3 学习器为 CATE 曲面拟合代理模型
#'
#' @description
#' metalearner 的 CATE 预测可能是多阶段、带权重、带交叉拟合的复合过程，
#' 直接解释未必对应单一可读的函数。做法是先得到逐人 CATE 估计
#' \eqn{\hat\tau(X_i)}，再用一个**单一**的 mlr3 学习器把它重拟合一遍，
#' 得到一个结构简单、可解释的代理模型（surrogate），用于 PDP、SHAP 与
#' 后续规则提取。这是 Explanatory Model Analysis 中
#' \emph{model distillation} 的做法。
#'
#' @param X 协变量 data.frame。
#' @param tau_hat 逐人 CATE 估计（通常来自 \code{fit$predict(X)}）。
#' @param learner 用于重拟合的 mlr3 回归学习器，默认
#'   \code{regr.ranger}（\code{num.trees = 500}，\code{min.node.size = 20}）。
#' @return 带 \code{$predict(newX)} 与 \code{$model} 的 list，可直接传给
#'   \code{\link{hte_explainer}}。
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
#' CATE 模型的变量重要性（置换法）
#'
#' @description
#' 基于 \code{DALEX::model_parts} 计算置换重要性：逐个打乱某个协变量的取值，
#' 观察 \eqn{\hat\tau} 相对双重稳健伪结局的损失上升多少。
#' 上升越多，说明该变量对 CATE 的异质性贡献越大。
#'
#' 注意这是**对模型的解释**，不是因果效应分解：重要性高只说明模型用到了这个
#' 变量，不说明该变量真的修饰了治疗效果。判断后者需要设计层面的证据
#' （例如交互项检验或随机化下的分层分析）。
#'
#' @param explainer \code{\link{hte_explainer}} 的结果。
#' @param loss 损失函数，默认 \code{"rmse"}；也可用 \code{"mse"}，或直接传一个
#'   \code{function(observed, predicted)} 形式的函数对象。DALEX 2.5 并未导出
#'   MAE，因此这里不提供 \code{"mae"}。注意必须传函数对象而非字符串：
#'   传字符串时 DALEX 会在自身框架内按名查找 \code{loss_*}，跨包调用会失败。
#' @param B 置换次数，默认 10。B 越大越稳定，代价是乘 B 的预测开销。
#' @param variables 只评估这些变量（默认全部）。
#' @param seed 随机种子。
#' @param N 用于计算损失的抽样行数；\code{NULL}（默认）用 DALEX 的默认值
#'   （1000 行或全量，取小者）。大样本下显式给 N 可显著加速。
#' @return data.frame：\code{variable} / \code{dropout_loss} /
#'   \code{baseline}（全模型损失）/ \code{dropout}（相对上升量）/
#'   \code{dropout_pct}（相对上升百分比），按 \code{dropout} 降序。
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
#' CATE 模型的偏依赖（PDP）与累积局部效应（ALE）
#'
#' @description
#' 基于 \code{DALEX::model_profile}：把某个协变量固定在网格上逐点变动、
#' 其余变量保持观测分布，看 \eqn{\hat\tau} 的平均值如何随之变化。
#' \code{type = "partial"} 为经典 PDP，\code{type = "accumulated"} 为 ALE
#' （在变量相关时 ALE 比 PDP 更稳健，因为 PDP 的外推会偏离观测支撑集）。
#'
#' @param explainer \code{\link{hte_explainer}} 的结果。
#' @param variables 要计算的变量名向量，默认取全部协变量。
#' @param grid_points 网格点数，默认 101。
#' @param type \code{"partial"}（PDP，默认）或 \code{"accumulated"}（ALE）。
#' @param center 是否把曲线减去平均预测值，默认 \code{FALSE}。CATE 语境下纵轴
#'   应为**绝对的平均预测 CATE**（量级本身有临床含义），曲线围绕 0 波动会
#'   掩盖效应水平。这里显式传值，不依赖 DALEX 版本对该参数的默认处理。
#' @param ... 传给 \code{DALEX::model_profile}。
#' @return data.frame：\code{variable} / \code{x}（该变量的取值）/
#'   \code{yhat}（该点的平均 CATE）/ \code{type}。
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
#' CATE 模型的 SHAP 值（Kernel SHAP）
#'
#' @description
#' 用 \code{kernelshap} 计算精确的 Kernel SHAP 值，再用 \code{shapviz}
#' 包装为可绘图的 \code{shapviz} 对象。SHAP 把每个个体的预测值分解为
#' 「基线值 + 各协变量的贡献」之和，且贡献满足可加性：
#' \deqn{\hat\tau(x) = \phi_0 + \sum_j \phi_j(x)}
#' 与置换重要性相比，SHAP 同时给出**方向**（该变量把 CATE 推高还是压低）
#' 与**局部性**（这一个体身上贡献多少），这是 PDP 做不到的。
#'
#' 协变量数 p 不大时 Kernel SHAP 走精确枚举（\eqn{2^p} 个联盟），
#' p 较大时由 kernelshap 自动切换到采样近似。
#'
#' @param object \code{\link{hte_explainer}} 的结果，或任何带
#'   \code{$predict(newX)} 的对象。
#' @param X 需要计算 SHAP 的样本；默认为解释器里的 \code{X}。
#' @param bg_X 背景数据（用于估计联盟的边际期望）；默认从 \code{X} 中
#'   随机抽 \code{n_background} 行。背景集越大越稳定但越慢。
#' @param n_background 背景样本量，默认 100。
#' @param seed 随机种子（用于抽背景集）。
#' @param verbose 是否显示 kernelshap 的进度条，默认 \code{FALSE}。
#' @param ... 传给 \code{kernelshap::kernelshap} 的其他参数。
#' @return \code{shapviz} 对象，可交给 \code{\link{plot_hte_shap}} 或
#'   \code{shapviz} 自带的 \code{sv_*()} 函数。
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

#' 把 shapviz 对象摊平为长表数据
#'
#' @description 便于把 SHAP 值导出为 CSV 或自行用 ggplot2 重画。
#' @param sv \code{\link{hte_shap}} 返回的 \code{shapviz} 对象。
#' @return data.frame：\code{id}（样本序号）/ \code{variable} /
#'   \code{value}（该样本该变量的取值）/ \code{shap}（SHAP 值）。
#'   基线值 \eqn{\phi_0} 放在属性 \code{baseline} 里。
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
#' 绘制 CATE 变量重要性
#'
#' @param importance \code{\link{hte_feature_importance}} 的返回 data.frame。
#' @param metric 画哪一列，默认 \code{"dropout_pct"}（相对上升百分比）；
#'   也可用 \code{"dropout"}（绝对上升）。
#' @param fill 条形填充色。
#' @return \code{ggplot} 对象，可直接 \code{print()} 或用 \code{+} 继续定制。
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

#' 绘制 CATE 的偏依赖曲线
#'
#' @param pdp \code{\link{hte_pdp}} 的返回 data.frame。
#' @param color 线条颜色。
#' @param free_y 是否让各分面使用各自的 y 轴刻度（不同变量的 CATE 量级差异大时建议 TRUE）。
#' @return \code{ggplot} 对象。
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

#' 绘制 SHAP 解释图
#'
#' @description
#' 四类常用视图，全部返回 \code{ggplot} 对象：
#' \describe{
#'   \item{\code{"importance"}}{平均绝对 SHAP 值的条形图（全局重要性）}
#'   \item{\code{"beeswarm"}}{逐样本 SHAP 值的蜂群图（重要性 + 方向 + 取值）}
#'   \item{\code{"dependence"}}{单个变量的 SHAP 值对取值的散点图}
#'   \item{\code{"waterfall"}}{单个样本的瀑布图（从基线到最终预测）}
#' }
#'
#' @param sv \code{\link{hte_shap}} 返回的 \code{shapviz} 对象。
#' @param kind 视图类型，见上。
#' @param variable \code{kind = "dependence"} 时指定变量名；
#'   \code{kind = "waterfall"} 时指定样本行号。
#' @param max_vars 最多显示多少个变量，默认 8。
#' @param ... 传给对应的 \code{shapviz::sv_*()} 函数。
#' @return \code{ggplot} 对象。
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
