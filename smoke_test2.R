# =====================================================================
# smoke_test2.R —— 二分类 / 生存 / 观察性 三条路径冒烟测试
#
# 目的：验证引擎的「结局模型抽象」在连续之外的三类场景下都能跑通且方向正确。
#   1) 二分类 RCT：五种 metalearner 的风险差 CATE 应对上真实 tau（风险差尺度）
#   2) 生存 RCT：五种 metalearner 的 t0 生存概率差应对上真实 tau
#   3) 观察性：未调整 vs IPTW，看 IPTW 是否把偏差拉回来
# 通过标准：各类 ATE 估计落在真值附近，观察性下 IPTW 明显优于不校正。
# =====================================================================

pkgload::load_all(".", quiet = TRUE)

set.seed(2026)

# 1 二分类 RCT ---------------------------------------------------------------
db <- mlr3HTE_demo_binary(n = 3000, seed = 42)
cat("== 二分类 RCT：真实 ATE（风险差）=", sprintf("%.4f", db$ate), "==\n")

lb_bin <- mlr3::lrn("classif.ranger", num.trees = 200, seed = 1)
for (tp in c("S", "T", "X", "R", "DR")) {
  fit <- mlr3HTE::metalearner(tp, db$X, db$A, db$Y, learner_base = lb_bin)
  cat(sprintf("  %-3s ATE=%+.4f  与真相关=%.3f  RMSE=%.4f\n",
              tp, fit$ate, stats::cor(fit$cate_train, db$tau),
              sqrt(mean((fit$cate_train - db$tau)^2))))
}

# 2 生存 RCT -----------------------------------------------------------------
ds <- mlr3HTE_demo_surv(n = 3000, t0 = 2, seed = 43)
cat("\n== 生存 RCT：真实 ATE（t0=2 生存概率差）=", sprintf("%.4f", ds$ate),
    "；删失比例=", sprintf("%.1f%%", 100 * mean(ds$Y[, 2] == 0)), "==\n")

for (tp in c("S", "T", "X", "R", "DR")) {
  fit <- mlr3HTE::metalearner(tp, ds$X, ds$A, ds$Y, learner_base = "coxph", t0 = 2)
  cat(sprintf("  %-3s ATE=%+.4f  与真相关=%.3f  RMSE=%.4f\n",
              tp, fit$ate, stats::cor(fit$cate_train, ds$tau),
              sqrt(mean((fit$cate_train - ds$tau)^2))))
}

# 3 观察性数据 ---------------------------------------------------------------
do <- mlr3HTE_demo_obs(n = 3000, seed = 44)
naive <- mean(do$Y[do$A == 1]) - mean(do$Y[do$A == 0])
cat("\n== 观察性（连续结局）：真实 ATE=", sprintf("%.4f", do$ate), "==\n")
cat(sprintf("  未调整差分会   = %+.4f（偏差 %+.4f）\n", naive, naive - do$ate))

lb_obs <- mlr3::lrn("regr.ranger", num.trees = 200, seed = 1)
for (tp in c("S", "T", "X", "R", "DR")) {
  fit <- mlr3HTE::metalearner(tp, do$X, do$A, do$Y, learner_base = lb_obs,
                              weighting = "iptw")
  cat(sprintf("  %-3s IPTW ATE=%+.4f  与真相关=%.3f\n",
              tp, fit$ate, stats::cor(fit$cate_train, do$tau)))
}

# 4 外部权重路径 -------------------------------------------------------------
# 用真实倾向得分构造权重，检验 weighting="external" 能否走通
w_ext <- ifelse(do$A == 1, do$ps_true, 1 - do$ps_true)
fit_ext <- mlr3HTE::metalearner("DR", do$X, do$A, do$Y, learner_base = lb_obs,
                                weighting = "external", weights = w_ext)
cat(sprintf("\n  外部权重 DR ATE=%+.4f（真实 %+.4f）\n", fit_ext$ate, do$ate))

cat("\n== 冒烟测试 2 完成 ==\n")
