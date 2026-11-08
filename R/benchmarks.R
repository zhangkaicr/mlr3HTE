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

.demo_benchmark_data <- function(name = NULL, path = NULL) {
  path <- .benchmarks_dir(path)
  meta <- .demo_benchmark_meta(path)
  all_names <- meta$dataset
  if (is.null(name)) {
    name <- all_names
  } else {
    bad <- setdiff(name, all_names)
    if (length(bad) > 0) {
      stop("Unknown dataset: ", paste(bad, collapse = ", "),
           ". Available names are listed in .demo_benchmark_meta()$dataset", call. = FALSE)
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

.demo_benchmark_meta <- function(path = NULL) {
  path <- .benchmarks_dir(path)
  rda <- file.path(path, "benchmarks_meta.RData")
  if (file.exists(rda)) {
    return(readr::read_rds(rda))
  }
  readr::read_csv(file.path(path, "benchmarks_meta.csv"), show_col_types = FALSE)
}

.demo_benchmark_export <- function(dest, path = NULL) {
  path <- .benchmarks_dir(path)
  if (!dir.exists(dest)) dir.create(dest, recursive = TRUE)
  files <- list.files(path, pattern = "\\.(csv|RData)$", full.names = TRUE)
  copied <- file.copy(files, dest, overwrite = TRUE)
  invisible(file.path(dest, basename(files))[copied])
}

# 99 收尾 ----
