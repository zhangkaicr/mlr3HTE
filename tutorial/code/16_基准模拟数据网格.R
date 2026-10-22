# =====================================================================
# 16_基准模拟数据网格.R
# 目的：介绍随包发布的基准模拟数据——10 个设计 × 3 类结局 = 30 份，n = 2000，
#       种子固定，打包在 data/mlr3hte_bench_data.rda。四个结构维度相互独立，
#       可以固定其余、只改一个来做对照。后续所有方法学比较都应在这一份数据上做。
# 输入：data/mlr3hte_bench_data.rda（随包发布，LazyData 自动可用）
# 输出：场景清单、混杂强度量化、非线性与线性 HTE 的可估性对照
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行
#       Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8");
#                  source("tutorial/code/16_基准模拟数据网格.R", encoding="UTF-8")'
# =====================================================================

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(mlr3)
  library(mlr3learners)
  library(dplyr)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 620, type = "cairo"))
}

# 1 四个结构维度 ----
#   研究设计   rct（随机化，无混杂）/ obs（观察性，有混杂）
#   混杂形式   none / linear / nonlinear
#   HTE 形式   linear（CATE 是协变量的线性函数）/ nonlinear（含 sin 与二次项）
#   共用变量   shared = TRUE 表示某变量既进入处理分配模型又进入 CATE，
#              即"混杂因子兼效应修饰因子"
mlr3HTE_scenarios()

# 2 预生成数据的索引 ----
idx <- mlr3HTE_bench_index()
dim(idx)
utils::head(idx, 6)

# 3 取一份数据：真值齐备 ----
b <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")
names(b)
c(n = nrow(b$X), ate = b$ate,
  cor_tau_lac = round(cor(b$tau, b$X$lac), 3),
  ps_range = paste(round(range(b$ps_true), 3), collapse = " – "))

# 4 混杂强度：未调整估计与真值的差距 ----
# 这是判断"某个方法是否真的校正了混杂"的标尺：同一份数据上，未调整差值与
# 真值 ATE 的差就是混杂偏差的上界（在不存在未测混杂的前提下）。
naive <- function(b) mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])
grid_ids <- c("rct_lin", "rct_nonlin",
              "obs_lin_lin_sharedF", "obs_lin_lin_sharedT",
              "obs_nonlin_lin_sharedF", "obs_nonlin_lin_sharedT")
bias_tab <- dplyr::bind_rows(lapply(grid_ids, function(id) {
  bb <- mlr3HTE_bench(id, "continuous")
  data.frame(id = id,
             ate_true = bb$ate,
             naive = naive(bb),
             bias = naive(bb) - bb$ate)
}))
bias_tab$bias_abs <- abs(bias_tab$bias)
bias_tab

p_bias <- ggplot2::ggplot(bias_tab, ggplot2::aes(x = reorder(.data$id, .data$bias_abs),
                                                 y = .data$bias)) +
  ggplot2::geom_col(fill = "#1B6CA8") +
  ggplot2::geom_hline(yintercept = 0, colour = "grey40") +
  ggplot2::coord_flip() +
  ggplot2::labs(x = NULL, y = "未调整差值 − 真值 ATE",
                title = "混杂偏差：随机化设计 ≈ 0，观察性设计随共用变量而放大") +
  ggplot2::theme_minimal(base_size = 12)
p_bias
ggplot2::ggsave("tutorial/figures/16_confounding_bias.png", p_bias,
                width = 7.5, height = 4, dpi = 150)

# 5 线性 vs 非线性 HTE：谁能估得准 ----
# 固定"观察性 + 非线性混杂 + 共用变量"，只改 HTE 形式；用 T-Learner 配两种
# 基学习器（线性模型 vs 随机森林）比较 CATE 与真值的相关。
#
# 关键：CATE 相关必须在留出集上算。t_learner() 返回的是训练集 CATE，
# 柔性学习器会记住训练噪声，回代自己必然虚高，比不出真假。
# 这里显式做 70/30 划分，只在测试集上比较。
cmp <- dplyr::bind_rows(lapply(c("obs_nonlin_lin_sharedT", "obs_nonlin_nonlin_sharedT"),
  function(id) {
    bb <- mlr3HTE_bench(id, "continuous")
    tr <- sample(seq_len(nrow(bb$X)), size = floor(0.7 * nrow(bb$X)))
    te <- setdiff(seq_len(nrow(bb$X)), tr)
    fit_one <- function(lb) {
      f <- metalearner("T", bb$X[tr, ], bb$A[tr], bb$Y[tr], learner_base = lb)
      cor(f$predict(bb$X[te, ]), bb$tau[te])
    }
    dplyr::bind_rows(
      data.frame(hte = bb$meta$hte, learner = "regr.lm",
                 cor = fit_one(lrn("regr.lm"))),
      data.frame(hte = bb$meta$hte, learner = "regr.ranger",
                 cor = fit_one(lrn("regr.ranger", num.trees = 300)))
    )
  }))
cmp$cor <- round(cmp$cor, 3)
cmp

# 6 生存结局额外提供 RMST 尺度的真值 ----
s <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "survival")
c(ate_survdiff = s$ate, ate_rmst = s$ate_rmst, t0 = s$t0)

# 7 使用约定 ----
cli::cli_alert_info("方法学比较请统一使用 mlr3HTE_bench()，不要各自重新模拟")
cli::cli_alert_info("需要真值以外的结构时，用 mlr3HTE_scenario() 按同一生成器扩展")
