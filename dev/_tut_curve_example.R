# 目的：跑出生存教程里「效应—时间曲线」小节的真实示例输出，
#       供粘贴进 content-tutorial.js（并按 language-r / r-out 配对，便于对账工具复核）。
# 输入：无
# 输出：控制台打印 + dev/_tut_curve_snippet.txt
# 依赖：pkgload::load_all()

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

# 1 教程里要展示的那段代码（与文档逐字一致）-----------------------------------
code <- c(
  'd <- mlr3HTE_demo_surv(n = 800, t0 = 2, seed = 103)',
  'cv <- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 12, effect = "rmst")',
  'head(cv, 3)'
)
writeLines(code, "dev/_tut_curve_code.R")

# 2 运行并捕获 ---------------------------------------------------------------
out <- utils::capture.output(
  source("dev/_tut_curve_code.R", echo = FALSE, print.eval = TRUE)
)
print(out)
writeLines(out, "dev/_tut_curve_snippet.txt", useBytes = TRUE)

# 99 收尾 ----
cli::cli_alert_success("教程曲线示例输出已捕获")
