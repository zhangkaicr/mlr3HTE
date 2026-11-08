# 目的：把原先分散的模拟数据 / 场景 / 打包基准 / 跨包基准数据的生成入口
#       收敛为三个按结局类型划分的统一门面，其余同名实现转为包内函数。
# 输入：用户参数（样本量、设计、数据来源等）
# 输出：统一结构的 list：X / A / Y / tau / ate（观察性另含 ps_true，生存另含 t0）
# 依赖：R/api.R、R/scenarios.R、R/dag.R、R/benchmarks.R 中的内部实现

# 1 内部路由助手 ----

# 旧版六个 DGP 各有自己的默认种子；门面按「结局 x 设计」复原，
# 保证替换调用后实测输出逐位不变（不是随便换个好看的整数）。
.demo_default_seed <- function(outcome, setting) {
  tbl <- list(
    rct = c(continuous = 1201L, binary = 1202L, survival = 1203L),
    obs = c(continuous = 1204L, binary = 1205L, survival = 1206L)
  )
  tbl[[setting]][[outcome]]
}

# 从跨包基准数据集的 data.frame 整理成统一 list；列名按各来源包做映射。
# 结局类型由数据自身的列推断：五份数据里有生存（time/event）、多臂二分类
# （treatment_group_key/conversion）和连续（treatment/outcome）三种，
# 不能拿门面的结局类型硬套，否则一次加载全部时会对不上列。
.demo_benchmark_as_list <- function(d) {
  nm <- names(d)
  a_col <- intersect(c("treatment", "treatment_group_key", "A"), nm)[1L]
  y_col <- intersect(c("outcome", "conversion", "Y"), nm)[1L]
  x_cols <- grep("^x", nm, value = TRUE)
  is_surv <- all(c("time", "event") %in% nm)
  if (is.na(a_col) || (is.na(y_col) && !is_surv)) {
    stop("Benchmark dataset does not expose a treatment or outcome column.", call. = FALSE)
  }
  A_raw <- d[[a_col]]
  A <- if (is.numeric(A_raw)) as.integer(A_raw) else as.integer(A_raw != "control")
  Y <- if (is_surv) survival::Surv(d$time, d$event) else d[[y_col]]
  tau <- if ("cate_true" %in% nm) d$cate_true else rep(NA_real_, nrow(d))
  out <- list(X = as.data.frame(d[, x_cols, drop = FALSE]), A = A, Y = Y,
              tau = tau, ate = mean(tau, na.rm = TRUE))
  if (is_surv) out$t0 <- stats::median(d$time)
  # 保留原始列，方便需要按来源包字段名做分析的场合（例如 uplift 的多臂标签）。
  out$raw <- d
  out
}

# 通用分发：三个门面只有结局类型不同，其余路由完全一致。
# seed = NULL 时由 .demo_default_seed() 复原旧默认；scenario 分支例外，
# 旧场景生成器自己按 id + outcome 派生种子，这里必须继续传 NULL。
.demo_dispatch <- function(outcome, n, setting, strength, treat_frac, t0, seed,
                           source, dataset, scenario, design, catalog,
                           export_to, ...) {
  setting <- match.arg(setting, c("rct", "obs"))
  source  <- match.arg(source, c("simulated", "bundled", "benchmark"))

  # 数据字典 / 导出属于数据访问，统一从连续结局入口取，避免三个入口各有一份
  if (!is.null(export_to)) return(.demo_benchmark_export(export_to))
  if (isTRUE(catalog)) {
    return(if (source == "benchmark") .demo_benchmark_meta() else
           if (source == "bundled") .demo_bench_index() else .demo_scenarios())
  }
  if (!is.null(design)) return(.demo_dag_data(design, outcome))
  if (!is.null(scenario)) {
    return(.demo_scenario(scenario, outcome, n = n, seed = seed, ...))
  }
  if (source == "bundled") {
    if (is.null(dataset)) stop("source = \"bundled\" requires a dataset key.", call. = FALSE)
    return(.demo_bench(dataset, outcome))
  }
  if (source == "benchmark") {
    raw <- .demo_benchmark_data(dataset)
    if (is.null(dataset)) return(lapply(raw, .demo_benchmark_as_list))
    return(.demo_benchmark_as_list(raw))
  }

  if (is.null(seed)) seed <- .demo_default_seed(outcome, setting)
  if (setting == "obs") {
    out <- switch(outcome,
      continuous = .demo_continuous_obs(n = n, strength = strength, seed = seed),
      binary     = .demo_binary_obs(n = n, strength = strength, seed = seed),
      survival   = .demo_surv_obs(n = n, t0 = t0, strength = strength, seed = seed))
    return(out)
  }
  switch(outcome,
    continuous = .demo_continuous_rct(n = n, treat_frac = treat_frac, seed = seed),
    binary     = .demo_binary_rct(n = n, treat_frac = treat_frac, seed = seed),
    survival   = .demo_surv_rct(n = n, treat_frac = treat_frac, t0 = t0, seed = seed))
}

# 2 连续结局 ----

