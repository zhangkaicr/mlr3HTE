# 目的：把 HTE 评价指标（Qini / TOC / c-for-benefit）在三类结局上各跑一遍并互相对账
# 输入：mlr3HTE_demo_data() / mlr3HTE_demo_binary() / mlr3HTE_demo_surv()
# 输出：tutorial/output/12_metrics_three_outcomes.md（对账表，脚本自动生成）
# 依赖：mlr3HTE（pkgload::load_all）、survival、ranger
#
# 三个结论，按重要性排：
#   1. 三类结局都能跑通，且 oracle（真 tau）在重复抽样下稳定压过随机排序
#   2. 生存结局的效应标尺必须和 CATE 定义一致（都是 S(t0) 差），删失 IPCW 不是可选项
#   3. 评价必须在"模型没见过"的数据上做。先在全集拟合、再切一块当留出集，等于
#      把 Y 泄漏进 CATE：二分类下 c-for-benefit 能从 0.61 虚高到 0.93（见第 6 节）

# 0 环境与依赖 -------------------------------------------------------------
# locale 必须在 load_all() 之前：本机 LC_CTYPE=C 会把源码里的 UTF-8 字面量解析坏
invisible(Sys.setlocale("LC_CTYPE", "en_US.UTF-8"))
pkgload::load_all(".")
set.seed(20261021)

out_dir <- file.path("tutorial", "output")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

R <- 8L                                  # 重复抽样次数（单次读数不可靠，见第 7 节）

# 1 工具：切分 → 训练集拟合 → 留出集评价 ------------------------------------
# 三层：oracle = 真 tau；model = 模型 CATE；random = 打乱的真 tau
# 顺序不能反：先拟合再切分，模型就"见过"留出集的 Y，CATE 里混进 Y 的记忆
three_layers <- function(d, fit_fun, ...) {
  n <- length(d$A)
  set.seed(4242)
  te <- sample(n, floor(n / 3))
  tr <- setdiff(seq_len(n), te)
  fit <- fit_fun(d, tr)                  # 只在训练集上拟合
  Xte <- d$X[te, , drop = FALSE]
  tau <- d$tau[te]
  cate_m <- fit$predict(Xte)
  set.seed(99)
  cate_r <- sample(tau)
  A <- d$A[te]
  Yte <- if (inherits(d$Y, "Surv")) d$Y[te, , drop = FALSE] else d$Y[te]
  c(
    q_oracle = qini_coefficient(tau, A, Yte, ...)$qini_coefficient,
    q_model  = qini_coefficient(cate_m, A, Yte, ...)$qini_coefficient,
    q_random = qini_coefficient(cate_r, A, Yte, ...)$qini_coefficient,
    c_oracle = c_for_benefit(tau, A, Yte, ...)$c_for_benefit,
    c_model  = c_for_benefit(cate_m, A, Yte, ...)$c_for_benefit,
    c_random = c_for_benefit(cate_r, A, Yte, ...)$c_for_benefit
  )
}

# 重复 R 次取均值与标准差：单次 IPW 读数的噪声比排序差距还大，必须平均
rep_layers <- function(gen, fit_fun, ...) {
  m <- matrix(NA_real_, nrow = R, ncol = 6)
  for (r in seq_len(R)) {
    d <- gen(r)
    m[r, ] <- three_layers(d, fit_fun, ...)
  }
  colnames(m) <- c("q_oracle", "q_model", "q_random",
                   "c_oracle", "c_model", "c_random")
  m
}

summarise_layers <- function(m, label, ate) {
  mu <- colMeans(m)
  sd <- apply(m, 2, sd)
  data.frame(
    结局 = label, ATE真值 = ate,
    Qini_oracle = sprintf("%.4f ± %.4f", mu[1], sd[1]),
    Qini_model  = sprintf("%.4f ± %.4f", mu[2], sd[2]),
    Qini_random = sprintf("%.4f ± %.4f", mu[3], sd[3]),
    c4b_oracle  = sprintf("%.4f ± %.4f", mu[4], sd[4]),
    c4b_model   = sprintf("%.4f ± %.4f", mu[5], sd[5]),
    c4b_random  = sprintf("%.4f ± %.4f", mu[6], sd[6]),
    stringsAsFactors = FALSE
  )
}

# 2 连续结局 ---------------------------------------------------------------
m_c <- rep_layers(
  gen = function(r) mlr3HTE_demo_data(n = 2400, seed = 100 + r),
  fit_fun = function(d, idx) metalearner(
    "T", d$X[idx, ], d$A[idx], d$Y[idx],
    learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))
)
row_c <- summarise_layers(m_c, "连续", mlr3HTE_demo_data(n = 2400)$ate)

