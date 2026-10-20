# =====================================================================
# api.R —— 函数式 API（与课程模块三教学代码风格一致）
#
# metalearner() 返回完整拟合对象（含 $predict / $ate / $cate_train）；
# s_learner()/t_learner()/... 直接返回训练集 CATE 向量，方便对照课程脚本；
# ml_task() 把原始 X/A/Y 编码成 mlr3 Task，供 R6 Learner 使用。
#
# 三类结局（用 learner_base 的类型自动判定，也可用 outcome 显式指定）：
#   连续   Y 为数值，配 regr.* 学习器，CATE = E[Y|A=1] - E[Y|A=0]
#   二分类 Y 为 0/1 或两水平因子，配 classif.* 学习器，CATE = 风险差
#   生存   Y 为 survival::Surv 对象。两套引擎（engine 参数）：
#            "native"（默认）原生 "coxph"/"ranger" 基学习器（不依赖 mlr3proba），
#              CATE = t0 时点生存概率差 S1(t0) - S0(t0)，五族 + RMST 齐全
#            "survlearners" 委托 survlearners 包（Suggests，GitHub-only），
#              S/T/X/R 四族 + S(t0) 差，自带 IPCW 与 R 族交叉拟合
# =====================================================================

#' 拟合一个 metalearner，返回可预测的对象
#'
#' @param type metalearner 类型：S / T / X / R / DR
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，类型须与结局匹配：连续用 regr.*，
#'   二分类用 classif.*，生存用 "coxph"/"ranger"（原生实现，不依赖 mlr3proba）；
#'   默认 regr.ranger
#' @param learner_tau 效应阶段回归学习器；默认沿用回归型 learner_base，否则 regr.ranger
#' @param learner_ps 倾向得分学习器（IPTW 时用，默认 classif.log_reg）
#' @param weighting "none"（RCT）/ "iptw" / "external"
#' @param weights 当 weighting = "external" 时的权重向量
#' @param stabilize IPTW 是否使用稳定化权重
#' @param t0 生存结局的效应评估时点，默认取事件时间中位数
#' @param outcome 结局类型 "auto"/"continuous"/"binary"/"survival"
#' @param effect 生存结局的效应度量："survdiff"（t0 时点生存概率差，默认）
#'   或 "rmst"（t0 时点限制平均生存时间差 RMST）
#' @param cross_fitting R/DR 是否做交叉拟合（干扰参数在 K 折训练折上拟合，
#'   伪结果在留出折上计算），默认 FALSE
#' @param n_folds 交叉拟合的折数，默认 5
#' @param engine 生存结局的估计引擎：\code{"native"}（默认，原生 coxph/ranger
#'   实现，五族齐全、支持 RMST 与任意 mlr3 基学习器）或 \code{"survlearners"}
#'   （委托 GitHub 包 survlearners，只有 S/T/X/R 与 S(t0) 差尺度，DR 与 RMST
#'   会明确报错；未安装该包时也会给出安装提示）
#' @return 含 $predict(newX)、$ate、$cate_train 的拟合对象
#' @seealso \code{\link{s_learner}}, \code{\link{ml_task}}
#' @export
#' @examples
#' d <- mlr3HTE_demo_data(n = 500, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"))
#' cor(fit$cate_train, d$tau)
metalearner <- function(type, X, A, Y,
                        learner_base = mlr3::lrn("regr.ranger"),
                        learner_tau = NULL,
                        learner_ps = NULL,
                        weighting = "none", weights = NULL,
                        stabilize = FALSE, t0 = NULL, outcome = "auto",
                        effect = "survdiff",
                        cross_fitting = FALSE, n_folds = 5L,
                        engine = "native") {
  ml_fit(type = type, X = X, A = A, Y = Y,
         learner_base = learner_base, learner_tau = learner_tau,
         learner_ps = learner_ps, weighting = weighting, weights = weights,
         stabilize = stabilize, t0 = t0, outcome = outcome, effect = effect,
         cross_fitting = cross_fitting, n_folds = n_folds, engine = engine)
}

