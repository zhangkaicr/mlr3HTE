# CHANGELOG

本文件记录 mlr3HTE 的每个交付批次。版本号遵循 `DESCRIPTION` 中的 `Version:`。

## [0.2.0] — 2026-10-21（评价指标覆盖三类结局）

### 新增：生存结局终于能评了
- `qini_curve()` / `qini_coefficient()` / `c_for_benefit()` / `toc_curve()` /
  `dr_pseudo_outcome()` 全部接受 `Surv` 对象。原来 `.hte_numeric_outcome()`
  遇到 `Surv` 会直接报错，现在换成统一的 `.hte_outcome()`，把三类结局都压成
  `(y, w)` 两件套再进评分：
  - 连续 / 二分类：`y = Y`，`w = 1`
  - 生存 `survdiff`（默认）：`y = I(T > t0)`，`w = I(可观测) / Ĝ(min(T, t0))`
  - 生存 `rmst`：`y = δ·min(T, t0) / Ĝ(T)`，`w = 1`
- 五个函数新增 `t0` / `X` / `effect` 三个参数。`t0` 不传时默认取**事件时间的中位数**；
  `X` 用于拟合删失模型（`X = NULL` 时退化为边际 Kaplan–Meier）；
  `effect = c("survdiff", "rmst")` 选效应标尺。
- `.surv_ipcw()` 扩展（`R/survival_base.R`）：新增 `at` 参数（在指定时点估值）
  与 `X = NULL` 的边际 KM 分支，删失 IPCW 现在既供引擎用也供指标用。

### 为什么生存必须走 `I(T > t0)` + IPCW（实测，n = 20000）
- 效应标尺必须和 `metalearner()` 的生存 CATE 定义一致（都是 S(t0) 差），
  否则被评价的 CATE 与指标算的效应不在同一个量纲上，排序比较没有意义。
- 删失校正是因为可选项：真值 ATE 0.1514，完整病例 IPCW 得 0.1424（偏差 −0.009），
  不做校正（`w = 1`）只有 0.1127（偏差 −0.039，低估约四分之一）——
  被删失的人被当成「没获益」计入了分母。
- `toc_curve()` 的分母从 `k` 改为 `cumsum(w)`，避免零权重的删失个体稀释均值。

### 已知限制：`effect = "rmst"` 在删失重时低估
- 权重取自 `Ĝ(T_i)` 且被截断在 100 以内，删失 58% 时实测 Q(1) = 0.043 vs 真值 0.184。
  该截断是引擎共用的 `.surv_ipcw()` 行为，为避免影响主估计未改；
  删失重的样本请用默认的 `survdiff`。

### 教程脚本 12（新）：`tutorial/code/12_三类结局评价指标.R`
- 三类结局 × 三层排序（oracle / model / random）对账，各重复 8 次报均值 ± 标准差。
  次序在三类结局上都对：oracle ≥ model > random。
- 新增**泄漏对照**：先在全集拟合再切留出集，二分类的 c-for-benefit 从
  0.558 虚高到 0.891 并反超 oracle 0.605——尽管它与真 `tau` 的相关反而更低
  （0.542 < 0.655）。观测获益是 `Y_treated − Y_control`，CATE 记住了 `Y_treated`。
  **先切分、后拟合**是硬规矩，已写进文档站的两个坑位。

### 测试
- `tests/testthat/test-metrics.R` 用 `Surv` 重写：新增 8 组生存测试
  （无删失时 Q(1) 复原真 S(t0) 差、30% 删失下 IPCW 仍无偏、oracle > random、
  TOC 的 overall ATE 等于 Qini 的 Q(1)、`t0` 默认取事件时间中位数、
  `dr_pseudo_outcome()` 在生存上可用、生存下拒绝 mlr3 Learner 作基学习器）。
  该文件 44 个断言，全套件通过。

---

## [0.1.0] — 2026-10-21（评价指标可用于观察性数据 + DAG 箭头修复）

