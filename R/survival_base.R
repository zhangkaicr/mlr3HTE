# =====================================================================
# survival_base.R —— 原生生存基学习器 + 删失 IPCW 权重
#
# 生存分支【完全不依赖 mlr3proba】：直接用 survival::coxph 与 ranger 的
# 生存模式实现基学习器，包装成与另外两类结局一致的接口：
#
#   .fit_surv(X, time, status, kind, t0, weights)
#     -> 结局模型对象，自带 $predict(newX)，返回 S(t0 | newX)
#
# 基学习器用字符串指定："coxph"（默认，线性预测、可解释）或 "ranger"
# （非线性，需装 ranger）。传 mlr3 的 lrn("surv.*") 会被明确拒绝并给出提示，
# 因为那需要 mlr3proba。
#
# 删失处理分工：
#   S/T 学习器不需要额外处理——生存模型本身（偏似然 / Kaplan-Meier）
#   已经在似然里正确处理了删失。
#   X/R/DR 需要个体尺度的结局，生存资料上用 I(T > t0)，并用 IPCW 校正删失，
#   权重 = 1 / G(T_i-)。G 为给定协变量下删失时间的生存函数，这里用一个
#   Cox 模型对删失指示 (1 - status) 建模得到。
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

# 2 拟合一个原生生存基学习器 ---------------------------------------------------
# kind = "coxph"（默认，线性预测，可解释）或 "ranger"（非线性，需装 ranger）
.fit_surv <- function(X, time, status, kind = c("coxph", "ranger"), t0, weights = NULL) {
  kind <- match.arg(kind)
  d <- data.frame(X, .time = as.numeric(time), .status = as.integer(status))

  if (kind == "coxph") {
    fit <- survival::coxph(
      survival::Surv(.time, .status) ~ .,
      data = d, weights = weights, model = TRUE, x = TRUE
    )
    pred <- function(newX) {
      nd <- as.data.frame(newX)
      sf <- survival::survfit(fit, newdata = nd, se.fit = FALSE)
      # summary(..., times = t0) 对每个新样本返回 t0 处的生存概率（列向量）
      as.numeric(summary(sf, times = t0)$surv)
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
    pred <- function(newX) {
      nd <- as.data.frame(newX)
      sm <- predict(fit, data = nd)$survival           # n x length(evt)
      .surv_at_t0(sm, evt, t0)
    }
  }
  list(kind = kind, t0 = t0, model = fit, predict = pred)
}

# 3 删失 IPCW 权重 -------------------------------------------------------------
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
