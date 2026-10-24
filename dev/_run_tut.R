# 目的：按顺序跑教程脚本，保证 Sys.setlocale 在 load_all() 之前执行
# 输入：命令行传入的 .R 文件路径
# 输出：各脚本的打印结果
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli, tibble

Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
options(warn = 1)  # 让 warning 立即带调用栈打出，便于核对
args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0L) stop("用法：Rscript dev/_run_tut.R <script.R> [...]", call. = FALSE)
for (f in args) {
  cli::cli_alert("运行 {f}")
  source(f, echo = FALSE)
}
