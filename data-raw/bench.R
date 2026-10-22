# =====================================================================
# data-raw/bench.R
# 目的：生成随包发布的基准模拟数据 data/mlr3hte_bench_data.rda
# 输入：R/scenarios.R（mlr3HTE_scenario 与场景清单）
# 输出：data/mlr3hte_bench_data.rda —— 10 个设计 × 3 类结局 = 30 个数据集
# 依赖：mlr3HTE（本地 load_all）、survival
#
# 只在需要重新生成基准数据时手工运行，日常构建不执行：
#   Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8"); source("data-raw/bench.R")'
# =====================================================================

# 0 环境与依赖 ----
pkgload::load_all(".", quiet = TRUE)

# 1 生成 30 个数据集 ----
ids <- mlr3HTE_scenarios()$id
outcomes <- c("continuous", "binary", "survival")

mlr3hte_bench_data <- list()
for (id in ids) {
  for (oc in outcomes) {
    # n = 2000 是精度与包体积的折中：足够稳定地估计 ATE 与 CATE 相关，
    # 30 个数据集压缩后仍在几 MB 以内。
    mlr3hte_bench_data[[paste(id, oc, sep = ".")]] <- mlr3HTE_scenario(id, oc, n = 2000)
  }
}

# 2 一致性自查 ----
# 每个场景的 ATE 必须等于 tau 的均值；RCT 的倾向得分必须恒为 0.5。
stopifnot(
  all(vapply(mlr3hte_bench_data, function(d)
    isTRUE(all.equal(d$ate, mean(d$tau))), logical(1)))
)
rct_keys <- grep("^rct_", names(mlr3hte_bench_data), value = TRUE)
stopifnot(all(vapply(mlr3hte_bench_data[rct_keys], function(d)
  all(d$ps_true == 0.5), logical(1))))

# 3 写盘 ----
dir.create("data", showWarnings = FALSE)
usethis_available <- requireNamespace("usethis", quietly = TRUE)
if (usethis_available) {
  usethis::use_data(mlr3hte_bench_data, overwrite = TRUE, compress = "xz")
} else {
  save(mlr3hte_bench_data, file = "data/mlr3hte_bench_data.rda", compress = "xz", version = 2)
}

cli::cli_alert_success("已生成 {length(mlr3hte_bench_data)} 个基准数据集 -> data/mlr3hte_bench_data.rda")
cli::cli_alert_info("文件大小：{round(file.size('data/mlr3hte_bench_data.rda') / 1024^2, 2)} MB")
