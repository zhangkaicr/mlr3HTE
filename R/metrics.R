# =====================================================================
# metrics.R —— 异质性治疗效应（HTE）模型的判别性评价
#
# 现有实现覆盖两类最常用指标：
#   1. Qini 曲线 / Qini 系数   —— 基于"按效应排序后靶向治疗"的增益曲线
#   2. c-for-benefit          —— 模型预测"治疗获益"的 C 统计量
#
# 仅支持数值型结局（连续，或 0/1 二分类）。生存结局需要删失 IPCW，
# 留作后续版本；当前若传入非数值 Y 会自动报错。
#
# 参考实现对照：
#   - Qini：Sverdrup, Wu, Athey & Wager (2025) 的 IPW 估计式
#   - c-for-benefit：van Klaveren, Steyerberg, Serruys & Kent (2018)
# =====================================================================

# ---------------------------------------------------------------------
# 内部：把 Y 规整为数值向量（连续或 0/1），并给出友好错误
# ---------------------------------------------------------------------
.hte_numeric_outcome <- function(Y) {
  if (inherits(Y, "Surv")) {
    stop("Survival outcomes are not supported by the HTE metrics yet ",
         "(they require censoring IPCW). Pass a numeric continuous or 0/1 outcome.",
         call. = FALSE)
  }
  if (is.factor(Y)) {
    if (nlevels(Y) != 2L) {
      stop("Factor outcome must have exactly two levels (binary).", call. = FALSE)
    }
    return(as.numeric(Y) - 1)          # 第一水平=0，第二水平=1
  }
  Y <- as.numeric(Y)
  if (anyNA(Y)) stop("Y contains NA; please handle missing outcomes first.", call. = FALSE)
  Y
}

# ---------------------------------------------------------------------
# 内部：IPW / AIPW 评分（Sverdrup et al. 2025 的 Q 曲线估计核）
#   s_i = A_i Y_i / e_i - (1 - A_i) Y_i / (1 - e_i)
# ---------------------------------------------------------------------
.hte_ipw_score <- function(A, Y, propensity) {
  e <- pmin(pmax(as.numeric(propensity), 1e-6), 1 - 1e-6)
  A * Y / e - (1 - A) * Y / (1 - e)
}

