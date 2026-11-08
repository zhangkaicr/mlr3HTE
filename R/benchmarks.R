# 目的：提供因果推断基准数据集（grf / econml / causalml 自带测试数据）的统一读取接口
# 输入：随包分发的 inst/extdata/benchmarks/ 下 *.RData（首选）+ *.csv（兜底），含 benchmarks_meta.csv/.RData
# 输出：data.frame（单集）或命名 list（多集）；meta 为数据字典
# 依赖：readr
# 说明：数据由 dev/_gen_grf.R（R/grf）、dev/_gen_python.py（Python/econml/causalml）一次性烘焙为
#       CSV 与 RData 并存，运行时无需 Python，函数仅做读取。每条数据均带 cate_true（真实个体
#       处理效应）以便评估 HTE 估计。RData 保留列类型且加载更快，作为运行时首选；CSV 保留作
#       人工可查 / 跨语言使用。所有文件随 R CMD INSTALL 安装到本地 library。

# 0 环境与依赖 ----

.benchmarks_dir <- function(path = NULL) {
  if (is.null(path)) {
    path <- system.file("extdata", "benchmarks", package = "mlr3HTE")
  }
  path
}

# 给定数据集名，返回可用文件路径：优先 .RData，回退 .csv
.benchmark_file <- function(name, ext, path) {
  f <- file.path(path, paste0(name, ".", ext))
  if (file.exists(f)) f else NULL
}

#' Load causal-inference benchmark datasets
#'
#' Load the benchmark datasets shipped with the package (test/synthetic data from
#' \pkg{grf}, \pkg{econml}, and \pkg{causalml}). Every dataset carries a true
#' individual treatment-effect column \code{cate_true}, which is useful for
#' evaluating any HTE estimator. The data are distributed in both \code{.RData}
#' and \code{.csv} formats (installed into the local library at install time);
#' this function prefers \code{.RData} (preserves column types, faster to load)
#' and falls back to \code{.csv} when needed.
#'
#' @param name Dataset name(s); see the \code{dataset} column of
#'   \code{\link{mlr3HTE_benchmark_meta}}. \code{NULL} (default) returns all
#'   datasets; a single name or a vector of names returns the corresponding
#'   data.
#' @param path Benchmark data directory. Defaults to the package's
#'   \code{inst/extdata/benchmarks} located via \code{system.file}.
#' @return A single \code{data.frame} when one dataset is requested, or a named
#'   \code{list} of \code{data.frame}s when several or all are requested.
#' @export
#' @examples
#' \dontrun{
#' # list all available benchmark datasets
#' mlr3HTE_benchmark_meta()
#' # load a single dataset
#' d <- mlr3HTE_benchmark_data("grf_causal")
#' # load all datasets as a named list
#' all <- mlr3HTE_benchmark_data()
#' }
mlr3HTE_benchmark_data <- function(name = NULL, path = NULL) {
  path <- .benchmarks_dir(path)
  meta <- mlr3HTE_benchmark_meta(path)
  all_names <- meta$dataset
  if (is.null(name)) {
    name <- all_names
  } else {
    bad <- setdiff(name, all_names)
    if (length(bad) > 0) {
      stop("Unknown dataset: ", paste(bad, collapse = ", "),
           ". Available names are listed in mlr3HTE_benchmark_meta()$dataset", call. = FALSE)
    }
  }
  out <- lapply(name, function(nm) {
    rda <- .benchmark_file(nm, "RData", path)
    if (!is.null(rda)) {
      e <- new.env(parent = emptyenv())
      load(rda, envir = e)
      objs <- ls(e, all.names = TRUE)
      return(as.list(e)[[objs[1L]]])
    }
    csv <- .benchmark_file(nm, "csv", path)
    if (is.null(csv)) {
      stop("Could not find dataset ", nm, ": .RData or .csv file not found.", call. = FALSE)
    }
    readr::read_csv(csv, show_col_types = FALSE)
  })
  names(out) <- name
  if (length(out) == 1L) out[[1L]] else out
}

#' Load benchmark dataset metadata (data dictionary)
#'
#' Returns a table describing each benchmark dataset: source package, generator
#' function, sample size, number of features, outcome/treatment type, whether a
#' true treatment effect is included, the true ATE, and field descriptions.
#' Prefers \code{benchmarks_meta.RData} and falls back to
#' \code{benchmarks_meta.csv}.
#'
#' @param path Benchmark data directory. Defaults to the package's
#'   \code{inst/extdata/benchmarks} located via \code{system.file}.
#' @return A \code{tibble} with one row per dataset.
#' @export
#' @examples
#' \dontrun{
#' mlr3HTE_benchmark_meta()
#' }
mlr3HTE_benchmark_meta <- function(path = NULL) {
  path <- .benchmarks_dir(path)
  rda <- file.path(path, "benchmarks_meta.RData")
  if (file.exists(rda)) {
    return(readr::read_rds(rda))
  }
  readr::read_csv(file.path(path, "benchmarks_meta.csv"), show_col_types = FALSE)
}

#' Export benchmark datasets to a directory
#'
#' Copy all benchmark datasets (RData + CSV) and the metadata file from the
#' installed package to a user-specified directory, for use outside the package
#' or upload to another repository.
#'
#' @param dest Destination directory; created recursively if it does not exist.
#' @param path Benchmark data directory. Defaults to the package's
#'   \code{inst/extdata/benchmarks} located via \code{system.file}.
#' @return (Invisibly) the file paths that were copied.
#' @export
#' @examples
#' \dontrun{
#' mlr3HTE_benchmark_export("~/benchmarks")
#' }
mlr3HTE_benchmark_export <- function(dest, path = NULL) {
  path <- .benchmarks_dir(path)
  if (!dir.exists(dest)) dir.create(dest, recursive = TRUE)
  files <- list.files(path, pattern = "\\.(csv|RData)$", full.names = TRUE)
  copied <- file.copy(files, dest, overwrite = TRUE)
  invisible(file.path(dest, basename(files))[copied])
}

# 99 收尾 ----
