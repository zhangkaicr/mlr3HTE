# =====================================================================
# scenarios.R — Benchmark simulation data system (10 designs x 3 outcome types)
#
# Purpose: provide a set of benchmark data with "controllable structure and known
#          truth" for HTE methodology comparison. The old six demo_* functions only
#          covered one structure ("linear confounding + linear HTE"), and could not
#          answer questions like "is IPTW still adequate under nonlinear confounding"
#          or "which learner is more stable when effect modification and confounding
#          share the same variable". Here the structure is made explicit and parameterized.
#
# Four design dimensions:
#   1. design        randomization (rct) / observational (obs)
#   2. confounding   none / linear / nonlinear (confounding only exists for obs)
#   3. hte           linear / nonlinear (the functional form of the true CATE in
#                    covariates)
#   4. shared        whether a variable exists that "both affects treatment assignment
#                    and modifies the treatment effect"
#
# Causal-structure conventions:
#   covariates Z = (z1, z2, z3, sex), z1/z2 standardized, z3 = (age - 60) / 12
#   effect modification: tau is determined only by z1 (linear or nonlinear) and z2
#   treatment assignment: logit e is determined by z2; when shared = TRUE, z1 also
#     enters e
#     -> shared = FALSE: the confounder (z2) and the effect-modifier (z1) are disjoint
#     -> shared = TRUE : z1 enters both e and tau, acting as both a confounder and an
#       effect modifier
#   prognosis: mu is determined by z1 / z2 / z3 / sex and shares z1, z2 with tau
#     (so the two families are correlated but not identical)
#
# The three outcome types share the same (Z, A, tau), only mapping tau onto their
# respective effect scales:
#   continuous : mean difference
#   binary     : risk difference (add tau_logit on the log-odds scale, then convert
#                per individual to risk difference)
#   survival   : survival probability difference at t0 (hazard multiplied by exp(-tau)),
#                with an RMST-version truth also provided
# =====================================================================

# 1 场景清单 -------------------------------------------------------------------
# 10 个设计 id。字段全部是「结构标签」，供 .demo_scenarios() 展示与筛选。
.scen_catalog <- function() {
  out <- data.frame(
    id = c("rct_lin", "rct_nonlin",
           "obs_lin_lin_sharedF", "obs_lin_lin_sharedT",
           "obs_lin_nonlin_sharedF", "obs_lin_nonlin_sharedT",
           "obs_nonlin_lin_sharedF", "obs_nonlin_lin_sharedT",
           "obs_nonlin_nonlin_sharedF", "obs_nonlin_nonlin_sharedT"),
    design       = c(rep("rct", 2), rep("obs", 8)),
    confounding  = c("none", "none", rep(c("linear", "nonlinear"), each = 4)),
    hte          = c("linear", "nonlinear",
                     "linear", "linear", "nonlinear", "nonlinear",
                     "linear", "linear", "nonlinear", "nonlinear"),
    shared       = c(FALSE, FALSE,
                     FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE),
    stringsAsFactors = FALSE
  )
  out
}

.demo_scenarios <- function() {
  .scen_catalog()
}

# 2 协变量 ---------------------------------------------------------------------
# 四个协变量刻意保留原始量纲（age 岁、lac 倍数、tumor 厘米），
# 同时在内部另算标准化版本给 DGP 用——这样 X 里既有可解释的原始单位，
# 又不必让读者去追标准化后的系数。
.scen_covariates <- function(n) {
  age   <- stats::rnorm(n, 60, 12)
  lac   <- stats::rnorm(n, 2.5, 1.2)
  tumor <- stats::rnorm(n, 5, 2)
  sex   <- stats::rbinom(n, 1, 0.45)
  list(
    X  = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
    z1 = as.numeric(scale(lac)),
    z2 = as.numeric(scale(tumor)),
    z3 = (age - 60) / 12
  )
}