#' Simulated or benchmark data with a continuous outcome
#'
#' @description The single entry point for continuous-outcome data. It covers the RCT and
#'   observational DGPs, the ten structural scenarios, the bundled benchmark grid, the
#'   DAG node/edge tables and the cross-package benchmark datasets shipped in
#'   \code{inst/extdata/benchmarks}.
#'
#'   Use \code{setting = "obs"} for measured confounding, \code{scenario = <id>} for one
#'   of the ten structural designs, \code{source = "bundled"} for the pre-generated
#'   benchmark grid, and \code{source = "benchmark"} for the grf / econml / causalml
#'   datasets. \code{catalog = TRUE} returns the corresponding index table and
#'   \code{export_to = <dir>} copies all benchmark files to disk.
#'
#'   Together with \code{\link{mlr3HTE_demo_binary}} and
#'   \code{\link{mlr3HTE_demo_surv}}, these three functions replace the older
#'   collection of single-purpose data generators.
#' @param n Sample size for simulated data; default 4000.
#' @param setting \code{"rct"} (default) or \code{"obs"} (measured confounding).
#' @param strength Confounding strength for \code{setting = "obs"}; 0 is close to an RCT.
#' @param treat_frac Treated proportion under \code{setting = "rct"}.
#' @param seed Random seed. \code{NULL} (default) reproduces the legacy generator's
#'   seed for this outcome type and design (1201-1206).
#' @param source \code{"simulated"} (default), \code{"bundled"} (the shipped 10-design grid)
#'   or \code{"benchmark"} (the grf / econml / causalml datasets).
#' @param dataset Dataset key for \code{source = "bundled"} or name for \code{source = "benchmark"}.
#'   \code{NULL} under \code{source = "benchmark"} loads every dataset as a named list.
#'   For cross-package benchmarks the outcome type is inferred from each dataset's own
#'   columns (time/event, multi-arm conversion, or continuous outcome), so all three
#'   facades return the same structure for this source.
#' @param scenario Structural scenario id; see \code{catalog = TRUE}.
#' @param design DAG design (\code{"rct"} / \code{"obs"}); returns node and edge tables.
#' @param catalog If \code{TRUE}, return the scenario / benchmark index instead of a dataset.
#' @param export_to Optional destination directory; copies all bundled benchmark files there.
#' @param ... Extra arguments forwarded to the internal scenario generator (e.g. \code{t0}).
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau} (true CATE), \code{ate};
#'   observational data also carry \code{ps_true}, survival data \code{t0},
#'   \code{tau_rmst} and \code{ate_rmst}. Data read from
#'   \code{source = "benchmark"} additionally carry \code{raw} (the untouched
#'   source table). Catalogue and DAG requests return their own structures.
#' @export
#' @examples
#' d <- mlr3HTE_demo_continuous(n = 500, seed = 1)
#' mean(d$tau)
#' # index of the ten structural scenarios
#' head(mlr3HTE_demo_continuous(catalog = TRUE))
#' # observational data with measured confounding
#' d_obs <- mlr3HTE_demo_continuous(n = 500, setting = "obs")
#' mean(d_obs$ps_true)
#' # a cross-package benchmark dataset
#' b <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "grf_causal")
#' b$ate
mlr3HTE_demo_continuous <- function(n = 4000, setting = c("rct", "obs"),
                                    strength = 1, treat_frac = 0.5, seed = NULL,
                                    source = c("simulated", "bundled", "benchmark"),
                                    dataset = NULL, scenario = NULL, design = NULL,
                                    catalog = FALSE, export_to = NULL, ...) {
  .demo_dispatch("continuous", n, setting, strength, treat_frac, NULL, seed,
                 source, dataset, scenario, design, catalog, export_to, ...)
}

# 3 二分类结局 ----

#' Simulated or benchmark data with a binary outcome
#'
#' @description Binary-outcome counterpart of \code{\link{mlr3HTE_demo_continuous}}.
#'   The same \code{setting} / \code{source} / \code{scenario} routing applies.
#'   \code{tau} is the true CATE on the risk-difference scale.
#' @inheritParams mlr3HTE_demo_continuous
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau}, \code{ate};
#'   observational data also carry \code{ps_true}.
#' @export
#' @examples
#' d <- mlr3HTE_demo_binary(n = 500, seed = 1)
#' mean(d$tau)
#' d_obs <- mlr3HTE_demo_binary(n = 500, setting = "obs")
#' mean(d_obs$ate)
mlr3HTE_demo_binary <- function(n = 4000, setting = c("rct", "obs"),
                                strength = 1, treat_frac = 0.5, seed = NULL,
                                source = c("simulated", "bundled", "benchmark"),
                                dataset = NULL, scenario = NULL, design = NULL,
                                catalog = FALSE, export_to = NULL, ...) {
  .demo_dispatch("binary", n, setting, strength, treat_frac, NULL, seed,
                 source, dataset, scenario, design, catalog, export_to, ...)
}

# 4 生存结局 ----

#' Simulated or benchmark data with a survival outcome
#'
#' @description Survival-outcome counterpart of \code{\link{mlr3HTE_demo_continuous}}.
#'   \code{Y} is a \code{survival::Surv} object and \code{t0} is the effect evaluation time.
#'   The same \code{setting} / \code{source} / \code{scenario} routing applies.
#' @inheritParams mlr3HTE_demo_continuous
#' @param t0 Effect evaluation time point; default 2.
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau}, \code{ate}, \code{t0},
#'   \code{tau_rmst}, \code{ate_rmst}; observational data also carry \code{ps_true}.
#' @export
#' @examples
#' d <- mlr3HTE_demo_surv(n = 500, seed = 1)
#' c(ate = d$ate, t0 = d$t0)
#' d_obs <- mlr3HTE_demo_surv(n = 500, setting = "obs")
#' inherits(d_obs$Y, "Surv")
mlr3HTE_demo_surv <- function(n = 4000, setting = c("rct", "obs"),
                              strength = 1, treat_frac = 0.5, t0 = 2, seed = NULL,
                              source = c("simulated", "bundled", "benchmark"),
                              dataset = NULL, scenario = NULL, design = NULL,
                              catalog = FALSE, export_to = NULL, ...) {
  .demo_dispatch("survival", n, setting, strength, treat_frac, t0, seed,
                 source, dataset, scenario, design, catalog, export_to, ...)
}

# 99 收尾 ----
