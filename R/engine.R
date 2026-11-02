# =====================================================================
# engine.R -- internal algorithm engine (single source of truth)
#
# Core abstraction: the five metalearner formulas are outcome-type agnostic;
# they only interact with an "outcome model".
# An outcome model is a list with a predict(newX) method that returns:
#     continuous outcome  -> E[Y | X]
#     binary outcome      -> P(Y = 1 | X)
#     survival outcome    -> S(t0 | X) (survival probability at time t0)
# The same formula skeleton thus serves all three outcome types:
#     S-Learner  = outcome model treating A as an ordinary feature; difference
#                  of the two counterfactual predictions
#     T-Learner  = one outcome model per treatment group; difference of predictions
#     X-Learner  = impute individual treatment effects, then blend by propensity
#                  score g(X)
#     R-Learner  = Robinson residualization: residualize both outcome and
#                  treatment on X, then regress
#     DR-Learner = regression on doubly-robust pseudo-outcome (Kennedy 2020)
#
# Design boundaries regarding "weighting" (from v0.40, further tightened in v0.43):
#   Classical metalearner literature (the X-learner of Künzel et al. 2019, PNAS,
#   and CausalML's BaseS / BaseT / BaseX / BaseR / BaseDR) never weights the
#   tau regression (causalml uses model_tau.fit(X, pseudo) with no sample_weight).
#   Confounding control in S/T/X is achieved by including confounders in X and
#   conditioning on them via the outcome model; R-Learner relies on Robinson
#   residualization, DR-Learner on the AIPW pseudo-outcome -- the latter two use
#   the propensity score through learner_ps, but that is part of the algorithm
#   definition, not a toggleable weighting.
#   The package therefore no longer exposes the weighting / weights / stabilize
#   parameters: a "single-robust" weighting that merely re-estimates the outcome
#   model is neither the literature approach nor able to deconfound on its own
#   (bias matches the naive estimate when confounders are omitted), so keeping it
#   would only mislead users.
#
#   Two historical weighting implementations were removed in v0.43:
#     (a) R-Learner once used (A-e)^2 as regression sample weights via importance
#         resampling -- this was merely an algebraic rewrite of the R-loss
#         (squares cancel on expansion) and not real weighting; after removal
#         R-Learner regresses (Y-m)/(A-e) directly without weights;
#     (b) DR-Learner's tau regression once used survival censoring IPCW as sample
#         weights (again via resampling).
#   The only weight-related elements that remain algorithmically necessary are:
#     - survival censoring IPCW is baked into the pseudo-outcome (survdiff uses
#       I(T>t0)/G, rmst uses xi), so the tau regression is fully unweighted;
#       S/T/X survival outcome models still use coxph/ranger native weights.
#   No "importance resampling" remains at the implementation level; reproducing
#   R/DR no longer requires set.seed() for weights (cross-fitting fold splits
#   still need set.seed).
#
# Conventions: internal function names always start with .; base learners use
# mlr3 Learners (the survival branch may use native name strings, see
# survival_base.R); clone(deep = TRUE) before each fit to avoid the same learner
# object being overwritten across multiple $train calls.
#
# Survival outcomes have two engines (engine argument, default "native"):
#   "native"       native coxph/ranger implementation (survival_base.R), all five
#                  families, supports RMST, accepts any mlr3 base learner, zero
#                  extra dependencies;
#   "survlearners" delegates to the survlearners package (surv_survlearners.R,
#                  GitHub-only, with a clear message whether or not it is
#                  installed), only S/T/X/R with the S(t0) difference scale, but
#                  it ships IPCW and R-family cross-fitting, useful as a
#                  methodological cross-check.
# =====================================================================

