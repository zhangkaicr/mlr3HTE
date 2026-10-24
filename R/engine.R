# =====================================================================
# engine.R —— 内部算法引擎（单一事实来源）
#
# 核心抽象：五种 metalearner 的公式与结局类型无关，它们只跟「结局模型」打交道。
# 结局模型是一个 list，自带 predict(newX)，返回：
#     连续结局   -> E[Y | X]
#     二分类结局 -> P(Y = 1 | X)
#     生存结局   -> S(t0 | X)（t0 时点的生存概率）
# 于是同一个公式骨架同时服务三类结局：
#     S-Learner  = 把 A 当普通特征的结局模型，两个反事实预测相减
#     T-Learner  = 两个分组各自的结局模型，预测相减
#     X-Learner  = 插补个体治疗效应，再按倾向得分 g(X) 加权融合
#     R-Learner  = Robinson 残差化：结局与处理都对 X 取残差后回归
#     DR-Learner = 双重稳健伪结果（Kennedy 2020）后回归
#
# 关于「加权」的设计边界（v0.40 起，破坏性变更）：
#   经典 metalearner 文献（Künzel et al. 2019 PNAS 的 X-learner，以及
#   CausalML 的 BaseS / BaseT / BaseX）从不给 S/T/X 的结局模型套 IPTW。
#   去混杂在 S/T/X 里靠的是**把混杂因子放进 X、由结局模型条件化**；
#   R-Learner 靠 Robinson 残差化，DR-Learner 靠 AIPW 伪结果——后两者
#   通过 learner_ps 使用倾向得分，但那是算法定义的一部分，不是可开关的加权。
#   因此本包不再提供 weighting / weights / stabilize 三个参数：
#   一个只会重估结局模型的「单稳健」加权既不是文献做法，也无法单独去混杂
#   （漏掉混杂因子时偏倚同朴素估计），留着只会误导使用者。
#
#   本引擎里唯一还存在的权重是**生存结局的删失 IPCW**：effect = "survdiff"
#   的个体尺度结局 I(T > t0) 会被删矢污染，需乘 1/G(T-)（Hernán 体系）。
#   它是估计量的组成部分而非用户选项，effect = "rmst" 时个体结局本身已含
#   IPCW，不再额外乘。
#
# 约定：内部函数名一律以 . 开头；基学习器用 mlr3 Learner（生存分支可为
# 原生名字符串，见 survival_base.R）；每次拟合前 clone(deep = TRUE)，
# 避免同一个 learner 对象多次 $train 互相覆盖。
#
# 生存结局有两套引擎（engine 参数，默认 "native"）：
#   "native"      原生 coxph/ranger 实现（survival_base.R），五族齐全、
#                 支持 RMST、支持任意 mlr3 基学习器，零额外依赖；
#   "survlearners" 委托 survlearners 包（surv_survlearners.R，GitHub-only，
#                 装没装都会给明确提示），只有 S/T/X/R 与 S(t0) 差尺度，
#                 但它自带 IPCW 与 R 族的交叉拟合，适合做方法学对照。
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
# 生存：按 effect 取 —— "survdiff" 为 I(T > t0)，"rmst" 为 IPCW 修正的
#       ξ = δ·min(X, τ)/Ĝ(X)（见 .surv_analysis_outcome）
.analysis_outcome <- function(Y, outcome, t0, effect = "survdiff", X = NULL) {
  if (outcome == "survival") {
    .surv_analysis_outcome(Y[, 1L], Y[, 2L], X, t0, effect)
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

# 6 按权重做重要性重采样（mlr3 无 case weights 的通用替代）---------------------
# 本引擎仅有的两处加权用途，都与「去混杂的可选加权」无关：
#   (a) R-Learner 的 Robinson 权重 (A - e(X))^2 —— Nie & Wager 2021 估计量的
#       定义本身，删掉它 R-learner 就不成立；
#   (b) 生存结局的删矢 IPCW —— 走 .fit_surv 的原生 weights / case.weights，
#       不经这里（见 .fit_outcome）。
# 注意重采样会引入蒙特卡洛噪声，需要复现时请在调用前 set.seed()。
.resample_by_weights <- function(X, y, weights) {
  if (is.null(weights) || diff(range(weights)) <= 1e-12) {
    return(list(X = X, y = y))
  }
  idx <- sample.int(length(y), size = length(y), replace = TRUE, prob = weights / sum(weights))
  list(X = X[idx, , drop = FALSE], y = y[idx])
}

# 7 拟合一个回归基学习器 -------------------------------------------------------
# weights 只服务于 R-Learner 的结构性 Robinson 权重（见第 6 节说明）；
# 除此之外各 learner 的结局模型与效应回归一律不加权。
.fit_regr <- function(X, y, learner_base, weights = NULL) {
  l <- learner_base$clone(deep = TRUE)
  rs <- .resample_by_weights(X, y, weights)
  data <- data.frame(rs$X, y_response = rs$y, stringsAsFactors = FALSE)
  task <- mlr3::as_task_regr(data, target = "y_response")
  l$train(task)
  l
}

# 8 拟合一个分类基学习器（二分类结局）------------------------------------------
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

# 9 预测 ---------------------------------------------------------------------
.pred_regr <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$response)
}

