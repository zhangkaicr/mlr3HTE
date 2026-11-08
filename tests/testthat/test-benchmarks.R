# 目的：验证三个统一数据门面在跨包基准数据、索引表与导出上的行为，
#       并守住「替换旧入口后数值不变」这条回归线。
# 输入：inst/extdata/benchmarks/* 与 data/mlr3hte_bench_data.rda
# 输出：testthat 断言
# 依赖：testthat、mlr3HTE、survival

# 基准数据集元数据 ----

test_that("benchmarks meta 包含全部 5 个数据集与必要字段", {
  m <- mlr3HTE_demo_continuous(catalog = TRUE, source = "benchmark")
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

# 单个数据集：统一 list + 原始表 ----

test_that("单个基准数据集默认走 RData 且真实效应完整", {
  d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "grf_causal")
  expect_type(d, "list")
  expect_true(all(c("X", "A", "Y", "tau", "ate", "raw") %in% names(d)))
  expect_s3_class(d$raw, "data.frame")
  expect_true("cate_true" %in% names(d$raw))
  expect_equal(length(d$Y), nrow(d$raw))
  expect_equal(length(d$A), nrow(d$raw))
  expect_false(any(is.na(d$tau)))
  expect_equal(unname(d$ate), mean(d$raw$cate_true), tolerance = 1e-8)
})

test_that("取全部数据集返回命名 list，每个都含真实效应列", {
  all <- mlr3HTE_demo_continuous(source = "benchmark")
  expect_type(all, "list")
  expect_length(all, 5)
  expect_true(all(vapply(all, function(x) "cate_true" %in% names(x$raw), logical(1))))
  expect_true(all(vapply(all, function(x) is.finite(x$ate), logical(1))))
  # 生存与多臂二分类数据集必须按自身列识别，不能套连续结局的列名
  expect_s3_class(all$grf_survival$Y, "Surv")
  expect_true(is.finite(all$grf_survival$t0))
  expect_equal(length(all$causalml_uplift$Y), nrow(all$causalml_uplift$raw))
})

test_that("三个门面对 benchmark 分支返回一致结构", {
  nm <- "grf_survival"
  a <- mlr3HTE_demo_continuous(source = "benchmark", dataset = nm)
  b <- mlr3HTE_demo_binary(source = "benchmark", dataset = nm)
  c <- mlr3HTE_demo_surv(source = "benchmark", dataset = nm)
  expect_equal(names(a), names(b))
  expect_equal(names(a), names(c))
  expect_equal(a$ate, b$ate)
  expect_equal(a$ate, c$ate)
})

test_that("导出函数同时复制 RData 与 CSV（双格式）", {
  td <- tempfile()
  on.exit(unlink(td, recursive = TRUE), add = TRUE)
  f <- mlr3HTE_demo_continuous(export_to = td)
  # 5 数据集 × (RData + csv) + benchmarks_meta.(RData + csv) = 12
  expect_length(f, 12)
  expect_true(all(file.exists(f)))
  expect_true(any(grepl("\\.RData$", f)))
  expect_true(any(grepl("\\.csv$", f)))
})

# 三个门面的契约与数值兼容性 ----

test_that("三个门面默认路径返回统一结构", {
  d1 <- mlr3HTE_demo_continuous(n = 200)
  d2 <- mlr3HTE_demo_binary(n = 200)
  d3 <- mlr3HTE_demo_surv(n = 200)
  expect_true(all(c("X", "A", "Y", "tau", "ate") %in% names(d1)))
  expect_true(all(c("X", "A", "Y", "tau", "ate") %in% names(d2)))
  expect_true(all(c("X", "A", "Y", "tau", "ate", "t0", "tau_rmst", "ate_rmst") %in% names(d3)))
  expect_s3_class(d3$Y, "Surv")
  expect_equal(nrow(d1$X), 200)
  expect_equal(unname(d1$ate), mean(d1$tau), tolerance = 1e-10)
})

test_that("默认 seed 沿用旧版六个 DGP，数值逐位一致", {
  # 旧入口已转为内部函数；这里直接比对，防止门面换种子导致全站实测输出过期。
  expect_equal(mlr3HTE_demo_continuous(n = 200)$Y,
               mlr3HTE:::.demo_continuous_rct(n = 200)$Y)
  expect_equal(mlr3HTE_demo_binary(n = 200)$Y,
               mlr3HTE:::.demo_binary_rct(n = 200)$Y)
  expect_equal(mlr3HTE_demo_surv(n = 200)$ate,
               mlr3HTE:::.demo_surv_rct(n = 200)$ate)
  expect_equal(mlr3HTE_demo_continuous(n = 200, setting = "obs")$ps_true,
               mlr3HTE:::.demo_continuous_obs(n = 200)$ps_true)
  expect_equal(mlr3HTE_demo_binary(n = 200, setting = "obs")$Y,
               mlr3HTE:::.demo_binary_obs(n = 200)$Y)
  expect_equal(mlr3HTE_demo_surv(n = 200, setting = "obs")$Y,
               mlr3HTE:::.demo_surv_obs(n = 200)$Y)
})

test_that("scenario / bundled / catalog / design 四条路由可用", {
  expect_equal(nrow(mlr3HTE_demo_continuous(catalog = TRUE)), 10)
  expect_equal(nrow(mlr3HTE_demo_continuous(catalog = TRUE, source = "bundled")), 30)

  s <- mlr3HTE_demo_surv(scenario = "rct_lin", n = 300, seed = 1)
  expect_equal(length(s$Y), 300)
  expect_true(is.finite(s$ate))

  b <- mlr3HTE_demo_continuous(source = "bundled", dataset = "rct_lin")
  expect_true(all(c("X", "A", "Y", "tau", "ate") %in% names(b)))

  dag <- mlr3HTE_demo_continuous(design = "obs")
  expect_true(all(c("nodes", "edges") %in% names(dag)))
  expect_true(nrow(dag$edges) > 0)
})
