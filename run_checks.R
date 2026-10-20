# run_checks.R — mlr3HTE 一键复跑验证（测试 + 10 教程 + 汇总报告）
#
# 用法（务必在正常 UTF-8 locale 下运行，否则 R CMD INSTALL 会写坏懒加载库）：
#   env -u LC_ALL -u LANG -u LC_CTYPE Rscript run_checks.R
# 仅跑测试（快，跳过教程）：
#   env -u LC_ALL -u LANG -u LC_CTYPE Rscript run_checks.R --quick
#
# 退出码：全绿 0；有失败 / 错误非 0（便于 CI 判定）。

options(device = function(...) grDevices::png(..., type = "cairo"))

## ---- 定位仓库根（脚本所在目录，运行时不依赖 CWD） ----
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("^--file=", "", grep("^--file=", args, value = TRUE)[1])
root <- normalizePath(dirname(script_path))

## ---- 0) 装载包 + 装包完整性自检 ----
if (!requireNamespace("mlr3HTE", quietly = TRUE)) {
  stop("mlr3HTE 未安装。请先：pak::pak('zhangkaicr/mlr3HTE') 或 R CMD INSTALL .")
}
library(mlr3HTE)

# 若关键函数取不到，多半是坏 locale 下 R CMD INSTALL 写坏了懒加载库。
# 注意：lrn 是 importFrom(mlr3, lrn) 的再导出符号，位于命名空间的 imports 环境，
# 不在 ls(asNamespace(pkg)) 自身环境里——必须用 get(..., inherits=TRUE) 真正取一次，
# 这样既覆盖导入符号，又能在懒加载库损坏时（get 抛错）抓到问题。
ns <- asNamespace("mlr3HTE")
needed <- c("mlr3HTE_dag", "mlr3HTE_demo_data", "metalearner", "lrn")
missing <- c()
for (x in needed) {
  ok <- tryCatch({
    obj <- get(x, envir = ns, inherits = TRUE, mode = "function")
    is.function(obj)
  }, error = function(e) FALSE)
  if (!ok) missing <- c(missing, x)
}
if (length(missing) > 0) {
  stop(
    "装好的包缺失函数: ", paste(missing, collapse = ", "), "\n",
    "多半是坏 locale 下 R CMD INSTALL 写坏了懒加载库。\n",
    "请在正常 UTF-8 locale 下重装：\n",
    "  env -u LC_ALL -u LANG -u LC_CTYPE R CMD INSTALL ."
  )
}

## ---- 1) 测试套件 ----
suppressWarnings(library(testthat))
test_res <- testthat::test_dir(
  file.path(root, "tests", "testthat"),
  reporter = "minimal", stop_on_failure = FALSE
)
t_ok <- t_fail <- t_err <- t_warn <- t_skip <- 0
for (f in test_res) {
  for (e in f$results) {
    cls <- class(e)[1]
    if      (cls == "expectation_success")  t_ok   <- t_ok + 1
    else if (cls == "expectation_failure")  t_fail <- t_fail + 1
    else if (cls == "expectation_error")    t_err  <- t_err + 1
    else if (cls == "expectation_warning")  t_warn <- t_warn + 1
    else if (cls == "expectation_skip")     t_skip <- t_skip + 1
  }
}

## ---- 2) 教程（除非 --quick） ----
tut <- c()
if ("--quick" %in% args) {
  cat("[run_checks] --quick：跳过教程，仅跑测试\n")
} else {
  code_dir <- file.path(root, "tutorial", "code")
  for (fn in sort(list.files(code_dir, pattern = "\\.R$"))) {
    ok <- tryCatch({
      source(file.path(code_dir, fn), local = new.env(parent = globalenv()))
      TRUE
    }, error = function(e) FALSE)
    tut[fn] <- if (ok) "OK" else "FAILED"
  }
}

## ---- 3) 汇总报告 ----
cat("\n================ mlr3HTE 复跑验证报告 ================\n")
cat(sprintf("测试 : %d 通过 / %d 失败 / %d 错误 / %d 警告\n",
            t_ok, t_fail, t_err, t_warn))
if (length(tut)) {
  cat("教程 :\n")
  for (fn in names(tut)) cat(sprintf("  [%s] %s\n", tut[fn], fn))
}
cat("======================================================\n")
all_ok <- (t_fail == 0 && t_err == 0 && (length(tut) == 0 || all(tut == "OK")))
cat(if (all_ok) "ALL GREEN\n" else "HAS FAILURES\n")
if (!all_ok) quit(status = 1)