#' CATE / ATE 的自助法置信区间
#'
#' 对整条拟合流程做 B 次自助重抽样（有放回抽同样本量的行），
#' 用百分位数法给出逐点 CATE 区间与 ATE 区间。
#'
#' 注意：这是**非参数自助法**，只反映抽样变异，不覆盖模型设定偏倚；
#' 且每次要重新拟合，B 较大时开销不小（建议先用小 B 试）。
#'
#' @param type metalearner 类型，或 "auto" 沿用 fit 的类型
#' @param X 协变量 data.frame
#' @param A 处理指示
#' @param Y 结局
#' @param B 自助次数，默认 100
#' @param level 置信水平，默认 0.95
#' @param seed 随机种子，便于复现
#' @param newX 需要 CATE 区间的新数据；默认用训练集 X
#' @param ... 其他传给 metalearner() 的参数（learner_base、t0、effect 等）
#' @return list：cate_lo / cate_hi（逐点 CATE 区间）、ate_lo / ate_hi、
#'   cate_mean、ate、B、level
#' @seealso \code{\link{metalearner}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_demo_data(n = 800, seed = 1)
#' ci <- cate_ci("T", d$X, d$A, d$Y, B = 50, seed = 1)
#' mean(ci$cate_mean); c(ci$ate_lo, ci$ate_hi)
#' }
cate_ci <- function(type, X, A, Y, B = 100L, level = 0.95, seed = NULL,
                    newX = NULL, ...) {
  X <- as.data.frame(X)
  n <- nrow(X)
  if (!is.null(seed)) set.seed(seed)
  if (is.null(newX)) newX <- X

  boot <- vector("list", B)
  ates <- numeric(B)
  for (b in seq_len(B)) {
    idx <- sample.int(n, size = n, replace = TRUE)
    fit <- ml_fit(type = type, X = X[idx, , drop = FALSE], A = A[idx],
                  Y = .subset_Y(Y, idx), ...)
    boot[[b]] <- as.numeric(fit$predict(newX))
    ates[b] <- fit$ate
  }
  M <- do.call(cbind, boot)                     # length(newX) x B
  a <- (1 - level) / 2
  probs <- c(a, 1 - a)
  q_cate <- t(apply(M, 1L, quantile, probs = probs, na.rm = TRUE))
  list(
    cate_lo   = as.numeric(q_cate[, 1L]),
    cate_hi   = as.numeric(q_cate[, 2L]),
    cate_mean = rowMeans(M, na.rm = TRUE),
    ate       = mean(ates),
    ate_lo    = unname(quantile(ates, probs = a, na.rm = TRUE)),
    ate_hi    = unname(quantile(ates, probs = 1 - a, na.rm = TRUE)),
    B = B, level = level
  )
}

