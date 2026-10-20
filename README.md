# mlr3HTE

> **仓库**：<https://github.com/zhangkaicr/mlr3HTE>
> **双语教程站（含搜索 / 中英切换 / 明暗主题）**：<https://zhangkaicr.github.io/mlr3HTE/>

`mlr3HTE` 是一个基于 **mlr3** 的异质性治疗效应（HTE / CATE）估计包，把课程模块三里的
S- / T- / X- / R- / DR-learner 做成了正规可安装的 mlr3 学习器。

**覆盖范围**

| 维度 | 支持 |
|---|---|
| 结局类型 | 连续（均值差）、二分类（风险差）、生存（t0 时点生存概率差） |
| 数据类型 | 随机化试验（RCT）、观察性数据（IPTW 或外部权重） |
| metalearner | S、T、X、R、DR 五种 |
| 接口 | 函数式 API + mlr3 R6 Learner（可进 `resample` / `benchmark` / `tune`） |

引擎只有一套：五种 metalearner 的公式与结局类型无关，它们统一通过「结局模型」打交道——
`predict(newX)` 对连续结局返回 `E[Y|X]`、对二分类返回 `P(Y=1|X)`、对生存返回 `S(t0|X)`。

---

## 1 安装与加载

从 GitHub 安装（推荐 `pak`，会自动解析并装齐全部依赖；`remotes` 也行）：

```r
# 方式一：pak（依赖求解快、并行下载，推荐）
pak::pak("zhangkaicr/mlr3HTE")

# 方式二：remotes
remotes::install_github("zhangkaicr/mlr3HTE")
```

开发期也可直接加载源码：

```r
pkgload::load_all(".")      # 开发期
# 或安装后
library(mlr3HTE)
```

> **`lrn()` 已经能从 `mlr3HTE` 直接用**——本包把 `mlr3::lrn()` 再导出了，
> 所以下面所有示例只需 `library(mlr3HTE)` 一行，不用再 `library(mlr3)`。
> 但 `resample()` / `benchmark()` / `rsmp()` 这些 mlr3 工作流函数没有再导出，
> 走 R6 Learner 那条路时要自己加 `library(mlr3)`。

依赖（均已列入 `DESCRIPTION` 的 `Imports`，安装时自动装齐，无需手动补）：
`mlr3`、`mlr3learners`、`paradox`、`R6`、`survival`、`ranger`、`dplyr`、`cli`。
其中 **`ranger` 是必需依赖**——包的默认基学习器就是 `regr.ranger`，且所有教程都用到它
（早期文档称“ranger 可选”已更正）。`testthat` 在 `Suggests`，仅运行测试时需要。

> **生存分支完全不依赖 mlr3proba。** 基学习器用字符串指定：`"coxph"`
> （默认，`survival::coxph`）或 `"ranger"`（`ranger` 包已随 `Imports` 安装）。
> 传 `lrn("surv.*")` 会被明确拒绝并提示——那需要 mlr3proba，本包不引入这个依赖。

---

## 2 函数式 API

### 2.1 连续结局（RCT）

```r
set.seed(1)
d <- mlr3HTE_demo_data(n = 4000)

fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))
fit$ate            # ATE 估计
fit$cate_train     # 训练集上每个人的 CATE
fit$predict(d$X)   # 新数据上的 CATE
```

### 2.2 二分类结局（风险差尺度）

```r
db <- mlr3HTE_demo_binary(n = 4000)

fit <- metalearner("T", db$X, db$A, db$Y,
                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1))
fit$ate            # 平均风险差
```

### 2.3 生存结局（t0 时点生存概率差）

```r
ds <- mlr3HTE_demo_surv(n = 4000, t0 = 2)

fit <- metalearner("T", ds$X, ds$A, ds$Y,
                   learner_base = "coxph",   # 或 "ranger"，均为原生实现
                   t0 = 2)
fit$ate            # 平均 S1(2) - S0(2)
```

`t0` 缺省时取事件时间中位数。删失由两部分处理：S/T 的生存模型自身已在似然中正确处理；
X/R/DR 需要个体尺度结局（用 `I(T > t0)`），此时会乘上删失 IPCW 权重。

生存结局有两套引擎（`engine` 参数，默认 `"native"`，行为零变化）：

```r
# 引擎二：survlearners（GitHub 包，需先安装；只支持 S/T/X/R 与 S(t0) 差）
remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")
fit <- metalearner("X", ds$X, ds$A, ds$Y, learner_base = "grf",
                   t0 = 2, engine = "survlearners")
```

