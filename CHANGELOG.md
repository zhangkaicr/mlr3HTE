# CHANGELOG

本文件记录 mlr3HTE 的每个交付批次。版本号遵循 `DESCRIPTION` 中的 `Version:`。

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

## [0.1.0] — 2026-10-20（首版 + 教程 + 站点）

初始交付：三类结局（连续 / 二分类 / 生存）× 随机化 / 观察性设计的 metalearner
（S / T / X / R / DR）CATE 估计；函数式 API `metalearner()` 与 R6 Learner
`lrn("regr.metalearner")`；`resample()` / `benchmark()` / `tune()` 集成；
`ml_task()` Task 编码辅助；配套教程（主文档 + 8 个实跑脚本）；双语文档站。
生存分支不依赖 mlr3proba（原生 `coxph` / `ranger` 实现）。