# 1 识别基学习器种类 -----------------------------------------------------------
# 生存结局的基学习器用字符串指定（原生实现，不依赖 mlr3proba）。
# 传 mlr3 的 lrn("surv.*") 会被明确拒绝——那需要 mlr3proba，本包不引入这个依赖。
.lb_kind <- function(lb) {
  if (is.character(lb)) {
    if (length(lb) != 1L || !lb %in% c("coxph", "ranger")) {
      stop('生存结局的基学习器只支持 "coxph" 与 "ranger"（原生实现，不依赖 mlr3proba）。')
    }
    return("surv_native")
  }
  if (inherits(lb, "LearnerRegr"))    return("regr")
  if (inherits(lb, "LearnerClassif")) return("classif")
  if (inherits(lb, "LearnerSurv")) {
    stop('生存结局请用原生基学习器 "coxph" 或 "ranger"；mlr3 的 lrn("surv.*") 需要 mlr3proba，本包不依赖它。')
  }
  stop('learner_base 必须是 mlr3 Learner（regr/classif），或生存结局的原生基学习器名字符串（"coxph"/"ranger"）。')
}

# 2 结局类型判定 ---------------------------------------------------------------
.resolve_outcome <- function(outcome, Y) {
  outcome <- match.arg(outcome, c("auto", "continuous", "binary", "survival"))
  if (outcome != "auto") return(outcome)
  if (inherits(Y, "Surv")) return("survival")
  if (is.factor(Y)) {
    if (nlevels(Y) != 2L) stop("二分类结局的因子必须恰好两个水平。")
    return("binary")
  }
  yv <- suppressWarnings(as.numeric(Y))
  if (all(!is.na(yv)) && length(unique(yv)) <= 2L && all(yv %in% c(0, 1))) return("binary")
  "continuous"
}

# 3 结局类型与基学习器是否匹配 -------------------------------------------------
.check_outcome_kind <- function(outcome, kind) {
  ok <- switch(outcome,
    continuous = kind == "regr",
    binary     = kind == "classif",
    survival   = kind == "surv_native"
  )
  if (!isTRUE(ok)) {
    stop(sprintf(
      '结局类型 "%s" 与基学习器种类 "%s" 不匹配：连续结局用 regr.*，二分类用 classif.*，生存结局用 "coxph" 或 "ranger"。',
      outcome, kind
    ))
  }
}

# 3b 规范化 learner 规格：单个学习器 或 按角色命名的 list -----------------------
# 让 T / X learner 能为每个分组 / 每个阶段单独指定学习器：
#   - 单个 mlr3 learner（或生存原生字符串 "coxph"/"ranger"）：所有角色共用同一个
#   - 命名 list：名字必须恰好覆盖 roles，每个角色一个 learner
# 返回：与 roles 同序、同名的 list。S / R / DR 只有单一角色，仍是单 learner 语义。
.resolve_learner_spec <- function(spec, roles) {
  if (inherits(spec, "Learner") || is.character(spec)) {
    return(stats::setNames(replicate(length(roles), spec, simplify = FALSE), roles))
  }
  if (is.list(spec)) {
    if (is.null(names(spec))) {
      stop(sprintf("按角色指定的 learner 必须是命名 list；期望角色：%s。",
                   paste(roles, collapse = ", ")))
    }
    extra   <- setdiff(names(spec), roles)
    missing <- setdiff(roles, names(spec))
    if (length(extra)) {
      stop(sprintf("未知的 learner 角色：%s。允许的角色只有：%s。",
                   paste(extra, collapse = ", "), roles))
    }
    if (length(missing)) {
      stop(sprintf("缺少必需的 learner 角色：%s（请用命名 list 一次性给全）。",
                   paste(missing, collapse = ", ")))
    }
    return(spec[roles])   # 按 roles 顺序重排，保证确定性
  }
  stop("learner_base / learner_tau 必须是单个 mlr3 learner（或生存原生字符串），或按角色命名的 list。")
}

# 4 分析尺度的结局数值（X/R/DR 的个体尺度结局）---------------------------------
# 连续/二分类：就是 Y 本身（二分类取 0/1）
# 生存：按 effect 取 —— "survdiff" 为 I(T > t0)/G(T-)（删失 IPCW 已烤进伪结局，
#       见 .surv_analysis_outcome），"rmst" 为 ξ = δ·min(X, τ)/Ĝ(X)（同样含 IPCW）
# ipcw_bake 默认 TRUE：删失 IPCW 烤进伪结局（X/DR 适用）。R-Learner 例外需传 FALSE，
# 退回原始指示 I(T > t0)，避免 Robinson 伪结局的 1/G × 1/(A-e) 双重倒数放大方差。
.analysis_outcome <- function(Y, outcome, t0, effect = "survdiff", X = NULL,
                             ipcw_bake = TRUE) {
  if (outcome == "survival") {
    .surv_analysis_outcome(Y[, 1L], Y[, 2L], X, t0, effect, ipcw_bake)
  } else if (is.factor(Y)) {
    as.integer(Y == levels(Y)[2L])
  } else {
    as.numeric(Y)
  }
}

