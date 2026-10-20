# =====================================================================
# survival_base.R —— 原生生存基学习器 + 删失 IPCW 权重
#
# 生存分支【完全不依赖 mlr3proba】：直接用 survival::coxph 与 ranger 的
# 生存模式实现基学习器，包装成与另外两类结局一致的接口：
#
#   .fit_surv(X, time, status, kind, t0, weights, effect)
#     -> 结局模型对象，自带 $predict(newX)
#
# 两种效应度量（effect 参数），共用同一个时间范围参数 t0：
#   "survdiff"（默认）: predict 返回 S(t0 | X)，CATE = t0 时点生存概率差
#   "rmst"           : predict 返回 RMST(t0) = ∫₀^t0 S(u|X) du，
#                      CATE = 限制平均生存时间差
#
# 基学习器用字符串指定："coxph"（默认，线性预测、可解释）或 "ranger"
# （非线性，需装 ranger）。传 mlr3 的 lrn("surv.*") 会被明确拒绝并给出提示，
# 因为那需要 mlr3proba。
#
# 删失处理分工：
#   S/T 学习器不需要额外处理——生存模型本身（偏似然 / Kaplan-Meier）
#   已经在似然里正确处理了删失。
#   X/R/DR 需要个体尺度的结局（.surv_analysis_outcome）：
#     effect="survdiff": 取 I(T > t0)，删失由 IPCW 权重 1/G(Tᵢ⁻) 在外部校正
#     effect="rmst":     取 ξ = δ·min(X, τ)/Ĝ(X)，其期望即 RMST，
#                        IPCW 已含在 ξ 里，外部不再额外乘权重
# =====================================================================

# 1 在阶梯生存曲线上取 t0 时点的生存概率 --------------------------------------
# surv_mat 为 n x length(times) 的生存概率矩阵，times 为递增的事件时点。
# 生存函数是右连续阶梯函数，S(t0) = 最后一个不超过 t0 的事件时点处的值。
#
# 陷阱（已踩过）：这里不能用 ifelse(idx >= 1L, surv_mat[...], 1)——
# idx 是标量，而 ifelse 的返回值形状跟随 test，标量 test 只会返回第一个元素，
# 结果是所有样本拿到同一个预测值。必须用普通的分支 + 整列取值。
.surv_at_t0 <- function(surv_mat, times, t0) {
  n <- nrow(surv_mat)
  if (n == 0L || length(times) == 0L) return(rep(1, n))
  idx <- findInterval(t0, times)                     # 不超过 t0 的最后一个时点
  if (idx < 1L) return(rep(1, n))                    # t0 早于所有事件时点
  as.numeric(surv_mat[, idx])
}

# 2 把 S(t0) 换成 RMST：对生存曲线在 [0, t0] 上做梯形积分 ---------------------
# S_at_u 是一个函数：给定时间向量 u（长度 m），返回 n x m 的生存概率矩阵。
# RMST(tau) = E[min(T, tau)] = ∫₀^tau S(u) du
.surv_rmst <- function(S_at_u, tau, n_grid = 200L) {
  u <- seq(0, tau, length.out = n_grid + 1L)
  S <- S_at_u(u)                                     # n x (n_grid + 1)
  du <- diff(u)
  # 梯形权重：首尾各半个步长
  w <- c(du / 2, 0) + c(0, du / 2)
  as.numeric(S %*% w)
}