| | `"native"`（默认） | `"survlearners"` |
|---|---|---|
| metalearner | S/T/X/R/DR 五族 | S/T/X/R（无 DR） |
| 效应尺度 | S(t0) 差 + RMST 差 | 仅 S(t0) 差 |
| 基学习器 | `"coxph"`/`"ranger"` + 任意 mlr3 learner | `"coxph"`/`"grf"`/`"lasso"`（`"ranger"` 是 grf 别名） |
| 依赖 | 零额外 | 需装 survlearners（已列入 Suggests） |

注意 survlearners 的 `T-coxph` 组合实测有系统性偏差（把未中心化的基线累积危险与
中心化的 `predict(type="risk")` 相乘），详见教程 09；要 Cox 做 T-learner 请用原生引擎。

### 2.4 观察性数据

```r
do <- mlr3HTE_demo_obs(n = 4000)

# 方式一：内部训倾向得分做 IPTW
fit <- metalearner("X", do$X, do$A, do$Y,
                   learner_base = lrn("regr.ranger"),
                   weighting = "iptw", stabilize = TRUE)

# 方式二：用自己算好的权重
fit <- metalearner("DR", do$X, do$A, do$Y, weighting = "external",
                   weights = my_weights)
```

### 2.5 便捷封装

`*_learner()` 系列与课程脚本同款签名，直接返回训练集 CATE 向量：

```r
s_learner(X, A, Y, learner_base = lrn("regr.ranger"))
t_learner(X, A, Y, learner_base = lrn("regr.ranger"))
x_learner(...); r_learner(...); dr_learner(...)
```

---

## 3 R6 Learner（接入 mlr3 工作流）

用 `ml_task()` 把原始数据编码成 Task，再交给 `lrn("regr.metalearner")`：

```r
task <- ml_task(d$X, d$A, d$Y)                  # 连续/二分类/生存通吃
l    <- lrn("regr.metalearner", metalearner = "T")
l$learner_base <- lrn("regr.ranger", num.trees = 300, seed = 1)

l$train(task)
l$predict(task)$response                       # CATE

# 接入 mlr3 工作流
resample(task, l, rsmp("cv", folds = 5))
benchmark(benchmark_grid(task,
           list(lrn("regr.metalearner", id = "T", metalearner = "T"),
                lrn("regr.metalearner", id = "X", metalearner = "X")),
           rsmp("cv", folds = 5)))
```

`ml_task()` 的编码约定（因为 mlr3 的 Task 目标列装不下 `Surv` 对象）：

| 结局 | 目标列 `.outcome` | 附带列 |
|---|---|---|
| 连续 / 二分类 | `Y`（二分类取 0/1） | — |
| 生存 | 随访时间 | `.status` = 事件指示 |

结局类型、状态列名与 `t0` 记录在 `task$extra_args` 里。该字段经实测在
`clone(deep = TRUE)$filter()` 与 `serialize()/unserialize()` 之后都保留，
所以 `resample()` 分折时元数据不会丢。

**可调字段**（不是 param，因为 paradox 的 `p_uty` 存不下 Learner 对象）：

| 字段 | 说明 |
|---|---|
| `learner_base` | 结局模型基学习器，类型须与结局匹配 |
| `learner_tau` | 效应阶段回归学习器；`NULL` 时用引擎的正则化默认值 |
| `learner_ps` | 倾向得分学习器（IPTW 时用，默认 `classif.log_reg`） |
| `treatment_col` | 处理列名，默认 `"A"` |
| `t0` | 生存效应时点 |
| `stabilize` | IPTW 是否用稳定化权重 |

**可调参数**（`param_set`，可用于 `tune()`）：`metalearner`（S/T/X/R/DR）、
`weighting`（none/iptw/external）。

---

## 4 方法学要点

| Learner | 公式 | 备注 |
|---|---|---|
| S | 一个结局模型含 `A`，反事实预测相减 | 最省数据，但基学习器若不建模交互则 CATE 近常数 |
| T | 两组各拟合一个结局模型，预测相减 | 简单稳健；两组样本量减半 |
| X | 插补个体效应后按 `g(X)` 融合 | 两组样本不均时表现好（Künzel et al. 2019） |
| R | Robinson 残差化 `(Y - m(X))/(A - e(X))`，以 `(A-e)^2` 加权回归 | Nie & Wager 2021 |
| DR | 伪结果 `psi = m1 - m0 + A(Y-m1)/e - (1-A)(Y-m0)/(1-e)` 后回归 | 双重稳健（Kennedy 2020） |

**关于 `learner_tau` 的默认值**：X/R/DR 的第二阶段是对**伪结果**做回归，噪声结构与
结局模型完全不同（R/DR 的目标含 `1/(A-e)` 放大）。ranger 回归默认
`min.node.size = 5`，树会长得很深、把伪结果里的噪声也拟合进去——实测会让 R/DR 的
CATE 相关从 0.9 掉到 0.2。因此引擎在 `learner_tau = NULL` 时**不沿用** `learner_base`，
而是单独建一个 `min.node.size = 50` 的 ranger。需要更强的灵活性可自行覆盖；
在生存 R/DR 上，`learner_tau = lrn("regr.lm")` 往往更好（伪结果噪声大、真值近线性时，
线性模型更稳）。

