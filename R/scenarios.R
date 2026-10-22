# =====================================================================
# scenarios.R —— 基准模拟数据体系（10 个设计 × 3 类结局）
#
# 目的：为 HTE 方法学比较提供一组「结构可控、真值已知」的基准数据。
#       旧版六个 demo_* 函数只覆盖「线性混杂 + 线性 HTE」一种结构，
#       无法回答「非线性混杂下 IPTW 是否仍然够用」「效应修饰与混杂共用
#       同一变量时哪个 learner 更稳」这类问题。这里把结构显式参数化。
#
# 四个设计维度：
#   1. design        随机化（rct）/ 观察性（obs）
#   2. confounding   无 / 线性 / 非线性（仅 obs 有混杂）
#   3. hte           线性 / 非线性（真实 CATE 对协变量的函数形式）
#   4. shared        是否存在「既影响处理分配、又修饰治疗效应」的变量
#
# 因果结构约定：
#   协变量 Z = (z1, z2, z3, sex)，z1/z2 已标准化，z3 = (age - 60) / 12
#   效应修饰：tau 只由 z1（线性或非线性）与 z2 决定
#   处理分配：logit e 由 z2 决定；shared = TRUE 时 z1 也进入 e
#     -> shared = FALSE：混杂变量（z2）与效应修饰变量（z1）不相交
#     -> shared = TRUE ：z1 同时进入 e 与 tau，是混杂因子兼效应修饰因子
#   预后：mu 由 z1 / z2 / z3 / sex 决定，与 tau 共享 z1、z2（故两族相关但不相同）
#
# 三类结局共用同一份 (Z, A, tau)，只是把 tau 映射到各自的效应尺度：
#   连续  ：均值差
#   二分类：风险差（对数几率尺度加 tau_logit，再逐人换算到风险差）
#   生存  ：t0 时点生存概率差（风险乘 exp(-tau)），另给 RMST 版真值
# =====================================================================

# 1 场景清单 -------------------------------------------------------------------
# 10 个设计 id。字段全部是「结构标签」，供 mlr3HTE_scenarios() 展示与筛选。
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