### 新增
- **`dr_pseudo_outcome()`**（新导出，`R/metrics.R`）：一次算出观察性数据做 HTE
  评价所需的三个干扰参数——倾向得分 `e`、结局模型 `mu1`/`mu0`——以及双重稳健伪结局
  \eqn{Y^* = (\hat\mu_1-\hat\mu_0) + A(Y-\hat\mu_1)/e - (1-A)(Y-\hat\mu_0)/(1-e)}。
  默认 **5 折交叉拟合**（`cross_fitting = FALSE` 可关），`seed` 可固定折分配。
- **`c_for_benefit()` 新增 `propensity` / `mu1` / `mu0` 三个参数**：观察性数据下
  把"观测获益"从原始结局差换成 DR 伪结局的配对内平均。`propensity` 非 `NULL`
  而 `mu1`/`mu0` 缺失时**直接报错**（见下），长度不符同样报错；
  只给 `mu1`/`mu0` 不给 `propensity` 时按随机化假设 `e = mean(A)` 并给出警告。

### 为什么不让 `c_for_benefit` 只吃倾向得分（实测，不是推测）
- 只传 `propensity` 等价于用 Horvitz–Thompson 评分 `AY/e − (1−A)Y/(1−e)` 当观测
  获益。本包观察性演示数据（n=4000，真 ATE ≈ 1.05）上该评分**单次样本标准差约 15**，
  噪声完全压过信号：即使用真 `tau` 排序，C 统计量也只有 **0.39**，比随机还差；
  按权重加权的原始结局差更差（0.035）。所以宁可报错也不给这个选项。
- 走 DR 后：模型 CATE 0.630 / 真 tau 0.649 / 随机 0.508，次序正确。

### 为什么 `mu1`/`mu0` 必须交叉拟合（实测）
- 全样本拟合再回代（in-fold）时，伪结局里的 `mu1 − mu0` 与被评价的 CATE 同源，
  配对又按该 CATE 找最近邻，观测获益被人为对齐到预测获益，出现倒挂：
  **in-fold 模型 0.754 > 真 tau 0.717**；交叉拟合后恢复 **0.662 ≤ 0.669**。

### 不校正的代价（Qini / TOC 同样）
- 观察性演示数据上，不传 `propensity` 时 TOC 的 overall ATE 被混杂抬到
  **1.797**（真值 1.046），Qini 系数从 0.267 虚高到 **1.054**——把混杂当成了异质性。
  传入后回落到 1.097 / 0.267。

### 工程
- `NAMESPACE` 重新由 roxygen2 生成（顺带补上了此前缺失的 6 个 metrics 手册页）。
- `tutorial/code/10_HTE评价指标.R` 新增第 8 节（观察性数据三指标各自补什么），
  并给 `learner_tau` 固定 `seed`，使文档引用的数值可复现。

### 修复
- **DAG 图箭头看不见**：`geom_segment(arrow =)` 一直画了箭头，但每条边都终止在
  节点中心，而不透明的 `geom_label` 画在更上层，把箭头整个吞掉。修法是让边终点
  沿边方向回退 0.45 个数据单位（`R/dag.R`），箭头停在标签盒外侧。
  6 张 DAG PNG 全部重新生成；`test-dag.R` 加了固定回退距离的回归测试。
- 顺带把 `geom_label` 里已废弃的 `label.size = NA` 换成 `linewidth = 0`。

### 测试
- `test-metrics.R` 新增 6 块观察性相关用例（DR ATE 对账、交叉拟合、Qini/TOC
  传 PS 后回落、三件套缺失报错、DR 下模型/真值/随机三者次序、长度校验）。
- 全量 **273 个期望，0 failed / 0 error**（2 条 "built under R 4.5.3" 无害提示）。

## [0.1.0] — 2026-10-20（生存第二套引擎：`engine = "survlearners"`）

