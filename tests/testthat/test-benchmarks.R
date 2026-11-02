# 基准数据集读取函数测试
test_that("benchmarks meta 包含全部 5 个数据集与必要字段", {
  m <- mlr3HTE_benchmark_meta()
  expect_s3_class(m, "data.frame")
  expect_equal(nrow(m), 5)
  req_cols <- c("dataset", "source_package", "source_function", "n", "n_features",
                "outcome_type", "treatment_type", "has_ground_truth", "true_ate",
                "description", "columns")
  expect_true(all(req_cols %in% names(m)))
  # 中文描述未被编码损坏（应当含常见中文字符，而非乱码控制符）
  expect_true(all(grepl("[一-鿿]", m$description)))
  expect_setequal(m$dataset, c("grf_causal", "grf_survival", "econml_ihdp",
                               "causalml_uplift", "causalml_continuous"))
})

test_that("单个基准数据集默认走 RData 且含真实效应列", {
  d <- mlr3HTE_benchmark_data("grf_causal")
  expect_s3_class(d, "data.frame")
  expect_true("cate_true" %in% names(d))
  expect_true(nrow(d) > 0)
  expect_false(any(is.na(d$cate_true)))
})

test_that("取全部数据集返回命名 list，每个都含 cate_true", {
  all <- mlr3HTE_benchmark_data()
  expect_type(all, "list")
  expect_length(all, 5)
  expect_true(all(sapply(all, function(x) "cate_true" %in% names(x))))
})

test_that("导出函数同时复制 RData 与 CSV（双格式）", {
  td <- tempfile()
  on.exit(unlink(td, recursive = TRUE), add = TRUE)
  f <- mlr3HTE_benchmark_export(td)
  # 5 数据集 × (RData + csv) + benchmarks_meta.(RData + csv) = 12
  expect_length(f, 12)
  expect_true(all(file.exists(f)))
  expect_true(any(grepl("\\.RData$", f)))
  expect_true(any(grepl("\\.csv$", f)))
})