#' 基准模拟场景清单
#'
#' @description
#' 列出 \code{\link{mlr3HTE_scenario}} 支持的 10 个基准设计及其结构标签。
#' 四个维度分别是：研究设计（\code{design}）、混杂机制的函数形式
#' （\code{confounding}）、真实 CATE 的函数形式（\code{hte}），以及是否存在
#' **同时影响处理分配与治疗效应**的协变量（\code{shared}）。
#'
#' 这一组场景用于方法学比较：固定其余结构、只改变一个维度，即可分离出
#' 「非线性混杂」「非线性效应修饰」「混杂与效应修饰共用变量」各自对
#' 估计量的影响，而不会把多个来源的偏差混在一起。
#'
#' @return data.frame，每行一个设计，列为 \code{id} / \code{design} /
#'   \code{confounding} / \code{hte} / \code{shared}。
#' @seealso \code{\link{mlr3HTE_scenario}}, \code{\link{mlr3HTE_bench}}
#' @export
#' @examples
#' mlr3HTE_scenarios()
mlr3HTE_scenarios <- function() {
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
#' 生成一个基准模拟场景
#'
#' @description
#' 按 \code{\link{mlr3HTE_scenarios}} 中的结构标签生成一份带真值的模拟数据。
#' 同一个 \code{id} + \code{outcome} + \code{n} + \code{seed} 组合结果完全可复现，
#' 因此可以直接作为方法学比较的固定基准。
#'
#' 真值 \code{tau} 的定义随结局尺度变化：连续结局为**均值差**，二分类为
#' **风险差**（逐人换算，不是对数几率尺度的常数），生存结局为
#' \strong{t0 时点生存概率差}；生存结局同时返回 RMST 尺度的真值
#' \code{tau_rmst}。ATE 为 \code{tau} 的样本均值。
#'
#' @param id 场景 id，见 \code{\link{mlr3HTE_scenarios}}。
#' @param outcome 结局类型：\code{"continuous"}（默认）/ \code{"binary"} /
#'   \code{"survival"}。
#' @param n 样本量，默认 2000。
#' @param seed 随机种子；默认 \code{NULL} 时按 \code{id} 与 \code{outcome}
#'   派生一个固定种子，保证不同场景之间互不相同但各自可复现。
#' @param t0 生存结局的效应评估时点，默认 2。
#' @return list：
#'   \itemize{
#'     \item \code{X} 协变量 data.frame（age / lac / tumor / sex）
#'     \item \code{A} 处理指示（0/1）
#'     \item \code{Y} 结局（生存结局为 \code{Surv} 对象）
#'     \item \code{tau} 逐人真实 CATE（当前结局尺度）
#'     \item \code{ate} 真实 ATE = \code{mean(tau)}
#'     \item \code{ps_true} 真实倾向得分（RCT 恒为 0.5）
#'     \item \code{tau_rmst} / \code{ate_rmst} 生存结局的 RMST 尺度真值
#'     \item \code{meta} 该场景的结构标签与参数
#'   }
#' @seealso \code{\link{mlr3HTE_scenarios}}, \code{\link{mlr3HTE_bench}}
#' @export
#' @examples
#' d <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "continuous", n = 500, seed = 1)
#' c(ate = d$ate, n = nrow(d$X), share_confounder = d$meta$shared)
mlr3HTE_scenario <- function(id, outcome = c("continuous", "binary", "survival"),
                             n = 2000, seed = NULL, t0 = 2) {
  outcome <- match.arg(outcome)
  cat_df  <- .scen_catalog()
  if (!id %in% cat_df$id) {
    stop(sprintf("未知场景 id：%s。可用取值见 mlr3HTE_scenarios()。", id))
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
#' 随包发布的基准模拟数据（.rda）
#'
#' @description
#' \code{\link{mlr3HTE_scenario}} 已按 10 个设计 × 3 类结局预生成完毕，
#' 以 \code{n = 2000}、固定种子打包在 \code{data/mlr3hte_bench_data.rda} 中随包发布。
#' 方法学比较应统一使用这一份数据，避免各自重新模拟导致结论不可比。
#'
#' 每个元素与 \code{mlr3HTE_scenario()} 的返回值结构相同；集合本身的
#' 键为 \code{<场景 id>.<结局>}，例如 \code{"obs_nonlin_nonlin_sharedT.survival"}。
#' 键的完整清单见 \code{mlr3HTE_bench_index()}。
#'
#' @param id 场景 id，见 \code{\link{mlr3HTE_scenarios}}。
#' @param outcome 结局类型。
#' @return 与 \code{\link{mlr3HTE_scenario}} 相同的 list；若该组合没有被
#'   预生成，则从磁盘上的场景生成器即时重算（结果一致，只是慢一点）。
#' @seealso \code{\link{mlr3HTE_scenarios}}, \code{\link{mlr3HTE_scenario}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "survival")
#' c(ate = d$ate, t0 = d$t0)
#' }
mlr3HTE_bench <- function(id, outcome = c("continuous", "binary", "survival")) {
  outcome <- match.arg(outcome)
  key <- paste(id, outcome, sep = ".")
  obj <- .bench_bundle()
  if (!is.null(obj) && key %in% names(obj)) return(obj[[key]])
  mlr3HTE_scenario(id, outcome, n = 2000)
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

#' 已打包基准数据的索引
#'
#' @description 列出 \code{data/mlr3hte_bench_data.rda} 中实际存在的键，方便批量循环。
#' @return data.frame：\code{key} / \code{id} / \code{outcome} / \code{ate} /
#'   \code{n}。
#' @seealso \code{\link{mlr3HTE_bench}}
#' @export
mlr3HTE_bench_index <- function() {
  obj <- .bench_bundle()
  if (is.null(obj)) {
    stop("未找到 mlr3hte_bench_data 数据对象，请重新安装本包。")
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