#' Qini 曲线：按估计 CATE 排序的累积治疗增益
#'
#' 将样本按估计的 CATE 从高到低排序，在"靶向前 k 个个体"的预算约束下，
#' 用逆概率加权（IPW）估计累积治疗增益，得到 Qini 曲线（亦称 uplift 曲线）。
#' 曲线越早抬升、越靠上，说明模型越能把真正获益的人排到前面。
#'
#' 估计式（Sverdrup et al. 2025）：
#' \deqn{Q(f_k) = \frac{1}{n}\sum_{i \in \text{top-}k}
#'   \left(\frac{A_i Y_i}{e_i} - \frac{(1-A_i) Y_i}{1-e_i}\right)}
#' 其中 \eqn{f_k = k/n} 为靶向比例，\eqn{e_i} 为倾向得分。
#'
#' @param cate 逐个体估计的 CATE（数值向量），即模型的排序分数。
#' @param A 处理指示（0/1 或逻辑）。
#' @param Y 数值结局：连续，或 0/1 二分类。生存结局暂不支持。
#' @param propensity 倾向得分 \eqn{e(X)}；\code{NULL}（默认）时用 \code{mean(A)}，
#'   适用于随机化试验。观察性数据请传入估计好的倾向得分。
#' @param n_bins 曲线取多少个点（等量分箱的箱末点）；\code{NULL} 表示用全部样本点。
#' @return 一个 data.frame，含 \code{fraction}（靶向比例，从 0 到 1）与
#'   \code{qini}（对应累积增益），并附属性 \code{qini_at_full}。
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
qini_curve <- function(cate, A, Y, propensity = NULL, n_bins = NULL) {
  Y <- .hte_numeric_outcome(Y)
  cate <- as.numeric(cate)
  A <- as.numeric(A)
  n <- length(cate)
  if (length(A) != n || length(Y) != n) {
    stop("cate, A and Y must have the same length.", call. = FALSE)
  }
  if (n < 2L) stop("Need at least two observations.", call. = FALSE)
  if (is.null(propensity)) propensity <- rep(mean(A), n)

  score <- .hte_ipw_score(A, Y, propensity)
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

#' Qini 系数：Qini 曲线与随机靶向线之间的面积
#'
#' 在 \code{\link{qini_curve}} 的基础上，计算曲线下面积（梯形法）与
#' "随机靶向线"（从 (0,0) 连到 (1, Q(1))）之间夹的面积。面积越大，
#' 说明模型排序相对随机分配带来的额外增益越多。
#'
#' 同时给出归一化版本：面积除以随机线下的面积 \eqn{0.5\,Q(1)}。
#' 随机模型的 Qini 系数约为 0；完美排序为正。
#'
#' @inheritParams qini_curve
#' @return 一个 list，含 \code{qini_coefficient}（绝对面积）、
#'   \code{qini_normalized}（归一化到随机线面积）、\code{auc}（曲线下面积）
#'   与 \code{qini_at_full}（\eqn{Q(1)}）。
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
qini_coefficient <- function(cate, A, Y, propensity = NULL) {
  df <- qini_curve(cate, A, Y, propensity = propensity, n_bins = NULL)
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

#' c-for-benefit：预测治疗获益的 C 统计量
#'
#' 按 van Klaveren 等（2018）的思路，把处理组与对照组个体**按预测获益配对**
#' （贪心 1:1 最近邻，基于估计 CATE），每对给出"观测获益"
#' （处理者结局减对照者结局）与"预测获益"（该对的估计 CATE）。
#' 随后在所有配对之间比较：若观测获益更大的那一对，其预测获益也更大，
#' 记为一致（concordant）。c-for-benefit 即一致对占全部信息对的比例
#' （预测获益相同按 0.5 计）。
#'
#' 解释：c = 0.5 相当于随机排序；越接近 1，模型越能区分"谁获益更多"。
#' 注意：这是对 van Klaveren 配对思想的**近似实现**（贪心配对 + 配对间秩相关），
#' 不是原文的完整匹配流程；需要严格复现时请对照 \code{CforBenefit} 包。
#'
#' @inheritParams qini_curve
#' @param caliper 配对时允许的最大预测获益差；\code{NULL}（默认）不设卡钳，
#'   总是取最近邻。设卡钳可避免把获益相差很大的两人硬配。
#' @return 一个 list，含 \code{c_for_benefit}（C 统计量）、\code{n_pairs}
#'   （配对数）以及一致/不一致/预测并列的对数。
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
c_for_benefit <- function(cate, A, Y, caliper = NULL) {
  Y <- .hte_numeric_outcome(Y)
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
    obs  <- c(obs, Y[t] - Y[ct[j]])     # 观测获益（配对差）
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

#' 绘制 Qini 曲线
#'
#' 用 base graphics 画 \code{\link{qini_curve}} 的返回对象，并叠加
#' 随机靶向参考线（虚线）。
#'
#' @param curve \code{\link{qini_curve}} 返回的 data.frame。
#' @param main 图标题。
#' @param ... 传给 \code{plot()} 的其他参数。
#' @return 不可见地返回 \code{curve}。
#' @references
#' Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment
#' Rules. \emph{Journal of Computational and Graphical Statistics}, 2025.
#' @seealso \code{\link{qini_curve}}
#' @export
plot_qini <- function(curve, main = "Qini curve", ...) {
  f <- curve$fraction
  q <- curve$qini
  plot(f, q, type = "l", lwd = 2, col = "#1B6CA8",
       xlab = "Fraction targeted", ylab = "Cumulative gain (Qini)",
       main = main, ...)
  abline(0, q[length(q)], lty = 2, col = "grey50")
  invisible(curve)
}

#' TOC 曲线：按效应排序后各分位的平均治疗效应
#'
#' 把样本按估计 CATE 从高到低排序，看"靶向前 k 个个体"这一子群里的
#' 平均治疗效应（用同一 IPW 评分估计）如何随靶向比例变化，并与全样本
#' 的总体 ATE（水平参考线）比较。信息性模型在前段应明显高于总体 ATE，
#' 说明获益更多的人被排到了前面；平坦贴近总体线则说明无异质性可利用。
#'
#' @inheritParams qini_curve
#' @return data.frame，含 \code{fraction} 与 \code{toc}，并附属性
#'   \code{overall_ate}（全样本 IPW 估计的 ATE，作为水平参考）。
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
toc_curve <- function(cate, A, Y, propensity = NULL, n_bins = NULL) {
  Y <- .hte_numeric_outcome(Y)
  cate <- as.numeric(cate)
  A <- as.numeric(A)
  n <- length(cate)
  if (length(A) != n || length(Y) != n) {
    stop("cate, A and Y must have the same length.", call. = FALSE)
  }
  if (n < 2L) stop("Need at least two observations.", call. = FALSE)
  if (is.null(propensity)) propensity <- rep(mean(A), n)

  score   <- .hte_ipw_score(A, Y, propensity)
  ord     <- order(cate, decreasing = TRUE)
  s       <- score[ord]
  cum     <- cumsum(s)
  k       <- seq_len(n)
  toc     <- cum / k                     # top-k 子群的平均（IPW）效应
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
