# 回归测试：DESCRIPTION 的版本号必须与文档站 SITE_META 一致
#
# 背景：曾真实出现「DESCRIPTION 已是 0.2.0，而 docs/assets/js/content-home.js 的
# SITE_META 还停在 0.1.0」——页脚与更新日志页头因此长期显示旧版本，谁也没发现。
# 版本号规则是「每次推送 +0.01」（见 CHANGELOG.md 开头），人工改动点分散在
# DESCRIPTION / SITE_META / CHANGELOG.md / content-changelog.js 四处，
# 这里把其中两处（源码与站内元信息）的一致性钉成测试。

# 1 找到包根目录 --------------------------------------------------------------

# 坑：不能用 test_path("..", "..") 之外的花招。R CMD check 时运行目录是
# <pkg>.Rcheck/tests/，往上两级正好是 <pkg>.Rcheck 根；而 .Rbuildignore 里
# 有 ^docs$，所以 check 环境下 docs/ 根本不存在——下面的用例会 skip，不会误报。
pkg_root <- normalizePath(file.path(testthat::test_path(), "..", ".."), mustWork = FALSE)

desc_file <- file.path(pkg_root, "DESCRIPTION")
if (!file.exists(desc_file)) {
  desc_file <- file.path(system.file(package = "mlr3HTE"), "DESCRIPTION")
}

read_version <- function() {
  dcf <- read.dcf(desc_file)
  unname(dcf[1, "Version"])
}

# 2 DESCRIPTION 自身 ----------------------------------------------------------

test_that("版本号是两位小数的批次计数", {
  ver <- read_version()
  expect_match(ver, "^[0-9]+\\.[0-9]{2}$")
})

# 3 与文档站 SITE_META 对齐 ---------------------------------------------------

test_that("SITE_META 的版本号与 DESCRIPTION 一致", {
  meta_file <- file.path(pkg_root, "docs", "assets", "js", "content-home.js")
  skip_if_not(file.exists(meta_file), "docs/ 未随源码分发（R CMD check 环境）")

  # 只取纯 ASCII 的 SITE_META 行，避开非 UTF-8 locale 下的编码坑
  meta_line <- grep("^window\\.SITE_META", readLines(meta_file, warn = FALSE), value = TRUE)
  expect_length(meta_line, 1L)

  site_ver <- sub('.*version: "([^"]+)".*', "\\1", meta_line)
  expect_equal(site_ver, read_version())

  # 日期也得是能被 as.Date 认出来的，避免手写成 2026/10/21 之类
  site_date <- sub('.*date: "([^"]+)".*', "\\1", meta_line)
  expect_match(site_date, "^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
})

# 4 更新日志页的「当前版本」标注 ----------------------------------------------

test_that("更新日志页的中英 lede 都标注了当前版本", {
  cl_file <- file.path(pkg_root, "docs", "assets", "js", "content-changelog.js")
  skip_if_not(file.exists(cl_file), "docs/ 未随源码分发（R CMD check 环境）")

  ver <- read_version()
  js <- readLines(cl_file, warn = FALSE)

  expect_true(any(grepl(paste0("当前版本 v", ver), js, fixed = TRUE)))
  expect_true(any(grepl(paste0("Current version: v", ver), js, fixed = TRUE)))

  # 中英各有一节以该版本号开头，说明新批次的小节没漏写
  expect_gte(sum(grepl(paste0('heading: "v', ver), js, fixed = TRUE)), 2L)
})
