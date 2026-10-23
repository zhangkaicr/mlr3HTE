# 观察性混杂下 S/T 学习器如何校正混杂（模拟演示）
# 目的：用一份构造数据展示 S-Learner / T-Learner 在观察性混杂下的行为。
# 核心方法学结论（与 IMA 知识库「三大偏倚」一致，混杂属其一）：
#   S/T 是**基于结局模型**的学习器，本身不做 IPW；它们校正混杂的唯一途径是
#   把混杂变量放进 X（结局模型对混杂条件化）。漏掉混杂 → 仍偏倚；
#   含混杂 + 正确设定模型 → 纠偏；再叠 package 的 weighting = "iptw" → 伪人群下 A⊥X，更稳。
# 输入：本脚本内部构造（连续结局、已知真实 ATE）
# 输出：各方法 ATE 估计与偏倚（打印 data.frame）
# 依赖：mlr3HTE、mlr3、dplyr

Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)
library(dplyr)

# 1 构造观察性混杂数据 -------------------------------------------------------
set.seed(20261023)
n <- 4000
Z <- rnorm(n)                       # 混杂变量：同时影响 A 与 Y（病情）
W <- rnorm(n)                       # 纯预后变量：只影响 Y，不影响 A
e <- plogis(-0.5 + 1.0 * Z)        # 处理概率随 Z 上升（混杂）
A <- rbinom(n, 1, e)
mu0  <- 2 + 1.5 * Z + 0.5 * W      # 对照组均值，依赖 Z（混杂）
tau <- 1.0 + 0.5 * W               # 真实 CATE；ATE = E[tau] = 1.0
Y   <- mu0 + A * tau + rnorm(n, 0, 1)

X_full  <- data.frame(Z = Z, W = W)   # 含混杂
X_noZ  <- data.frame(W = W)           # 漏掉混杂 Z
true_ate <- mean(tau)

# 朴素（忽略 X）：直接两组均值差，混杂未校正，应明显偏倚
naive_ate <- mean(Y[A == 1]) - mean(Y[A == 0])

# 2 逐方法拟合并取 ATE ------------------------------------------------------
fit_ate <- function(type, X, ...) {
  set.seed(1)
  fit <- metalearner(type, X, A, Y, learner_base = mlr3::lrn("regr.lm"), ...)
  fit$ate
}

res <- bind_rows(
  tibble(method = "朴素两组差（忽略 X）",      type = "-", spec = "无调整",
         ate = naive_ate),
  tibble(method = "S / X 含混杂 (Z,W)",        type = "S", spec = "含混杂",
         ate = fit_ate("S", X_full)),
  tibble(method = "S / X 漏掉混杂 (仅 W)",     type = "S", spec = "漏混杂",
         ate = fit_ate("S", X_noZ)),
  tibble(method = "S / X 含混杂 + IPTW",       type = "S", spec = "含混杂+IPTW",
         ate = fit_ate("S", X_full, weighting = "iptw")),
  tibble(method = "T / X 含混杂 (Z,W)",        type = "T", spec = "含混杂",
         ate = fit_ate("T", X_full)),
  tibble(method = "T / X 漏掉混杂 (仅 W)",     type = "T", spec = "漏混杂",
         ate = fit_ate("T", X_noZ)),
  tibble(method = "T / X 含混杂 + IPTW",       type = "T", spec = "含混杂+IPTW",
         ate = fit_ate("T", X_full, weighting = "iptw")),
) |>
  mutate(
    true_ate = true_ate,
    bias = ate - true_ate,
    abs_bias = abs(bias)
  ) |>
  select(method, type, spec, ate, true_ate, bias)

cat(sprintf("真实 ATE = %.4f\n", true_ate))
print(res, n = Inf, width = 120)
