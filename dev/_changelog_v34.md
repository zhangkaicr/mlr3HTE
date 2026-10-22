## [0.34] — 2026-10-22（CATE 可解释性模块 + 基准模拟数据网格）

本批次对应四项反馈：给 CATE 配上一整套可解释性工具、所有图形可导出为 ggplot 对象
且绘图数据可单独取出、教程代码要有 R 语法高亮与复制按钮、DAG 每两个节点之间只能有
一条箭头；同时补齐模拟数据的结构维度、把三个长期待办结清。

### 1. 新增模块：CATE 模型可解释性（`R/explain.R`，9 个导出函数）

以 **DALEX** 体系为骨架、以 **kernelshap + shapviz** 计算 SHAP 值：

- `hte_explainer()` 把 CATE 模型包装为 DALEX 解释器。**响应变量取双重稳健伪结局
  `Y*`，而不是原始 `Y`**——后者衡量的是基线预后 `mu(X)`，与效应异质性无关。
- `hte_surrogate()` 用单一 mlr3 学习器重拟合 CATE 曲面，得到结构简单的代理模型
  （实测与原模型相关 0.913–0.937），仅供解释与可视化，不用于效应估计。
- `hte_feature_importance()` 置换重要性；`hte_pdp()` 偏依赖（PDP）与累积局部效应（ALE）。
- `hte_shap()` Kernel SHAP；`hte_shap_data()` 把 shapviz 对象摊平为长表。
- `plot_hte_importance()` / `plot_hte_pdp()` / `plot_hte_shap()` 三种图，均返回 ggplot。

两处刻意偏离上游默认行为，均已写在函数文档里：

- **`hte_pdp()` 默认 `center = FALSE`**。DALEX 的 `model_profile()` 默认把曲线减去
  平均预测值；CATE 语境下纵轴必须是**绝对**的平均预测 CATE，围绕 0 波动会掩盖
  效应水平本身（"平均获益 1.2"与"平均获益 0.2"是两个临床结论）。
- **`loss` 只接受函数对象或 `"rmse"` / `"mse"`**。DALEX 2.5 未导出 MAE；传字符串时
  DALEX 会在自身框架内按名查找 `loss_*`，跨包调用必然失败。

SHAP 的可加性残差实测为 4.44e-16（机器精度），该式同时被用作回归测试的断言。

### 2. 所有绘图返回 ggplot 对象，绘图数据可单独导出

`plot_hte_importance()` / `plot_hte_pdp()` / `plot_hte_shap()` / `plot_hte_benchmark()`
/ `plot_qini()` / `mlr3HTE_dag()` 全部返回 ggplot 对象，可用 `+` 叠加图层、
用 `ggsave()` 导出。配套的数据函数：

| 绘图函数 | 数据函数 |
|---|---|
| `plot_hte_importance()` | `hte_feature_importance()` |
| `plot_hte_pdp()` | `hte_pdp()` |
| `plot_hte_shap()` | `hte_shap_data()` |
| `plot_hte_benchmark()` | `hte_benchmark_data()`（新） |
| `plot_qini()` | `qini_curve()` |
| `mlr3HTE_dag()` | `mlr3HTE_dag_data()`（新） |

`plot_qini()` 由 base graphics 改写为 ggplot2，随机靶向参考线保留为 `geom_abline`。

### 3. 教程代码：R 语法高亮 + 复制按钮

新增 `docs/assets/js/highlight-r.js`（约 230 行，自写分词器，不引入 CDN 或构建步骤）。
220 个代码块被区分为 `language-r`（138 个，带复制按钮）与 `r-out`（82 个输出块，
标注"输出"、不给复制按钮）。同时修掉一个旧 bug：R 控制台原文里的 `<dbl>` /
`<int>` / `<chr>` 曾被浏览器当成标签吞掉，现已转义（149 个块）。

### 4. DAG：每两个节点之间只保留一条箭头

`R/dag.R` 重写。先做边去重，再用二次 Bézier 曲线对矩形标签盒做碰撞检测：
若某条边会从第三个节点身上穿过，自动搜索一个曲率绕行，结果记在 `curve` 列。
绘图时按曲率分组、一层一个 `geom_curve`——`curvature` 是参数而非美学映射，
写进 `aes()` 会被忽略。回归测试断言：任意两节点间边数 ≤ 1，且无边穿过第三节点。

