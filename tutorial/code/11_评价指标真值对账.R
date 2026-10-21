# 11_评价指标真值对账.R
# 目的：模拟数据里真实 CATE（tau）是已知的，所以 Qini / TOC 的**真值**可以直接算出
#       来，不需要 IPW 估计。本脚本用这条真值标尺把模型的实测得分拆成两部分：
#         排序损失（模型没把获益者排对位置）  +  估计噪声（IPW 估计本身的抽样误差）
#       并给出 c-for-benefit 的闭式上界，说明它的天花板由信噪比决定、不由模型决定。
# 输入：无外部数据，全部用 mlr3HTE 的演示数据生成器（DGP 已知）
# 输出：tutorial/figures/11_qini_truth.png、11_toc_truth.png、
#       tutorial/output/11_truth_reconciliation.md（对账表，Markdown）
# 依赖：mlr3HTE, mlr3, mlr3learners, ranger, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下  Rscript tutorial/code/11_评价指标真值对账.R

# 0 环境与依赖 -------------------------------------------------------------
# 本机 LC_CTYPE=C 时，R 解析含 UTF-8 的源文件会把字符串改写成 <U+XXXX> 字面量，
# 且 ragg 不做字体回退（中文全变豆腐块）。必须在 load_all() 与任何 ggsave() 之前切 locale。
invisible(Sys.setlocale("LC_CTYPE", "en_US.UTF-8"))

if (requireNamespace("pkgload", quietly = TRUE)) {
  pkgload::load_all(".")
} else {
  library(mlr3HTE)
}
suppressWarnings({library(mlr3); library(mlr3learners); library(ggplot2)})

set.seed(2024)

# 1 真值指标：tau 已知时，Qini / TOC 不需要估计 ------------------------------
# 包里的 qini_curve() 用 IPW 评分估计累积增益；而真实增益是 tau 的直接函数：
#   Q_true(f_k) = (1/n) * sum(tau_i, i in top-k by score)
# 两者在同一尺度上（RCT 下 E[IPW 评分] = ATE = mean(tau)），可以直接相减。
# 这三个函数只在本脚本内使用，放在脚本顶部是为了让读者一眼看到"真值怎么来的"。

## 1.1 真值 Qini 曲线与系数 ----
qini_truth <- function(score, tau) {
  ord  <- order(score, decreasing = TRUE)
  q    <- cumsum(tau[ord]) / length(tau)
  frac <- seq_along(tau) / length(tau)
  out  <- data.frame(fraction = c(0, frac), qini = c(0, q))
  attr(out, "qini_at_full") <- q[length(q)]
  out
}

qini_coef_truth <- function(score, tau) {
  df  <- qini_truth(score, tau)
  auc <- sum(diff(df$fraction) * (df$qini[-nrow(df)] + df$qini[-1]) / 2)
  auc - 0.5 * attr(df, "qini_at_full")     # 减去随机靶向线下的面积
}

## 1.2 真值 TOC 曲线 ----
toc_truth <- function(score, tau) {
  ord <- order(score, decreasing = TRUE)
  data.frame(fraction = seq_along(tau) / length(tau),
             toc      = cumsum(tau[ord]) / seq_along(tau))
}

# 2 RCT：把模型得分拆成排序损失与估计噪声 -----------------------------------

## 2.1 数据、模型与测试集 CATE ----
d     <- mlr3HTE_demo_data(n = 4000, seed = 1)
n     <- nrow(d$X)
idx   <- sample.int(n, size = n %/% 2)
Xte   <- d$X[idx, ]; Ate <- d$A[idx]; Yte <- d$Y[idx]; tau_te <- d$tau[idx]

fit <- metalearner("T", d$X[-idx, ], d$A[-idx], d$Y[-idx],
                   learner_base = mlr3::lrn("regr.ranger", num.trees = 300, seed = 1),
                   learner_tau  = mlr3::lrn("regr.ranger", num.trees = 500,
                                            min.node.size = 50, seed = 1))
cate <- fit$predict(Xte)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("test set n = {length(idx)}, true ATE = {round(mean(tau_te), 3)}")
  cli::cli_alert_info("cor(cate_test, tau_test) = {round(cor(cate, tau_te), 3)}")
}