# 5 按行子集取结局 -------------------------------------------------------------
.subset_Y <- function(Y, idx) {
  if (inherits(Y, "Surv")) Y[idx, , drop = FALSE] else Y[idx]
}

# 6 拟合一个回归基学习器（无权重）-------------------------------------------
# 本包自 v0.43 起严格遵循各 metalearner 的原始公式：所有效应回归与目标
# 结局模型一律**不加权**（与 causalml 的 model_tau.fit(X, pseudo) 无
# sample_weight 一致）。R-Learner 的 (A-e)² 与生存删失 IPCW 都属于「伪结局
# 内部构造」，不再以回归样本权重的形式出现，故引擎内不再有重要性重采样。
.fit_regr <- function(X, y, learner_base) {
  l <- learner_base$clone(deep = TRUE)
  data <- data.frame(X, y_response = y, stringsAsFactors = FALSE)
  task <- mlr3::as_task_regr(data, target = "y_response")
  l$train(task)
  l
}

# 7 拟合一个分类基学习器（二分类结局）------------------------------------------
# 注意：classif 学习器默认 predict_type = "response"，拿不到概率；
# 必须在 $train() 之前把 predict_type 切成 "prob"（训练后再改会触发
# check_prediction_data 的断言错误）。
.fit_classif <- function(X, y, learner_base) {
  l <- learner_base$clone(deep = TRUE)
  if ("prob" %in% l$predict_types) l$predict_type <- "prob"
  yf <- factor(ifelse(as.integer(y) == 1L, "yes", "no"), levels = c("no", "yes"))
  data <- data.frame(X, y_response = yf, stringsAsFactors = FALSE)
  task <- mlr3::as_task_classif(data, target = "y_response")
  l$train(task)
  l
}

# 8 预测 ---------------------------------------------------------------------
.pred_regr <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$response)
}

.pred_classif <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$prob[, "yes"])
}

# 9 倾向得分：返回 g(newX) = P(A = 1 | X) --------------------------------------
# learner_ps 三种形态，对应三种使用场景：
#   - mlr3 分类学习器：内部拟合（观察性数据的默认做法，默认 classif.log_reg）
#   - 标量：常数倾向得分，用于 RCT 已知随机化概率（如 0.5），
#     也等价于「治疗与协变量独立、不需要估倾向得分」的声明
#   - 函数：用户自建的 g(newX)（例如用别的包估好、封成函数传进来）
# predict_type 同样要在 $train() 之前切成 "prob"（见 .fit_classif 的说明）。
# 截断到 ps_bounds（默认 [0.01, 0.99]）：R/DR 的伪结果与 Robinson 中心化都以 (A - e) 为分母，
# 不截断会在近 0/1 处炸开；bounds 越紧越稳、但引入偏差。
.fit_ps <- function(X, A, ps, ps_bounds = c(0.01, 0.99)) {
  lo <- ps_bounds[1L]
  hi <- ps_bounds[2L]
  # 用户自建的 function(newX) 也统一截断——否则 R/DR 的伪结局会绕过保护直接炸开
  if (is.function(ps)) {
    return(function(newX) pmin(pmax(ps(as.data.frame(newX)), lo), hi))
  }
  if (is.numeric(ps)) {
    if (length(ps) != 1L) {
      stop("learner_ps 为数值时只支持标量（常数倾向得分，如 RCT 的 0.5）；",
           "逐人的外部倾向得分请封装成 function(newX) 后传入。", call. = FALSE)
    }
    p <- pmin(pmax(as.numeric(ps), lo), hi)
    return(function(newX) rep(p, nrow(as.data.frame(newX))))
  }
  if (!inherits(ps, "Learner")) {
    stop('learner_ps 必须是 mlr3 分类学习器、常数倾向得分（标量），或 function(newX)。',
         call. = FALSE)
  }
  l <- ps$clone(deep = TRUE)
  if ("prob" %in% l$predict_types) l$predict_type <- "prob"
  Af <- factor(ifelse(A == 1L, "yes", "no"), levels = c("no", "yes"))
  data <- data.frame(X, a_trt = Af, stringsAsFactors = FALSE)
  task <- mlr3::as_task_classif(data, target = "a_trt")
  l$train(task)
  function(newX) {
    p <- l$predict_newdata(as.data.frame(newX))$prob[, "yes"]
    pmin(pmax(p, lo), hi)
  }
}

