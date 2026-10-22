#' 在随机化试验（RCT）数据上对多个 meta-learner 做基准测试
#'
#' \strong{这套基准测试不依赖真实 CATE，因此在现实 RCT 数据上同样可用}——
#' 它只问一个问题：模型把"谁更获益"排到前面的能力如何。这与
#' \code{\link{metalearner}} 在自带真值的模拟数据上做的对账（相关 / RMSE）是
#' 两件事：真实 \eqn{\tau} 只有模拟数据才有，现实研究永远拿不到。
#'
#' 三个指标全部建立在\strong{随机化}带来的可交换性上，不需要倾向得分：
#' \describe{
#'   \item{Qini 系数}{\code{\link{qini_coefficient}}：曲线与"随机靶向线"之间
#'     夹的面积。越大说明按模型排序比随机分配带来的额外增益越多。}
#'   \item{TOC 增益}{TOC 曲线（\code{\link{toc_curve}}）与全样本 ATE 水平线
#'     之间夹的面积，量纲 = 结局单位。正值表示"优先处理模型排前面的人"
#'     平均而言优于随机靶向。}
#'   \item{c-for-benefit}{\code{\link{c_for_benefit}}：把处理组按预测获益
#'     与对照组做增益匹配后的 C 统计量，0.5 = 随机排序。}
#' }
#'
#' @section 为什么必须交叉拟合:
#' 每个 meta-learner 都在 K 折的\strong{训练折}上拟合、在\strong{留出折}上预测，
#' 最终用全部留出预测（out-of-fold）拼成一条 CATE。若用全样本拟合后回代自己
#' （in-fold），模型会把训练噪声也排进序里，Qini 会明显虚高。本包演示数据上
#' 实测 in-fold 的 c-for-benefit 会呈现"模型 CATE 0.754 > 真 tau 0.717"的倒挂，
#' 交叉拟合后恢复为"0.662 ≤ 0.669"。
#'
#' @section 什么时候能报什么:
#' \itemize{
#'   \item \strong{模拟数据}（自带 \eqn{\tau}）：可以额外报 CATE 相关 / RMSE
#'     —— 传 \code{tau} 即可，输出里会多两列。
#'   \item \strong{现实 RCT 数据}：没有 \eqn{\tau}，只能报 Qini / TOC / c-for-benefit。
#'     这三列正是为这种情况设计的。
#' }
#'
#' @param X 协变量 data.frame。
#' @param A 处理指示（0/1 或逻辑）。
#' @param Y 结局：连续数值、0/1 二分类，或 \code{survival::Surv(time, status)}。
#' @param t0 生存结局的效应时点；连续 / 二分类忽略。默认取事件时间中位数。
#' @param learners 要比较的 meta-learner，默认五族全上。
#' @param learner_base 基学习器；默认按结局类型自动选（连续/二分类用
#'   \code{regr.ranger}，生存用 \code{"coxph"}）。所有 learner 共用同一个，
#'   这样比出来的差异才归因于 meta-learner 而不是基学习器。
#' @param metrics 要算的指标，默认三个全算。
#' @param n_folds 交叉拟合折数，默认 5。
#' @param tau \strong{可选}的真实 CATE，只有模拟数据才有。给了就额外输出
#'   \code{tau_cor} 与 \code{tau_rmse} 两列。
#' @param propensity,mu1,mu0 \strong{可选}的观察性数据三件套（见
#'   \code{\link{dr_pseudo_outcome}}）。RCT 下全部留空。
#' @param effect 生存效应的标尺，\code{"survdiff"}（默认，S(t0) 差）或 \code{"rmst"}。
#' @param seed 随机种子，用于折的划分；固定后才能复现。
#'
#' @return 一个 list：
#'   \describe{
#'     \item{table}{一行一个 learner 的 tidy 汇总表（tibble）。}
#'     \item{cate}{长表：\code{.row} / \code{learner} / \code{cate}，即交叉拟合的
#'       留出预测，可用来自己画图或做进一步分析。}
#'     \item{curves}{命名 list：\code{qini} 与 \code{toc} 各含每个 learner 的曲线
#'       data.frame，可直接喂给 ggplot2。}
#'     \item{truth}{传了 \code{tau} 才有：\code{.row} / \code{tau} 长表。}
#'     \item{setup}{折数、种子、效应标尺、t0、样本量等运行参数。}
#'   }
#'
#' @seealso \code{\link{qini_coefficient}} \code{\link{toc_curve}}
#'   \code{\link{c_for_benefit}} \code{\link{dr_pseudo_outcome}}
#' @export
#' @examples
#' \donttest{
#' # 模拟数据：既能报 Qini 三件套，也能报相关 / RMSE（因为有真值）
#' d <- mlr3HTE_demo_data(n = 1500, seed = 1)
#' bm <- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 1)
#' bm$table
#'
#' # 现实 RCT 数据：没有 tau，只看 Qini / TOC / c-for-benefit 三列
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
  if (n_folds < 2L) stop("n_folds 至少为 2。", call. = FALSE)

  X <- as.data.frame(X)
  A <- as.integer(A)
  n <- nrow(X)
  if (length(A) != n) stop("A 的长度必须与 X 的行数一致。", call. = FALSE)
  if (n < 4L) stop("样本量太小，做不了交叉拟合。", call. = FALSE)

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
    stop("tau 的长度必须与 X 的行数一致。", call. = FALSE)
  }

  # 折的划分：按处理组分层，保证每折里两个臂都有样本。
  # 不分层的话某一折可能全是同一个臂，该折的效应估计直接失效。
  if (!is.null(seed)) set.seed(seed)
  fold_id <- integer(n)
  for (a in sort(unique(A))) {
    ii <- which(A == a)
    if (length(ii) < n_folds) {
      stop(sprintf("处理组 A = %d 只有 %d 个观测，凑不齐 %d 折。",
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
      stop(sprintf("%s-learner 有 %d 个观测没拿到留出预测，请检查数据。",
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

#' 取出 hte_benchmark() 的曲线绘图数据
#'
#' @description
#' \code{\link{plot_hte_benchmark}} 画图所用的长表数据，单独提供出来便于
#' 导出 CSV 或自行用 ggplot2 重画。
#'
#' @param x \code{\link{hte_benchmark}} 的返回对象。
#' @param metric \code{"qini"} 或 \code{"toc"}。
#' @param min_fraction 从哪个靶向比例开始保留，含义同 \code{\link{plot_hte_benchmark}}。
#' @return data.frame：\code{learner} / \code{fraction} / 指标列
#'   （\code{qini} 或 \code{toc}），另附属性 \code{reference}（各 learner 的参考线
#'   截距与斜率）。
#' @seealso \code{\link{plot_hte_benchmark}}
#' @export
hte_benchmark_data <- function(x, metric = c("qini", "toc"), min_fraction = 0.05) {
  metric <- match.arg(metric)
  curves <- x$curves[[metric]]
  if (is.null(curves)) {
    stop(sprintf("hte_benchmark 没有算 %s（metrics 参数里没选它）。", metric),
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

#' 画 hte_benchmark() 的曲线对比
#'
#' 把 \code{\link{hte_benchmark}} 存下来的 Qini / TOC 曲线按 learner 分面画出来。
#' Qini 面板里的灰色虚线是"随机靶向"基线；TOC 面板里的灰色虚线是全样本 ATE。
#'
#' 返回的是 \code{ggplot} 对象，可继续用 \code{+} 叠加图层或主题；
#' 绘图所用的数据由 \code{\link{hte_benchmark_data}} 单独提供。
#'
#' @param x \code{\link{hte_benchmark}} 的返回对象。
#' @param metric \code{"qini"} 或 \code{"toc"}。
#' @param title 主标题，默认按指标自动生成。
#' @param min_fraction 从哪个靶向比例开始画。TOC / Qini 在最左端只对应一两个
#'   观测，值是单个个体的效应，能把纵轴拉到几十倍 ATE，剩下的曲线全被压扁。
#'   默认 \code{0.05}（前 5% 不画）；设 \code{0} 看全貌。
#' @return \code{ggplot} 对象。
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