# 各 learner 的便捷封装：直接返回训练集 CATE 向量（与课程脚本同款签名）
# 完整控制（含 $predict、$ate、$cate_train）请用 metalearner()。
#' S-Learner（便捷封装，直接返回训练集 CATE）
#'
#' @description 拟合 S-Learner 并直接返回训练集上的 CATE 向量，方便与课程脚本对照。
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，默认 \code{regr.ranger}
#' @param ... 其他传给 \code{\link{metalearner}} 的参数（\code{weighting}、\code{t0}、
#'   \code{effect}、\code{cross_fitting} 等）
#' @return 训练集上逐样本的 CATE 数值向量
#' @seealso \code{\link{metalearner}}
#' @export
s_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("S", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' T-Learner（便捷封装，直接返回训练集 CATE）
#'
#' @description 拟合 T-Learner 并直接返回训练集上的 CATE 向量。
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，默认 \code{regr.ranger}
#' @param ... 其他传给 \code{\link{metalearner}} 的参数
#' @return 训练集上逐样本的 CATE 数值向量
#' @seealso \code{\link{metalearner}}
#' @export
t_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("T", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' X-Learner（便捷封装，直接返回训练集 CATE）
#'
#' @description 拟合 X-Learner 并直接返回训练集上的 CATE 向量。
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，默认 \code{regr.ranger}
#' @param ... 其他传给 \code{\link{metalearner}} 的参数
#' @return 训练集上逐样本的 CATE 数值向量
#' @seealso \code{\link{metalearner}}
#' @export
x_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("X", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' R-Learner（便捷封装，直接返回训练集 CATE）
#'
#' @description 拟合 R-Learner 并直接返回训练集上的 CATE 向量。
#'   可用 \code{cross_fitting = TRUE} 启用交叉拟合。
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，默认 \code{regr.ranger}
#' @param ... 其他传给 \code{\link{metalearner}} 的参数
#' @return 训练集上逐样本的 CATE 数值向量
#' @seealso \code{\link{metalearner}}
#' @export
r_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("R", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' DR-Learner（便捷封装，直接返回训练集 CATE）
#'
#' @description 拟合 DR-Learner 并直接返回训练集上的 CATE 向量（双重稳健）。
#'   可用 \code{cross_fitting = TRUE} 启用交叉拟合。
#' @param X 协变量 data.frame（不含处理与结局）
#' @param A 处理指示（0/1，或逻辑）
#' @param Y 结局：连续（数值）/ 二分类（0-1 或两水平因子）/ 生存（Surv 对象）
#' @param learner_base 结局模型基学习器，默认 \code{regr.ranger}
#' @param ... 其他传给 \code{\link{metalearner}} 的参数
#' @return 训练集上逐样本的 CATE 数值向量
#' @seealso \code{\link{metalearner}}
#' @export
dr_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("DR", X, A, Y, learner_base = learner_base, ...)$cate_train
}

#' 把原始 X/A/Y 编码成可直接喂给 lrn("regr.metalearner") 的 mlr3 Task
#'
#' mlr3 的 Task 目标列只能是单一数值列，装不下 Surv 对象，所以约定如下编码：
#' \describe{
#'   \item{连续/二分类}{目标列 \code{.outcome} = Y（二分类取 0/1 数值）}
#'   \item{生存}{目标列 \code{.outcome} = 随访时间，另加特征列 \code{.status} = 事件指示}
#' }
#' 结局类型与（生存的）t0 记录在 \code{task$extra_args} 里。实测该字段在
#' \code{clone(deep = TRUE)$filter()} 与 \code{serialize()/unserialize()}
#' 之后都保留，因此 \code{resample()} 分折时元数据不会丢。
#'
#' @param X 协变量 data.frame
#' @param A 处理指示（0/1）
#' @param Y 结局（数值 / 0-1 / 两水平因子 / Surv 对象）
#' @param t0 生存结局的效应评估时点
#' @param id Task 的 id
#' @param treatment_col 处理列在 Task 里的列名（默认 "A"）
#' @return 一个 \code{TaskRegr}，可直接用于 \code{lrn("regr.metalearner")}
#' @seealso \code{\link{metalearner}}, \code{\link{LearnerRegrMetalearner}}
#' @export
ml_task <- function(X, A, Y, t0 = NULL, id = "ml_hte", treatment_col = "A") {
  X <- as.data.frame(X)
  A <- as.integer(A)
  if (nrow(X) != length(A)) stop("X 的行数与 A 的长度不一致。")
  if (treatment_col %in% names(X)) {
    stop(sprintf("协变量里已经有名为 '%s' 的列，请换个 treatment_col。", treatment_col))
  }

  outcome <- .resolve_outcome("auto", Y)
  d <- X
  d[[treatment_col]] <- A

  if (outcome == "survival") {
    d$.outcome <- as.numeric(Y[, 1L])
    d$.status  <- as.integer(Y[, 2L])
    extra <- list(
      ml_outcome = "survival", ml_status_col = ".status",
      ml_t0 = t0, ml_treatment_col = treatment_col
    )
  } else {
    d$.outcome <- if (is.factor(Y)) as.integer(Y == levels(Y)[2L]) else as.numeric(Y)
    extra <- list(
      ml_outcome = outcome, ml_status_col = NULL,
      ml_t0 = t0, ml_treatment_col = treatment_col
    )
  }
  task <- mlr3::as_task_regr(d, target = ".outcome", id = id)
  task$extra_args <- extra
  task
}

# 1 连续结局 RCT 演示数据（与课程模块三同款 DGP）------------------------------
# 真实 CATE: tau = 1.0 + 0.8*z1 - 0.5*z2 + 0.6*(z1>1 & z2<0)
# 真实基线均值: mu = 6 + 0.4*z1 + 0.5*z2 - 0.02*(age-60) + 0.3*sex
#' 演示数据：连续结局 RCT
#'
#' @description 生成连续结局的 RCT 演示数据（默认处理 A 与协变量 X 独立，无混杂）。
#'   真实 CATE 与 ATE 随数据一并返回，便于评估 metalearner 的拟合质量。
#' @param n 样本量，默认 4000
#' @param treat_frac 处理组比例，默认 0.5
#' @param seed 随机种子
#' @return list：X（协变量）、A（处理）、Y（结局）、tau（真实 CATE 向量）、ate（真实 ATE）
#' @export
mlr3HTE_demo_data <- function(n = 4000, treat_frac = 0.5, seed = 1201) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 1.0 + 0.8 * z1 - 0.5 * z2 + 0.6 * (z1 > 1 & z2 < 0)
  mu  <- 6 + 0.4 * z1 + 0.5 * z2 - 0.02 * (age - 60) + 0.3 * sex
  A   <- rbinom(n, 1, treat_frac)
  Y   <- mu + A * tau + rnorm(n, 0, 1)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau))
}

