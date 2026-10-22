# 目的：重做 031（apidrpseudo）的小节标题插入。
#       上一版用「语句自身」当锚点 + 插在其后，导致标题落在 tibble 输出之后。
#       这里改用「前一条语句的末行」当锚点，保证标题打在下一段输出之前。
# 输入：dev/_audit/case_031.old.R（原始代码）
# 输出：dev/_audit/case_031.R
# 依赖：无

# 0 环境与依赖 ----
audit_dir <- "dev/_audit"

# 1 还原并重新插入 -------------------------------------------------------------
lines <- readLines(file.path(audit_dir, "case_031.old.R"),
                   warn = FALSE, encoding = "UTF-8")

# 三条标题各自要落在哪一行之后（按原始行内容匹配，从后往前插）
rules <- list(
  list(after = "dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)",
       cat   = "--- 返回的字段 ---", blank_before = FALSE),
  list(after = "names(dr)",
       cat   = "--- 伪结局的均值 = DR 估计的 ATE ---", blank_before = TRUE),
  list(after = "tibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)",
       cat   = "--- 三件套的范围 ---", blank_before = TRUE)
)

for (k in rev(seq_along(rules))) {
  r <- rules[[k]]
  hit <- which(trimws(lines, which = "right") == r$after)
  if (length(hit) != 1L) {
    stop(sprintf("片段「%s」命中 %d 次，期望 1 次", r$after, length(hit)))
  }
  txt <- if (r$blank_before) sprintf('cat("\\n%s\\n")', r$cat) else sprintf('cat("%s\\n")', r$cat)
  lines <- append(lines, txt, after = hit)
}

writeLines(lines, file.path(audit_dir, "case_031.R"), useBytes = TRUE)
print(readLines(file.path(audit_dir, "case_031.R"), encoding = "UTF-8"))

# 99 收尾 ----
cli::cli_alert_success("case_031 标题位置已修正")
