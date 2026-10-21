# 目的：把包版本号抬到指定值，并同步站内元信息（DESCRIPTION + 文档站 SITE_META）
# 输入：命令行第一个参数 = 新的两位小数版本号，例如 0.22
# 输出：改写 DESCRIPTION 与 docs/assets/js/content-home.js；终端列出仍需手写的文件
# 依赖：R >= 4.1、cli（包 Imports 内）
# 用法：在包根目录执行 Rscript dev/bump_version.R 0.22

# 0 环境与依赖 ----

suppressPackageStartupMessages(library(cli))

if (!file.exists("DESCRIPTION")) {
  cli_abort("请在包根目录（含 DESCRIPTION 的目录）执行本脚本")
}
if (!dir.exists("docs/assets/js")) {
  cli_abort("docs/assets/js 不存在，无法同步站内版本号")
}

# 1 校验新版本号 ----

args <- commandArgs(trailingOnly = TRUE)

if (length(args) != 1L) {
  cli_abort("用法：Rscript dev/bump_version.R <新版本号>，例如 0.22")
}

new_ver <- args[[1L]]

# 版本号是两位小数的批次计数（0.10 / 0.21 / 0.87），不是语义化三段式
if (!grepl("^[0-9]+\\.[0-9]{2}$", new_ver)) {
  cli_abort(c(
    "版本号格式不对：{.val {new_ver}}",
    "i" = "要求形如 {.val 0.22}（两位小数）。本项目每次推送 +0.01，不用三段式。"
  ))
}

desc <- readLines("DESCRIPTION", encoding = "UTF-8")
ver_line <- grep("^Version:", desc, value = TRUE)

if (length(ver_line) != 1L) {
  cli_abort("DESCRIPTION 里没有唯一的 Version: 字段")
}

old_ver <- trimws(sub("^Version:", "", ver_line))

cli_alert_info("版本号 {.val {old_ver}} -> {.val {new_ver}}")

# 2 改 DESCRIPTION ----

desc <- sub("^Version:.*$", paste0("Version: ", new_ver), desc)
writeLines(desc, "DESCRIPTION", useBytes = TRUE)

cli_alert_success("DESCRIPTION: Version: {.val {new_ver}}")

# 3 改文档站 SITE_META（页脚与站点元信息的唯一来源）----

meta_file <- "docs/assets/js/content-home.js"
meta <- readLines(meta_file, encoding = "UTF-8", warn = FALSE)
today <- format(Sys.Date(), "%Y-%m-%d")

hit <- grepl("^window\\.SITE_META", meta)
if (!any(hit)) {
  cli_abort("在 {.file {meta_file}} 里没找到 SITE_META 行，请人工核对")
}

meta[hit] <- paste0(
  'window.SITE_META = { version: "', new_ver, '", date: "', today, '" };'
)
writeLines(meta, meta_file, useBytes = TRUE)

cli_alert_success("{.file {meta_file}}: SITE_META 已设为 {.val {new_ver}}（{today}）")

# 4 扫出仍在引用旧版本号的文件（内容要人写，脚本不代劳）----

# 只扫会被人读到的文本与文档站源码，不碰 renv.lock 之类的机器文件
scan_files <- c(
  "README.md",
  "CHANGELOG.md",
  "tutorial/00_教程.md",
  list.files("docs/assets/js", pattern = "\\.js$", full.names = TRUE)
)
scan_files <- scan_files[file.exists(scan_files)]

hits_old <- vapply(
  scan_files,
  function(f) any(grepl(old_ver, readLines(f, encoding = "UTF-8", warn = FALSE), fixed = TRUE)),
  logical(1)
)

cli_alert_info("以下文件仍含旧版本号 {.val {old_ver}}，需人工判断是否更新：")
print(scan_files[hits_old])

# 5 下一步提示 ----

cli_alert_warning("还剩两处要手写（版本号规则见 CHANGELOG.md 开头）：")
cli_ul(c(
  "CHANGELOG.md 顶部加一节 {.code ## [{new_ver}]}",
  "docs/assets/js/content-changelog.js 加对应小节，并改 lede 的「当前版本」与上一节的 heading"
))

# 6 自检 ----

if (requireNamespace("testthat", quietly = TRUE)) {
  testthat::test_file("tests/testthat/test-version.R")
} else {
  cli_alert_info("未安装 testthat，跳过 test-version.R 自检")
}
