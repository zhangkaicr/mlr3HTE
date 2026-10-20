# =====================================================================
# 00_数据生成机制与DAG.R
# 目的：把六个演示数据集的"数据生成机制（DGP）"讲透——每个数据集配一张因果图
#       （DAG）、一组真实值（ATE / CATE 分布 / 效应修饰），并说明真实值为啥长这样。
#       后续 01–06 的每一步估计，都是拿这里的真值当"答案纸"来对账。
# 输入：无（数据由 mlr3HTE_demo_*() 现场生成）
# 输出：控制台打印的 DAG、真值卡、效应修饰交叉表、CATE 分布图（ggplot）
# 依赖：mlr3HTE, dplyr, tidyr, ggplot2, cli
# 运行：在 mlr3HTE/ 目录下执行
#       Rscript tutorial/code/00_数据生成机制与DAG.R
# =====================================================================

# 0 环境与依赖 ----
for (root in c(".", "..", "../..")) {
  if (file.exists(file.path(root, "DESCRIPTION"))) break
}
pkgload::load_all(root, quiet = TRUE)
suppressPackageStartupMessages({
  library(dplyr)
  library(tidyr)
  library(ggplot2)
  library(cli)
})
set.seed(2026)
# 非交互执行（Rscript）时默认 pdf 设备编码不支持中文，DAG 标题里的汉字会报
# "mbcsToSbcs conversion failure"。换成 cairo png 设备即可正常绘制（RStudio 里无需此设置）。
if (!interactive()) {
  options(device = function(...) grDevices::png(filename = tempfile(fileext = ".png"),
                                                width = 1000, height = 640, type = "cairo"))
}

# 一个被六个数据集反复用到的小工具：把"真值"整理成一张 tibble。
# 抽出来是因为下面 6 个小节各调用一次（超过 3 次重复，值得抽）。
# 生存数据额外带 RMST 真值，所以用 has_rmst 判断。
true_card <- function(d, outcome_zh, label) {
  has_rmst <- !is.null(d$tau_rmst)
  tibble::tibble(
    数据集   = label,
    结局类型 = outcome_zh,
    真实ATE  = round(d$ate, 4),
    CATE均值 = round(mean(d$tau), 4),
    CATE标准差 = round(sd(d$tau), 4),
    CATE最小 = round(min(d$tau), 4),
    CATE最大 = round(max(d$tau), 4),
    ATE_RMST = if (has_rmst) round(d$ate_rmst, 4) else NA_real_
  )
}

# 1 为什么演示数据必须"自带真值" ----
# 真实数据里你永远不知道 tau；没有真值就没法判断一个 metalearner 到底学对了没有。
# 这六个数据集是"人造世界"：先生成协变量，再按已知公式算出每个人的真实处理效应
# tau_i，最后按 A_i 抽结局。所以 tau、ate 都是已知的"答案纸"，可以直接逐人对账。

# 2 两种设计、三种结局的全景 ----
# 设计维度：rct（A 随机化，无混杂）vs obs（A 由协变量决定，有混杂）。
# 结局维度：continuous（均值差）· binary（风险差）· survival（t0 生存概率差）。
# 因果结构只随"设计"变，不随"结局"变——所以 DAG 只有 2 种骨架 × 3 种标题。

# 3 逐个数据集：DAG + DGP + 真值 ----

## 3.1 连续结局 × 随机化 RCT ----
# DGP（逐行照抄 R/api.R 的生成逻辑）：
#   age ~ N(60,12), lac ~ N(2.5,1.2), tumor ~ N(5,2), sex ~ Bern(0.45)
#   z1 = scale(lac), z2 = scale(tumor)                 # 标准化，均值 0 方差 1
#   tau = 1.0 + 0.8*z1 - 0.5*z2 + 0.6*(z1>1 & z2<0)    # 真实 CATE（效应修饰）
#   mu  = 6 + 0.4*z1 + 0.5*z2 - 0.02*(age-60) + 0.3*sex # 基线结局（预后）
#   A   ~ Bern(0.5)                                     # 随机化，与 X 无关
#   Y   = mu + A*tau + N(0,1)                            # 结局
# 读 DAG：X 同时指向 tau 与 mu；A 无父节点（随机化）；tau、mu、A 都指向 Y。
print(mlr3HTE_dag("rct", "continuous"))

d1 <- mlr3HTE_demo_data(n = 4000, seed = 1201)
print(true_card(d1, "连续", "连续 × RCT"))

# 效应修饰到底体现在哪？按 z1 分位 × z2 符号 看真实 CATE 的均值
d1_tab <- d1$X |>
  mutate(z1 = as.numeric(scale(lac)),
         z2 = as.numeric(scale(tumor)),
         tau = d1$tau,
         z1_q = cut(z1, quantile(z1, 0:4 / 4), include.lowest = TRUE,
                    labels = c("Q1(低)", "Q2", "Q3", "Q4(高)")),
         z2_s = if_else(z2 < 0, "z2<0", "z2>=0")) |>
  group_by(z2_s, z1_q) |>
  summarise(真实CATE = round(mean(tau), 3), .groups = "drop") |>
  pivot_wider(names_from = z2_s, values_from = 真实CATE)
print(d1_tab)   # 看：z1 越高、z2 越低，CATE 越大；z1 高且 z2<0 时最高（交互项）