# 10 结局模型：统一入口 --------------------------------------------------------
# 返回 list(predict = function(newX) -> 结局尺度预测值, kind = ..., model = ...)
# w_cens 只承载生存删失 IPCW，走 coxph/ranger 原生权重（见文件头「关于加权的
# 设计边界」）；连续 / 二分类与 effect = "rmst" 一律为 NULL。survdiff 的删失
# IPCW 已烤进个体尺度伪结局（.analysis_outcome），故 τ 回归无需再加权。
.fit_outcome <- function(X, Y, lb, w_cens, t0, outcome, effect) {
  kind <- .lb_kind(lb)
  .check_outcome_kind(outcome, kind)
  if (kind == "regr") {
    m <- .fit_regr(X, .analysis_outcome(Y, outcome, t0, effect, X), lb)
    list(kind = "regr", model = m, predict = function(newX) .pred_regr(m, newX))
  } else if (kind == "classif") {
    m <- .fit_classif(X, .analysis_outcome(Y, outcome, t0, effect, X), lb)
    list(kind = "classif", model = m, predict = function(newX) .pred_classif(m, newX))
  } else {
    # 生存结局：lb 是 "coxph" / "ranger" 字符串，走原生实现
    # effect 决定 predict 返回 S(t0) 还是 RMST(t0)
    m <- .fit_surv(X, Y[, 1L], Y[, 2L], lb, t0, w_cens, effect = effect)
    list(kind = "surv", effect = effect, model = m,
         predict = function(newX) as.numeric(m$predict(newX)))
  }
}

# 11 S-Learner：一个模型，处理当普通特征，两次反事实预测相减 -------------------
# 不使用倾向得分：去混杂靠把混杂因子放进 X，由这一个结局模型条件化。
.fit_S <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  m <- .fit_outcome(data.frame(X, a_trt = A), Y, lb, w_cens, t0, outcome, effect)
  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    m$predict(data.frame(nd, a_trt = 1L)) - m$predict(data.frame(nd, a_trt = 0L))
  }
  list(models = list(m = m), predict = pred_fn)
}

# 12 T-Learner：两组各一个模型，相减 ------------------------------------------
# lb 可以是单个 learner（两组共用），或命名 list list(treated = ..., control = ...)
# 让两组用不同算法（例如治疗组用随机森林、对照组用线性模型）。
.fit_T <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  lb <- .resolve_learner_spec(lb, c("treated", "control"))
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w_cens)) NULL else w_cens[i1]
  w0 <- if (is.null(w_cens)) NULL else w_cens[i0]
  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb[["treated"]], w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb[["control"]], w0, t0, outcome, effect)
  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    m1$predict(nd) - m0$predict(nd)
  }
  list(models = list(m1 = m1, m0 = m0), predict = pred_fn)
}