.pred_classif <- function(learner, newX) {
  as.numeric(learner$predict_newdata(as.data.frame(newX))$prob[, "yes"])
}

# 10 倾向得分：返回 g(newX) = P(A = 1 | X) --------------------------------------
# learner_ps 三种形态，对应三种使用场景：
#   - mlr3 分类学习器：内部拟合（观察性数据的默认做法，默认 classif.log_reg）
#   - 标量：常数倾向得分，用于 RCT 已知随机化概率（如 0.5），
#     也等价于「治疗与协变量独立、不需要估倾向得分」的声明
#   - 函数：用户自建的 g(newX)（例如用别的包估好、封成函数传进来）
# predict_type 同样要在 $train() 之前切成 "prob"（见 .fit_classif 的说明）。
# 截断到 [1e-3, 1-1e-3]：R/DR 的伪结果与 Robinson 中心化都以 (A - e) 为分母，
# 不截断会在近 0/1 处炸开。
.fit_ps <- function(X, A, ps) {
  if (is.function(ps)) return(ps)
  if (is.numeric(ps)) {
    if (length(ps) != 1L) {
      stop("learner_ps 为数值时只支持标量（常数倾向得分，如 RCT 的 0.5）；",
           "逐人的外部倾向得分请封装成 function(newX) 后传入。", call. = FALSE)
    }
    p <- pmin(pmax(as.numeric(ps), 1e-3), 1 - 1e-3)
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
    pmin(pmax(p, 1e-3), 1 - 1e-3)
  }
}

# 11 结局模型：统一入口 --------------------------------------------------------
# 返回 list(predict = function(newX) -> 结局尺度预测值, kind = ..., model = ...)
# w_cens 只承载生存删失 IPCW（见文件头「关于加权的设计边界」）；
# 连续 / 二分类与 effect = "rmst" 一律为 NULL。
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

# 12 S-Learner：一个模型，处理当普通特征，两次反事实预测相减 -------------------
# 不使用倾向得分：去混杂靠把混杂因子放进 X，由这一个结局模型条件化。
.fit_S <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  m <- .fit_outcome(data.frame(X, a_trt = A), Y, lb, w_cens, t0, outcome, effect)
  pred_fn <- function(newX) {
    nd <- as.data.frame(newX)
    m$predict(data.frame(nd, a_trt = 1L)) - m$predict(data.frame(nd, a_trt = 0L))
  }
  list(models = list(m = m), predict = pred_fn)
}

# 13 T-Learner：两组各一个模型，相减 ------------------------------------------
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

# 14 X-Learner：两阶段插补 + 倾向得分加权融合 --------------------------------
# 插补的个体效应 D1 = Y1 - mu0(X1)，D0 = mu1(X0) - Y0，再分别回归出
# tau1 / tau0，最后按 g(X) 加权融合（Künzel et al. 2019, PNAS）。
# 这里的 g(X) = e(X) 是 X-learner 定义的一部分：两组样本悬殊时，
# 用倾向得分给样本少的那一侧插补更高权重以稳定融合。它**不是**去混杂工具
# —— 可忽略性由 m1/m0 对 X 的条件化保证。
# lb 支持 list(m1 = ..., m0 = ...) 让两个结局模型用不同算法；
# lb_tau 支持 list(tau1 = ..., tau0 = ...) 让两个效应回归各自选用算法
# （例如 tau1 用随机森林、tau0 用线性模型）。单 learner 则全部共用。
.fit_X <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  lb      <- .resolve_learner_spec(lb, c("m1", "m0"))
  lb_tau  <- .resolve_learner_spec(lb_tau, c("tau1", "tau0"))
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w_cens)) NULL else w_cens[i1]
  w0 <- if (is.null(w_cens)) NULL else w_cens[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  g_fn <- .fit_ps(X, A, learner_ps)

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

# 15 R-Learner：残差对残差（Robinson 变换）------------------------------------
# mu(X) = E[Y|X]（不含 A），处理对倾向得分取残差 A - e(X)，
# 目标 (Y - mu)/(A - e)，以 (A - e)^2 为权重回归得 tau（Nie & Wager 2021）。
# 倾向得分在这里是 Robinson 中心化的必需输入，不是可选的加权开关。
.fit_R <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  mu <- .fit_outcome(X, Y, lb, w_cens, t0, outcome, effect)
  mu_hat <- mu$predict(as.data.frame(X))
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  g_fn <- .fit_ps(X, A, learner_ps)
  e <- g_fn(as.data.frame(X))
  tildeA <- A - e
  target <- (Yv - mu_hat) / tildeA
  wt <- if (is.null(w_cens)) tildeA^2 else w_cens * tildeA^2
  tau <- .fit_regr(X, target, lb_tau, weights = wt)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(mu = mu, tau = tau), predict = pred_fn)
}

