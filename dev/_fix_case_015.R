# 目的：修 apidemoobs 页（观测性演示数据）的示例代码 —— 文档输出里带
#       `--- 数据卡 ---` / `--- 两组基线差异（混杂的来源）---` /
#       `--- ps_true 范围 ---` 三个小节标题，但示例代码从不打印它们。
#       补上真实的 cat() 标题语句，再重跑取得与之字面一致的输出。
# 输入：dev/_audit/case_015.R（已抽出的示例代码）
# 输出：case_015.old.R / case_015.old.txt（快照）、case_015.R（改后）、
#       case_015.new.txt（改后真实输出）
# 依赖：pkgload::load_all()、dplyr

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  library(dplyr)
  pkgload::load_all(".", quiet = TRUE)
})

audit_dir <- "dev/_audit"
tag <- "015"

# 1 快照原始版本 ---------------------------------------------------------------
file.copy(file.path(audit_dir, sprintf("case_%s.R", tag)),
          file.path(audit_dir, sprintf("case_%s.old.R", tag)), overwrite = TRUE)
file.copy(file.path(audit_dir, sprintf("case_%s.expected.txt", tag)),
          file.path(audit_dir, sprintf("case_%s.old.txt", tag)), overwrite = TRUE)

# 2 插入小节标题 ---------------------------------------------------------------
lines <- readLines(file.path(audit_dir, sprintf("case_%s.old.R", tag)),
                   warn = FALSE, encoding = "UTF-8")

rules <- list(
  list(after = "d <- mlr3HTE_demo_obs(n = 1200, seed = 1204)",
       cat = "--- 数据卡 ---", blank_before = FALSE),
  list(after = "tibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A))",
       cat = "--- 两组基线差异（混杂的来源）---", blank_before = TRUE),
  list(after = "summarise(across(where(is.numeric), mean), .groups = \"drop\")",
       cat = "--- ps_true 范围 ---", blank_before = TRUE)
)

for (k in rev(seq_along(rules))) {
  r <- rules[[k]]
  # 用整体 trimws：summarise 那行有前导缩进，只修右端会匹配不上
  hit <- which(trimws(lines) == r$after)
  if (length(hit) != 1L) {
    stop(sprintf("片段「%s」命中 %d 次，期望 1 次", r$after, length(hit)))
  }
  txt <- if (r$blank_before) sprintf('cat("\\n%s\\n")', r$cat) else sprintf('cat("%s\\n")', r$cat)
  lines <- append(lines, txt, after = hit)
}
writeLines(lines, file.path(audit_dir, sprintf("case_%s.R", tag)), useBytes = TRUE)
print(lines)

# 3 重跑取真实输出 -------------------------------------------------------------
env <- new.env(parent = globalenv())
out <- utils::capture.output(
  source(file.path(audit_dir, sprintf("case_%s.R", tag)),
         local = env, echo = FALSE, print.eval = TRUE)
)
writeLines(out, file.path(audit_dir, sprintf("case_%s.new.txt", tag)), useBytes = TRUE)
print(out)

# 99 收尾 ----
cli::cli_alert_success("case_015 已修正并重跑")
