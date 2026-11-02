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

#' 读取因果推断基准数据集
#'
#' 加载随包分发的基准数据集（来自 \pkg{grf}、\pkg{econml}、\pkg{causalml} 自带的测试/合成数据），
#' 每个数据集都带有真实个体处理效应列 \code{cate_true}，可用于评估各类 HTE 估计量。
#' 数据同时以 \code{.RData} 与 \code{.csv} 两种格式随包分发（安装后即位于本地 library），
#' 本函数优先读取 \code{.RData}（保留列类型、加载更快），缺失时回退 \code{.csv}。
#'
#' @param name 数据集名称，详见 \code{\link{mlr3HTE_benchmark_meta}} 的 \code{dataset} 列。
#'   默认 \code{NULL} 返回全部；传入单个或多个名称则返回对应数据。
#' @param path 基准数据目录，默认通过 \code{system.file} 定位包内 \code{inst/extdata/benchmarks}。
#' @return 单个 \code{data.frame}（仅取一个数据集时）或命名 \code{list}（取多个或全部）。
#' @export
#' @examples
#' \dontrun{
#' # 列出所有可用基准数据集
#' mlr3HTE_benchmark_meta()
#' # 取单个数据集
#' d <- mlr3HTE_benchmark_data("grf_causal")
#' # 取全部（命名 list）
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
      stop("未知数据集: ", paste(bad, collapse = ", "),
           "。可用名称见 mlr3HTE_benchmark_meta()$dataset", call. = FALSE)
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
      stop("找不到数据集 ", nm, " 的 .RData 或 .csv 文件。", call. = FALSE)
    }
    readr::read_csv(csv, show_col_types = FALSE)
  })
  names(out) <- name
  if (length(out) == 1L) out[[1L]] else out
}

#' 读取基准数据集元信息（数据字典）
#'
#' 返回一张描述每张基准数据集的表：来源包、生成函数、样本量、特征数、结局/处理类型、
#' 是否含真实处理效应、真实 ATE 与字段说明。优先读取 \code{benchmarks_meta.RData}，
#' 缺失时回退 \code{benchmarks_meta.csv}。
#'
#' @param path 基准数据目录，默认通过 \code{system.file} 定位包内 \code{inst/extdata/benchmarks}。
#' @return 一个 \code{tibble}，每行对应一个数据集。
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

#' 导出基准数据集到指定目录
#'
#' 将包内所有基准数据集（RData + CSV）与元信息文件复制到用户指定目录，
#' 便于在包外直接使用或上传到其它仓库。
#'
#' @param dest 目标目录；不存在则自动创建。
#' @param path 基准数据目录，默认通过 \code{system.file} 定位包内 \code{inst/extdata/benchmarks}。
#' @return 被复制的文件路径组成的字符向量（不可见返回）。
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
