# 目的：用 mlr3HTE 自带的各类 metalearner（S/T/X/R/DR）去拟合随包分发的跨包基准数据集，
#       把估计出的 ATE 与数据自带真值（true_ate / cate_true）对比，验证「用我们的方法
#       能否像原包一样还原真实效应」。额外对 grf_causal 跑一次 grf::causal_forest 做直接对照。
# 输入：inst/extdata/benchmarks/*（通过 mlr3HTE_benchmark_data 读取）
# 输出：每种数据集 × 每种方法的 ATE 估计值、与真值的偏差、与 cate_true 的相关性
# 依赖：mlr3HTE, mlr3learners, grf（仅 grf_causal 对照用）
# 说明：本脚本只做验证、不写入包内；运行需先 pkgload::load_all(".") 或安装后 library(mlr3HTE)

# 0 环境与依赖 ----

Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)
library(mlr3HTE)
library(mlr3learners)

methods <- c("S", "T", "X", "R", "DR")
lb_reg  <- lrn("regr.ranger", num.trees = 200)
lb_cls  <- lrn("classif.ranger", num.trees = 200)
tau_l  <- lrn("regr.ranger", num.trees = 200, min.node.size = 50)

results <- list()

# 1 grf_causal：连续结局 / 二分类处理 ----

d <- mlr3HTE_benchmark_data("grf_causal")
X <- d[, grep("^x", names(d)), drop = FALSE]
A <- d$treatment
Y <- d$outcome
true_ate <- mlr3HTE_benchmark_meta()$true_ate[1]

row_grf <- data.frame(dataset = "grf_causal", method = "TRUE",
                      est_ate = true_ate, bias = 0, cor_cate = 1, stringsAsFactors = FALSE)
for (tp in methods) {
  fit <- metalearner(tp, X, A, Y, learner_base = lb_reg, learner_tau = tau_l, outcome = "continuous", cross_fitting = TRUE)
  est <- fit$ate
  cc  <- cor(fit$cate_train, d$cate_true, use = "complete.obs")
  row_grf <- rbind(row_grf, data.frame(dataset = "grf_causal", method = paste0("HTE-", tp),
                                       est_ate = round(est, 4),
                                       bias = round(est - true_ate, 4),
                                       cor_cate = round(cc, 4), stringsAsFactors = FALSE))
}
# grf 原生 causal_forest 直接对照
if (requireNamespace("grf", quietly = TRUE)) {
  cf <- grf::causal_forest(as.matrix(X), Y, A, num.trees = 2000)
  g  <- as.numeric(grf::average_treatment_effect(cf))[1]
  row_grf <- rbind(row_grf, data.frame(dataset = "grf_causal", method = "grf::causal_forest",
                                       est_ate = round(g, 4),
                                       bias = round(g - true_ate, 4),
                                       cor_cate = round(cor(grf:::predict.causal_forest(cf)$predictions, d$cate_true), 4),
                                       stringsAsFactors = FALSE))
}
results[["grf_causal"]] <- row_grf
print(row_grf)

# 2 grf_survival：生存结局 / 二分类处理 ----

d <- mlr3HTE_benchmark_data("grf_survival")
X <- d[, grep("^x", names(d)), drop = FALSE]
A <- d$treatment
Y <- survival::Surv(d$time, d$event)
t0 <- median(d$time)
true_ate <- mlr3HTE_benchmark_meta()$true_ate[2]

row_surv <- data.frame(dataset = "grf_survival", method = "TRUE",
                       est_ate = true_ate, bias = 0, cor_cate = 1, stringsAsFactors = FALSE)
for (tp in methods) {
  fit <- metalearner(tp, X, A, Y, learner_base = "coxph", learner_tau = tau_l,
                     outcome = "survival", t0 = t0, effect = "survdiff", cross_fitting = TRUE)
  est <- fit$ate
  cc  <- cor(fit$cate_train, d$cate_true, use = "complete.obs")
  row_surv <- rbind(row_surv, data.frame(dataset = "grf_survival", method = paste0("HTE-", tp),
                                         est_ate = round(est, 4),
                                         bias = round(est - true_ate, 4),
                                         cor_cate = round(cc, 4), stringsAsFactors = FALSE))
}
results[["grf_survival"]] <- row_surv
print(row_surv)