set.seed(99)
cate_rand <- sample(cate)                    # 无信息排序的下界

## 2.2 五个数：真值 / 估计 × 随机 / 模型 / oracle ----
# 真值列只用 tau 与排序分数，与 A、Y 无关；估计列走包里的 IPW。
truth_model  <- qini_coef_truth(cate,      tau_te)
truth_oracle <- qini_coef_truth(tau_te,    tau_te)
truth_rand   <- qini_coef_truth(cate_rand, tau_te)

est_model    <- qini_coefficient(cate,      Ate, Yte)$qini_coefficient
est_oracle   <- qini_coefficient(tau_te,    Ate, Yte)$qini_coefficient
est_rand     <- qini_coefficient(cate_rand, Ate, Yte)$qini_coefficient

recon <- data.frame(
  layer      = c("随机排序", "模型排序", "oracle 排序"),
  truth      = c(truth_rand, truth_model, truth_oracle),
  estimated  = c(est_rand,   est_model,   est_oracle),
  gap        = c(est_rand - truth_rand, est_model - truth_model,
                 est_oracle - truth_oracle)
)
print(recon)

## 2.3 分解与效率 ----
# 排序损失 = oracle 真值 − 模型真值（纯排序质量的差距，与估计无关）
# 估计噪声 = oracle 估计 − oracle 真值（排序已经完美，剩下的全是 IPW 抽样误差）
ranking_loss <- truth_oracle - truth_model
estim_noise  <- est_oracle   - truth_oracle
efficiency   <- truth_model / truth_oracle      # 相对天花板拿到了多少

decomp <- data.frame(
  component = c("oracle 真值（天花板）", "排序损失", "模型真值",
                "估计噪声（oracle 上）", "模型实测", "排序效率"),
  value     = c(truth_oracle, -ranking_loss, truth_model,
                estim_noise, est_model, efficiency)
)
print(decomp)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("排序损失 = {round(ranking_loss, 4)}（占天花板 {round(100*ranking_loss/truth_oracle, 1)}%）")
  cli::cli_alert_info("估计噪声 = {round(estim_noise, 4)}（占天花板 {round(100*abs(estim_noise)/truth_oracle, 1)}%）")
  cli::cli_alert_info("排序效率 = {round(efficiency, 3)}（模型拿到了 oracle 可得增益的比例）")
}

## 2.4 用随机排序标定噪声标尺：单次 Qini 估计能分辨多细的差距 ----
# 随机排序的真值 Qini 系数**恒等于 0**（Q_true(f) = f·ATE 是直线，面积正好等于
# 随机线下的面积）。所以它的 IPW 估计值偏离 0 多少，就是单次估计的噪声量级。
noise_scale <- abs(est_rand - truth_rand)
separable   <- noise_scale > ranking_loss
if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("随机排序的真值 = {round(truth_rand, 4)}（理论上恒为 0），IPW 估计 = {round(est_rand, 4)}")
  cli::cli_alert_info("→ 单次估计的噪声标尺 ≈ {round(noise_scale, 4)}；",
                      "而 oracle 与模型的真值差距只有 {round(ranking_loss, 4)}")
  cli::cli_alert_warning("噪声 {round(noise_scale, 3)} > 排序差异 {round(ranking_loss, 3)}：",
                         "单次 Qini 估计分辨不出这两个排序的优劣")
}

# 3 c-for-benefit 的天花板由信噪比决定，不由模型决定 ------------------------

## 3.1 重做一遍配对，拿到"观测获益"和它对应的真 tau ----
# c_for_benefit() 内部就是这段贪心 1:1 最近邻配对；这里显式重做一次，
# 是为了把每对的观测获益与真 tau 拿出来，算信噪比。
pair_benefit <- function(cate, A, Y, tau) {
  tr <- which(A == 1); ct <- which(A == 0)
  tr <- tr[order(cate[tr])]
  used <- rep(FALSE, length(ct))
  pred <- numeric(0); obs <- numeric(0); tau_p <- numeric(0)
  for (t in tr) {
    avail <- which(!used)
    if (!length(avail)) break
    j <- avail[which.min(abs(cate[ct[avail]] - cate[t]))]
    used[j] <- TRUE
    pred   <- c(pred, cate[t])
    obs    <- c(obs, Y[t] - Y[ct[j]])       # 观测获益 = 处理者结局 − 对照者结局
    tau_p  <- c(tau_p, tau[t])              # 该对的真 tau
  }
  data.frame(pred = pred, obs = obs, tau = tau_p)
}