# 16 DR-Learner：双重稳健伪结果 ------------------------------------------------
# psi = mu1 - mu0 + A(Y - mu1)/e - (1 - A)(Y - mu0)/(1 - e)，
# 只要 (mu1, mu0) 或 e 之一正确，ATE 估计就一致（Kennedy 2020）。
.fit_DR <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens, t0, outcome, effect) {
  i1 <- A == 1L
  i0 <- A == 0L
  w1 <- if (is.null(w_cens)) NULL else w_cens[i1]
  w0 <- if (is.null(w_cens)) NULL else w_cens[i0]
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)

  m1 <- .fit_outcome(X[i1, , drop = FALSE], .subset_Y(Y, i1), lb, w1, t0, outcome, effect)
  m0 <- .fit_outcome(X[i0, , drop = FALSE], .subset_Y(Y, i0), lb, w0, t0, outcome, effect)
  mu1 <- m1$predict(as.data.frame(X))
  mu0 <- m0$predict(as.data.frame(X))
  g_fn <- .fit_ps(X, A, learner_ps)
  e <- g_fn(as.data.frame(X))
  psi <- mu1 - mu0 + A * (Yv - mu1) / e - (1 - A) * (Yv - mu0) / (1 - e)
  tau <- .fit_regr(X, psi, lb_tau, weights = w_cens)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(m1 = m1, m0 = m0, tau = tau), predict = pred_fn)
}

# 17 交叉拟合（cross-fitting）-------------------------------------------------
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
                      t0, outcome, effect, folds) {
  n <- nrow(X)
  Yv <- .analysis_outcome(Y, outcome, t0, effect, X)
  target <- numeric(n)
  for (f in folds) {
    tr <- setdiff(seq_len(n), f)
    w_tr <- if (is.null(w_cens)) NULL else w_cens[tr]
    mu <- .fit_outcome(X[tr, , drop = FALSE], .subset_Y(Y, tr), lb, w_tr,
                       t0, outcome, effect)
    g_k <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps)
    target[f] <- (Yv[f] - mu$predict(X[f, , drop = FALSE])) /
                 (A[f] - g_k(X[f, , drop = FALSE]))
  }
  g_all <- .fit_ps(X, A, learner_ps)
  tildeA <- A - g_all(X)
  wt <- if (is.null(w_cens)) tildeA^2 else w_cens * tildeA^2
  tau <- .fit_regr(X, target, lb_tau, weights = wt)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# DR-Learner 的交叉拟合版
.fit_DR_cf <- function(X, A, Y, lb, lb_tau, learner_ps, w_cens,
                      t0, outcome, effect, folds) {
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
    g_k <- .fit_ps(X[tr, , drop = FALSE], A[tr], learner_ps)
    e <- g_k(X[f, , drop = FALSE])
    psi[f] <- mu1 - mu0 + A[f] * (Yv[f] - mu1) / e -
              (1 - A[f]) * (Yv[f] - mu0) / (1 - e)
  }
  tau <- .fit_regr(X, psi, lb_tau, weights = w_cens)
  pred_fn <- function(newX) .pred_regr(tau, as.data.frame(newX))
  list(models = list(tau = tau), predict = pred_fn)
}

# 18 调度器：归一化输入 -> 组装倾向得分与删矢权重 -> 分派到五种 learner --------
ml_fit <- function(type, X, A, Y, learner_base = NULL, learner_tau = NULL,
                   learner_ps = NULL,
                   t0 = NULL, outcome = "auto",
                   effect = c("survdiff", "rmst"),
                   cross_fitting = FALSE, n_folds = 5L,
                   engine = c("native", "survlearners")) {
  type <- match.arg(type, c("S", "T", "X", "R", "DR"))
  effect <- match.arg(effect)
  engine <- match.arg(engine)
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
                    outcome = outcome, effect = effect, folds = folds)
    res <- if (type == "R") do.call(.fit_R_cf, cf_args) else do.call(.fit_DR_cf, cf_args)
  } else {
    res <- switch(type,
      S  = .fit_S(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      T  = .fit_T(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      X  = .fit_X(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      R  = .fit_R(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect),
      DR = .fit_DR(X, A, Y, learner_base, learner_tau, learner_ps, w_cens, t0, outcome, effect)
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