# 2 二分类结局 RCT 演示数据 ----------------------------------------------------
# logit P(Y=1|A=0) = -1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex
# 治疗在对数几率尺度上加 tau_logit = 0.6 + 0.5*z1 - 0.4*z2；
# 风险差尺度的真实 CATE 按基线概率逐一换算，随数据一并返回。
#' 演示数据：二分类结局 RCT
#'
#' @description 生成二分类结局的 RCT 演示数据（无混杂）。治疗在对数几率尺度上施加
#'   异质性效应，风险差尺度的真实 CATE 按基线概率逐一换算并随数据返回。
#' @param n 样本量，默认 4000
#' @param treat_frac 处理组比例，默认 0.5
#' @param seed 随机种子
#' @return list：X、A、Y、tau（风险差尺度的真实 CATE）、ate（真实 ATE）
#' @export
mlr3HTE_demo_binary <- function(n = 4000, treat_frac = 0.5, seed = 1202) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  p0 <- plogis(-1.2 + 0.5 * z1 + 0.4 * z2 + 0.1 * (age - 60) / 12 + 0.2 * sex)
  tau_logit <- 0.6 + 0.5 * z1 - 0.4 * z2
  p1 <- plogis(qlogis(p0) + tau_logit)
  tau <- p1 - p0                                   # 风险差尺度的真实 CATE
  A   <- rbinom(n, 1, treat_frac)
  Y   <- rbinom(n, 1, ifelse(A == 1L, p1, p0))
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau))
}

# 3 生存结局 RCT 演示数据 ------------------------------------------------------
# 指数基线风险，治疗把风险乘以 exp(-tau)，tau 随协变量变化；
# 效应度量 = t0 时点生存概率差。含随机关闭，删失比例约 15%。
#' 演示数据：生存结局 RCT
#'
#' @description 生成生存结局的 RCT 演示数据（指数基线风险，含约 15% 独立删失）。
#'   默认效应度量 = t0 时点生存概率差 S1(t0) - S0(t0)；另返回 RMST 版真实效应
#'   （tau_rmst / ate_rmst）。
#' @param n 样本量，默认 4000
#' @param treat_frac 处理组比例，默认 0.5
#' @param t0 效应评估时点，默认 2
#' @param seed 随机种子
#' @return list：X、A、Y（Surv 对象）、tau（生存概率差尺度的真实 CATE）、ate、
#'   t0、tau_rmst、ate_rmst
#' @export
mlr3HTE_demo_surv <- function(n = 4000, treat_frac = 0.5, t0 = 2, seed = 1203) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 0.5 + 0.4 * z1 - 0.3 * z2                  # 对数风险尺度的异质性效应
  base_rate <- exp(-1.0 + 0.3 * z1 + 0.2 * z2 + 0.1 * (age - 60) / 12 + 0.15 * sex)
  A <- rbinom(n, 1, treat_frac)
  rate <- base_rate * exp(-A * tau)                 # 治疗把风险乘以 exp(-tau)
  T <- rexp(n, rate = rate)
  C <- rexp(n, rate = 0.12)                         # 独立删失
  time <- pmin(T, C)
  status <- as.integer(T <= C)

  s1 <- exp(-base_rate * exp(-tau) * t0)            # 无删失下的真实 S(t0|A=1,X)
  s0 <- exp(-base_rate * t0)                        # 无删失下的真实 S(t0|A=0,X)
  # 指数分布下 RMST(τ) = ∫₀^τ e^{-λu} du = (1 - e^{-λτ}) / λ
  rmst <- function(lam) (1 - exp(-lam * t0)) / lam
  lam0 <- base_rate
  lam1 <- base_rate * exp(-tau)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0,
       tau_rmst = rmst(lam1) - rmst(lam0),
       ate_rmst = mean(rmst(lam1) - rmst(lam0)))
}

