# 目的：把基准数据集 CSV 同时烘焙成 RData 格式（用户要求，保留列类型、加载更快）
# 输入：inst/extdata/benchmarks/*.csv（已由 _gen_grf.R / _gen_python.py 生成，数据本身正确）
# 输出：inst/extdata/benchmarks/*.RData（每集一个，对象名 = 数据集名）
# 依赖：readr
# 说明：RData 与 CSV 并存于 inst/extdata/benchmarks/，均随 R CMD INSTALL 安装到本地。
#       中文描述由 dev/_gen_meta.py（Python UTF-8 写出）负责，避免 R 源文件编码问题。

# 0 环境与依赖 ----
suppressMessages(library(readr))

out_dir <- "inst/extdata/benchmarks"
datasets <- c("grf_causal", "grf_survival", "econml_ihdp",
              "causalml_uplift", "causalml_continuous")

# 1 读取 CSV 并写出 RData ----------------------------------------------------
for (nm in datasets) {
  df <- read_csv(file.path(out_dir, paste0(nm, ".csv")), show_col_types = FALSE)
  assign(nm, df)
  save(list = nm, file = file.path(out_dir, paste0(nm, ".RData")))
  cat(sprintf("%s.RData 写出: %d x %d\n", nm, nrow(df), ncol(df)))
}

# 99 收尾 ----
cat("=== 完成：5 个数据集 .RData 已生成 ===\n")