**已知局限**

- 生存 R/DR 的 CATE 是二阶段回归的结果，**不受 `[-1, 1]` 概率尺度约束**，个别点可能越界；
  S/T 的 CATE 是两个生存概率之差，严格有界。
- 权重通过**重要性重采样**落地（mlr3 1.8 的 Task/Learner 没有 case weights API），
  会引入蒙特卡洛噪声，需要复现结果时请在调用前 `set.seed()`。
- 生存分支默认 `coxph` 是线性预测结构，S-learner 因此难以捕捉异质性（T/X 不受此限）。

---

## 5 脚本与文件

```
R/
  aaa.R            .onLoad 注册 + .metalearner_registry 模型登记处
  survival_base.R  原生生存基学习器（coxph/ranger）+ 删失 IPCW
  engine.R         引擎：结局模型抽象 + 五种 metalearner + 调度器
  api.R            函数式 API + ml_task() + 4 个演示数据集
  learner.R        R6 Learner lrn("regr.metalearner")
smoke_test.R       连续结局 RCT 冒烟测试
smoke_test2.R      二分类/生存/观察性冒烟测试
smoke_test3.R      R6 Learner 三类结局 + resample 冒烟测试
tests/testthat/   119 个测试
```

演示数据集（`*_obs_*` 为观察性版本，含真实 PS）：

| 函数 | 结局 | 数据 | 真值随数据返回 |
|---|---|---|---|
| `mlr3HTE_demo_data()` | 连续 | RCT | `tau`, `ate` |
| `mlr3HTE_demo_binary()` | 二分类 | RCT | `tau`, `ate` |
| `mlr3HTE_demo_surv()` | 生存 | RCT | `tau`, `ate`, `t0` |
| `mlr3HTE_demo_obs()` | 连续 | 观察性 | `tau`, `ate`, `ps_true` |
| `mlr3HTE_demo_obs_binary()` | 二分类 | 观察性 | `tau`, `ate`, `ps_true` |
| `mlr3HTE_demo_obs_surv()` | 生存 | 观察性 | `tau`, `ate`, `ps_true` |

每个都返回真实的 `tau`，方便直接对账——这是教学时最有用的部分。

## 5.5 配套教程

**在线双语文档站**：<https://zhangkaicr.github.io/mlr3HTE/>
（全局搜索、中英切换、明暗主题；内容与本 README 同步）

`tutorial/` 下是完整教程，覆盖**三类结局 × 随机/观察性**共 6 种组合：

- `tutorial/00_教程.md` — 主文档：统一架构、6 格矩阵、五种 learner 公式与选用、
  调参避坑（含目录与对照表）
- `tutorial/code/01..08_*.R` — 8 个配套脚本，每个自带章节目录，可独立运行

运行方式（在 `mlr3HTE/` 目录下）：

```r
Rscript tutorial/code/01_连续结局_随机化RCT.R
```

| 脚本 | 内容 |
|---|---|
| `01_连续结局_随机化RCT.R` | 连续 + RCT，五种 learner 对账 |
| `02_连续结局_观察性研究.R` | 连续 + 观察性，IPTW vs 未调整 |
| `03_二分类结局_随机化RCT.R` | 二分类 + RCT，风险差尺度 |
| `04_二分类结局_观察性研究.R` | 二分类 + 观察性 |
| `05_生存结局_随机化RCT.R` | 生存 + RCT，t0 生存概率差 |
| `06_生存结局_观察性研究.R` | 生存 + 观察性，IPTW × IPCW |
| `07_五种metalearner横向对比.R` | 三种结局 × 五种 learner 对比表 |
| `08_mlr3工作流集成.R` | `ml_task` + `resample` + `benchmark` |

---

## 6 环境

- R 4.5.1；mlr3 1.8.0；paradox 1.0.1
- **不依赖 `mlr3proba`**：生存分支用 `survival` + `ranger` 原生实现（`ranger` 已列入 `Imports`，安装即带）
- **复现依赖版本（可选）**：仓库已带 `renv.lock`（开发机系统库全量快照，约 100 个包）。
  想锁定到完全相同的版本，clone 后执行 `renv::restore()` 即可。不强制——
  直接用 `pak::pak("zhangkaicr/mlr3HTE")` / `remotes::install_github(...)` 安装也能跑通全部教程，
  只是依赖版本随 CRAN 当前发布浮动。
