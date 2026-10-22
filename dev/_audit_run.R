# 目的：把 dev/_audit/ 里抽出的「示例代码」逐个重跑，与文档里贴的
#       「实测输出」逐行对账，产出一张差异表。
#       判据分三档：
#         OK        输出与文档一致
#         STALE     能跑通，但输出与文档不同（= 文档过期，必须改）
#         NO_CONTEXT 跑不通（依赖前面示例留下的对象），无法自动核对
# 输入：dev/_audit/case_XXX.R 与 case_XXX.expected.txt
# 输出：dev/_audit/report.csv、控制台汇总
# 依赖：pkgload::load_all()；部分案例要 ranger / ggplot2

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  # 文档示例里会直接 summarize() / pivot_longer()，把这些包也放进对账环境，
  # 否则会被误判成「跑不通」。
  for (p in c("dplyr", "tidyr", "tibble")) {
    if (requireNamespace(p, quietly = TRUE)) library(p, character.only = TRUE)
  }
  pkgload::load_all(".", quiet = TRUE)
})

audit_dir <- "dev/_audit"
manifest <- jsonlite::fromJSON(file.path(audit_dir, "manifest.json"),
                               simplifyDataFrame = TRUE)

# 1 输出归一化 ---------------------------------------------------------------
# 只比较真正有信息的内容：逐行去掉行尾空白；忽略纯空行的数量差异。
# 不做大小写或数字模糊匹配——文档声称"实测"，就该一位不差。
norm_lines <- function(x) {
  l <- strsplit(x, "\n", fixed = TRUE)[[1]]
  l <- trimws(l, which = "right")
  l[nzchar(l)]
}

# 2 逐个案例重跑 -------------------------------------------------------------
res <- vector("list", nrow(manifest))
for (i in seq_len(nrow(manifest))) {
  tag <- manifest$tag[i]
  f_code <- file.path(audit_dir, sprintf("case_%s.R", tag))
  f_exp  <- file.path(audit_dir, sprintf("case_%s.expected.txt", tag))

  expected <- norm_lines(paste(readLines(f_exp, warn = FALSE, encoding = "UTF-8"),
                               collapse = "\n"))

  # 每个案例在独立环境里跑，避免互相污染；包已加载，函数可见
  # 若该案例所在页面有前置代码块，先 source 进来（setup.R），
  # 还原读者「先看上一段、再看这一段」的上下文。
  env <- new.env(parent = globalenv())
  f_setup <- file.path(audit_dir, sprintf("case_%s.setup.R", tag))
  if (file.exists(f_setup) && file.size(f_setup) > 0L) {
    try(source(f_setup, local = env, echo = FALSE, print.eval = FALSE),
        silent = TRUE)
  }
  actual <- tryCatch(
    utils::capture.output(
      source(f_code, local = env, echo = FALSE, print.eval = TRUE)
    ),
    error = function(e) structure(conditionMessage(e), class = "case_error")
  )

  if (inherits(actual, "case_error")) {
    status <- "NO_CONTEXT"
    detail <- actual
    actual <- character(0)
  } else {
    actual <- norm_lines(paste(actual, collapse = "\n"))
    status <- if (identical(actual, expected)) "OK" else "STALE"
    detail <- if (status == "OK") "" else {
      paste0("期望 ", length(expected), " 行，实得 ", length(actual), " 行")
    }
  }

  writeLines(actual, file.path(audit_dir, sprintf("case_%s.actual.txt", tag)))

  res[[i]] <- data.frame(
    tag = tag,
    page_id = manifest$page_id[i],
    lang = if (is.null(manifest$lang)) NA_character_ else manifest$lang[i],
    status = status,
    detail = detail,
    stringsAsFactors = FALSE
  )
}

report <- do.call(rbind, res)
utils::write.csv(report, file.path(audit_dir, "report.csv"), row.names = FALSE)

# 3 汇总 ---------------------------------------------------------------------
print(table(report$status))
print(report[report$status == "STALE", c("tag", "page_id", "detail")])

# 99 收尾 ----
cli::cli_alert_success("示例输出对账完成：{nrow(report)} 个案例")