# 13 X-Learner：两阶段插补 + 倾向得分加权融合 --------------------------------
# 插补的个体效应 D1 = Y1 - mu0(X1)，D0 = mu1(X0) - Y0，再分别回归出
# tau1 / tau0，最后按 g(X) 加权融合（Künzel et al. 2019, PNAS）。
# 这里的 g(X) = e(X) 是 X-learner 定义的一部分：两组样本悬殊时，
# 用倾向得分给样本少的那一侧插补更高权重以稳定融合。它**不是**去混杂工具
# —— 可忽略性由 m1/m0 对 X 的条件化保证。
# lb 支持 list(m1 = ..., m0 = ...) 让两个结局模型用不同算法；
# lb_tau 支持 list(tau1 = ..., tau0 = ...) 让两个效应回归各自选用算法
# （例如 tau1 用随机森林、tau0 用线性模型）。单 learner 则全部共用。
.fit_X <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect,
                   ps_bounds = c(0.01, 0.99)) {
  lb      <- .resolve_learner_spec(lb, c("m1", "m0"))
  lb_tau  <- .resolve_learner_spec(lb_tau, c("tau1", "tau0"))
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w_cens)) NULL else w_cens[i1]
  w0 <- if (is.null(w_cens)) NULL else w_cens[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  g_fn <- .fit_ps(X, A, learner_ps, ps_bounds)

  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb[["m1"]], w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb[["m0"]], w0, t0, outcome, effect)

  D1 <- Yv[i1] - m0$predict(X[i1, , drop = FALSE])     # 治疗组：实际 - 若未治
  D0 <- m1$predict(X[i0, , drop = FALSE]) - Yv[i0]     # 对照组：若治 - 实际
  tau1 <- .fit_regr(X[i1, , drop = FALSE], D1, lb_tau[["tau1"]])
  tau0 <- .fit_regr(X[i0, , drop = FALSE], D0, lb_tau[["tau0"]])

  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    g <- g_fn(nd)
    g * .pred_regr(tau0, nd) + (1 - g) * .pred_regr(tau1, nd)
  }
  list(models = list(m1 = m1, m0 = m0, tau1 = tau1, tau0 = tau0), predict = pred_fn)
}

# 14 R-Learner：残差对残差（Robinson 变换）------------------------------------
# mu(X) = E[Y|X]（不含 A）；处理对倾向得分取残差 A - e(X)，
# 再无权重回归 Robinson 伪结局 (Y - mu)/(A - e) 得 tau（Nie & Wager 2021）。
# (A-e)² 只是 R-loss 的代数等价重写（展开相消），并非真实回归权重；
# 倾向得分是 Robinson 中心化的必需输入，不是可开关的加权开关。
.fit_R <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect,
                   ps_bounds = c(0.01, 0.99)) {
  mu <- .fit_outcome(X, Y, lb, w_cens, t0, outcome, effect)
  mu_hat <- mu$predict(as.data.frame(X))
  # R-Learner 的 Robinson 伪结局还要除以 (A-e)，与 survdiff 的 1/G 构成双重倒数，
  # 会把方差放大到 τ 回归无法消化；故 R-Learner 的生存伪结局退回原始指示 I(T>t0)，
  # 删失由 censoring-aware 的结局模型 mu 承担（生存 R-Learner 的标准做法）。
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X, ipcw_bake = FALSE)
  g_fn <- .fit_ps(X, A, learner_ps, ps_bounds)
  e <- g_fn(as.data.frame(X))
  tildeA <- A - e
  target <- (Yv - mu_hat) / tildeA
  tau <- .fit_regr(X, target, lb_tau)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(mu = mu, tau = tau), predict = pred_fn)
}

# 15 DR-Learner：双重稳健伪结果 ------------------------------------------------
# psi = mu1 - mu0 + A(Y - mu1)/e - (1 - A)(Y - mu0)/(1 - e)，
# 只要 (mu1, mu0) 或 e 之一正确，ATE 估计就一致（Kennedy 2020）。
.fit_DR <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect,
                    ps_bounds = c(0.01, 0.99)) {
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w_cens)) NULL else w_cens[i1]
  w0 <- if (is.null(w_cens)) NULL else w_cens[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)

  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
  mu1 <- m1$predict(as.data.frame(X))
  mu0 <- m0$predict(as.data.frame(X))
  g_fn <- .fit_ps(X, A, learner_ps, ps_bounds)
  e <- g_fn(as.data.frame(X))
  psi <- mu1 - mu0 + A * (Yv - mu1) / e - (1 - A) * (Yv - mu0) / (1 - e)
  tau <- .fit_regr(X, psi, lb_tau)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(m1 = m1, m0 = m0, tau = tau), predict = pred_fn)
}