# 3 真实 CATE（效应修饰机制）--------------------------------------------------
# 线性：tau 对 z1 与 z2 都是一次项
# 非线性：z1 走正弦（周期约 4 个标准差），z2 走二次项（U 形）
# 两种形式的均值都刻意接近 1.0，便于跨场景比较偏差而不被尺度差异掩盖。
.scen_tau <- function(z1, z2, hte) {
  if (identical(hte, "linear")) {
    1.0 + 0.8 * z1 - 0.5 * z2
  } else {
    1.0 + 1.1 * sin(1.4 * z1) - 0.5 * (z2^2 - 1) / 1.3
  }
}

# 4 处理分配机制（混杂）--------------------------------------------------------
# confounding = "none"  ：e 恒为 0.5（随机化）
# confounding = "linear"：logit e 对 z2 线性
# confounding = "nonlinear"：logit e 对 z2 取正弦 + 二次项
# shared = TRUE 时把 z1 一并放进 e（同样按对应形式），使 z1 成为混杂-修饰共用变量
.scen_ps <- function(z1, z2, confounding, shared) {
  if (identical(confounding, "none")) return(rep(0.5, length(z1)))
  if (identical(confounding, "linear")) {
    eta <- -0.3 + 0.9 * z2
    if (shared) eta <- eta + 0.7 * z1
  } else {
    eta <- -0.3 + 1.1 * sin(1.3 * z2) - 0.4 * (z2^2 - 1) / 1.4
    if (shared) eta <- eta + 0.9 * sin(1.3 * z1)
  }
  stats::plogis(eta)
}

# 5 预后机制（基线结局）--------------------------------------------------------
# 连续结局的基线均值。z1、z2 同时进入 tau 与 mu，所以「预后好的人效应不一定大」，
# 这正是需要 CATE 而非仅 ATE 的原因。
.scen_mu <- function(z1, z2, z3, sex) {
  # z3 = (age - 60) / 12，所以 -0.02 * (age - 60) 等价于 -0.24 * z3
  6 + 0.4 * z1 + 0.5 * z2 - 0.24 * z3 + 0.3 * sex
}

# 6 三类结局 ---------------------------------------------------------------
.scen_y_continuous <- function(mu, A, tau, sd_noise = 1) {
  mu + A * tau + stats::rnorm(length(mu), 0, sd_noise)
}

.scen_y_binary <- function(z1, z2, z3, sex, A, tau_logit) {
  p0 <- stats::plogis(-1.2 + 0.5 * z1 + 0.4 * z2 + 0.1 * z3 + 0.2 * sex)
  p1 <- stats::plogis(stats::qlogis(p0) + tau_logit)
  y  <- stats::rbinom(length(p0), 1, ifelse(A == 1L, p1, p0))
  list(Y = y, tau = p1 - p0, p0 = p0, p1 = p1)
}

.scen_y_survival <- function(z1, z2, z3, sex, A, tau, t0, cens_rate = 0.12) {
  base_rate <- exp(-1.0 + 0.3 * z1 + 0.2 * z2 + 0.1 * z3 + 0.15 * sex)
  rate <- base_rate * exp(-A * tau)
  Tt <- stats::rexp(length(rate), rate = rate)
  Cc <- stats::rexp(length(rate), rate = cens_rate)
  time   <- pmin(Tt, Cc)
  status <- as.integer(Tt <= Cc)
  s0 <- exp(-base_rate * t0)
  s1 <- exp(-base_rate * exp(-tau) * t0)
  rmst_fun <- function(lam) (1 - exp(-lam * t0)) / lam
  list(
    Y = survival::Surv(time, status),
    tau = s1 - s0, tau_rmst = rmst_fun(base_rate * exp(-tau)) - rmst_fun(base_rate)
  )
}

