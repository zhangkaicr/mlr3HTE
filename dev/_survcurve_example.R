# 目的：跑出 apisurvcurve 帮助页示例的真实输出，供粘贴进 content-api.js。
# 输入：无
# 输出：控制台打印 + dev/_survcurve_snippet.txt
# 依赖：pkgload::load_all()

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

# 1 示例代码（与将要写进文档页的代码逐字一致）----------------------------------
ex_code <- c(
  'd &lt;- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)',
  'cv &lt;- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 4)',
  'cv',
  'dim(attr(cv, "cate"))',
  'attr(cv, "n_fits")'
)
ex_run <- gsub("&lt;", "<", ex_code, fixed = TRUE)
writeLines(ex_run, "dev/_survcurve_example_code.R")

# 2 运行并捕获 ---------------------------------------------------------------
out <- utils::capture.output(
  source("dev/_survcurve_example_code.R", echo = FALSE, print.eval = TRUE)
)
print(out)

# 3 落盘（原样，供手工粘贴时核对）---------------------------------------------
writeLines(out, "dev/_survcurve_snippet.txt", useBytes = TRUE)

# 99 收尾 ----
cli::cli_alert_success("surv_effect_curve 示例输出已捕获")
