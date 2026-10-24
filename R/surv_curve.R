# =====================================================================
# surv_curve.R —— 生存结局的「效应—时间」曲线
#
# 为什么需要它：metalearner() 的生存效应只在**一个**时点 t0 上定义
# （survdiff: S(t0) 差；rmst: 限制到 τ=t0 的平均生存时间差）。但临床解释
# 常常要回答「效应随时间怎么变」——术后 1 个月的生存获益和 3 年时不一样。
#
# 实现方式（用户拍板：统一逐点重拟合）：
#   对每个 t 完整调用一次 metalearner(t0 = t)，五族（S/T/X/R/DR）行为
#   **完全一致**，不做任何「一次拟合出整条曲线」的特例。
#
# 为什么不为 S/T 开特例：S/T 的结局模型本身就是生存模型，理论上一次拟合
# 就能在任意 t 取值，快一到两个数量级。但那样接口行为会按 learner 类型
# 分叉，用户得先记住「我是 S 还是 DR」才知道函数做了什么。这里宁可慢，
# 也要语义单一：曲线上的每个点，都是一个完整、独立的 metalearner 估计。
#
# 代价（必须在文档里说清）：G 个时点 = G 次完整拟合，倾向得分模型也会被
# 重复训练 G 次。默认 n_times = 20。
# =====================================================================

# 0 环境与依赖 ----

#' 生存结局的效应—时间曲线（逐点重拟合）
#'
#' @description
#' 在一组时点上**逐个重拟合**同一个 metalearner，把「效应随时间怎么变」
#' 画成一条曲线。曲线上第 g 个点就是 `metalearner(type, X, A, Y, t0 = times[g])`
#' 的估计结果——没有任何近似或复用，五族学习器行为完全一致。
#'
#' 两种效应尺度由 `effect` 决定，与 \code{\link{metalearner}} 完全对齐：
#' \itemize{
#'   \item \code{"survdiff"}：\eqn{\Delta S(t) = S_1(t) - S_0(t)}，t 时点的生存概率差；
#'   \item \code{"rmst"}：\eqn{\Delta \mathrm{RMST}(\tau)}，限制到 \eqn{\tau} 的
#'     平均生存时间之差。每个 \eqn{\tau} 各自重拟合（伪结局
#'     \eqn{\xi = \delta\min(T,\tau)/\hat G(T)} 本身随 \eqn{\tau} 变化）。
#' }
#'
#' @section 计算代价:
#' G 个时点就是 G 次完整拟合，倾向得分模型也会重复训练 G 次。
#' 默认 \code{n_times = 20}；若基学习器换成 \code{"ranger"}，20 个点会明显变慢，
#' 建议先减小 \code{n_times} 试跑。
#'
#' @param type metalearner 类型：S / T / X / R / DR。
#' @param X 协变量 data.frame（不含处理与结局）。
#' @param A 处理指示（0/1 或逻辑）。
#' @param Y 生存结局，\code{survival::Surv} 对象。其他结局类型会报错——
#'   连续 / 二分类的效应不随时间变化，没有曲线可画。
#' @param times 时点向量。\code{NULL}（默认）时取**事件时间**的 10%–90% 分位数
#'   共 \code{n_times} 个——避开两端是因为尾部事件数少、估计不稳定。
#' @param n_times \code{times = NULL} 时的时点个数，默认 20。
#' @param effect 效应尺度，\code{"survdiff"}（默认）或 \code{"rmst"}。
#' @param learner_base 生存结局的原生基学习器，\code{"coxph"}（默认，快且可解释）
#'   或 \code{"ranger"}（非线性）。注意生存结局**不能**用 \code{lrn("regr.*")}。
#' @param newX 求逐点 CATE 的协变量；默认用训练集 \code{X}。
#'   曲线的 \code{ate} 始终是训练集人群上的 ATE，与 \code{newX} 无关。
#' @param ... 其他传给 \code{\link{metalearner}} 的参数（\code{learner_tau}、
#'   \code{learner_ps}、\code{cross_fitting}、\code{engine} 等）。
#'
#' @return 一个 data.frame，两列：\code{time} 与 \code{ate}；并带属性：
#'   \itemize{
#'     \item \code{cate}：\code{nrow(newX) × length(times)} 矩阵，第 j 列是
#'       第 j 个时点上各样本的 CATE；
#'     \item \code{type} / \code{effect} / \code{learner_base}：本次拟合的配置；
#'     \item \code{n_fits}：实际重拟合次数（= 时点个数）。
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
    stop("surv_effect_curve() 只对生存结局有意义；Y 必须是 survival::Surv 对象。",
         call. = FALSE)
  }
  if (length(A) != n) {
    stop(sprintf("A 的长度（%d）与 X 的行数（%d）不一致。", length(A), n),
         call. = FALSE)
  }
  if (nrow(Y) != n) {
    stop(sprintf("Y 的行数（%d）与 X 的行数（%d）不一致。", nrow(Y), n),
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
    stop("至少需要 2 个时点才能构成曲线。", call. = FALSE)
  }

  # 超出随访范围的时点不会报错，但 S(t) 只能靠模型外推，提醒一句。
  max_obs <- max(as.numeric(Y[, 1L]))
  if (max(times) > max_obs) {
    warning(sprintf(
      "有 %d 个时点超过最长随访时间 %.3g，这些点上的效应是模型外推值，请谨慎解释。",
      sum(times > max_obs), max_obs), call. = FALSE)
  }

  # 3 交叉拟合参数：避免同一个 warning 在循环里刷 G 遍 --------------------------
  # engine 里对非 R/DR 学习器会 warning 说交叉拟合未实现；逐点重拟合会把这条
  # 警告放大 G 倍，所以这里提前拦一次、改成单次警告后关掉。
  dots <- list(...)
  if (isTRUE(dots$cross_fitting) && !type %in% c("R", "DR")) {
    warning("交叉拟合目前只对 R / DR 学习器实现；为避免逐点重复警告，已在本函数中关闭。",
            call. = FALSE)
    dots$cross_fitting <- FALSE
  }

  # 4 逐点重拟合 ---------------------------------------------------------------
  G <- length(times)
  ate <- numeric(G)
  cate <- matrix(NA_real_, nrow = nrow(newX), ncol = G)

  cli::cli_progress_bar("逐点重拟合 metalearner", total = G, type = "iterator")
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
#' 画生存结局的效应—时间曲线
#'
#' @description
#' 把 \code{\link{surv_effect_curve}} 的结果画成 ggplot：横轴时间、纵轴效应，
#' 并叠加一条 0 参考线（效应为零 = 处理与对照无差别）。默认再叠一层
#' **个体 CATE 的四分位带**（25%–75%），直观显示异质性的时间变化：
#' 带子越宽说明该时点上不同个体的效应分歧越大。
#'
#' @param curve \code{\link{surv_effect_curve}} 的返回值。
#' @param ribbon 是否叠加个体 CATE 的 25%–75% 四分位带，默认 \code{TRUE}。
#' @param main 图标题；\code{NULL} 时由 \code{type} 与 \code{effect} 自动生成。
#' @param color 曲线颜色。
#' @param ... 不再使用，保留以兼容旧调用。
#'
#' @return 一个 \code{ggplot} 对象，可用 \code{+} 继续定制或 \code{ggsave()} 导出。
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
    stop("curve 必须是 surv_effect_curve() 的返回值。", call. = FALSE)
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
