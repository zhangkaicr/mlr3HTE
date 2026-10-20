# CHANGELOG

本文件记录 mlr3HTE 的每个交付批次。版本号遵循 `DESCRIPTION` 中的 `Version:`。

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
