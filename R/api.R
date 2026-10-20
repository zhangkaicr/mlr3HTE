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
#   生存   Y 为 survival::Surv 对象，配原生基学习器 "coxph"/"ranger"（不依赖 mlr3proba），
#         CATE = t0 时点生存概率差 S1(t0) - S0(t0)
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
#' @return 含 $predict(newX)、$ate、$cate_train 的拟合对象
metalearner <- function(type, X, A, Y,
                        learner_base = mlr3::lrn("regr.ranger"),
                        learner_tau = NULL,
                        learner_ps = NULL,
                        weighting = "none", weights = NULL,
                        stabilize = FALSE, t0 = NULL, outcome = "auto") {
  ml_fit(type = type, X = X, A = A, Y = Y,
         learner_base = learner_base, learner_tau = learner_tau,
         learner_ps = learner_ps, weighting = weighting, weights = weights,
         stabilize = stabilize, t0 = t0, outcome = outcome)
}

# 各 learner 的便捷封装：直接返回训练集 CATE 向量（与课程脚本同款签名）
s_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("S", X, A, Y, learner_base = learner_base, ...)$cate_train
}
t_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("T", X, A, Y, learner_base = learner_base, ...)$cate_train
}
x_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("X", X, A, Y, learner_base = learner_base, ...)$cate_train
}
r_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("R", X, A, Y, learner_base = learner_base, ...)$cate_train
}
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
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0)
}

# 4 观察性数据（连续结局 + 混杂）-----------------------------------------------
# 处理概率依赖协变量（confounding by indication）：病情越重越容易接受处理，
# 因此未调整的差分会偏离真实 ATE，需要 IPTW / DR 等校正。
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
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0, ps_true = e)
}