# 3 二分类结局 -------------------------------------------------------------
m_b <- rep_layers(
  gen = function(r) mlr3HTE_demo_binary(n = 2400, seed = 200 + r),
  fit_fun = function(d, idx) metalearner(
    "T", d$X[idx, ], d$A[idx], d$Y[idx],
    learner_base = lrn("classif.ranger", num.trees = 300, seed = 1))
)
row_b <- summarise_layers(m_b, "二分类", mlr3HTE_demo_binary(n = 2400)$ate)

# 4 生存结局（效应标尺 = S(t0) 差，与 metalearner 的生存 CATE 一致）--------
m_s <- rep_layers(
  gen = function(r) mlr3HTE_demo_surv(n = 3000, t0 = 2, seed = 300 + r),
  fit_fun = function(d, idx) metalearner(
    "T", d$X[idx, ], d$A[idx], d$Y[idx, , drop = FALSE],
    learner_base = "coxph", t0 = d$t0),
  t0 = 2
)
row_s <- summarise_layers(m_s, "生存", mlr3HTE_demo_surv(n = 3000, t0 = 2)$ate)

tab <- rbind(row_c, row_b, row_s)
print(tab)

# 5 生存：删失 IPCW 到底救回多少 -------------------------------------------
# 大样本下看无偏性；同时对比"假装没删失（w = 1）"的算法
ds <- mlr3HTE_demo_surv(n = 20000, t0 = 2)
oc <- mlr3HTE:::.hte_outcome(ds$Y, t0 = 2, effect = "survdiff")
e <- mean(ds$A)
u <- ds$A * oc$y / e - (1 - ds$A) * oc$y / (1 - e)
ate_ipcw  <- mean(oc$w * u)
ate_naive <- mean(u)

cens_tab <- data.frame(
  算法 = c("完整病例 IPCW（本包默认）", "不做删失校正（w = 1）", "真值"),
  Q1 = c(ate_ipcw, ate_naive, ds$ate),
  stringsAsFactors = FALSE
)
cens_tab$偏差 <- cens_tab$Q1 - ds$ate
print(cens_tab)

# Q(1) 在小样本下的波动：这就是"单次读数不能比较模型"的根源
qs <- replicate(R, {
  d <- mlr3HTE_demo_surv(n = 3000, t0 = 2, seed = 400 + sample.int(1e6, 1))
  qini_coefficient(d$tau, d$A, d$Y, t0 = 2)$qini_at_full
})
cli::cli_alert_info("生存 Q(1) 在 n=3000 下：mean {round(mean(qs), 4)}，sd {round(sd(qs), 4)}（真 ATE {round(ds$ate, 4)}）")

# 6 泄漏对照：先拟合后切分 vs 先切分后拟合 ---------------------------------
# 同一个二分类数据、同一个 T-learner，只改拟合顺序，看 c-for-benefit 差多少
db <- mlr3HTE_demo_binary(n = 2400, seed = 200)
nb <- length(db$A)
set.seed(4242)
te <- sample(nb, floor(nb / 3))
tr <- setdiff(seq_len(nb), te)
fit_leak <- metalearner("T", db$X, db$A, db$Y,
                        learner_base = lrn("classif.ranger", num.trees = 300, seed = 1))
fit_honest <- metalearner("T", db$X[tr, ], db$A[tr], db$Y[tr],
                          learner_base = lrn("classif.ranger", num.trees = 300, seed = 1))
cate_leak   <- fit_leak$predict(db$X[te, ])
cate_honest <- fit_honest$predict(db$X[te, ])
leak_tab <- data.frame(
  拟合方式 = c("全集拟合后切留出集（泄漏）", "只在训练集拟合（正确）", "真 tau（oracle）"),
  c4b = c(
    c_for_benefit(cate_leak, db$A[te], db$Y[te])$c_for_benefit,
    c_for_benefit(cate_honest, db$A[te], db$Y[te])$c_for_benefit,
    c_for_benefit(db$tau[te], db$A[te], db$Y[te])$c_for_benefit
  ),
  与真tau的相关 = c(
    cor(cate_leak, db$tau[te]),
    cor(cate_honest, db$tau[te]),
    1
  ),
  stringsAsFactors = FALSE
)
print(leak_tab)

# 7 单次读数为什么不能比模型：model 挑的人真 tau 更低，IPW 评分却更高 --------
dd <- mlr3HTE_demo_data(n = 3000)
n <- length(dd$A)
set.seed(4242)
te2 <- sample(n, floor(n / 3))
tr2 <- setdiff(seq_len(n), te2)
fitd <- metalearner("T", dd$X[tr2, ], dd$A[tr2], dd$Y[tr2],
                    learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))
tau <- dd$tau[te2]; A <- dd$A[te2]; Y <- dd$Y[te2]
cate_m <- fitd$predict(dd$X[te2, , drop = FALSE])
ee <- mean(A)
s <- A * Y / ee - (1 - A) * Y / (1 - ee)
k <- 100
om <- order(cate_m, decreasing = TRUE)[seq_len(k)]
ot <- order(tau, decreasing = TRUE)[seq_len(k)]
single_tab <- data.frame(
  排序 = c("model（T-learner）", "oracle（真 tau）"),
  top100真tau均值 = c(mean(tau[om]), mean(tau[ot])),
  top100_IPW评分均值 = c(mean(s[om]), mean(s[ot]))
)
print(single_tab)