### 5. 教程语气改为学术规范

24 处中文与 4 处英文表述由口语改为客观陈述（"照着敲一遍就能跑" →
"每篇均给出一条可独立执行的完整流程"；"四个坑" → "四项前提限制"）。
替换以精确匹配脚本执行，可复核。

### 6. 基准模拟数据网格（`R/scenarios.R` + `data/mlr3hte_bench_data.rda`）

10 个设计 × 3 类结局 = 30 份数据，`n = 2000`，种子固定，随包发布。四个结构维度
相互独立，可固定其余、只改一个来做对照：

| 维度 | 取值 |
|---|---|
| 研究设计 | `rct`（随机化，无混杂）/ `obs`（观察性，有混杂） |
| 混杂形式 | `none` / `linear` / `nonlinear` |
| 效应异质性形式 | `linear` / `nonlinear`（含 `sin` 与二次项） |
| 共用变量 | 是否存在**既是混杂因子、又是效应修饰因子**的协变量 |

每份数据带真值 `tau` / `ate` / `ps_true`；生存结局额外提供 RMST 尺度的
`tau_rmst` / `ate_rmst`。实测的混杂强度梯度（未调整差值 − 真值 ATE）：

- 随机化设计：±0.04 以内（纯抽样波动）
- 观察性设计、`shared = FALSE`：0.09–0.24
- 观察性设计、`shared = TRUE`：0.47–0.61

线性与非线性 HTE 的可估性对照（留出集 CATE 相关）：真实 CATE 线性时 `regr.lm`
0.994 > `regr.ranger` 0.894；真实 CATE 非线性时 `regr.lm` 0.564 < `regr.ranger`
0.819。基学习器的函数形式必须覆盖真实 CATE 的形式，否则是偏差而非方差。

**破坏性变更**：数据对象由 `mlr3hte_bench` 改名为 `mlr3hte_bench_data`。
原因是 Windows 文件系统不区分大小写，`mlr3hte_bench.Rd`（数据）会被
`mlr3HTE_bench.Rd`（函数）覆盖，导致 `R CMD check` 报数据集未文档化。
取用请一律走 `mlr3HTE_bench()`，不受影响。

### 7. 三个长期待办结清

- **R CMD check / roxygen2 生成 `man/`**：`man/` 重新生成（40 个 Rd）。
  依赖声明补齐（`tibble` / `tidyr` 进 Imports；`R6` / `paradox` / `mlr3learners`
  补进 NAMESPACE），`rexp` / `setNames` 改为 `stats::` 显式引用，
  `xs` / `ys` / `xe` / `ye` 加入 `globalVariables`。
  结果：**0 error / 0 note**，剩 1 条 WARNING（R 代码含非 ASCII 字符，见下）。
- **R / DR 的交叉拟合**：`engine.R` 中已实现并默认关闭，`cross_fitting = TRUE` 启用；
  干扰参数在 K 折训练折上拟合、在留出折上评估。实测 R-Learner 的偏差由 in-fold
  的 −0.456 改善到 out-of-fold 的 +0.143。已加回归测试锁定。
- **生存分支的 RMST 效应选项**：`effect = "rmst"` 可用，逐人效应取 IPCW 校正的
  RMST 差；实测偏差 −0.0144（对照 `survdiff` 的 −0.0214）。已加回归测试锁定。

### 已知限制

`R CMD check` 仍报 1 条 WARNING：R 代码文件含非 ASCII 字符（即中文 roxygen 注释）。
该检查由 `tools:::.check_package_ASCII_code()` 无条件执行，**不看 `DESCRIPTION`
的 `Encoding: UTF-8`**；要彻底消除只能把全部中文注释改写成 `\uxxxx` 转义，
代价是源码不可读。此处选择保留可读性，明确记录为已知项。

### 文档站

- 教程新增第 7 篇（基准模拟数据网格）与第 8 篇（CATE 模型可解释性），各配可独立
  执行的脚本 `tutorial/code/16_*.R` 与 `15_*.R`，文中数值均为实跑结果。
- 函数文档新增 15 个独立页面，另加 `apisim` / `apiexplain` 两个模块索引页。
- 参考文献新增 F（模型可解释性，6 条）与 G（模拟设计与估计方法学，3 条）两节。
- 全站 63 页，中英小节 id 对齐与站内链接均已通过校验。
