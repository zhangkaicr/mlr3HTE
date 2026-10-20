# smoke_test.R —— Phase A 冒烟测试：连续结局 + RCT，校验五种 metalearner 与 R6 Learner
# 运行：在该包根目录执行  Rscript smoke_test.R
# 说明：不依赖 here()，直接用 pkgload::load_all(".") 加载当前包。

pkgload::load_all(".", quiet = TRUE)

message("== 载入演示数据（与课程模块三同款 DGP）==")
d <- mlr3HTE_demo_data(n = 4000, treat_frac = 0.5, seed = 1201)
message(sprintf("真实 ATE = %.4f；真实 tau 标准差 = %.4f", d$ate, sd(d$tau)))

# 基学习器：随机森林（与课程默认一致），固定种子保证可复现
lb <- mlr3::lrn("regr.ranger", num.trees = 300, seed = 1201)

message("== 五种 metalearner 在 RCT 数据上的 CATE 估计质量 ==")
rows <- list()
for (tp in c("S", "T", "X", "R", "DR")) {
  cate <- mlr3HTE::metalearner(tp, d$X, d$A, d$Y, learner_base = lb)$cate_train
  rows[[length(rows) + 1]] <- data.frame(
    方法       = tp,
    平均CATE   = sprintf("%.4f", mean(cate)),
    真实ATE    = sprintf("%.4f", d$ate),
    与真相关   = sprintf("%.3f", cor(cate, d$tau)),
    估计SD     = sprintf("%.4f", sd(cate)),
    RMSE       = sprintf("%.4f", sqrt(mean((cate - d$tau)^2))),
    stringsAsFactors = FALSE
  )
}
print(do.call(rbind, rows))

message("== 便捷封装 s_learner/t_learner/... 直接返回 CATE 向量 ==")
tau_s <- s_learner(d$X, d$A, d$Y, learner_base = lb)
tau_t <- t_learner(d$X, d$A, d$Y, learner_base = lb)
message(sprintf("s_learner ATE=%.4f, t_learner ATE=%.4f（真实 %.4f）",
                mean(tau_s), mean(tau_t), d$ate))

message("== R6 Learner：lrn(\"regr.metalearner\") 训练 + 预测 ==")
task <- mlr3::as_task_regr(
  cbind(d$X, A = d$A, Y = d$Y),
  target = "Y",
  features = c("age", "lac", "tumor", "sex", "A")
)
lrn_mm <- mlr3::lrn("regr.metalearner", metalearner = "T")
lrn_mm$learner_base <- lb
lrn_mm$train(task)
cate_lr <- as.numeric(lrn_mm$predict(task)$response)
message(sprintf("LearnerRegrMetalearner(T) ATE=%.4f, 与真相关=%.3f, RMSE=%.4f",
                mean(cate_lr), cor(cate_lr, d$tau),
                sqrt(mean((cate_lr - d$tau)^2))))

message("== 冒烟测试完成：相关 0.8 以上、RMSE 小于 1 即说明引擎与 Learner 均可用 ==")