## 3.2 二分类结局 × 随机化 RCT ----
# DGP：
#   p0 = plogis(-1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex)  # 对照风险
#   tau_logit = 0.6 + 0.5*z1 - 0.4*z2                                  # 对数几率尺度效应
#   p1 = plogis(qlogis(p0) + tau_logit)                                # 处理组风险
#   tau = p1 - p0                                                      # 风险差尺度 CATE
#   A ~ Bern(0.5); Y ~ Bern(if A==1 then p1 else p0)
print(mlr3HTE_dag("rct", "binary"))

d2 <- mlr3HTE_demo_binary(n = 4000, seed = 1202)
print(true_card(d2, "二分类(风险差)", "二分类 × RCT"))

## 3.3 生存结局 × 随机化 RCT ----
# DGP：
#   tau = 0.5 + 0.4*z1 - 0.3*z2                              # 对数风险尺度的效应
#   base_rate = exp(-1.0 + 0.3*z1 + 0.2*z2 + 0.1*(age-60)/12 + 0.15*sex)
#   rate = base_rate * exp(-A*tau)                            # 治疗把风险乘以 exp(-tau)
#   T ~ Exp(rate); C ~ Exp(0.12)（独立删失）; time = min(T,C)
#   真实 S(t0|A=1,X) = exp(-base_rate*exp(-tau)*t0)
#   真实 S(t0|A=0,X) = exp(-base_rate*t0)
#   tau = S1(t0) - S0(t0)                                    # t0 时点生存概率差
#   另给 RMST 真值：rmst(lam) = (1 - exp(-lam*t0)) / lam
print(mlr3HTE_dag("rct", "survival"))

d3 <- mlr3HTE_demo_surv(n = 4000, t0 = 2, seed = 1203)
print(true_card(d3, "生存(S(t0)差)", "生存 × RCT"))
cli::cli_alert_info("生存数据删失比例 = {round(mean(d3$Y[, 2] == 0), 3)}")

## 3.4 连续结局 × 观察性（混杂）----
# 与 3.1 同一套结局机制，唯一区别是处理分配不再随机：
#   e = plogis(-0.5 + 0.8*z1 + 0.4*z2)   # 病情越重越易接受治疗（confounding by indication）
#   A ~ Bern(e)                           # A 依赖 X → 打开后门 A<-e<-X->mu->Y
# 因果结构变了：X 多了一条指向 e 的边，e 指向 A。红色就是被打开的后门路径。
print(mlr3HTE_dag("obs", "continuous"))

d4 <- mlr3HTE_demo_obs(n = 4000, seed = 1204)
print(true_card(d4, "连续", "连续 × 观察性"))

# 混杂有多大？对比"未调整差"与"真实 ATE"
naive4 <- mean(d4$Y[d4$A == 1]) - mean(d4$Y[d4$A == 0])
tibble::tibble(
  指标 = c("未调整差 mean(Y|A=1)-mean(Y|A=0)", "真实 ATE", "未调整偏倚"),
  值 = round(c(naive4, d4$ate, naive4 - d4$ate), 4)
) |> print()
cli::cli_alert_warning("未调整差明显偏离真实 ATE——这就是混杂，后续教程用 IPTW/DR 校正")

## 3.5 二分类结局 × 观察性（混杂）----
# 同 3.4 的混杂结构（e 依赖 z1,z2），结局机制同 3.2。
print(mlr3HTE_dag("obs", "binary"))

d5 <- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)
print(true_card(d5, "二分类(风险差)", "二分类 × 观察性"))

## 3.6 生存结局 × 观察性（混杂）----
# 同 3.4 的混杂结构，结局机制同 3.3。
print(mlr3HTE_dag("obs", "survival"))

d6 <- mlr3HTE_demo_obs_surv(n = 4000, t0 = 2, seed = 1206)
print(true_card(d6, "生存(S(t0)差)", "生存 × 观察性"))

# 4 六张真值卡拼成一张总表 ----
all_cards <- bind_rows(
  true_card(d1, "连续", "连续 × RCT"),
  true_card(d2, "二分类(风险差)", "二分类 × RCT"),
  true_card(d3, "生存(S(t0)差)", "生存 × RCT"),
  true_card(d4, "连续", "连续 × 观察性"),
  true_card(d5, "二分类(风险差)", "二分类 × 观察性"),
  true_card(d6, "生存(S(t0)差)", "生存 × 观察性")
)
print(all_cards)

# 5 真值不是常数：CATE 的异质性一眼可见 ----
# 把连续 × RCT 的真实 tau 画成分布：若 CATE 是同质的，这里会是一根竖线。
ggplot(data.frame(tau = d1$tau, z1 = as.numeric(scale(d1$X$lac))),
       aes(x = tau, fill = z1 > 0)) +
  geom_histogram(bins = 40, color = "white") +
  scale_fill_manual(values = c("TRUE" = "#B279A2", "FALSE" = "#4C78A8"),
                    labels = c("TRUE" = "z1 高", "FALSE" = "z1 低"),
                    name = NULL) +
  labs(title = "连续 × RCT：真实 CATE 的分布（按 z1 高低分组）",
       subtitle = "z1 高的病人效应明显更大——这就是效应修饰",
       x = "真实 CATE（tau）", y = "人数") +
  theme_minimal(base_size = 12)

# 99 收尾 ----
cli::cli_alert_success("脚本 00 完成：六个数据集的 DGP、DAG 与真实值已全部讲清")