# 3 econml_ihdp：连续结局 / 二分类处理 ----

d <- mlr3HTE_benchmark_data("econml_ihdp")
X <- d[, grep("^x", names(d)), drop = FALSE]
A <- d$treatment
Y <- d$outcome
true_ate <- mlr3HTE_benchmark_meta()$true_ate[3]

row_ihdp <- data.frame(dataset = "econml_ihdp", method = "TRUE",
                       est_ate = true_ate, bias = 0, cor_cate = 1, stringsAsFactors = FALSE)
for (tp in methods) {
  fit <- metalearner(tp, X, A, Y, learner_base = lb_reg, learner_tau = tau_l, outcome = "continuous", cross_fitting = TRUE)
  est <- fit$ate
  cc  <- cor(fit$cate_train, d$cate_true, use = "complete.obs")
  row_ihdp <- rbind(row_ihdp, data.frame(dataset = "econml_ihdp", method = paste0("HTE-", tp),
                                        est_ate = round(est, 4),
                                        bias = round(est - true_ate, 4),
                                        cor_cate = round(cc, 4), stringsAsFactors = FALSE))
}
results[["econml_ihdp"]] <- row_ihdp
print(row_ihdp)

# 4 causalml_uplift：二分类结局 / 多分类处理（取 control vs treatment1 做二分类对照）----

d <- mlr3HTE_benchmark_data("causalml_uplift")
sub <- d[d$treatment_group_key %in% c("control", "treatment1"), ]
sub$A <- ifelse(sub$treatment_group_key == "treatment1", 1, 0)
X <- sub[, grep("^x", names(sub)), drop = FALSE]
Y <- sub$conversion
true_ate <- mean(sub$cate_true[sub$A == 1]) - mean(sub$cate_true[sub$A == 0])  # 该对照臂的真值 ATE

row_up <- data.frame(dataset = "causalml_uplift", method = "TRUE",
                    est_ate = round(true_ate, 4), bias = 0, cor_cate = 1, stringsAsFactors = FALSE)
for (tp in methods) {
  fit <- metalearner(tp, X, sub$A, Y, learner_base = lb_cls, learner_tau = tau_l, outcome = "binary", cross_fitting = TRUE)
  est <- fit$ate
  cc  <- cor(fit$cate_train, sub$cate_true, use = "complete.obs")
  row_up <- rbind(row_up, data.frame(dataset = "causalml_uplift", method = paste0("HTE-", tp),
                                     est_ate = round(est, 4),
                                     bias = round(est - true_ate, 4),
                                     cor_cate = round(cc, 4), stringsAsFactors = FALSE))
}
results[["causalml_uplift"]] <- row_up
print(row_up)

# 5 causalml_continuous：连续结局 / 二分类处理 ----

d <- mlr3HTE_benchmark_data("causalml_continuous")
X <- d[, grep("^x", names(d)), drop = FALSE]
A <- d$treatment
Y <- d$outcome
true_ate <- mlr3HTE_benchmark_meta()$true_ate[5]

row_cc <- data.frame(dataset = "causalml_continuous", method = "TRUE",
                     est_ate = true_ate, bias = 0, cor_cate = 1, stringsAsFactors = FALSE)
for (tp in methods) {
  fit <- metalearner(tp, X, A, Y, learner_base = lb_reg, learner_tau = tau_l, outcome = "continuous", cross_fitting = TRUE)
  est <- fit$ate
  cc  <- cor(fit$cate_train, d$cate_true, use = "complete.obs")
  row_cc <- rbind(row_cc, data.frame(dataset = "causalml_continuous", method = paste0("HTE-", tp),
                                     est_ate = round(est, 4),
                                     bias = round(est - true_ate, 4),
                                     cor_cate = round(cc, 4), stringsAsFactors = FALSE))
}
results[["causalml_continuous"]] <- row_cc
print(row_cc)

# 99 收尾 ----

cat("\n=== 汇总：各数据集真值 ATE 与 mlr3HTE 各方法恢复值 ===\n")
for (nm in names(results)) print(results[[nm]])
