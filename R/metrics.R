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

#' 双重稳健伪结局：观察性数据做 HTE 评价的入口
#'
#' 计算 \eqn{Y^*}（AIPW / 双重稳健伪结局）：
#' \deqn{Y^*_i = (\hat\mu_1(X_i) - \hat\mu_0(X_i)) +
#'   \frac{A_i(Y_i - \hat\mu_1(X_i))}{e_i} -
#'   \frac{(1-A_i)(Y_i - \hat\mu_0(X_i))}{1-e_i}}
#' 满足 \eqn{E[Y^*_i \mid X_i] = \tau(X_i)}，且\strong{结局模型与倾向得分模型
#' 只要有一个正确即无偏}。\eqn{Y^*} 的均值就是 ATE 的 DR 估计。
#'
#' 它同时把三个"干扰参数"（倾向得分 \eqn{e}、\eqn{\hat\mu_1}、\eqn{\hat\mu_0}）
#' 一并返回，正好是 \code{\link{c_for_benefit}} 在观察性数据下需要的输入；
#' 其中的 \code{propensity} 也可以直接喂给 \code{\link{qini_curve}} /
#' \code{\link{qini_coefficient}} / \code{\link{toc_curve}}。
#'
#' @section 为什么要交叉拟合：
#' 默认 \code{cross_fitting = TRUE}：倾向得分与结局模型都在 K 折的\strong{训练折}
#' 上拟合、在留出折上预测。若用全样本拟合再回代自己（in-fold），\eqn{Y^*} 里的
#' \eqn{\hat\mu_1-\hat\mu_0} 与被评价的 CATE 出自同一个模型，配对时又按该 CATE
#' 找最近邻，会把"观测获益"人为对齐到"预测获益"，导致 c-for-benefit 虚高——
#' 本包演示数据上实测 in-fold 会出现"模型 CATE 0.754 > 真 tau 0.717"的倒挂，
#' 交叉拟合后恢复为"模型 0.659 ≤ 真 tau 0.669"。
#'
#' @param X 协变量 data.frame。
#' @param A 处理指示（0/1 或逻辑）。
#' @param Y 数值结局（连续，或 0/1 二分类）。
#' @param cross_fitting 是否对干扰参数做交叉拟合，默认 \code{TRUE}。
#' @param n_folds 交叉拟合折数，默认 5。
#' @param learner_ps 倾向得分学习器（classif），默认 \code{classif.log_reg}。
#' @param learner_base 结局模型基学习器，默认按结局类型自动选
#'   \code{regr.ranger}（连续）或 \code{classif.log_reg}（二分类）。
#' @param seed 折分配的随机种子；\code{NULL} 则不设（复现请显式给）。
#' @return list：\code{pseudo}（DR 伪结局向量）、\code{mu1}、\code{mu0}、
#'   \code{propensity}、\code{ate}（\code{mean(pseudo)}）。
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
                              learner_ps = NULL, learner_base = NULL,
                              seed = NULL) {
  Y <- .hte_numeric_outcome(Y)
  A <- as.numeric(A)
  X <- as.data.frame(X)
  n <- nrow(X)
  if (length(A) != n) {
    stop("X and A must have the same number of rows.", call. = FALSE)
  }
  if (n < 4L) stop("Need at least four observations.", call. = FALSE)

  if (is.null(learner_ps)) learner_ps <- mlr3::lrn("classif.log_reg")
  binary <- all(Y %in% c(0, 1))
  if (is.null(learner_base)) {
    learner_base <- if (binary) {
      mlr3::lrn("classif.log_reg")
    } else {
      mlr3::lrn("regr.ranger", num.trees = 300L)
    }
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
    e[te] <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps)(X[te, , drop = FALSE])

    tr1 <- tr[A[tr] == 1]
    tr0 <- tr[A[tr] == 0]
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

  ee <- pmin(pmax(e, 1e-6), 1 - 1e-6)
  pseudo <- (mu1 - mu0) + A * (Y - mu1) / ee - (1 - A) * (Y - mu0) / (1 - ee)
  list(pseudo = pseudo, mu1 = mu1, mu0 = mu0, propensity = e,
       ate = mean(pseudo))
}

# 内部：按结局类型分派结局模型的拟合 / 预测（伪结局的干扰参数用）-----------------
.fit_regr_or_classif <- function(X, y, learner_base, binary) {
  if (binary) .fit_classif(X, y, learner_base) else .fit_regr(X, y, learner_base)
}
.pred_regr_or_classif <- function(model, newX, binary) {
  if (binary) .pred_classif(model, newX) else .pred_regr(model, newX)
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
#' @section 观察性数据：必须走双重稳健，不能只给倾向得分：
#' 默认的"观测获益 = 处理者结局 − 对照者结局"只在处理随机化时无偏。观察性数据里
#' 两者基线预后不同，这个差被混杂污染。
#' 正确做法是把观测获益换成\strong{双重稳健（DR）伪结局}：
#' \deqn{Y^*_i = (\hat\mu_1(X_i) - \hat\mu_0(X_i)) +
#'   \frac{A_i(Y_i - \hat\mu_1(X_i))}{e_i} -
#'   \frac{(1-A_i)(Y_i - \hat\mu_0(X_i))}{1-e_i}}
#' 满足 \eqn{E[Y^*_i \mid X_i] = \tau(X_i)}，且\strong{结局模型与倾向得分模型
#' 只要有一个正确即无偏}。配对内取两人的 \eqn{Y^*} 平均作为观测获益。
#'
#' 为什么不能只传 \code{propensity}：那样等价于用 Horvitz–Thompson 评分
#' \eqn{AY/e - (1-A)Y/(1-e)} 当观测获益，其单次样本标准差极大（本包演示数据上
#' 实测约 15，而 ATE 只有 1 左右），噪声会把 C 统计量压到随机线以下——实测即使用
#' 真 \code{tau} 排序也只有 0.39，比随机还差。所以只给 \code{propensity} 会直接报错，
#' 逼你把结局模型一起给进来。
#'
#' 三个干扰参数可以用 \code{\link{dr_pseudo_outcome}} 一次拿到，它默认做交叉拟合，
#' 避免"结局模型评价自己的 CATE"带来的虚高。
#'
#' @inheritParams qini_curve
#' @param caliper 配对时允许的最大预测获益差；\code{NULL}（默认）不设卡钳，
#'   总是取最近邻。设卡钳可避免把获益相差很大的两人硬配。
#' @param mu1 处理组的结局模型预测值 \eqn{\hat\mu_1(X)}（数值向量，长度同 \code{cate}）。
#'   观察性数据下与 \code{propensity}、\code{mu0} 一起传入以启用 DR 校正；
#'   \code{NULL}（默认）时用原始结局差，仅在随机化试验下无偏。
#' @param mu0 对照组的结局模型预测值 \eqn{\hat\mu_0(X)}。用法同 \code{mu1}。
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
#'
#' # 观察性数据：用交叉拟合的 DR 伪结局当观测获益
#' set.seed(1)
#' d <- mlr3HTE_demo_obs(n = 800)
#' dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
#' c_for_benefit(dr$mu1 - dr$mu0, d$A, d$Y,
#'               propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)
c_for_benefit <- function(cate, A, Y, caliper = NULL,
                          propensity = NULL, mu1 = NULL, mu0 = NULL) {
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
    Ystar <- (m1 - m0) + A * (Y - m1) / e - (1 - A) * (Y - m0) / (1 - e)
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
      Y[t] - Y[ct[j]]                   # 观测获益：原始结局差（仅随机化下无偏）
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