pairs <- pair_benefit(tau_te, Ate, Yte, tau_te)   # oracle 排序下的配对

## 3.2 闭式上界：C_max = 0.5 + asin(rho) / pi ----
# 观测获益 = tau + 不可约噪声（配对内两人的基线差 + 结局噪声差）。
# 比较两对 i,j 时：信号 D = tau_i - tau_j，噪声 eta = noise_i - noise_j，
# 二者独立正态 → (D, D+eta) 是二元正态，相关 rho = sd(tau)/sd(obs)，
# 同号概率 = 1/2 + arcsin(rho)/pi。这就是 c-for-benefit 的理论天花板。
rho     <- sd(pairs$tau) / sd(pairs$obs)
c_upper <- 0.5 + asin(rho) / pi

c_oracle <- c_for_benefit(tau_te, Ate, Yte)$c_for_benefit
c_model  <- c_for_benefit(cate,   Ate, Yte)$c_for_benefit
c_rand   <- c_for_benefit(cate_rand, Ate, Yte)$c_for_benefit

cfb <- data.frame(
  layer   = c("理论天花板", "oracle 实测", "模型实测", "随机排序"),
  value   = c(c_upper, c_oracle, c_model, c_rand),
  note    = c("0.5 + asin(rho)/pi", "排序完美", "实际", "约 0.5")
)
print(cfb)
if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("信噪比 rho = sd(tau)/sd(obs) = {round(rho, 3)}")
  cli::cli_alert_info("观测获益 SD = {round(sd(pairs$obs), 3)}，其中真 tau SD 只有 {round(sd(pairs$tau), 3)}")
}

# 4 观察性：不传 propensity 是偏差，传了只剩噪声 ----------------------------

## 4.1 真值标尺与三层估计 ----
d_obs <- mlr3HTE_demo_obs(n = 4000, seed = 11)
dr    <- dr_pseudo_outcome(d_obs$X, d_obs$A, d_obs$Y, seed = 1)
cate_obs <- dr$mu1 - dr$mu0

truth_obs_model  <- qini_coef_truth(cate_obs,     d_obs$tau)
truth_obs_oracle <- qini_coef_truth(d_obs$tau,    d_obs$tau)
est_obs_ps       <- qini_coefficient(cate_obs, d_obs$A, d_obs$Y,
                                     propensity = dr$propensity)$qini_coefficient
est_obs_nops     <- qini_coefficient(cate_obs, d_obs$A, d_obs$Y)$qini_coefficient
est_obs_oracle   <- qini_coefficient(d_obs$tau, d_obs$A, d_obs$Y,
                                     propensity = dr$propensity)$qini_coefficient

recon_obs <- data.frame(
  layer     = c("模型真值", "oracle 真值", "模型 + propensity", "模型 不传", "oracle + propensity"),
  qini      = c(truth_obs_model, truth_obs_oracle, est_obs_ps, est_obs_nops, est_obs_oracle)
)
print(recon_obs)

## 4.2 偏差-方差分解 ----
# 不传 propensity：曲线整体被混杂抬高，这是**系统偏差**，可修。
# 传了 propensity ：曲线围绕真值抖动，这是**抽样噪声**，只能靠增大 n 压下去。
bias_obs   <- est_obs_nops - truth_obs_model
noise_obs  <- est_obs_ps   - truth_obs_model

# 同样用随机排序标定噪声标尺（观察性下真值仍恒为 0）
set.seed(99)
truth_obs_rand <- qini_coef_truth(rnorm(length(cate_obs)), d_obs$tau)
est_obs_rand   <- qini_coefficient(rnorm(length(cate_obs)), d_obs$A, d_obs$Y,
                                   propensity = dr$propensity)$qini_coefficient