# 4 观察性数据（连续结局 + 混杂）-----------------------------------------------
# 处理概率依赖协变量（confounding by indication）：病情越重越容易接受处理，
# 因此未调整的差分会偏离真实 ATE，需要 IPTW / DR 等校正。
#' 演示数据：连续结局 + 观察性（混杂）
#'
#' @description 生成连续结局的**观察性**演示数据，处理概率依赖协变量（病情越重越易
#'   接受治疗 = confounding by indication）。未调整的差分会偏离真实 ATE，需用
#'   \code{weighting = "iptw"} / \code{"external"} 或 DR-Learner 校正。同时返回真实
#'   倾向得分 \code{ps_true} 供加权对比。
#' @param n 样本量，默认 4000
#' @param seed 随机种子
#' @return list：X、A、Y、tau（真实 CATE）、ate（真实 ATE）、ps_true（真实倾向得分）
#' @export
mlr3HTE_demo_obs <- function(n = 4000, seed = 1204) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 1.0 + 0.8 * z1 - 0.5 * z2 + 0.6 * (z1 > 1 & z2 < 0)
  mu  <- 6 + 0.4 * z1 + 0.5 * z2 - 0.02 * (age - 60) + 0.3 * sex
  e <- plogis(-0.5 + 0.8 * z1 + 0.4 * z2)          # 处理概率随病情上升
  A <- rbinom(n, 1, e)
  Y <- mu + A * tau + rnorm(n, 0, 1)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau), ps_true = e)
}

# 5 观察性数据（二分类结局 + 混杂）---------------------------------------------
# 与 mlr3HTE_demo_obs 同一套混杂结构（病情越重越容易接受处理），
# 结局换成二分类：治疗在对数几率尺度上加 tau_logit，
# 风险差尺度的真实 CATE 按基线概率逐一换算。
#' 演示数据：二分类结局 + 观察性（混杂）
#'
#' @description 与 \code{\link{mlr3HTE_demo_obs}} 同一套混杂结构（病情越重越易接受
#'   处理），结局换成二分类。风险差尺度的真实 CATE 随数据返回，另含 \code{ps_true}。
#' @param n 样本量，默认 4000
#' @param seed 随机种子
#' @return list：X、A、Y、tau（风险差尺度的真实 CATE）、ate（真实 ATE）、ps_true
#' @export
mlr3HTE_demo_obs_binary <- function(n = 4000, seed = 1205) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  p0 <- plogis(-1.2 + 0.5 * z1 + 0.4 * z2 + 0.1 * (age - 60) / 12 + 0.2 * sex)
  tau_logit <- 0.6 + 0.5 * z1 - 0.4 * z2
  p1 <- plogis(qlogis(p0) + tau_logit)
  tau <- p1 - p0                                   # 风险差尺度的真实 CATE
  e <- plogis(-0.5 + 0.8 * z1 + 0.4 * z2)          # 处理概率随病情上升
  A <- rbinom(n, 1, e)
  Y <- rbinom(n, 1, ifelse(A == 1L, p1, p0))
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau), ps_true = e)
}

# 6 观察性数据（生存结局 + 混杂）-----------------------------------------------
# 同一套混杂结构，结局换成生存时间；效应度量 = t0 时点生存概率差。
#' 演示数据：生存结局 + 观察性（混杂）
#'
#' @description 与 \code{\link{mlr3HTE_demo_obs}} 同一套混杂结构，结局换成生存时间。
#'   默认效应度量 = t0 时点生存概率差；另返回 RMST 版真实效应与 \code{ps_true}。
#' @param n 样本量，默认 4000
#' @param t0 效应评估时点，默认 2
#' @param seed 随机种子
#' @return list：X、A、Y（Surv 对象）、tau（生存概率差尺度的真实 CATE）、ate、t0、
#'   ps_true、tau_rmst、ate_rmst
#' @export
mlr3HTE_demo_obs_surv <- function(n = 4000, t0 = 2, seed = 1206) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 0.5 + 0.4 * z1 - 0.3 * z2                  # 对数风险尺度的异质性效应
  base_rate <- exp(-1.0 + 0.3 * z1 + 0.2 * z2 + 0.1 * (age - 60) / 12 + 0.15 * sex)
  e <- plogis(-0.5 + 0.8 * z1 + 0.4 * z2)
  A <- rbinom(n, 1, e)
  rate <- base_rate * exp(-A * tau)
  T <- rexp(n, rate = rate)
  C <- rexp(n, rate = 0.12)                         # 独立删失
  time <- pmin(T, C)
  status <- as.integer(T <= C)

  s1 <- exp(-base_rate * exp(-tau) * t0)
  s0 <- exp(-base_rate * t0)
  # 指数分布下 RMST(τ) = ∫₀^τ e^{-λu} du = (1 - e^{-λτ}) / λ
  rmst <- function(lam) (1 - exp(-lam * t0)) / lam
  lam0 <- base_rate
  lam1 <- base_rate * exp(-tau)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0, ps_true = e,
       tau_rmst = rmst(lam1) - rmst(lam0),
       ate_rmst = mean(rmst(lam1) - rmst(lam0)))
}
