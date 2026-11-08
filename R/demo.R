# 目的：把原先分散的模拟数据 / 场景 / 打包基准 / 跨包基准数据的生成入口
#       收敛为三个按结局类型划分的统一门面，其余同名实现转为包内函数。
# 输入：用户参数（样本量、设计、数据来源等）
# 输出：统一结构的 list：X / A / Y / tau / ate（观察性另含 ps_true，生存另含 t0）
# 依赖：R/api.R、R/scenarios.R、R/dag.R、R/benchmarks.R 中的内部实现

# 1 内部路由助手 ----

# 从跨包基准数据集的 data.frame 整理成统一 list；列名按各来源包做映射。
.demo_benchmark_as_list <- function(d, outcome) {
  nm <- names(d)
  a_col <- intersect(c("treatment", "treatment_group_key", "A"), nm)[1L]
  y_col <- intersect(c("outcome", "conversion", "Y"), nm)[1L]
  x_cols <- grep("^x", nm, value = TRUE)
  if (is.na(a_col) || is.na(y_col)) {
    stop("Benchmark dataset does not expose a treatment or outcome column.", call. = FALSE)
  }
  A_raw <- d[[a_col]]
  A <- if (is.numeric(A_raw)) as.integer(A_raw) else as.integer(A_raw != "control")
  Y <- if (outcome == "survival") {
    survival::Surv(d$time, d$event)
  } else {
    d[[y_col]]
  }
  tau <- if ("cate_true" %in% nm) d$cate_true else rep(NA_real_, nrow(d))
  out <- list(X = as.data.frame(d[, x_cols, drop = FALSE]), A = A, Y = Y,
              tau = tau, ate = mean(tau, na.rm = TRUE))
  if (outcome == "survival") out$t0 <- stats::median(d$time)
  out
}

# 通用分发：三个门面只有结局类型与默认种子不同，其余路由完全一致。
.demo_dispatch <- function(outcome, n, setting, strength, treat_frac, t0, seed,
                           source, dataset, scenario, design, catalog,
                           export_to, ...) {
  setting <- match.arg(setting, c("rct", "obs"))
  source  <- match.arg(source, c("simulated", "bundled", "benchmark"))

  # 数据字典 / 导出属于数据访问，统一从连续结局入口取，避免三个入口各有一份
  if (!is.null(export_to)) return(mlr3HTE_benchmark_export(export_to))
  if (isTRUE(catalog)) {
    return(if (source == "benchmark") mlr3HTE_benchmark_meta() else
           if (source == "bundled") mlr3HTE_bench_index() else mlr3HTE_scenarios())
  }
  if (!is.null(design)) return(mlr3HTE_dag_data(design, outcome))
  if (!is.null(scenario)) {
    return(mlr3HTE_scenario(scenario, outcome, n = n, seed = seed, ...))
  }
  if (source == "bundled") {
    if (is.null(dataset)) stop("source = \"bundled\" requires a dataset key.", call. = FALSE)
    return(mlr3HTE_bench(dataset, outcome))
  }
  if (source == "benchmark") {
    return(.demo_benchmark_as_list(mlr3HTE_benchmark_data(dataset), outcome))
  }

  if (setting == "obs") {
    out <- switch(outcome,
      continuous = mlr3HTE_demo_obs(n = n, strength = strength, seed = seed),
      binary     = mlr3HTE_demo_obs_binary(n = n, strength = strength, seed = seed),
      survival   = mlr3HTE_demo_obs_surv(n = n, t0 = t0, strength = strength, seed = seed))
    return(out)
  }
  switch(outcome,
    continuous = mlr3HTE_demo_data(n = n, treat_frac = treat_frac, seed = seed),
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
#' @param n Sample size for simulated data; default 4000.
#' @param setting \code{"rct"} (default) or \code{"obs"} (measured confounding).
#' @param strength Confounding strength for \code{setting = "obs"}; 0 is close to an RCT.
#' @param treat_frac Treated proportion under \code{setting = "rct"}.
#' @param seed Random seed.
#' @param source \code{"simulated"} (default), \code{"bundled"} (the shipped 10-design grid)
#'   or \code{"benchmark"} (the grf / econml / causalml datasets).
#' @param dataset Dataset key for \code{source = "bundled"} or name for \code{source = "benchmark"}.
#' @param scenario Structural scenario id, forwarded to the internal scenario generator.
#' @param design DAG design (\code{"rct"} / \code{"obs"}); returns node and edge tables.
#' @param catalog If \code{TRUE}, return the scenario / benchmark index instead of a dataset.
#' @param export_to Optional destination directory; copies all bundled benchmark files there.
#' @param ... Extra arguments forwarded to the internal scenario generator.
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau} (true CATE), \code{ate};
#'   observational data also carry \code{ps_true}, survival data \code{t0}.
#' @export
#' @examples
#' d <- mlr3HTE_demo_continuous(n = 500, seed = 1)
#' mean(d$tau)
mlr3HTE_demo_continuous <- function(n = 4000, setting = c("rct", "obs"),
                                    strength = 1, treat_frac = 0.5, seed = 1201,
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
#' @inheritParams mlr3HTE_demo_continuous
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau} (true CATE on the
#'   risk-difference scale), \code{ate}; observational data also carry \code{ps_true}.
#' @export
#' @examples
#' d <- mlr3HTE_demo_binary(n = 500, seed = 1)
#' mean(d$tau)
mlr3HTE_demo_binary <- function(n = 4000, setting = c("rct", "obs"),
                                       strength = 1, treat_frac = 0.5, seed = 1202,
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
#' @inheritParams mlr3HTE_demo_continuous
#' @param t0 Effect evaluation time point; default 2.
#' @return A list with \code{X}, \code{A}, \code{Y}, \code{tau}, \code{ate}, \code{t0}.
#' @export
#' @examples
#' d <- mlr3HTE_demo_surv(n = 500, seed = 1)
#' mean(d$tau)
mlr3HTE_demo_surv <- function(n = 4000, setting = c("rct", "obs"),
                                     strength = 1, treat_frac = 0.5, t0 = 2, seed = 1203,
                                     source = c("simulated", "bundled", "benchmark"),
                                     dataset = NULL, scenario = NULL, design = NULL,
                                     catalog = FALSE, export_to = NULL, ...) {
  .demo_dispatch("survival", n, setting, strength, treat_frac, t0, seed,
                 source, dataset, scenario, design, catalog, export_to, ...)
}

# 99 收尾 ----
