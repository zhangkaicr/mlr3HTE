# =====================================================================
# 09_生存结局_survlearners引擎.R
# 目的：生存结局的第二套引擎 engine = "survlearners"。把估计整体委托给
#       GitHub 包 survlearners（Shah Lab，S/T/X/R 四族 + IPCW + R 族交叉拟合），
#       与默认的原生引擎（engine = "native"）同题对比，讲清两者的能力边界。
# 输入：无（数据由演示函数现场生成）
# 输出：DAG、真值卡、两套引擎 × 四种 metalearner × 三种基学习器的对账表、
#       观察性场景（混杂全进 X 条件化）、估计-vs-真实散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, survival, dplyr, tidyr, purrr, ggplot2, cli
#       survlearners（可选，GitHub-only；未装则本脚本的 survlearners 部分
#       会给出明确安装提示，native 部分不受影响）
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/09_生存结局_survlearners引擎.R
# =====================================================================

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(mlr3)
  library(mlr3learners)
  library(survival)
  library(dplyr)
  library(tidyr)
  library(purrr)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP（逐行照抄 R/api.R 的 mlr3HTE_demo_surv）：
#   tau = 0.5 + 0.4*z1 - 0.3*z2                              # 对数风险尺度的效应
#   base_rate = exp(-1.0 + 0.3*z1 + 0.2*z2 + 0.1*(age-60)/12 + 0.15*sex)
#   rate = base_rate * exp(-A*tau)                            # 治疗把风险乘以 exp(-tau)
#   T ~ Exp(rate);  C ~ Exp(0.12)（独立删失）;  time = min(T,C), status = I(T<=C)
#   真实 S(t0|A=1,X)=exp(-base_rate*exp(-tau)*t0)；S(t0|A=0,X)=exp(-base_rate*t0)
#   效应 tau = S1(t0) - S0(t0)；RMST(τ)=(1-exp(-λτ))/λ
print(mlr3HTE_dag("rct", "survival"))

## 1.1 生成数据并打印真值卡 ----
# n 取 2000 而不是其他脚本的 4000：survlearners 的 lasso 族内部要做 K 折
# 交叉验证选 lambda，n 越大越慢（R-lasso 在 n=4000 下要跑几十秒）。
t0 <- 2
n_used <- 2000
d <- mlr3HTE_demo_surv(n = n_used, treat_frac = 0.5, t0 = t0, seed = 1203)

tibble(
  项目 = c("样本量", "真实 ATE（S(t0) 差）", "真实 ATE（RMST 差）", "CATE 标准差",
           "处理率", "删失比例", "中位随访"),
  值   = c(n_used, round(c(d$ate, d$ate_rmst, sd(d$tau), mean(d$A),
                           100 * mean(d$Y[, 2] == 0), median(d$Y[, 1])), 4))
) |> print()

# 2 两套引擎：能力对照 ----
# survlearners（som-shahlab/survlearners，GPL-3）为生存结局实现了
# S/T/X/R/M 五种 metalearner，自带 IPCW 删失校正，R 族内部还有 K 折交叉拟合。
# 它与 mlr3HTE 原生引擎不是替代关系，能力互补——差异必须先讲清楚：
tribble(
  ~能力,              ~"native（默认）",        ~"survlearners",
  "metalearner 覆盖", "S/T/X/R/DR 五族齐全",     "S/T/X/R（没有 DR；另有一个 M）",
  "效应尺度",          "S(t0) 差 + RMST 差",     "只有 S(t0) 差",
  "基学习器",          '"coxph" / "ranger" + 任意 mlr3 learner', '"coxph" / "grf" / "lasso" 三种固定',
  "删失处理",          "IPCW 加到结局模型（本包引擎，自动）", "包内 IPCW（cen.fit 参数）",
  "交叉拟合",          "cross_fitting = TRUE（R/DR）", "R 族内部自带 K 折",
  "依赖",              "零额外（survival + ranger）", "需装 GitHub 包 survlearners"
) |> print()

