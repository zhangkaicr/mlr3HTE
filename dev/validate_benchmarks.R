# 目的：用 mlr3HTE 的 S/T/X/R/DR 拟合随包分发的跨包基准数据集，同时核对
#       ① ATE 是否还原真值；② CATE（个体效应）是否与真值/来源包一致（相关、RMSE、MAE）；
#       ③ PS 截断 ps_bounds 对 R/DR 的影响；④ 与 grf::causal_forest 的直接对照。
# 输入：inst/extdata/benchmarks/*（由三函数门面的 source = "benchmark" 读取）。
#       门面返回统一 list；这里需要来源包的原始列名（uplift 多臂标签、生存 time/event），
#       所以取 $raw 继续按原始 data.frame 处理。
# 输出：控制台报表（每数据集×方法一行；另附 ps_bounds 敏感性与 grf 对照）
# 依赖：mlr3HTE, mlr3learners, grf
# 说明：只做验证、不写包内；运行前已 pkgload::load_all(".")

# 0 环境与依赖 ----

Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)
library(mlr3learners)

methods <- c("S", "T", "X", "R", "DR")
lb_reg  <- lrn("regr.ranger", num.trees = 150)
lb_cls  <- lrn("classif.ranger", num.trees = 150)
tau_l   <- lrn("regr.ranger", num.trees = 150, min.node.size = 50)
DEF     <- c(0.01, 0.99)   # 新默认
meta    <- mlr3HTE_demo_continuous(catalog = TRUE, source = "benchmark")

# 1 工具：CATE 级指标 + 单数据集评估 ----

cate_metrics <- function(chat, ctrue) {
  ok <- is.finite(chat) & is.finite(ctrue)
  c(cor  = stats::cor(chat[ok], ctrue[ok]),
    rmse = sqrt(mean((chat[ok] - ctrue[ok])^2)),
    mae  = mean(abs(chat[ok] - ctrue[ok])))
}

eval_ds <- function(nm, X, A, Y, true_ate, ctrue, base, outcome,
                    t0 = NULL, effect = "survdiff") {
  rows <- lapply(methods, function(tp) {
    fit <- metalearner(tp, X, A, Y, learner_base = base, learner_tau = tau_l,
                       outcome = outcome, t0 = t0, effect = effect,
                       cross_fitting = TRUE, ps_bounds = DEF)
    m <- cate_metrics(fit$cate_train, ctrue)
    data.frame(dataset = nm, method = paste0("HTE-", tp),
               est_ate = round(fit$ate, 4), ate_bias = round(fit$ate - true_ate, 4),
               cate_cor = round(unname(m["cor"]), 3),
               cate_rmse = round(unname(m["rmse"]), 4),
               cate_mae = round(unname(m["mae"]), 4))
  })
  do.call(rbind, rows)
}

# 2 逐数据集评估（ATE + CATE）====

report <- list()

# 2.1 grf_causal（连续）
d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "grf_causal")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
report[["grf_causal"]] <- eval_ds("grf_causal", X, d$treatment, d$outcome,
                                  meta$true_ate[1], d$cate_true, lb_reg, "continuous")

# 2.2 grf_survival（生存）
d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "grf_survival")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
report[["grf_survival"]] <- eval_ds("grf_survival", X, d$treatment,
                                    survival::Surv(d$time, d$event),
                                    meta$true_ate[2], d$cate_true, "coxph", "survival",
                                    t0 = stats::median(d$time))

# 2.3 econml_ihdp（连续，强混杂）
d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "econml_ihdp")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
report[["econml_ihdp"]] <- eval_ds("econml_ihdp", X, d$treatment, d$outcome,
                                   meta$true_ate[3], d$cate_true, lb_reg, "continuous")

# 2.4 causalml_uplift（二分类；control vs treatment1）
d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "causalml_uplift")$raw
sub <- d[d$treatment_group_key %in% c("control", "treatment1"), ]
sub$A <- as.integer(sub$treatment_group_key == "treatment1")
X <- sub[, grep("^x", names(sub)), drop = FALSE]
true_ate <- mean(sub$cate_true[sub$A == 1]) - mean(sub$cate_true[sub$A == 0])
report[["causalml_uplift"]] <- eval_ds("causalml_uplift", X, sub$A, sub$conversion,
                                       true_ate, sub$cate_true, lb_cls, "binary")

# 2.5 causalml_continuous（连续）
d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "causalml_continuous")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
report[["causalml_continuous"]] <- eval_ds("causalml_continuous", X, d$treatment,
                                           d$outcome, meta$true_ate[5],
                                           d$cate_true, lb_reg, "continuous")

main <- do.call(rbind, report)
row.names(main) <- NULL
print(main)

# 3 ps_bounds 敏感性（只看强混杂 ihdp 上的 R / DR）====

d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "econml_ihdp")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
sens <- list()
for (tp in c("R", "DR")) {
  for (b in list(c(0.001, 0.999), c(0.01, 0.99), c(0.05, 0.95))) {
    fit <- metalearner(tp, X, d$treatment, d$outcome, learner_base = lb_reg,
                       learner_tau = tau_l, outcome = "continuous",
                       cross_fitting = TRUE, ps_bounds = b)
    m <- cate_metrics(fit$cate_train, d$cate_true)
    sens[[length(sens) + 1]] <- data.frame(
      learner = tp, ps_bounds = paste(b, collapse = ","),
      est_ate = round(fit$ate, 3), ate_bias = round(fit$ate - meta$true_ate[3], 3),
      cate_cor = round(unname(m["cor"]), 3),
      cate_rmse = round(unname(m["rmse"]), 4))
  }
}
sens <- do.call(rbind, sens)
cat("\n=== ps_bounds 敏感性（econml_ihdp，真值 ATE =", meta$true_ate[3], "）===\n")
print(sens)

# 4 与 grf::causal_forest 的 CATE 直接对照（grf_causal）====

d <- mlr3HTE_demo_continuous(source = "benchmark", dataset = "grf_causal")$raw
X <- d[, grep("^x", names(d)), drop = FALSE]
cf <- grf::causal_forest(as.matrix(X), d$outcome, d$treatment, num.trees = 2000)
cate_grf <- as.numeric(grf:::predict.causal_forest(cf)$predictions)
mg <- cate_metrics(cate_grf, d$cate_true)
cat("\n=== grf::causal_forest CATE（grf_causal）===\n")
cat("est_ate =", round(as.numeric(grf::average_treatment_effect(cf))[1], 4),
    " cate_cor =", round(unname(mg["cor"]), 3),
    " cate_rmse =", round(unname(mg["rmse"]), 4), "\n")

# 与 mlr3HTE 各方法的 CATE 相关性（是否给出与 grf 一致的个人排序）
cat("mlr3HTE 的 CATE 与 grf::causal_forest 的 CATE 相关：\n")
for (tp in methods) {
  fit <- metalearner(tp, X, d$treatment, d$outcome, learner_base = lb_reg,
                     learner_tau = tau_l, outcome = "continuous",
                     cross_fitting = TRUE, ps_bounds = DEF)
  cat(sprintf("  HTE-%s: cor(cate_hat, cate_grf) = %.3f\n", tp,
              stats::cor(fit$cate_train, cate_grf)))
}

# 99 收尾 ----
