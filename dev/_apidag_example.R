# 目的：跑出 apidag 帮助页示例的**真实**输出，并额外导出一份可直接粘进
#       content-api.js 的转义字符串（\n 已转义），避免手抄引入错字。
# 输入：无
# 输出：控制台打印真实输出；dev/_apidag_snippet.txt 存转义后的 JS 片段
# 依赖：pkgload::load_all()、ggplot2

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  pkgload::load_all(".", quiet = TRUE)
})

# 1 示例代码（与文档页展示的代码逐字一致）--------------------------------------
# 注意：这里必须让代码自己打出 design 表头，否则输出里的分隔行对不上代码。
ex_code <- c(
  'for (k in c("rct", "obs")) {',
  '  g <- mlr3HTE_dag(k, "continuous")',
  '  cat("=====", "design =", k, "=====", "\\n")',
  '  cat("class:", paste(class(g), collapse = " / "), "\\n")',
  '  cat("geom layers:", length(g$layers), "\\n")',
  '  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),',
  '                         collapse = ", "), "\\n\\n")',
  '}'
)
writeLines(ex_code, "dev/_apidag_example_code.R")

# 2 运行并捕获输出 -------------------------------------------------------------
out <- utils::capture.output(source("dev/_apidag_example_code.R", echo = FALSE))

print(out)                       # 真实输出，逐行核对用

# 3 导出为 content-api.js 可直接粘贴的转义串 -----------------------------------
# JS 单引号字符串里需要转义的只有反斜杠与单引号；中文原样保留。
js_escape <- function(x) {
  x <- gsub("\\\\", "\\\\\\\\", x)
  gsub("'", "\\\\'", x)
}
# 用真正的换行符连接，再整体转义成 \n 字面量
joined <- paste(out, collapse = "\n")
joined_escaped <- gsub("\n", "\\\\n", js_escape(joined), fixed = FALSE)
joined_escaped <- gsub("\\\\\\\\n", "\\\\n", joined_escaped)

code_joined <- paste(ex_code, collapse = "\n")
code_escaped <- gsub("\\\\\\\\n", "\\\\n",
                     gsub("\n", "\\\\n", js_escape(code_joined)))

writeLines(c(
  "### OUTPUT (escaped) ###",
  joined_escaped,
  "### CODE (escaped) ###",
  code_escaped
), "dev/_apidag_snippet.txt", useBytes = TRUE)

# 99 收尾 ----
cli::cli_alert_success("apidag 示例输出已捕获并转义")