# 16 交叉拟合（cross-fitting）-------------------------------------------------
# R/DR 的伪结果依赖干扰参数（R 的 mu；DR 的 m1 / m0 与倾向得分 e）。
# 如果这些干扰参数是在同一批数据上拟合、又在同一批数据上取伪结果，
# 过拟合会让伪结果带上系统性偏差，进而污染 tau。标准做法（Kennedy 2020）是：
#   第 k 折的伪结果用「其余 K-1 折拟合的干扰参数」算出，
#   全部折拼齐后再回归一次 tau。
# 本实现同时把倾向得分也做折内重估，所以是完整的交叉拟合。

# 折划分：随机打乱后尽量均分
.cv_folds <- function(n, k) {
  k <- max(2L, min(as.integer(k), n))
  idx <- sample.int(n)
  split(idx, cut(seq_len(n), breaks = k, labels = FALSE))
}

# R-Learner 的交叉拟合版
.fit_R_cf <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens,
                      t0, outcome, effect, folds, ps_bounds = c(0.01, 0.99)) {
  n <- nrow(X)
  # R-Learner 交叉拟合：生存伪结局同样退回原始指示（见 .fit_R 的说明），避免 1/G×1/(A-e) 双倒数
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X, ipcw_bake = FALSE)
  target <- numeric(n)
  for (f in folds) {
    tr <- setdiff(seq_len(n), f)
    w_tr <- if (is.null(w_cens)) NULL else w_cens[tr]
    mu <- .fit_outcome(X[tr, , drop = FALSE], .subset_Y(Y, tr), lb, w_tr,
                       t0, outcome, effect)
    g_k <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps, ps_bounds)
    target[f] <- (Yv[f] - mu$predict(X[f, , drop = FALSE])) /
                 (A[f] - g_k(X[f, , drop = FALSE]))
  }
  g_all <- .fit_ps(X, A, learner_ps, ps_bounds)
  tildeA <- A - g_all(X)
  # 无权重回归 Robinson 伪结局（见 .fit_R：R-loss 的 (A-e)² 是代数等价项，不加权）
  tau <- .fit_regr(X, target, lb_tau)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# DR-Learner 的交叉拟合版
.fit_DR_cf <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens,
                      t0, outcome, effect, folds, ps_bounds = c(0.01, 0.99)) {
  n <- nrow(X)
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  psi <- numeric(n)
  for (f in folds) {
    tr <- setdiff(seq_len(n), f)
    i1 <- tr[A[tr] == 1L]
    i0 <- tr[A[tr] == 0L]
    w_tr <- if (is.null(w_cens)) NULL else w_cens[tr]
    w1 <- if (is.null(w_tr)) NULL else w_tr[A[tr] == 1L]
    w0 <- if (is.null(w_tr)) NULL else w_tr[A[tr] == 0L]
    m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
    m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
    mu1 <- m1$predict(X[f, , drop = FALSE])
    mu0 <- m0$predict(X[f, , drop = FALSE])
    g_k <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps, ps_bounds)
    e <- g_k(X[f, , drop = FALSE])
    psi[f] <- mu1 - mu0 + A[f] * (Yv[f] - mu1) / e -
              (1 - A[f]) * (Yv[f] - mu0) / (1 - e)
  }
  # 无权重回归 AIPW 伪结局（删失 IPCW 已烤进 survdiff / rmst 伪结局内部）
  tau <- .fit_regr(X, psi, lb_tau)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# 17 调度器：归一化输入 -> 组装倾向得分与删矢权重 -> 分派到五种 learner --------
