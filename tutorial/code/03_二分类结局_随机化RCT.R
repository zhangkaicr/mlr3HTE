# =====================================================================
# 03_二分类结局_随机化RCT.R
# 目的：二分类结局的 CATE 估计。效应度量是【风险差】
#       P(Y(1)=1|X) - P(Y(0)=1|X)，不是对数比也不是比值比。
# 输入：无（数据由 mlr3HTE_demo_binary() 现场生成）
# 输出：DAG、真值卡、五种 learner 对账表、估计 vs 真实风险差散点图
# 依赖：mlr3, mlr3learners, mlr3HTE, dplyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行 Rscript tutorial/code/03_二分类结局_随机化RCT.R
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
                                                width = 1000, height = 640, type = "cairo"))
}

# 1 数据集与因果结构（数据卡）----
# DGP：
#   p0 = plogis(-1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex)  # 对照风险
#   tau_logit = 0.6 + 0.5*z1 - 0.4*z2                                  # 对数几率尺度效应
#   p1 = plogis(qlogis(p0) + tau_logit)                                # 处理组风险
#   tau = p1 - p0                                                      # 风险差尺度 CATE
#   A ~ Bern(0.5); Y ~ Bern(if A==1 then p1 else p0)
# 因果结构同 01（RCT，无混杂），只是 Y 换成了 0/1。
print(mlr3HTE_dag("rct", "binary"))

## 1.1 生成数据并打印真值卡 ----
d <- mlr3HTE_demo_binary(n = 4000, treat_frac = 0.5, seed = 1202)
glimpse(d$X)

tibble(
  项目 = c("真实 ATE（风险差）", "CATE 标准差", "CATE 最小", "CATE 最大",
           "处理率", "结局事件率"),
  值   = round(c(d$ate, sd(d$tau), min(d$tau), max(d$tau),
                 mean(d$A), mean(d$Y)), 4)
) |> print()

# 2 基学习器必须是分类学习器 ----
# 引擎按 learner_base 的类型自动判定 outcome = "binary"，
# 结局模型返回 P(Y=1|X)，所以 CATE 天然落在风险差尺度上。
lb <- lrn("classif.ranger", num.trees = 300, seed = 1)

## 2.1 类型判定的结果 ----
fit0 <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)
cli::cli_alert_info("引擎判定的结局类型 = {fit0$outcome}")
stopifnot(identical(fit0$outcome, "binary"))

# 3 五种 learner 对账（tidyverse）----
types <- c("S", "T", "X", "R", "DR")
fits <- lapply(types, function(tp) {
  cli::cli_alert_info("拟合 {tp}-learner ...")
  metalearner(tp, d$X, d$A, d$Y, learner_base = lb)
})
names(fits) <- types

tibble(
  方法     = types,
  平均CATE = vapply(fits, \(f) f$ate, numeric(1)),
  真实ATE  = d$ate,
  与真相关 = vapply(fits, \(f) cor(f$cate_train, d$tau), numeric(1)),
  估计SD   = vapply(fits, \(f) sd(f$cate_train), numeric(1)),
  RMSE     = vapply(fits, \(f) sqrt(mean((f$cate_train - d$tau)^2)), numeric(1))
) |>
  mutate(across(where(is.double), \(x) round(x, 4))) |>
  print()

# 4 估计 vs 真实风险差（tidyverse 散点图）----
bind_rows(lapply(types, function(tp) {
  tibble(方法 = tp, 真实风险差 = d$tau, 估计风险差 = fits[[tp]]$cate_train)
})) |>
  ggplot(aes(真实风险差, 估计风险差)) +
  geom_point(alpha = 0.12, size = 0.7, color = "#F58518") +
  geom_abline(slope = 1, intercept = 0, color = "#E45756", linewidth = 0.9) +
  facet_wrap(~ 方法, nrow = 2) +
  labs(title = "五种 metalearner：估计风险差 vs 真实风险差（二分类 × RCT）",
       subtitle = "点贴 45° 红线越紧越好", x = "真实风险差（tau）", y = "估计风险差") +
  theme_minimal(base_size = 11)

# 5 风险差 vs 对数比：为什么用风险差 ----
## 5.1 同一个病人，两种尺度给出的人群排序可能不同 ----
# 风险差直接回答"多治好几个"，临床沟通更直观；
# 对数比是常数尺度，异质性只体现在风险差上。这里看真实 tau 的分布。
tibble(
  分位数     = c("0%", "25%", "50%", "75%", "100%"),
  真实风险差 = quantile(d$tau, c(0, .25, .5, .75, 1))
) |>
  mutate(真实风险差 = round(真实风险差, 4)) |>
  print()
cli::cli_alert_info(
  "本 DGP 的治疗效应在对数比尺度上是异质的，因此风险差尺度上也有异质性（如上表）。"
)

# 6 基学习器类型不匹配会报错 ----
## 6.1 用 regr.* 配二分类结局 ----
res <- tryCatch(
  metalearner("T", d$X, d$A, d$Y, learner_base = lrn("regr.ranger")),
  error = function(e) conditionMessage(e)
)
print(res)

# 99 收尾 ----
cli::cli_alert_success("脚本 03 完成：二分类结局 × RCT")