## 2.1 survlearners 装没装 ----
# 它在 Suggests 里（只发布在 GitHub，不在 CRAN），所以装没装都要能跑：
# 装了 → 本脚本 survlearners 部分正常；没装 → 那些调用给一条安装提示。
has_sl <- requireNamespace("survlearners", quietly = TRUE)
if (has_sl) {
  sl_ver <- as.character(utils::packageVersion("survlearners"))
  cli::cli_alert_success("survlearners 已安装（版本 {sl_ver}），可以跑 engine = \"survlearners\"")
} else {
  cli::cli_alert_warning("未安装 survlearners；下面 survlearners 部分会报错并给出安装命令，native 部分不受影响")
  cli::cli_alert_info('安装：remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")')
}

# 3 RCT：survlearners 引擎 × 四种 metalearner × 三种基学习器 ----
# 注意 X-learner 在 survlearners 里只有 grf / lasso 两种基学习器（没有 coxph 版），
# 所以网格里 X-coxph 缺席是设计如此，不是漏跑。
if (has_sl) {
  grid <- expand_grid(tp = c("S", "T", "X", "R"),
                      kind = c("coxph", "grf", "lasso")) |>
    filter(!(tp == "X" & kind == "coxph"))

  res <- grid |>
    mutate(
      fit = purrr::pmap(list(tp, kind), function(tp, kind) {
        metalearner(tp, d$X, d$A, d$Y, learner_base = kind,
                    t0 = t0, engine = "survlearners")
      })
    ) |>
    mutate(
      ATE  = vapply(fit, function(f) f$ate, numeric(1)),
      相关 = vapply(fit, function(f) cor(f$cate_train, d$tau), numeric(1))
    ) |>
    select(tp, kind, ATE, 相关) |>
    mutate(
      偏差   = ATE - d$ate,
      across(c(ATE, 相关, 偏差), ~ round(., 3))
    )

  ## 3.1 对账表：与真值逐格比 ----
  res |> print()

  ## 3.2 T-coxph 这一格要特别说明 ----
  # 实测：T-coxph 的 ATE 只有 ~0.07（真值 0.15），偏差明显；同族 T-grf/T-lasso 正常。
  # 机制（读 survlearners 0.0.1 源码 + 实测验证，非猜测）：
  #   surv_tl_coxph 用 basehaz(centered = FALSE) 拿【未中心化】的基线累积危险，
  #   却与 predict(type = "risk") 相乘——后者的线性预测器以训练样本均值为参照
  #   （中心化：平移协变量后 mean(risk) 恒为 1，而 mean(exp(x'beta)) = 1.09）。
  #   两个基准不一致，S(t0) 被系统性扭曲，两臂差被压缩。
  #   对照：surv_sl_coxph 的链接是手算的 exp(x %*% coef)（未中心化），基准一致，
  #   所以 S-coxph 这一格是准的（ATE 0.156，偏差 +0.005）。
  # 结论：生存场景可以用 survlearners 的 S/X/R 各族与 T-grf/T-lasso，
  # 但避开 T-coxph 这一格；要 Cox 做 T-learner，用原生引擎（相关 0.98、ATE 0.130）。
  res |> filter(tp == "T") |> print()

  ## 3.3 最优组合 ----
  res |>
    arrange(desc(相关)) |>
    slice_head(n = 3) |>
    select(tp, kind, ATE, 相关, 偏差) |>
    print()

  # 4 与原生引擎同题对比 ----
  # 同一份数据、同一个 metalearner，换 engine 会差多少？
  # 原生引擎的 ranger 与 survlearners 的 grf 都是随机生存森林，但实现不同
  # （ranger vs grf 包、损失与抽样细节也不同），结果不会逐位相同。
  native_res <- tibble(tp = c("S", "T", "X", "R")) |>
    mutate(
      fit = map(tp, function(tp) {
        metalearner(tp, d$X, d$A, d$Y, learner_base = "coxph", t0 = t0)
      })
    ) |>
    mutate(
      ATE  = vapply(fit, function(f) f$ate, numeric(1)),
      相关 = vapply(fit, function(f) cor(f$cate_train, d$tau), numeric(1))
    ) |>
    select(tp, ATE, 相关)

  sl_best <- res |>
    group_by(tp) |>
    arrange(desc(相关), .by_group = TRUE) |>
    slice_head(n = 1) |>
    ungroup() |>
    select(tp, kind, ATE, 相关)

  compare <- native_res |>
    left_join(sl_best, by = "tp", suffix = c("_native", "_sl")) |>
    select(tp, kind, ATE_native, ATE_sl, 相关_native, 相关_sl) |>
    mutate(across(c(ATE_native, ATE_sl, 相关_native, 相关_sl), ~ round(., 3)))

  cli::cli_alert_info("下表：native 用 coxph；survlearners 用各 tp 下相关最高的基学习器")
  compare |> print()

  # 5 估计 vs 真实 CATE 散点 ----
  best_fit <- metalearner("S", d$X, d$A, d$Y, learner_base = "lasso",
                          t0 = t0, engine = "survlearners")
  tibble(真实 = d$tau, 估计 = best_fit$cate_train) |>
    ggplot(aes(真实, 估计)) +
    geom_point(alpha = 0.25, size = 1.2, color = "#4C78A8") +
    geom_abline(slope = 1, intercept = 0, linetype = 2, color = "#E45756") +
    geom_smooth(method = "lm", formula = y ~ x, se = FALSE, color = "#F58518") +
    labs(title = "S-learner + lasso（survlearners 引擎）：估计 vs 真实 CATE",
         subtitle = sprintf("相关 = %.3f；ATE = %.3f（真实 %.3f）",
                            cor(best_fit$cate_train, d$tau), best_fit$ate, d$ate),
         x = "真实 CATE（S(t0) 差）", y = "估计 CATE") +
    coord_equal() +
    theme_minimal(base_size = 12)
  print(last_plot())
}