# 8 RMST 标尺：删失重时会低估 ----------------------------------------------
# 权重取自 Ĝ(T_i)，删失重时权重被截断到 100，效应被系统性压低
q_survdiff <- qini_coefficient(ds$tau, ds$A, ds$Y, t0 = 2)$qini_at_full
q_rmst <- qini_coefficient(ds$tau, ds$A, ds$Y, t0 = 2, effect = "rmst")
rmst_tab <- data.frame(
  标尺 = c("survdiff（默认）", "rmst"),
  Q1 = c(q_survdiff, q_rmst$qini_at_full),
  参考真值 = c(ds$ate, ds$ate_rmst),
  stringsAsFactors = FALSE
)
rmst_tab$差距 <- rmst_tab$Q1 - rmst_tab$参考真值
print(rmst_tab)

# 9 写盘 -------------------------------------------------------------------
md <- c(
  "# 三类结局的评价指标对账（脚本 12 自动生成）",
  "",
  paste0("三类结局各重复抽样 ", R, " 次。模型一律只在训练集（2/3）上拟合，",
         "指标在留出集（1/3）上计算。格式为「均值 ± 标准差」。"),
  "",
  "## 1 三种结局 × 三层排序",
  "",
  "| 结局 | ATE真值 | Qini oracle | Qini model | Qini random | c4b oracle | c4b model | c4b random |",
  "|---|---|---|---|---|---|---|---|"
)
for (i in seq_len(nrow(tab))) {
  md <- c(md, sprintf("| %s | %.4f | %s | %s | %s | %s | %s | %s |",
                      tab$结局[i], tab$ATE真值[i], tab$Qini_oracle[i],
                      tab$Qini_model[i], tab$Qini_random[i], tab$c4b_oracle[i],
                      tab$c4b_model[i], tab$c4b_random[i]))
}
md <- c(md, "", "## 2 生存结局：删失 IPCW 的作用（n = 20000）", "",
        "| 算法 | Q(1) | 偏差 |", "|---|---|---|")
for (i in seq_len(nrow(cens_tab))) {
  md <- c(md, sprintf("| %s | %.4f | %+.4f |", cens_tab$算法[i],
                      cens_tab$Q1[i], cens_tab$偏差[i]))
}
md <- c(md, "",
        sprintf("小样本波动：n = 3000 时 Q(1) 的均值 %.4f、标准差 %.4f（真 ATE %.4f）。",
                mean(qs), sd(qs), ds$ate),
        "", "## 3 泄漏对照：拟合顺序决定 c-for-benefit 能不能信（二分类，n = 2400）", "",
        "| 拟合方式 | c-for-benefit | 与真 tau 的相关 |", "|---|---|---|")
for (i in seq_len(nrow(leak_tab))) {
  md <- c(md, sprintf("| %s | %.4f | %.3f |", leak_tab$拟合方式[i],
                      leak_tab$c4b[i], leak_tab$与真tau的相关[i]))
}
md <- c(md, "",
        "「全集拟合后切留出集」把 Y 的记忆带进了 CATE：二分类下观测获益就是 ",
        "Y_treated − Y_control，CATE 记住了 Y_treated，一致率凭空抬高，",
        "甚至反超 oracle。留出集必须在拟合之前切出来。",
        "", "## 4 单次 IPW 读数不能比较排序（连续结局，n = 3000，top-100）", "",
        "| 排序 | top-100 真 tau 均值 | top-100 IPW 评分均值 |", "|---|---|---|")
for (i in seq_len(nrow(single_tab))) {
  md <- c(md, sprintf("| %s | %.3f | %.3f |", single_tab$排序[i],
                      single_tab$top100真tau均值[i], single_tab$top100_IPW评分均值[i]))
}
md <- c(md, "", "## 5 两种生存标尺（n = 20000）", "",
        "| 标尺 | Q(1) | 参考真值 | 差距 |", "|---|---|---|---|")
for (i in seq_len(nrow(rmst_tab))) {
  md <- c(md, sprintf("| %s | %.4f | %.4f | %+.4f |",
                      rmst_tab$标尺[i], rmst_tab$Q1[i],
                      rmst_tab$参考真值[i], rmst_tab$差距[i]))
}

# LC_CTYPE=C 下 writeLines 经连接写盘会把 UTF-8 每个字节减 0x80，必须用 useBytes
con <- file(file.path(out_dir, "12_metrics_three_outcomes.md"), open = "wb")
writeLines(md, con = con, useBytes = TRUE, sep = "\n")
close(con)

# 99 收尾 ------------------------------------------------------------------
sessionInfo()