# 3 拟合一个原生生存基学习器 ---------------------------------------------------
# kind   = "coxph"（默认，线性预测，可解释）或 "ranger"（非线性）
# effect = "survdiff"（返回 S(t0)）或 "rmst"（返回 ∫₀^t0 S(u) du）
.fit_surv <- function(X, time, status, kind = c("coxph", "ranger"), t0,
                      weights = NULL, effect = c("survdiff", "rmst")) {
  kind <- match.arg(kind)
  effect <- match.arg(effect)
  d <- data.frame(X, .time = as.numeric(time), .status = as.integer(status))

  # 3.1 统一的"查询生存概率"接口：输入协变量与时间向量 u，返回 n x length(u) 矩阵
  if (kind == "coxph") {
    fit <- survival::coxph(
      survival::Surv(.time, .status) ~ .,
      data = d, weights = weights, model = TRUE, x = TRUE
    )
    S_at_u <- function(newX, u) {
      nd <- as.data.frame(newX)
      sf <- survival::survfit(fit, newdata = nd, se.fit = FALSE)
      m <- summary(sf, times = u)$surv
      # 注意：summary.survfit 的 $surv 是 length(u) x n（时间为行、样本为列），
      # 不是 n x length(u)。单时间点时 as.numeric 恰好也是对的，
      # 但积分要多个时间点，必须显式转置，否则样本之间会串位。
      t(matrix(as.numeric(m), nrow = length(u), ncol = nrow(nd)))
    }
  } else {
    if (!requireNamespace("ranger", quietly = TRUE)) {
      stop("kind = 'ranger' 需要安装 ranger 包；或改用默认的 kind = \"coxph\"。")
    }
    fit <- ranger::ranger(
      survival::Surv(.time, .status) ~ .,
      data = d, probability = TRUE,
      case.weights = weights, num.trees = 500, seed = 1
    )
    evt <- fit$unique.death.times
    S_at_u <- function(newX, u) {
      nd <- as.data.frame(newX)
      sm <- predict(fit, data = nd)$survival           # n x length(evt)
      idx <- findInterval(u, evt)
      out <- matrix(1, nrow = nrow(nd), ncol = length(u))
      ok <- idx >= 1L
      if (any(ok)) out[, ok] <- sm[, idx[ok], drop = FALSE]
      out
    }
  }

  # 3.2 按 effect 决定 predict 返回什么
  if (effect == "survdiff") {
    pred <- function(newX) as.numeric(S_at_u(newX, t0)[, 1L])
  } else {
    pred <- function(newX) .surv_rmst(function(u) S_at_u(newX, u), t0)
  }
  list(kind = kind, t0 = t0, effect = effect, model = fit, predict = pred)
}

# 4 删失 IPCW 权重 -------------------------------------------------------------
# G(t|x) = P(C > t | x)，C 为删失时间。Cox 模型对删失指示 (1 - status) 建模，
# 取 Breslow 基线累积危险的左极限 H0(t-)，再乘 exp(x'beta) 得 H(t-|x)，
# G = exp(-H)。最后截断到 [0.01, 1]，避免极端权重把估计搅坏。
.surv_ipcw <- function(time, status, X) {
  time <- as.numeric(time)
  status <- as.integer(status)
  cens <- 1L - status
  if (!any(cens > 0L)) return(rep(1, length(time)))     # 没有删失，权重全为 1

  d <- data.frame(X, .time = time, .cens = cens)
  fit <- survival::coxph(survival::Surv(.time, .cens) ~ ., data = d, x = TRUE)
  bh <- survival::basehaz(fit, centered = FALSE)        # 列: time, hazard
  bh <- bh[order(bh$time), ]
  lp <- as.numeric(predict(fit, type = "lp", newdata = as.data.frame(X)))
  idx <- findInterval(time, bh$time, left.open = TRUE)  # 严格小于 t_i 的删失时点个数
  H0 <- ifelse(idx >= 1L, bh$hazard[pmax(idx, 1L)], 0)
  pmin(pmax(exp(-H0 * exp(lp)), 0.01), 1)
}

# 5 X/R/DR 需要的个体尺度分析结局 ---------------------------------------------
#   survdiff: Yv = I(T > t0)，删失由外部乘 IPCW 权重校正
#   rmst:     Yv = ξ = δ · min(X, τ) / Ĝ(X)，其中 X = min(T, C)、δ = 1{T ≤ C}
#             独立删失下有 E[ξ] = E[min(T, τ)] = RMST(τ)，
#             所以删失校正已含在 ξ 内，外部不再额外乘 IPCW
.surv_analysis_outcome <- function(time, status, X, t0, effect) {
  time <- as.numeric(time)
  status <- as.integer(status)
  if (identical(effect, "rmst")) {
    G <- .surv_ipcw(time, status, X)
    # 不要把 ξ 截到 τ：虽然真值 min(T, τ) ≤ τ，但 IPCW 估计量要靠被 1/Ĝ 放大的
    # 那些观测来保持无偏。实测截断会把 R/DR 的 ATE 从 +0.29 压到 −0.02（真值 0.19）。
    # 代价是 X/R/DR 的 RMST 方差明显大于 T（T 只用结局模型、不用个体结局）。
    as.numeric(status * pmin(time, t0) / G)
  } else {
    as.integer(time > t0)
  }
}