noise_scale_obs <- abs(est_obs_rand - truth_obs_rand)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_info("不传 propensity 的偏差 = {round(bias_obs, 3)}（真值 {round(truth_obs_model, 3)}）")
  cli::cli_alert_info("传 propensity 后的残差 = {round(noise_obs, 3)}")
  cli::cli_alert_info("噪声标尺 ≈ {round(noise_scale_obs, 3)}；偏差是它的 {round(bias_obs/noise_scale_obs, 0)} 倍")
  cli::cli_alert_info("排序能带来的真值差异 = {round(truth_obs_oracle - truth_obs_model, 4)}，",
                      "小于噪声标尺 → 单次估计同样分辨不出")
}

# 5 出图 -------------------------------------------------------------------
fig_dir <- "tutorial/figures"
dir.create(fig_dir, recursive = TRUE, showWarnings = FALSE)

## 5.1 Qini：真值线 vs 估计线 vs 随机靶向线 ----
q_o <- qini_truth(tau_te, tau_te);            q_m <- qini_truth(cate, tau_te)
q_e <- qini_curve(cate, Ate, Yte)
p1 <- ggplot() +
  geom_line(data = q_o, aes(x = fraction, y = qini, colour = "真值 · oracle 排序"),
            linewidth = 1) +
  geom_line(data = q_m, aes(x = fraction, y = qini, colour = "真值 · 模型排序"),
            linewidth = 0.9) +
  geom_line(data = q_e, aes(x = fraction, y = qini, colour = "IPW 估计 · 模型排序"),
            linewidth = 0.9, linetype = "dashed") +
  geom_abline(slope = attr(q_o, "qini_at_full"), intercept = 0,
              linetype = "dotted", colour = "grey50") +
  annotate("text", x = 0.62, y = attr(q_o, "qini_at_full") * 0.62,
           label = "随机靶向线", colour = "grey40", size = 3.2) +
  scale_colour_manual(values = c("真值 · oracle 排序" = "#0F6E56",
                                 "真值 · 模型排序"   = "#185FA5",
                                 "IPW 估计 · 模型排序" = "#BA7517")) +
  labs(title = "Qini 曲线：真值标尺与 IPW 估计",
       subtitle = sprintf("真值 oracle %.3f / 模型 %.3f；IPW 估计 %.3f\n排序效率 %.1f%%，噪声标尺 %.3f",
                          truth_oracle, truth_model, est_model, 100 * efficiency, noise_scale),
       x = "Fraction targeted", y = "Cumulative gain", colour = NULL) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "bottom",
        plot.subtitle = element_text(size = 9.5))
# device 必须显式给 ragg::agg_png：ragg 不回退字体，空 family 就是 Arial，
# 中文全成豆腐块；必须先切到 en_US.UTF-8（见第 0 节）。
ggsave(file.path(fig_dir, "11_qini_truth.png"), p1, width = 7.2, height = 5, dpi = 150,
       bg = "white", device = ragg::agg_png)

## 5.2 TOC：真值与估计 ----
t_o <- toc_truth(tau_te, tau_te);             t_m <- toc_truth(cate, tau_te)
t_e <- toc_curve(cate, Ate, Yte)
# y 轴截到 6：最左端的 IPW 估计会冲到 20+（单个样本除以极小的 e），
# 不截断则整张图被那一个点拉扁，什么也看不出来。这一点本身就是结论，写进标题。
toc_top <- t_m$toc[which.max(t_m$fraction >= 0.10)]
p2 <- ggplot() +
  geom_line(data = t_o, aes(x = fraction, y = toc, colour = "真值 · oracle 排序"),
            linewidth = 1) +
  geom_line(data = t_m, aes(x = fraction, y = toc, colour = "真值 · 模型排序"),
            linewidth = 0.9) +
  geom_line(data = t_e, aes(x = fraction, y = toc, colour = "IPW 估计 · 模型排序"),
            linewidth = 0.9, linetype = "dashed") +
  geom_hline(yintercept = mean(tau_te), linetype = "dotted", colour = "grey50") +
  coord_cartesian(ylim = c(0, 6)) +
  scale_colour_manual(values = c("真值 · oracle 排序" = "#0F6E56",
                                 "真值 · 模型排序"   = "#185FA5",
                                 "IPW 估计 · 模型排序" = "#BA7517")) +
  labs(title = "TOC 曲线：真值标尺与 IPW 估计",
       subtitle = sprintf("真 ATE = %.3f；前 10%% 真值效应 %.3f\ny 轴截到 6：最左端 IPW 估计越界（单个样本 ÷ 极小 e）",
                          mean(tau_te), toc_top),
       x = "Fraction targeted", y = "Average effect in top fraction", colour = NULL) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "bottom",
        plot.subtitle = element_text(size = 9.5))
