# =====================================================================
# smoke_test3.R —— R6 Learner 在三种结局 + resample 下的冒烟测试
#
# 目的：验证 lrn("regr.metalearner") 配合 ml_task() 后，
#   连续 / 二分类 / 生存三类结局都能训练、预测、打分，且 resample 不炸。
# =====================================================================

pkgload::load_all(".", quiet = TRUE)

cat("== R6 Learner：三类结局直接 train / predict ==\n")

# 1 连续结局
dc <- mlr3HTE_demo_data(n = 1500, seed = 41)
task_c <- mlr3HTE::ml_task(dc$X, dc$A, dc$Y)
l_c <- mlr3::lrn("regr.metalearner", metalearner = "T")
l_c$learner_base <- mlr3::lrn("regr.ranger", num.trees = 200, seed = 1)
l_c$train(task_c)
p_c <- l_c$predict(task_c)
cat(sprintf("  连续   ATE=%+.4f（真实 %+.4f） mse=%.4f\n",
            mean(p_c$response), dc$ate, p_c$score(mlr3::msr("regr.mse"))))

# 2 二分类结局
db <- mlr3HTE_demo_binary(n = 1500, seed = 42)
task_b <- mlr3HTE::ml_task(db$X, db$A, db$Y)
l_b <- mlr3::lrn("regr.metalearner", metalearner = "X")
l_b$learner_base <- mlr3::lrn("classif.ranger", num.trees = 200, seed = 1)
l_b$train(task_b)
p_b <- l_b$predict(task_b)
cat(sprintf("  二分类 ATE=%+.4f（真实 %+.4f）\n",
            mean(p_b$response), db$ate))

# 3 生存结局（t0 由 ml_task 记录）
ds <- mlr3HTE_demo_surv(n = 1500, t0 = 2, seed = 43)
task_s <- mlr3HTE::ml_task(ds$X, ds$A, ds$Y, t0 = 2)
l_s <- mlr3::lrn("regr.metalearner", metalearner = "T")
l_s$learner_base <- "coxph"
l_s$train(task_s)
p_s <- l_s$predict(task_s)
cat(sprintf("  生存   ATE=%+.4f（真实 %+.4f）\n",
            mean(p_s$response), ds$ate))

# 4 观察性（IPTW）
do <- mlr3HTE_demo_obs(n = 1500, seed = 44)
task_o <- mlr3HTE::ml_task(do$X, do$A, do$Y)
l_o <- mlr3::lrn("regr.metalearner", metalearner = "X", weighting = "iptw")
l_o$train(task_o)
p_o <- l_o$predict(task_o)
cat(sprintf("  观察性 ATE=%+.4f（真实 %+.4f，未调整差分会 %+.4f）\n",
            mean(p_o$response), do$ate,
            mean(do$Y[do$A == 1]) - mean(do$Y[do$A == 0])))

# 5 resample：三类结局各跑一次 3 折 CV
cat("\n== resample：三类结局 3 折 CV ==\n")
for (nm in c("cont", "bin", "surv")) {
  task <- switch(nm, cont = task_c, bin = task_b, surv = task_s)
  lrn_ <- switch(nm,
    cont = mlr3::lrn("regr.metalearner", id = "mm_c", metalearner = "T"),
    bin  = mlr3::lrn("regr.metalearner", id = "mm_b", metalearner = "X"),
    surv = mlr3::lrn("regr.metalearner", id = "mm_s", metalearner = "T")
  )
  switch(nm,
    cont = { lrn_$learner_base <- mlr3::lrn("regr.ranger", num.trees = 100, seed = 1) },
    bin  = { lrn_$learner_base <- mlr3::lrn("classif.ranger", num.trees = 100, seed = 1) },
    surv = { lrn_$learner_base <- "coxph" }
  )
  rr <- mlr3::resample(task, lrn_, mlr3::rsmp("cv", folds = 3))
  cat(sprintf("  %-5s mse = %s\n", nm,
              paste(sprintf("%.4f", rr$score()$regr.mse), collapse = " ")))
}

cat("\n== 冒烟测试 3 完成 ==\n")