# 6 观察性数据：把混杂变量放进 X 条件化 ----
# survlearners 的 X/R 族内部按个体倾向得分 W.hat 做校正——这是它算法定义的一部分
# （与 v0.40 移除的 IPTW 加权选项无关），W.hat 由它自带的 PS 模型估计。
# 本包要做的只是把全部混杂变量放进 X，让后门路径被条件化阻断。
if (has_sl) {
  dobs <- mlr3HTE_demo_obs_surv(n = n_used, t0 = t0, seed = 1206)

  obs_res <- tibble(tp = c("X", "R")) |>
    mutate(
      fit = map(tp, function(tp) {
        metalearner(tp, dobs$X, dobs$A, dobs$Y, learner_base = "grf", t0 = t0,
                    engine = "survlearners")
      })
    ) |>
    mutate(
      ATE  = vapply(fit, function(f) f$ate, numeric(1)),
      相关 = vapply(fit, function(f) cor(f$cate_train, dobs$tau), numeric(1))
    ) |>
    select(tp, ATE, 相关) |>
    mutate(across(c(ATE, 相关), ~ round(., 3)))

  # 未调整基准：两组 Kaplan-Meier 在 t0 处的差
  km <- survfit(survival::Surv(dobs$Y[, 1], dobs$Y[, 2]) ~ dobs$A)
  s_at <- summary(km, times = t0)$surv
  tibble(
    方法 = c("未调整 KM 差", "survlearners X-grf", "survlearners R-grf"),
    ATE  = round(c(s_at[2] - s_at[1], obs_res$ATE[1], obs_res$ATE[2]), 3)
  ) |>
    mutate(真实ATE = round(dobs$ate, 3), 偏差 = round(ATE - dobs$ate, 3)) |>
    print()

  # 反面对照：漏掉一个混杂因子。变量没选对时，引擎再强也纠不回来。
  X_miss <- dobs$X |> select(-lac)
  fit_miss <- metalearner("R", X_miss, dobs$A, dobs$Y, learner_base = "grf",
                          t0 = t0, engine = "survlearners")
  cli::cli_alert_warning(
    "漏掉 lac 后 survlearners R-grf：ATE = {round(fit_miss$ate, 3)}，真实 = {round(dobs$ate, 3)}——变量没选对，引擎再强也纠不回来"
  )
}

# 7 复现性与已知边界（如实说明）----
if (has_sl) {
  cli::cli_alert_info("复现性：grf 族在引擎内固定 seed = 1，两次运行逐位相同")
  cli::cli_alert_warning("lasso 族内部用 glmnet 交叉验证选 lambda，折序随机；survlearners 未暴露 foldid，两次运行有 ~0.001 量级抖动")
  cli::cli_alert_info("边界：DR 与 RMST 请用 engine = \"native\"；X 无 coxph 版；survlearners 的 S-grf/S-lasso 分支不挂 IPCW 权重（只有 S-coxph 挂）")
}

# 99 收尾 ----
cli::cli_alert_success("脚本 09 完成：survlearners 引擎与原生引擎已同题对比")