ggsave(file.path(fig_dir, "11_toc_truth.png"), p2, width = 7.2, height = 5, dpi = 150,
       bg = "white", device = ragg::agg_png)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_success("figures saved to {fig_dir}/11_qini_truth.png and 11_toc_truth.png")
}

# 6 对账表写盘 ---------------------------------------------------------------
out_dir <- "tutorial/output"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

f <- function(x) formatC(round(x, 4), format = "f", digits = 4)
lines <- c(
  "# HTE 评价指标的真值对账（n_test = 2000，连续结局 RCT）",
  "",
  "| 层 | 真值 | IPW 估计 | 估计 − 真值 |",
  "|---|---|---|---|",
  sprintf("| 随机排序 | %s | %s | %s |", f(truth_rand),   f(est_rand),   f(est_rand - truth_rand)),
  sprintf("| 模型排序 | %s | %s | %s |", f(truth_model),  f(est_model),  f(est_model - truth_model)),
  sprintf("| oracle 排序 | %s | %s | %s |", f(truth_oracle), f(est_oracle), f(est_oracle - truth_oracle)),
  "",
  "## 分解",
  "",
  sprintf("- oracle 真值（排序天花板）：%s", f(truth_oracle)),
  sprintf("- 排序损失（模型没排对）：%s，占天花板 %.1f%%",
          f(ranking_loss), 100 * ranking_loss / truth_oracle),
  sprintf("- 估计噪声（IPW 抽样误差）：%s，占天花板 %.1f%%",
          f(estim_noise), 100 * abs(estim_noise) / truth_oracle),
  sprintf("- 排序效率 = 模型真值 / oracle 真值：%s", f(efficiency)),
  sprintf("- 噪声标尺（随机排序真值恒为 0，实测 %s）：%s", f(truth_rand), f(noise_scale)),
  sprintf("- 排序差异 %s 远小于噪声标尺 %s → **单次 IPW 估计分辨不出排序优劣**",
          f(ranking_loss), f(noise_scale)),
  "",
  "## c-for-benefit：没有真值，只有上界",
  "",
  sprintf("- 信噪比 rho = sd(tau)/sd(观测获益) = %s", f(rho)),
  sprintf("- 理论天花板 0.5 + asin(rho)/pi = %s", f(c_upper)),
  sprintf("- oracle 实测 %s / 模型实测 %s / 随机 %s", f(c_oracle), f(c_model), f(c_rand)),
  "",
  "## 观察性数据（n = 4000，真 ATE = 1.046）",
  "",
  sprintf("- 模型真值 %s / oracle 真值 %s", f(truth_obs_model), f(truth_obs_oracle)),
  sprintf("- 传 propensity 的估计 %s（残差 %s = 噪声）", f(est_obs_ps), f(noise_obs)),
  sprintf("- 不传 propensity 的估计 %s（偏差 %s = 混杂）", f(est_obs_nops), f(bias_obs)),
  sprintf("- 噪声标尺 %s，偏差是它的 %.0f 倍 → propensity 修的是**系统偏差**，不是噪声",
          f(noise_scale_obs), bias_obs / noise_scale_obs)
)
# 写盘用 useBytes = TRUE：本机 LC_CTYPE 为 C 时，按连接编码走的写盘路径会把
# UTF-8 每个字节减 0x80 写成 ASCII（E8→68），中文全毁。useBytes 直接吐内部字节。
con <- file(file.path(out_dir, "11_truth_reconciliation.md"), open = "wb")
writeLines(lines, con = con, useBytes = TRUE, sep = "\n")
close(con)

if (requireNamespace("cli", quietly = TRUE)) {
  cli::cli_alert_success("reconciliation written to {out_dir}/11_truth_reconciliation.md")
}

# 99 收尾 ------------------------------------------------------------------