ml_fit <- function(type, X, A, Y, learner_base = NULL, learner_tau = NULL,
                   learner_ps = NULL,
                   t0 = NULL, outcome = "auto",
                   effect = c("survdiff", "rmst"),
                   cross_fitting = FALSE, n_folds = 5L,
                   ps_bounds = c(0.01, 0.99),
                   engine = c("native", "survlearners")) {
  type <- match.arg(type, c("S", "T", "X", "R", "DR"))
  effect <- match.arg(effect)
  engine <- match.arg(engine)
  # 倾向得分截断区间：R/DR 的伪结果与 X 的融合权重都以 (A - e) 或 e 为分母，
  # 极端 PS 会把这些量放大到 τ 回归无法消化（实测 econml_ihdp 上 R 的 ATE 冲 18.9）。
  # 收紧到 [0.01, 0.99]（更保守可用 [0.05, 0.95]）能把放大倍数从 ~117x 压到 ~100x/~20x。
  if (!is.numeric(ps_bounds) || length(ps_bounds) != 2L ||
      !all(is.finite(ps_bounds)) || ps_bounds[1L] <= 0 ||
      ps_bounds[2L] >= 1 || ps_bounds[1L] >= ps_bounds[2L]) {
    stop("ps_bounds 必须是长度 2 的数值向量，满足 0 < lo < hi < 1（例如 c(0.01, 0.99)）。",
         call. = FALSE)
  }
  if (is.null(learner_base)) learner_base <- mlr3::lrn("regr.ranger")
  if (cross_fitting && !type %in% c("R", "DR")) {
    warning("交叉拟合目前只对 R / DR 学习器实现；其他 learner 忽略该参数。")
    cross_fitting <- FALSE
  }
  # R/DR 的伪结果含「同一批数据上拟合的干扰参数」。R-Learner 尤其敏感：
  # mu 若用 ranger 这类高弹性学习器，样本内残差 Y - mu_hat 被过拟合压向 0，
  # tau 会整体衰减（实测 ATE 可被砍掉六成，且不报错）。Nie & Wager 2021 的
  # R-learner 理论与 Kennedy 2020 的 DR 理论都以交叉拟合为前提。
  # 因此这里显式提示，但不静默改默认值——用户可为速度自行承担该后果。
  if (!cross_fitting && type %in% c("R", "DR")) {
    cli::cli_alert_warning(
      "{type}-Learner 未启用交叉拟合：干扰参数（mu / m1 / m0 / e）与伪结果同批数据，\\
      高弹性学习器会把 tau 系统性衰减。建议 cross_fitting = TRUE。"
    )
  }

  X <- as.data.frame(X)
  A <- as.integer(A)
  n <- nrow(X)

  outcome <- .resolve_outcome(outcome, Y)

  # survlearners 引擎：只服务生存结局，整体委托 survlearners 包实现
  # （S/T/X/R 四族；DR 与 RMST 它没有，里面会给明确报错）。
  # 放在 .lb_kind 校验之前——它的基学习器是 coxph/grf/lasso 字符串，
  # 与原生引擎的 "coxph"/"ranger" 不是同一套取值。
  if (identical(engine, "survlearners")) {
    if (!identical(outcome, "survival")) {
      stop('engine = "survlearners" 只支持生存结局；连续 / 二分类请用 engine = "native"。')
    }
    return(.ml_fit_survlearners(type, X, A, Y, learner_base, learner_ps, t0, effect))
  }

  # learner_base 既可以是单个 learner，也可以是按角色命名的 list（T / X 专用）：
  # 单个 -> 这里做统一的「结局类型 vs 基学习器种类」校验；
  # list  -> 交给 .fit_T / .fit_X 内部按角色逐个校验，这里只做「类型 / 引擎」层面的放行。
  if (is.list(learner_base)) {
    if (engine == "survlearners") {
      stop('按角色命名的 learner_base 列表暂不支持 survlearners 引擎；该引擎请传单个 learner（"coxph"/"grf"/"lasso"）。')
    }
    if (!type %in% c("T", "X")) {
      stop("按角色命名的 learner_base 列表只支持 T-Learner（list(treated=, control=)）与 X-Learner（list(m1=, m0=)）；S / R / DR 请传单个 learner。")
    }
    kind <- NULL
  } else {
    kind <- .lb_kind(learner_base)
    .check_outcome_kind(outcome, kind)
  }
  # learner_tau 的 list 形式（tau1 / tau0 分阶段）只对 X-Learner 有意义
  if (is.list(learner_tau) && type != "X") {
    stop("按角色命名的 learner_tau 列表（list(tau1=, tau0=)）只对 X-Learner 有意义；其余 learner 请传单个 learner。")
  }
  # RMST 只在生存结局下有定义（必须在 outcome 解析之后检查）
  if (!identical(outcome, "survival") && identical(effect, "rmst")) {
    stop('effect = "rmst" 只对生存结局有意义。')
  }

  # 效应阶段的回归学习器：X/R/DR 要对「伪结果」做回归，噪声结构与结局模型
  # 完全不同（R/DR 的目标含 1/(A-e) 放大，DR 的 psi 是残差型伪结果）。
  # ranger 回归默认 min.node.size = 5，树会长得很深、把伪结果里的噪声也拟合进去，
  # 实测会让 R/DR 的 CATE 相关从 0.9 掉到 0.2。因此这里不沿用结局模型的
  # learner_base，而是单独建一个偏正则化的 ranger（min.node.size = 50）。
  # 用户可用 learner_tau 显式覆盖（例如 regr.lm 在生存 R/DR 上表现更好）。
  if (is.null(learner_tau)) {
    learner_tau <- mlr3::lrn("regr.ranger", num.trees = 500, min.node.size = 50, seed = 1)
  }

  # t0：生存结局必填，默认取观测事件时间的中位数
  if (outcome == "survival" && is.null(t0)) {
    tt <- Y[, 1L][Y[, 2L] == 1L]
    t0 <- if (length(tt)) stats::median(tt) else stats::median(Y[, 1L])
    message("t0 未指定，默认取事件时间中位数：", signif(t0, 4))
  }

  # 倾向得分：X 的 g(x) 融合、R 的 Robinson 中心化、DR 的伪结果都要求 e(x)。
  # 未指定时默认内部拟合一个逻辑回归（观察性数据的常规做法）；RCT 若已知
  # 随机化概率，传标量（如 0.5）即可，也免掉拟合计入的噪声。
  # S/T 是纯结局回归，不使用倾向得分，learner_ps 对它们无效。
  if (type %in% c("X", "R", "DR") && is.null(learner_ps)) {
    learner_ps <- mlr3::lrn("classif.log_reg")
  }

  # 生存结局的删矢校正：
  #   effect = "survdiff" —— 个体结局是 I(T > t0)，需要乘删矢 IPCW 1/G(Tᵢ⁻)
  #   effect = "rmst"     —— 个体结局 ξ 本身已含 IPCW，不再额外乘
  # 这是估计量的组成部分（Hernán 体系对删矢的标准处理），不是用户可开关的加权。
  w_cens <- NULL
  if (outcome == "survival" && identical(effect, "survdiff")) {
    w_cens <- .surv_ipcw(Y[, 1L], Y[, 2L], X)
  }

  # 交叉拟合：R/DR 的干扰参数（mu 或 m1/m0 + e）在 K 折的训练折上拟合，
  # 伪结果在留出折上计算，最后统一回归一次。这样能避免 in-sample 过拟合
  # 把伪结果的系统性偏差带进 tau。
  if (cross_fitting) {
    folds <- .cv_folds(n, n_folds)
    cf_args <- list(X = X, A = A, Y = Y, lb = learner_base, lb_tau = learner_tau,
                    learner_ps = learner_ps, w_cens = w_cens, t0 = t0,
                    outcome = outcome, effect = effect, folds = folds,
                    ps_bounds = ps_bounds)
    res <- if (type == "R") do.call(.fit_R_cf, cf_args) else do.call(.fit_DR_cf, cf_args)
  } else {
    res <- switch(type,
      S  = .fit_S(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      T  = .fit_T(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      X  = .fit_X(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect, ps_bounds),
      R  = .fit_R(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect, ps_bounds),
      DR = .fit_DR(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect, ps_bounds)
    )
  }

  res$type <- type
  res$outcome <- outcome
  res$effect <- effect
  res$engine <- engine
  res$cross_fitting <- cross_fitting
  res$t0 <- t0
  res$cate_train <- res$predict(X)
  res$ate <- mean(res$cate_train)
  res
}