### 新增
- **`engine = "survlearners"`**（`R/surv_survlearners.R`）：生存结局可显式切换到
  GitHub 包 [survlearners](https://som-shahlab.github.io/survlearners/)（Shah Lab，
  GPL-3，S/T/X/R/M 五族，自带 IPCW 与 R 族交叉拟合）。默认仍为 `"native"`，
  **老代码行为零变化**。
  - 派发：S/T/X/R × `coxph`/`grf`/`lasso`（`"ranger"` 是 `grf` 的别名）；
    X 无 coxph 版（survlearners 自身限制），会给明确提示。
  - 倾向得分 `W.hat` 三来源：`none` → 0.5；`iptw` → mlr3HTE 自训 PS；
    `external` → 按 1/PS 约定从权重反解。
  - 引擎内固定 grf `seed = 1`（各函数 nuisance 参数名不统一，按形参名匹配），
    保证教学场景可复现。
  - 精确屏蔽 glmnet 的一条上游 tie-handling 提示（lasso 族一次能发 200+ 条），
    其余警告原样抛出。
- 新教程 `09_生存结局_survlearners引擎.R`：数据卡、能力对照表、n=2000 全组合
  对账、与原生引擎同题对比、观察性（外部真实 PS 权重 + IPTW）、复现性说明。
- 文档站教程页新增「生存结局的第二套引擎：survlearners」节（中英同步，含实际输出）；
  README 2.3 节加引擎对照表；`00_教程.md` 加 5.7 节。

### 工程
- `DESCRIPTION`：`survlearners` 进 `Suggests`（GitHub-only，不做硬依赖）。
- `ml_fit()` 返回对象新增 `engine` 字段（native / survlearners），R6 Learner
  `param_set` 新增同名参数并透传。

### 测试
- 新增 `tests/testthat/test-survlearners.R`（8 块）：全组合数值合理性
  （n=500 实测容差：ATE 偏差 ±0.1、相关 > 0.4）、外部权重反解、iptw 路径、
  五条错误路径（DR / RMST / 非生存结局 / X+coxph / 非法 engine）、
  默认 native 不变、R6 Learner 切换引擎。
- `test-learner.R` 参数断言同步加入 `engine`。

### 验证
- 测试 **235 个期望、0 failed / 0 error**（仅 2 条 "built under R 4.5.3" 无害提示）。
- `R CMD INSTALL .` 干净；教程 09 exit 0。

### 如实记录（上游 survlearners 0.0.1 的实测发现）
- **`surv_tl_coxph` 组合有系统性偏差**：本数据 n=2000 下 ATE 仅 0.067（真值 0.151），
  同族 T-grf/T-lasso 正常。读源码 + 实验验证的机制：该函数把**未中心化**的
  `basehaz(centered = FALSE)` 与 `predict(type = "risk")` 相乘，而后者的线性
  预测器**以训练样本均值为参照**（平移协变量后 mean(risk) 恒为 1，而未中心化
  链接 mean = 1.09），基准不一致导致 S(t0) 被扭曲。对照 `surv_sl_coxph`
  手算未中心化链接，所以 S-coxph 准确。教程与 README 均已提示避开该组合。
- **lasso 族不可逐位复现**：glmnet 内部交叉验证折序随机，survlearners 未暴露
  `foldid`，两次运行有 ~0.001 量级抖动；grf 族因引擎内固定 seed 而完全可复现。

### 文档修正（忠实性）
- 修正文档站 DGP 节与 `00_教程.md` 第 0 节中与 `R/api.R` 源码不符的公式：
  二分类为对数几率尺度 `tau_logit = 0.6 + 0.5·z1 − 0.4·z2`（非 `expit(mu/3 + A·tau)`）；
  生存为 `tau = 0.5 + 0.4·z1 − 0.3·z2`（对数风险尺度，非 `h₀·exp(−mu/3 − A·tau)`）；
  观察性 PS 为 `plogis(−0.5 + 0.8·z1 + 0.4·z2)`（非 `expit(0.8·z1 + 0.5·z2 − 0.5·sex)`）。

## [0.1.0] — 2026-10-20（教程深化：DAG、DGP 讲解、真实输出、tidyverse 整理）

把教程从「能跑的示例」升级成「能教的讲义」：每个测试数据配套 DAG 与真值说明，
结果一律用 tidyverse 整理，文档站给出实际运行输出。

### 新增
- **`mlr3HTE_dag()`**（新增 `R/dag.R`）：为六个演示数据集画配套因果图，
  纯 `ggplot2` 实现（不引入 ggdag 等重依赖）。`design = "rct"/"obs"` ×
  `outcome = "continuous"/"binary"/"survival"` 共六张；观察性设计的
  混杂路径 `X → e → A` 以红色高亮。
- **6 张 DAG PNG** 提交至 `docs/assets/img/dag/`，文档站直接引用。
- **新教程 `00_数据生成机制与DAG.R`**（`tutorial/code/`）：逐步展开 DGP
  （协变量 → tau / mu → 结局方程）、打印六个数据集的真值一览 tibble、
  按协变量四层分位的真实 CATE 分层表、观察性粗差分 vs 真值对账。
  这是所有分格教程的「数据说明书」。
- `tutorial/00_教程.md` 新增第 0 节：DGP 公式、两张 DAG 的结构对照表、
  六个数据集真值表；脚本索引加入 00。

### 教程升级（01–08）
- 每个脚本开头新增「数据卡片」：DAG 引用、真实 ATE、DGP 关键公式。
- 结果整理全部改用 tidyverse：`tibble` / `mutate` / `group_by` / `summarise`
  替代 `data.frame` 与手写循环；新增估计-vs-真实 CATE 散点图（`ggplot2`）。
- 生存脚本补 RMST 尺度说明与 t0 敏感性表（去掉原先无意义的 NA 列）。
- 07 增加「结局 × learner」热力图汇总；08 增加 tibble 化的基准对比表。

### 文档站
- 教程页新增「数据生成机制与 DAG（先读这个）」节（中英同步）：公式块、
  两张 DAG 并排、结局方程表、**实际运行输出**（tibble 原样贴入）。
- 六个场景节各嵌入对应 DAG 图与图注；脚本清单加入 00。
- guide 页架构节加跳转链接；CSS 新增 `.fig` / `.fig-grid` / `.formula` 样式。

### 工程
- `DESCRIPTION`：`ggplot2` 加入 `Imports`（`mlr3HTE_dag()` 的硬依赖）。

### 测试
- 新增 `tests/testthat/test-dag.R`：输入校验、六种组合返回 ggplot、
  cairo 设备渲染中文标题。

### 验证
- 测试 **142 个期望、0 failed / 0 error**（新增 3 块）。
- `R CMD INSTALL .` 干净；教程 00–08 全部 exit 0。

## [0.1.0] — 2026-10-20（消费路径修复：`lrn()` 再导出）

### 修复（消费者照抄文档即报错）
- **`lrn()` 从 mlr3 再导出**（新增 `R/reexport.R`）。此前文档站与 README 的示例
  都只写 `library(mlr3HTE)` 就直接 `lrn("regr.ranger", ...)`，消费者照抄会得到
  「没有 lrn 这个函数」。现在 `library(mlr3HTE)` 之后 `lrn()` 直接可用：
  NAMESPACE 同时有 `export(lrn)` 与 `importFrom(mlr3,lrn)`，再导出的是同一个函数
  对象，与 `library(mlr3)` 的先后顺序无关，不会产生 mask 冲突。
- 文档站：教程页「六格导航」前加「运行前准备」提示（中英同步）；
  `content-guide.js` / `content-api.js` 中用到 `resample()` / `benchmark()` /
  `rsmp()` 的片段补一行 `library(mlr3)`（这些 mlr3 工作流函数没有再导出）。
- README 安装段补充同一说明：示例只需 `library(mlr3HTE)`，走 R6 Learner +
  `resample()` 时才需要 `library(mlr3)`。

### 测试
- 新增 `tests/testthat/test-reexports.R`：断言 NAMESPACE 中 `export(lrn)` 与
  `importFrom(mlr3,lrn)` 同时存在，且 `lrn()` 真能造出 `Learner`、
  与 `mlr3::lrn` 为同一对象。

### 验证
- 测试 **25 个块、0 failed / 0 error**（新增 2 块 / 5 个期望）。
- 原样执行文档片段（只 `library(mlr3HTE)`）：S 0.936 / T 0.950 / X 0.950 /
  R 0.456 / DR 0.954，与文档表格数值一致；`regr.metalearner` 的 `train/predict` 正常。
- 教程 01（连续 × RCT）与 08（mlr3 工作流集成）exit 0。

## [0.1.0] — 2026-10-20（收尾批次，commit `8e019b7`）

首版功能交付后的收尾与文档补全。

### 新增
- 生存结局支持 `effect = "rmst"`（限制平均生存时间差）：
  `metalearner(..., effect = "rmst", t0 = ...)`。
- R/DR metalearner 支持交叉拟合：`cross_fitting = TRUE` 时按 K 折
  out-of-fold 拟合伪结果，降低过拟合偏倚。
- `cate_ci()`：bootstrap 给出 ATE 点估计与置信区间，及可选逐样本 CATE
  置信区间；本次补充 roxygen2 文档与 `\donttest` 示例。

### 文档
- roxygen2 生成 15 个 `.Rd` 帮助页（含 `LearnerRegrMetalearner` R6 类文档），
  NAMESPACE 同步为 roxygen2 托管。
- 新增本 `CHANGELOG.md`。

### 修复
- `.onLoad` 显式 `loadNamespace("mlr3learners")`，修复默认 `regr.ranger` /
  `classif.ranger` 未注册导致 `not found in DictionaryLearner` 的问题。
- 4 条输入校验测试改用报错信息中**本来就有的 ASCII 标记**
  （`classif` / `weights` / `survival` / `treatment_col`）匹配，避免非 UTF-8
  locale 下中文被转成 `<U+XXXX>` 转义造成的 `grepl` 字节匹配失败。

### 工程
- `DESCRIPTION`：显式 `Author` / `Maintainer` + `Encoding: UTF-8`；
  移除未使用的 `data.table` 依赖（代码未直接调用）。
- `.Rbuildignore` / `.gitignore` 整理：排除 `docs/`、`tutorial/`、
  `*.Rcheck/`、`*.tar.gz` 等构建与站点产物。

### 验证
- 测试套件 0 失败（load_all 下 ~119 个期望全过）。
- `R CMD build` 干净；`R CMD check` 的纯 R 部分在 UTF-8 机器 / CI（ubuntu）
  环境可完整跑通（examples / tests 在沙箱中受 junction 与 CRAN 网络限制无法执行）。

## [0.1.0] — 2026-10-20（消费者可复现性修复，commit 待定）

针对「别人从 GitHub 安装后跑教程」的保证做的两处修正。

### 修复（消费者安装即跑通）
- `DESCRIPTION`：`ranger` 从 `Suggests` 提到 **`Imports`**——它是包的默认基学习器
  （`regr.ranger`）且所有教程都用它，`install_github` / `pak::pak` 只自动装 `Imports`，
  原先在 `Suggests` 会导致消费者装完跑教程报 `regr.ranger not found`。
- `DESCRIPTION`：新增 `dplyr`、`cli` 到 `Imports`（教程脚本 `library(dplyr)` /
  `library(cli)` 所需，保证一键安装即带齐，无需消费者手动补）。
- `README.md` 安装段补上**从 GitHub 安装的可复制命令**（`pak::pak(...)` 与
  `remotes::install_github(...)`）；纠正两处陈旧说法：
  - 依赖列表曾列 `data.table`（早已移除）——已删；
  - 曾称"`ranger` 为可选（仅生存分支选 ranger 才需要）"——错误，已改为"`ranger` 必需"。
- `README.md` 环境段澄清 `renv.lock` 为可选版本锁定（`renv::restore()`），并说明
  `pak` / `remotes` 一键安装即可跑通，不强制 renv。
- README 测试数 112 → 119 订正。

### 验证
- `R CMD INSTALL .` 干净（`* DONE`）；教程 07（同时用 ranger + dplyr + cli）exit 0、0 错误。

## [0.1.0] — 2026-10-20（首版 + 教程 + 站点）

初始交付：三类结局（连续 / 二分类 / 生存）× 随机化 / 观察性设计的 metalearner
（S / T / X / R / DR）CATE 估计；函数式 API `metalearner()` 与 R6 Learner
`lrn("regr.metalearner")`；`resample()` / `benchmark()` / `tune()` 集成；
`ml_task()` Task 编码辅助；配套教程（主文档 + 8 个实跑脚本）；双语文档站。
生存分支不依赖 mlr3proba（原生 `coxph` / `ranger` 实现）。
