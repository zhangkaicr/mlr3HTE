# 目的：回答「dr_pseudo_outcome() 能否处理二分类与生存结局」。
# 输入：无（用 mlr3HTE_bench() 的固定基准数据）。
# 输出：三类结局各跑一遍，打印伪结局定义、取值范围、权重与真值对账。
# 依赖：pkgload::load_all()。

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
set.seed(1)
suppressMessages(pkgload::load_all(".", quiet = TRUE))

# 1 连续结局（基线） ----
d <- mlr3HTE_bench("rct_lin", "continuous")
dr <- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)
cli::cli_alert_info("连续：n = {length(dr$pseudo)}，ATE 估计 = {round(mean(dr$pseudo), 4)}，真值 = {round(d$ate, 4)}")
cli::cli_alert_info("连续：mu1/mu0/propensity 长度 = {length(dr$mu1)}/{length(dr$mu0)}/{length(dr$propensity)}")

# 2 二分类结局 ----
b <- mlr3HTE_bench("rct_lin", "binary")
dr_b <- dr_pseudo_outcome(b$X, b$A, b$Y, seed = 1)
cli::cli_alert_info("二分类：n = {length(dr_b$pseudo)}，ATE 估计 = {round(mean(dr_b$pseudo), 4)}，真值 = {round(b$ate, 4)}")
cli::cli_alert_info("二分类：伪结局范围 [{round(min(dr_b$pseudo), 3)}, {round(max(dr_b$pseudo), 3)}]；mu1 范围 [{round(min(dr_b$mu1), 3)}, {round(max(dr_b$mu1), 3)}]")
# 伪结局理论上 = mu1 - mu0 + A(Y-mu1)/ps - (1-A)(Y-mu0)/(1-ps)，风险差尺度
head(round(dr_b$pseudo, 4), 5)

# 3 生存结局 ----
s <- mlr3HTE_bench("rct_lin", "survival")
dr_s <- dr_pseudo_outcome(s$X, s$A, s$Y, t0 = s$t0, seed = 1)
cli::cli_alert_info("生存 survdiff：n = {length(dr_s$pseudo)}，ATE 估计 = {round(mean(dr_s$pseudo), 4)}，真值 = {round(s$ate, 4)}")
cli::cli_alert_info("生存 survdiff：权重范围 [{round(min(dr_s$w), 3)}, {round(max(dr_s$w), 3)}]，权重为 1 的比例 {round(mean(dr_s$w == 1), 3)}")

# 3.1 换 RMST 标尺 ----
dr_r <- dr_pseudo_outcome(s$X, s$A, s$Y, t0 = s$t0, effect = "rmst", seed = 1)
cli::cli_alert_info("生存 rmst：ATE 估计 = {round(mean(dr_r$pseudo), 4)}，真值 ate_rmst = {round(s$ate_rmst, 4)}")

# 4 二分类的权重是否恒为 1（无删失） ----
cli::cli_alert_info("二分类权重是否恒为 1：{all(dr_b$w == 1)}")

# 5 观察性数据（有混杂）下三件套是否还准 ----
o <- mlr3HTE_bench("obs_lin_lin_sharedF", "binary")
dr_o <- dr_pseudo_outcome(o$X, o$A, o$Y, seed = 1)
cli::cli_alert_info("观察性二分类：ATE 估计 = {round(mean(dr_o$pseudo), 4)}，真值 = {round(o$ate, 4)}；未调整 = {round(mean(o$Y[o$A == 1]) - mean(o$Y[o$A == 0]), 4)}")

# 99 收尾 ----
cli::cli_alert_success("三类结局均已实跑")