# 7 单个场景生成器 -------------------------------------------------------------
.demo_scenario <- function(id, outcome = c("continuous", "binary", "survival"),
                             n = 2000, seed = NULL, t0 = 2) {
  outcome <- match.arg(outcome)
  cat_df  <- .scen_catalog()
  if (!id %in% cat_df$id) {
    stop(sprintf("Unknown scenario id: %s. See .demo_scenarios() for valid values.", id))
  }
  spec <- cat_df[cat_df$id == id, , drop = FALSE]

  # 默认种子按 id + 结局派生：不同场景的数据彼此独立，但同一场景可复现
  if (is.null(seed)) {
    seed <- 1000L + match(id, cat_df$id) * 10L +
      match(outcome, c("continuous", "binary", "survival"))
  }
  set.seed(seed)

  cv <- .scen_covariates(n)
  e  <- .scen_ps(cv$z1, cv$z2, spec$confounding, spec$shared)
  A  <- stats::rbinom(n, 1, e)

  # HTE 机制：连续结局直接用 tau 本身；二分类当作对数几率增量；生存当作对数风险增量
  if (identical(outcome, "binary")) {
    tau_lin <- .scen_tau(cv$z1, cv$z2, spec$hte)
    tau_logit <- 0.6 * tau_lin                 # 压缩尺度，避免风险差饱和
    yb  <- .scen_y_binary(cv$z1, cv$z2, cv$z3, cv$X$sex, A, tau_logit)
    res <- list(Y = yb$Y, tau = yb$tau, extra = list(p0 = yb$p0, p1 = yb$p1))
  } else if (identical(outcome, "survival")) {
    tau_lin <- 0.5 * .scen_tau(cv$z1, cv$z2, spec$hte)
    ys  <- .scen_y_survival(cv$z1, cv$z2, cv$z3, cv$X$sex, A, tau_lin, t0)
    res <- list(Y = ys$Y, tau = ys$tau,
                extra = list(tau_rmst = ys$tau_rmst))
  } else {
    tau_lin <- .scen_tau(cv$z1, cv$z2, spec$hte)
    mu  <- .scen_mu(cv$z1, cv$z2, cv$z3, cv$X$sex)
    res <- list(Y = .scen_y_continuous(mu, A, tau_lin), tau = tau_lin,
                extra = list(mu = mu))
  }

  out <- list(
    X = cv$X, A = A, Y = res$Y, tau = res$tau, ate = mean(res$tau),
    ps_true = e, t0 = if (identical(outcome, "survival")) t0 else NULL,
    meta = list(id = id, design = spec$design, confounding = spec$confounding,
                hte = spec$hte, shared = spec$shared, outcome = outcome,
                n = n, seed = seed, t0 = t0)
  )
  # 生存结局带 RMST 尺度真值；其余结局这两个字段保留为 NULL（而不是直接删掉），
  # 这样无论哪种结局，返回 list 的键都是完整的，下游批量循环不必判断存在性。
  out["tau_rmst"] <- list(res$extra$tau_rmst)
  out["ate_rmst"] <- list(
    if (is.null(res$extra$tau_rmst)) NULL else mean(res$extra$tau_rmst)
  )
  out
}

# 8 随包发布的基准数据 ---------------------------------------------------------
.demo_bench <- function(id, outcome = c("continuous", "binary", "survival")) {
  outcome <- match.arg(outcome)
  key <- paste(id, outcome, sep = ".")
  obj <- .bench_bundle()
  if (!is.null(obj) && key %in% names(obj)) return(obj[[key]])
  .demo_scenario(id, outcome, n = 2000)
}

# 取随包发布的基准数据对象。用 get() 而不是直接引用对象名，
# 一是避免 R CMD check 的 no-visible-binding NOTE，二是让 pkgload 与
# 安装后两种环境都能命中（两者都能从包的命名空间里找到 LazyData 对象）。
.bench_bundle <- function() {
  ns <- environment(.bench_bundle)
  if (exists("mlr3hte_bench_data", envir = ns, inherits = TRUE)) {
    return(get("mlr3hte_bench_data", envir = ns, inherits = TRUE))
  }
  NULL
}

.demo_bench_index <- function() {
  obj <- .bench_bundle()
  if (is.null(obj)) {
    stop("The mlr3hte_bench_data data object was not found. Please reinstall the package.")
  }
  data.frame(
    key     = names(obj),
    id      = vapply(obj, function(x) x$meta$id, character(1)),
    outcome = vapply(obj, function(x) x$meta$outcome, character(1)),
    ate     = vapply(obj, function(x) as.numeric(x$ate), numeric(1)),
    n       = vapply(obj, function(x) as.numeric(x$meta$n), numeric(1)),
    stringsAsFactors = FALSE, row.names = NULL
  )
}
