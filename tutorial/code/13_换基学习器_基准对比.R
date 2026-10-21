# 目的：演示「基于 mlr3 体系」最直接的收益——基学习器一行就能换，
#       而且整个 mlr3 工作流（resample / benchmark）原样可复用。
# 输入：mlr3HTE_demo_data() 生成的连续 RCT 模拟数据（带真值 tau）
# 输出：控制台对比表 + tutorial/output/13_swap_base_learners.md
# 依赖：mlr3HTE（含 mlr3 / mlr3learners）、dplyr、cli

# 0 环境与依赖 ----------------------------------------------------------
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")   # 必须放在 load_all 之前，否则源码里的 UTF-8 字面量会被改写
suppressMessages(pkgload::load_all("."))

library(dplyr)

# 1 准备数据 -------------------------------------------------------------
set.seed(1)
d <- mlr3HTE_demo_data(n = 4000)   # 返回 X / A / Y / tau(真值) / ate(真值)
cat("真值 ATE =", signif(d$ate, 4), "\n")

# 2 一行换基学习器：同一套 T-learner 配方，换不同算法 ------------------
#    关键就这一行：learner_base = lrn("regr.xxx")
#    五种 metalearner 是「配方」，真正干活的是基学习器；换算法不动其它任何代码。
candidates <- list(
  ranger  = lrn("regr.ranger",  num.trees = 300, seed = 1),
  xgboost = lrn("regr.xgboost"),
  glmnet  = lrn("regr.glmnet"),
  rpart   = lrn("regr.rpart"),
  lm      = lrn("regr.lm")
)

run_one <- function(name, learner) {
  fit <- metalearner("T", d$X, d$A, d$Y, learner_base = learner)
  ate <- as.numeric(fit$ate)
  cate_cor <- cor(fit$cate_train, d$tau)          # 与真 tau 的相关，越高排序越好
  data.frame(算法 = name, ATE = round(ate, 4),
             ATE偏差 = round(ate - d$ate, 4),
             CATE相关 = round(cate_cor, 3),
             stringsAsFactors = FALSE)
}

rows <- Reduce(rbind, Map(run_one, names(candidates), candidates))
print(rows)

# 3 进阶：直接复用 mlr3 的 benchmark 工作流 -----------------------------
#    因为 lrn("regr.metalearner") 是正规 R6 Learner，换基学习器后
#    benchmark() / tune() / resample() 完全照常——这是「用 mlr3 体系」而非
#    自己写一套训练循环的最大好处。
library(mlr3)
task <- ml_task(d$X, d$A, d$Y)

design <- benchmark_grid(
  task,
  list(
    lrn("regr.metalearner", id = "T_ranger",  metalearner = "T",
        learner_base = lrn("regr.ranger", num.trees = 300, seed = 1)),
    lrn("regr.metalearner", id = "T_xgboost", metalearner = "T",
        learner_base = lrn("regr.xgboost"))
  ),
  rsmp("cv", folds = 5)
)
bm <- benchmark(design)
bm_score <- as.data.frame(bm$score()[, .(learner_id, regr.mse)])
print(bm_score)

# 4 把结果写成简单的 Markdown 表（base R，避免额外依赖）-----------------
md_table <- function(df) {
  header <- paste("|", paste(names(df), collapse = " | "), "|")
  sep    <- paste("|", paste(rep("---", ncol(df)), collapse = " | "), "|")
  body   <- apply(df, 1, function(r) paste("|", paste(r, collapse = " | "), "|"))
  paste(c(header, sep, body), collapse = "\n")
}

out_md <- c(
  "# 换基学习器：mlr3 生态随便挑",
  "",
  "同一套 T-learner 配方，只改 `learner_base = lrn(\"regr.xxx\")` 一行，",
  "就能在随机森林 / XGBoost / GLMnet / CART 决策树 / 线性回归之间切换。",
  paste0("下方为连续 RCT 模拟数据（n=4000，真值 ATE = ", signif(d$ate, 4), "）上的实测："),
  "",
  "## 各基学习器的 ATE 与 CATE 相关",
  "",
  md_table(rows),
  "",
  "## benchmark：跨基学习器的 5 折 CV MSE",
  "",
  md_table(bm_score),
  "",
  "结论：换算法不影响 mlr3HTE 的接口与流程，只影响拟合能力与噪声；",
  "这正是基于 mlr3 体系而非自写训练循环的核心收益。"
)

# 5 收尾：中文写盘必须用二进制连接 + useBytes，否则 LC_CTYPE=C 下字节会被改写
writeLines(out_md, con = file("tutorial/output/13_swap_base_learners.md", open = "wb"),
           useBytes = TRUE, sep = "\n")
cli::cli_alert_info("已写出 tutorial/output/13_swap_base_learners.md")
