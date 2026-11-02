# 目的：用 grf 自带测试数据生成器产出带真实 CATE 的基准数据集，写出为 CSV
# 输入：grf::generate_causal_data() / generate_causal_survival_data()
# 输出：inst/extdata/benchmarks/grf_causal.csv, grf_survival.csv
# 依赖：grf
# 说明：grf 不内置固定基准数据集，其"测试数据"就是这两个带真实 CATE 的合成生成器

library(grf)

# 0 环境与依赖 ----
set.seed(20261001)  # 固定种子保证可复现
out_dir <- file.path("inst", "extdata", "benchmarks")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

# 1 连续结局因果数据 ----
d_cont <- generate_causal_data(n = 2000, p = 10)
cat("=== generate_causal_data 结构 ===\n")
str(d_cont, max.level = 1)
cat("W 取值:", sort(unique(d_cont$W)), "| Y 范围:", range(d_cont$Y),
    "| X 维度:", dim(d_cont$X), "| CATE 范围:", range(d_cont$CATE), "\n")

grf_causal <- data.frame(
  treatment = as.integer(d_cont$W),
  outcome   = as.numeric(d_cont$Y),
  d_cont$X,
  cate_true = as.numeric(d_cont$tau)
)
names(grf_causal)[grep("^X", names(grf_causal))] <-
  paste0("x", seq_len(ncol(d_cont$X)))
readr::write_csv(grf_causal, file.path(out_dir, "grf_causal.csv"))
cat("grf_causal 写出:", nrow(grf_causal), "x", ncol(grf_causal), "\n")
cat("grf_causal 真实 ATE (mean tau):", round(mean(d_cont$tau), 4), "\n")

# 2 生存结局因果数据 ----
d_surv <- generate_causal_survival_data(n = 2000, p = 10)
cat("=== generate_causal_survival_data 结构 ===\n")
str(d_surv, max.level = 1)
cat("survival 字段名:", names(d_surv), "\n")
# 自适应字段名：时间/事件/真实效应
time_col  <- as.numeric(d_surv[[grep("^(time|Y)$", names(d_surv), value = TRUE)[1]]])
event_col <- as.integer(d_surv[[grep("^(event|D)$", names(d_surv), value = TRUE)[1]]])
tau_col   <- as.numeric(d_surv[[grep("^(tau|CATE|cate)$", names(d_surv), value = TRUE)[1]]])
cat("time 范围:", range(time_col), "| event 取值:", sort(unique(event_col)),
    "| X 维度:", dim(d_surv$X), "| tau 范围:", range(tau_col), "\n")

grf_survival <- data.frame(
  treatment = as.integer(d_surv$W),
  time      = time_col,
  event     = event_col,
  d_surv$X,
  cate_true = tau_col
)
names(grf_survival)[grep("^X", names(grf_survival))] <-
  paste0("x", seq_len(ncol(d_surv$X)))
readr::write_csv(grf_survival, file.path(out_dir, "grf_survival.csv"))
cat("grf_survival 写出:", nrow(grf_survival), "x", ncol(grf_survival), "\n")
cat("grf_survival 真实 ATE (mean tau):", round(mean(tau_col), 4), "\n")

# 99 收尾 ----
cat("=== 完成：grf 两个数据集已写出到", out_dir, "===\n")
