# 目的：R CMD check 因沙箱限制无法安装包（Sys.junction 被拒），
#       `--no-install` 会跳过 examples。这里手工把 man/ 里两个新函数的
#       @examples 抽出来原样执行，确认它们真能跑。
# 输入：man/surv_effect_curve.Rd、man/plot_surv_effect_curve.Rd
# 输出：控制台打印每个示例的结果
# 依赖：pkgload::load_all()、工具函数 tools::Rd2ex()

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

# 1 抽取 Rd 里的 examples 段 ---------------------------------------------------
for (rd in c("man/surv_effect_curve.Rd", "man/plot_surv_effect_curve.Rd")) {
  cli::cli_alert_info("运行 {rd} 的 examples")
  ex_file <- tempfile(fileext = ".R")
  tools::Rd2ex(rd, out = ex_file)
  print(readLines(ex_file, encoding = "UTF-8"))
  source(ex_file, echo = TRUE, print.eval = TRUE)
}

# 99 收尾 ----
cli::cli_alert_success("两个新函数的 @examples 均可执行")
