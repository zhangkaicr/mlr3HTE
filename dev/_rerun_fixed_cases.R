# 目的：把改过示例代码的 5 个案例重跑一遍，捕获新的真实输出，落成
#       case_XXX.new.txt，供 _apply_example_fix.py 写回 content-api.js。
# 输入：dev/_audit/case_0{11,13,19,21,31}.R
# 输出：dev/_audit/case_XXX.new.txt
# 依赖：pkgload::load_all()、tibble（由包依赖带入）

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  pkgload::load_all(".", quiet = TRUE)
})

audit_dir <- "dev/_audit"
tags <- c("011", "013", "019", "021", "031")

# 1 逐个重跑并捕获输出 ---------------------------------------------------------
for (tag in tags) {
  env <- new.env(parent = globalenv())
  out <- utils::capture.output(
    source(file.path(audit_dir, sprintf("case_%s.R", tag)),
           local = env, echo = FALSE, print.eval = TRUE)
  )
  f <- file.path(audit_dir, sprintf("case_%s.new.txt", tag))
  writeLines(out, f, useBytes = TRUE)
  cli::cli_alert_info("case_{tag} -> {f}（{length(out)} 行）")
  print(out)
}

# 99 收尾 ----
cli::cli_alert_success("5 个案例的新输出已捕获")
