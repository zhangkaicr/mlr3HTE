# CHANGELOG

本文件记录 mlr3HTE 的每个交付批次。版本号遵循 `DESCRIPTION` 中的 `Version:`。

## 版本号规则：每次推送 +0.01

- 版本号写成**两位小数**的递增计数：`0.20` → `0.21` → `0.22` → …，
  **每推送一次更新就加 0.01**，不区分功能/修复/文档的分量（本项目版本号是
  交付批次序号，不是语义化版本）。
- 新批次发布时四处必须同步：`DESCRIPTION` 的 `Version:`、本文件新增的
  `## [x.xx]` 小节、`docs/assets/js/content-home.js` 的 `SITE_META.version`
  （页脚用）、`docs/assets/js/content-changelog.js` 的 `lede` 与 `heading`（当前版本标注）。
  改这四处最省事的办法是跑 `Rscript dev/bump_version.R 0.22`，它直接改前三处并把
  漏改的地方列出来。
- `0.21` 之前的历史批次沿用旧编号折算（`0.1.0` → `0.10`，10-21 那批观察性指标 →
  `0.11`，`0.2.0` → `0.20`）；`0.21` 起严格执行上面的 +0.01。

## [0.43] — 2026-10-26（移除重采样权重，严格回归原始公式；修好生存 R-learner 偏差）

按用户要求，把引擎里所有的「重要性重采样」（`.resample_by_weights`）彻底移除，**五种 meta-learner 的 τ 回归与结局模型一律无权重**，与 Künzel et al. 2019（X-learner）及 CausalML 的 BaseS/BaseT/BaseX/BaseR/BaseDR（`model_tau.fit(X, pseudo)` 无 `sample_weight`）一致。

### 1. 三种「权重」的去留

- **R-learner 的 (A-e)²**：本质是 R-loss 展开后平方相消的代数等价项，并非真实回归权重。v0.40 曾把它当样本权重经重采样近似，现已移除——R-learner 改为直接无权重回归伪结局 `(Y-m)/(A-e)`。
- **生存删矢 IPCW**：烤进伪结局内部（survdiff 取 `I(T>t0)/G`，rmst 取 ξ），τ 回归全程无权重。
- **S/T/X 的生存结局模型**：继续走 coxph/ranger 原生权重（偏似然 / KM 已在似然里正确处理删失），不走重采样。

顺带：移除重采样也消掉了它引入的 MC 噪声，**R/DR 在不交叉拟合时变成种子可复现**。

### 2. 修好一个被 v0.43 改动暴露的生存 R-learner 偏差

把 IPCW 烤进 survdiff 伪结局后，R-learner 的 Robinson 伪结局 `(Y-m)/(A-e)` 等于 `1/G × 1/(A-e)` 双重倒数，把 `1/G` 的方差放大到无权重 τ 回归无法消化——RCT 演示数据上 ATE 从真值 0.15 漂到 0.38。修复：R-learner 的生存伪结局改回**原始指示 `I(T>t0)`**，删失交由 censoring-aware 的 coxph/ranger 结局模型承担（这才是生存 R-learner 的标准做法），且 τ 回归全程无权重，契合「原始公式不加权」。X/DR 的伪结局结构能吃下 `1/G`，保持不变。

### 3. 校验

- `tests/testthat/test-engine.R`：五种 learner 在生存 RCT 演示数据上的 ATE 全部回到真值 0.2 容差内（R 偏差 0.0015）。
- 全量 `testthat` 通过；`dev/_validate.js` 与 `_smoke_site.js` 全绿。

## [0.42] — 2026-10-26（CI 修复 + 导航整理；R 代码不变）

纯文档站与 `DESCRIPTION` 元数据调整，**不改任何 R 代码与统计行为**——v0.41 的引擎、API、测试全部原样。

### 1. 修好 R-CMD-check 在 GitHub Actions 上的连续失败

失败发生在 `setup-r-dependencies` 这一步：`survlearners`（生存第二套引擎，只发布在 GitHub、`som-shahlab/survlearners`，不在 CRAN）写在 `Suggests` 里，却漏了 `Remotes:` 声明，pak 按 CRAN 解析不到就中断整个 job。已补回：

```
Remotes:
    github::som-shahlab/survlearners/r-package/survlearners
```

CI 据此从 GitHub 装齐依赖后，再正常跑 `R CMD check`。

### 2. 安装说明：pak 优先

首页「安装」改为**方式一 pak（推荐）/ 方式二 remotes** 两段式，与 README 早已采用的写法一致。

### 3. 导航整理

- **可解释性合并**：函数文档下拉里 9 个 CATE 可解释性函数（`hte_explainer()` 起）不再逐个列出，只保留「CATE 可解释性 · 总览」入口；各函数页仍由总览页内部链接可达。
- **目录去编号**：教程下拉的「0…6」前缀去掉，只留语义名。
- **模拟数据并入函数文档**：取消原独立的「模拟数据」顶栏下拉，其 6 个函数页（`mlr3HTE_scenarios()` 等）整体移入「函数文档」下拉。

## [0.41] — 2026-10-24（教程目录重组：1+2 合并，可解释性主文并入，函数页移入函数文档）

纯文档站结构调整，**不改任何 R 代码与统计行为**。v0.40 的引擎、API、测试全部不变。

### 1. 教程下拉从 11 项减到 8 项

| 之前 | 之后 |
|---|---|
| 1 RCT 设计下的分析 | **1 RCT 与观察性研究分析**（合并） |
| 2 观察性研究分析 | ↑ 已并入第 1 篇 |
| 3 生存结局分析 | 2 生存结局分析 |
| 4 换不同学习器 | 3 换不同学习器 |
| 5 模型评价指标 | 4 模型评价指标 |
| 6 RCT 基准测试 | 5 RCT 基准测试 |
| 7 基准模拟数据网格 | 6 基准模拟数据网格 |
| 8 CATE 可解释性 + 10 个函数子页 | 主文并入第 1 篇后半；10 个函数页移入「函数文档」下拉 |

合并的理由写在教程里：RCT 与观察性的分析流程**完全相同**，唯一区别是混杂因子有没有进
`X`。场景按「结局 × 设计」编号（1 连续 RCT、2 连续观察性、3 二分类 RCT、4 二分类观察性），
同一结局的两种设计挨在一起，正好直接对照。

### 2. 可解释性的处理

- `tutorialexplain` 主文的 10 个小节并入第 1 篇，标题加「可解释性 · 」前缀，
  在 16 节的目录里能看出分组；
- 10 个函数页（`apiexplain` / `apiexplainer` / `apisurrogate` / `apiimportance` /
  `apipdp` / `apishap` / `apishapdata` / `apiplotimportance` / `apiplotpdp` /
  `apiplotshap`）**页面 id 不变**，只是从「教程」下拉移到「函数文档」下拉——
  它们本来就是函数文档，全站 84 处指向它们的锚链因此一条都不用改。

### 3. 顺带修的两处不准

- `content-api.js` 函数总览把可解释性函数数写成「6 个 CATE 可解释性函数 + 5 个绘图函数」，
  实际是 **9 个 + 3 个配套绘图函数**（已按 `NAMESPACE` 的 42 个导出核对）；
- `dev/_smoke_site.js` 还在导航到已不存在的 `#/tutorialrct`，改为 `#/tutorialanalysis`。

### 4. 同步改动

`tutorial/00_教程.md` 的「六篇独立文章」表改为七篇并说明合并理由；教程索引页的
文章列表、六格矩阵锚链、导语与 lede 同步；`content-references.js` 里指向
「教程 · CATE 可解释性」的两处链接改指第 1 篇。

### 5. 校验

`dev/_validate.js` 62 页 ALL OK（64 − 3 + 1）；`_smoke_site.js` SMOKE OK
（合并后的教程页 25 个代码块 / 16 个复制按钮）；全部 JS 文件 `node --check` 通过。

## [0.40] — 2026-10-24（破坏性变更：移除 IPTW 加权选项，去混杂回归「混杂进 X 条件化」）

本批次是一次**破坏性**变更：把 `metalearner()` / `ml_fit()` 的 `weighting`、`weights`、`stabilize`
三个参数整体移除，回归经典 meta-learner 文献与 CausalML 的行为。

### 1. 为什么移除

Künzel et al. 2019 *PNAS* 的 S/T/X-learner 原文与 CausalML 的 BaseS/BaseT/BaseX
**都不给结局模型套 IPTW**。本包此前提供的 `weighting = "iptw"` / `"external"` 是额外扩展，
本质是「加权结局回归」：

- 它是**单稳健**的——要求倾向模型与结局模型同时正确；
- 它**不是**经典 IPTW 估计量（后者是边际效应的加权对照，本身没有结局模型）；
- 它**不是**双重稳健（AIPW/DR 才是）；
- 它**不能单独去混杂**——漏掉混杂因子时偏倚与朴素相同，只能当稳定器用。

真正去混杂的两条路是：把混杂变量放进 X 让结局模型条件化（S/T/X），或用自带倾向得分的
R / DR。教程主线相应改为「混杂进 X 条件化 vs 漏掉混杂因子」。

### 2. 保留了哪些权重

| 权重 | 归属 | 是否可选 |
|---|---|---|
| `(A-e)^2` | R-learner 的 Robinson 残差化估计量 | 不可选 |
| IPCW（删矢） | 生存分支处理信息删矢，`.surv_ipcw()` 自动算 | 不可选 |
| `e(X)` | R/DR 与 survlearners 的 X/R 的倾向得分 | 不可选，由 `.fit_ps()` 给出 |

`.resample_by_weights` 的重要性重采样通道也相应收窄为「只服务 R-learner 结构性权重与生存删矢」。

### 3. `learner_ps` 三形态 + 修掉一个静默 bug

倾向得分现在支持：mlr3 分类学习器 / 常数标量（如 RCT 的 `0.5`）/ `function(newX)`。
逐人外部倾向得分必须封装成 function 传入，直接传向量会报错。

此前 `g_fn` 只在 `weighting = "iptw"` 时才拟合真实倾向得分，否则退化为常数 `mean(A)`——
观察性数据下默认跑 R/DR 时伪结果用的是常数倾向得分，混杂被**静默**放过。现已修复，
并对 `(A-e)` 分母做 1e-3 截断。回归测试见 `test-engine.R` 第 7 节。

### 4. R/DR 未开交叉拟合时给出诚实警告

高弹性学习器做 mu 会过拟合训练残差，把 tau 系统性衰减：实测 R-learner 的 ATE
从 0.976（交叉拟合）掉到 0.432（不交叉拟合），真实值 1.049。现在
`cross_fitting = FALSE` 跑 R/DR 会直接 `cli::cli_alert_warning()` 提示。

### 5. 新增教程脚本 17：混杂强度扫描

`tutorial/code/17_混杂强度扫描.R`：5 档强度（0 / 0.5 / 1 / 1.5 / 2）× 五族 × 10 次重复，
n = 2000，70/30 划分，R/DR 开交叉拟合。产出
`tutorial/figures/17_confounding_strength.png` 与 `.csv`。

| strength | 未调整偏差 | S | T | X | R | DR |
|---|---|---|---|---|---|---|
| 0（RCT） | +0.008 | −0.037 | +0.007 | +0.009 | +0.005 | +0.006 |
| 0.5 | +0.392 | +0.010 | +0.039 | +0.033 | +0.044 | +0.006 |
| 1.0 | +0.709 | +0.061 | +0.067 | +0.043 | +0.020 | −0.011 |
| 1.5 | +0.919 | +0.100 | +0.099 | +0.052 | +0.062 | −0.057 |
| 2.0 | +1.048 | +0.137 | +0.134 | +0.060 | +0.040 | −0.045 |

未调整偏差从 +0.01 线性涨到 +1.05，五族 |偏差| ≤ 0.14。CATE 相关在 RCT 与中低强度下稳定
（X 约 0.94–0.96），在极端倾向得分（e ∈ [0.001, 0.994]）处 R/DR 因 `1/(A-e)` 放大而退化——
这一点在教程里如实说明，没有粉饰。

### 6. 同步改动

- 教程脚本 00 / 02 / 04 / 06 / 07 / 08 / 09 / 10 全部去掉 `weighting`，观察性主线改为
  「混杂全进 X vs 漏掉 lac」的反面对照；
- `mlr3HTE_demo_obs*()` 新增 `strength` 参数，用于强度扫描；
- 文档站 home / api / guide / references / tutorial 中英同步；`content-references.js`
  的 Robins 2000 条目改为「本包不给 S/T/X 加权的原因」；
- 7 个测试文件重写为「条件化 X 把偏差拉回来」「倾向得分三形态」
  「R/DR 默认即校正混杂（回归测试）」等。

## [0.38] — 2026-10-23（四点评测修订：可解释性限定 + 每阶段 mlr3 模型 + 观察性演示 + S/T 混杂校正）

本批次是针对用户四点评测反馈的统一修订，不引入新的导出函数，只补文档、补测试、补模拟证据。

### 1. 可解释性文档的「语义最干净」加边界

「统一逐点重拟合」的「clean」只指**算法行为一致**——五族在每个时点都做同构的完整
估计，不插值、不共享拟合。它**绝不**暗示能「看到」效应：CATE 是两个**潜在结果**之差，
同一单位只能观测其一，除测试/模拟数据外现实数据里真值无从直接计算。文档里
「伪结局与真值 tau 相关」的核对，仅是模拟数据下的内部诊断。该限定同时写进了
`overview.md` 的路线对比表与 `docs/assets/js/content-tutorial.js` 的生存曲线小节（中英双语）。

### 2. metalearner() 文档写明「每阶段、每种算法各拟合一个 mlr3 模型」

`@details` 新增说明：每个 metalearner 在内部会为每一个阶段、每一种机器学习算法各训练
一个 mlr3 模型，全部留在返回对象的 `$models` 里（S={m}、T={m1,m0}、X={m1,m0,tau1,tau0}、
R={mu,tau}、DR={m1,m0,tau}）。并指出可以用「按角色命名的 learner 列表」让各阶段用不同算法，
例如 T-Learner 写成 `list(treated = lrn("regr.lm"), control = lrn("regr.ranger"))`。

新增 `tests/testthat/test-ml-fit-models.R`：逐项断言 `$models` 里每个组件都是训练好的
`LearnerRegr`、命名与文档一致、且重跑 `predict()` 能复现 `cate_train`（tolerance 1e-8）。
覆盖了 S/T 的结局模型 `predict` 需要补 `a_trt`、效应阶段 `tau` 是裸 `Learner` 需用
`$predict_newdata()` 这两个形状差异。

### 3. c_for_benefit() 帮助文档补上观察性数据演示

原 `@examples` 已有一条 `mlr3HTE_demo_obs` + `dr_pseudo_outcome` 三件套的观察性演示；
本次再加一条走完整 `metalearner(weighting = "iptw")` 流水线的示例，并在结果里明确
propensity/mu1/mu0 三件套怎么来（实测 `c_for_benefit ≈ 0.78`）。

### 4. 观察性研究里 S/T 学习器如何校正混杂（模拟证据）

新增 `dev/_sim_obs_confound.R`：构造一个 Z 同时影响 A 与 Y 的混杂设定（真实 ATE≈1）。
模拟显示——（a）**朴素**估计偏 ≈+1.2；（b）S/T 只要把 Z 放进 X（条件结局模型）偏倚就 ≈0，
漏掉 Z 则与朴素一样偏；（c）再叠加 `weighting = "iptw"` 进一步收紧。结论：S/T 的混杂校正
靠的是**结局模型纳入混杂因子**，不是靠 IPW 单独作用。该结论可参阅用户 IMA 知识库
「灵活胖子的知识库」中「临床试验三大偏倚及永恒时间偏倚」一节（混杂是三大偏倚之一）。

## [0.37] — 2026-10-23（生存效应—时间曲线 surv_effect_curve()）

本批次补上候选中最后一项功能：生存结局的效应随时间变化曲线。实现路线经用户拍板
选**统一逐点重拟合**——五族行为一致，不为 S/T 开「一次拟合出整条曲线」的特例。

### 1. 新增 surv_effect_curve()

```r
surv_effect_curve(type, X, A, Y, times = NULL, n_times = 20L,
                  effect = c("survdiff", "rmst"),
                  learner_base = "coxph", newX = NULL, ...)
```

- 曲线上第 g 个点**就是** `metalearner(..., t0 = times[g])` 的完整估计，无近似、无复用；
- 默认时点取**事件时间**的 10%–90% 分位数（避开尾部事件稀疏区，那里 S(t) 不稳）；
- `effect = "rmst"` 时每个 τ 各自重拟合，因为伪结局
  `ξ = δ·min(T,τ)/Ĝ(T)` 本身随 τ 变化，不能复用；
- 返回 `data.frame(time, ate)`，属性含 `cate`（`nrow(newX) × G` 矩阵）、
  `type` / `effect` / `learner_base` / `n_fits`；
- 代价写进文档：G 个时点 = G 次完整拟合，倾向得分模型也会重复训练 G 次，
  默认 `n_times = 20`。

### 2. 新增 plot_surv_effect_curve()

横轴时间、纵轴效应，叠一条 0 参考线（效应为零 = 无差别）；默认再叠一层
**个体 CATE 的 25%–75% 四分位带**，直接看出异质性随时间的张弛。返回 ggplot 对象。

### 3. 用测试钉死「逐点重拟合」这条契约

`tests/testthat/test-surv-curve.R` 的核心断言：单点曲线的 ATE 必须与在同一个 t 上
单独调用 `metalearner()` 的结果**逐位相等**（`tolerance = 1e-12`）。一旦有人为了
性能改成「一次拟合出整条曲线」，这条测试会立刻红——这是本设计唯一的契约。

另覆盖：五族返回结构一致、`rmst` 曲线首末上升、非生存结局报错、时点不足 2 个报错、
时点超出随访范围给外推警告、`A` / `Y` 行数不符报错、`newX` 只影响逐点 CATE 不影响 ATE 曲线。

### 4. 文档

- 函数文档新增 `surv_effect_curve()` 独立页，内嵌两张实跑图（survdiff 与 rmst 各一张）；
- 函数总览表 40 → **42** 个导出对象；顺带修掉原先「分类明细合计」与「总对象数」
  对不上的问题（旧文案写 40，实际明细加起来是 42）；
- 生存教程新增「效应随时间怎么变」小节，含代码、实测输出与实跑图；
- 示例对账工具自动覆盖新增的两处「代码 + 实测输出」对。

## [0.36] — 2026-10-23（DAG 图重生成 + 文档示例输出对账）

本批次是一次**文档正确性**修复，主题是「文档说'实测'，就得真能实测出来」。
起因是发现 `mlr3HTE_dag()` 帮助页贴的输出写着图层类型为 `GeomSegment`，
而当前实现早已改用 `GeomCurve`；进一步核查又发现文档里的示例代码与其下方
粘贴的「实测输出」对不上——输出里有 `--- 数据卡 ---` 这类小节标题，代码
却从不打印它们。顺着这条线做了三件事。

### 1. 重生成 4 张过期的 DAG 图

`docs/assets/img/dag/` 下 binary 与 survival 的 4 张图（rct/obs 各两张）停留在
v0.34「任意两节点之间只允许一条箭头」的布局修正**之前**，与 continuous 两张
在布局、箭头路由、画布尺寸（1080 vs 880 宽）上都不一致。本批次用当前
`mlr3HTE_dag()` 统一重生成全部 6 张，画布统一为 880×550（8×5 in @110 dpi），
并在 `dev/_make_dag_figs.R` 里加了 PNG 头宽高的一致性核查。

### 2. 修正 apidag 帮助页

- 图层说明与示例输出里的 `GeomSegment` → `GeomCurve`，并说明「曲率不同的边
  各占一层，当前布局曲率全为 0 故共 2 层」；
- 错字「协变变 X」→「协变量 X」；
- 示例代码原来是一个 `for` 循环，粘贴的输出里却有 `===== design = rct =====`
  表头——循环根本不打印它，说明那份输出来自另一段脚本。已把表头的打印写进
  示例代码，并重新跑出与之逐字一致的输出；
- `fig` 小节原来只放 continuous 两张，补齐为 6 张（三种结局 × 两种设计）。

### 3. 新增文档示例的自动对账工具链

新增 `dev/_extract_examples.js` + `dev/_audit_run.R`：从 `content-api.js` /
`content-tutorial.js` 里抽出全部「示例代码 + 实测输出」配对（当前 40 对），
逐对重跑并逐行比对，输出 `dev/_audit/report.csv`。判据三档：`OK` / `STALE`
（能跑通但与文档不符）/ `NO_CONTEXT`（依赖前文对象，无法独立重跑）。

首次运行抓到 6 处 `STALE`（`apidag` + 5 个数据与 DR 页），全部是「输出里有
小节标题、代码不打印」。已给这些示例代码补上真实打印标题的 `cat()` 语句，
重跑输出后写回文档页。当前结果：**STALE 0**，16 对自动通过，24 对因依赖
前文上下文未能独立核对（已如实记在报告里，不粉饰）。

## [0.35] — 2026-10-22（文档站重组：可解释性并入教程 + 函数全量索引 + 绘图内嵌实跑图）

本批次聚焦文档站的信息架构，回应四处反馈：把模型可解释性内容并入教程下拉菜单、
补齐函数文档索引里的全部 40 个导出对象、让六个绘图函数的帮助页与教程都内嵌
「实际运行代码生成的图片」、并修掉一处潜伏的重复页面定义 bug。

### 1. 模型可解释性并入教程下拉菜单

原先「可解释性」是顶部独立菜单；本批次把它拆成 10 个页面（函数总览 + 9 个函数的
独立页），全部挂到「教程」下拉菜单下，与既有的 rct / obs / surv / learners / metrics /
benchmark / benchgrid / explain 并列。函数文档索引（apisim / apiexplain 两个模块页 +
总索引页）不再重复承载可解释性内容，只做函数级索引。

### 2. 函数文档索引补齐全部 40 个导出对象

`docs/assets/js/content-api.js` 的 `SITE_PAGES.api` 总览表重写为全部 40 个导出对象
（含 6 个返回 ggplot 的 Plot 函数，注明其数据来自对应的数据函数）。

### 3. 六个绘图函数：帮助文档与教程均内嵌实跑图

`plot_hte_importance()` / `plot_hte_pdp()` / `plot_hte_shap()` / `plot_hte_benchmark()`
/ `plot_qini()` / `mlr3HTE_dag()` 各自帮助页新增一个 `fig` 小节，内嵌先用真实数据
跑出图、再落盘的 PNG；教程对应位置（explain 篇的 importance / pdp / shap 三节、
benchgrid 篇的 confounding 节）同样内嵌实跑图，而非单独成节。

### 4. 修掉 content-api.js 的重复页面定义 bug

该文件原先有 17 个页面被定义了两遍（首份为死定义，缺 title/lede、且带「凂数」
乱码），由 `dev/_validate.js` 新增的重复定义检测命中。现已删除每个 id 的首份定义，
保留生效的第二份，48 个定义 0 重复，全站校验通过。

### 5. 验证 dr_pseudo_outcome() 支持二分类与生存结局

`dr_pseudo_outcome()` 默认 `cross_fitting = TRUE`，对三类结局均给出双重稳健伪结局
列表（pseudo / mu1 / mu0 / propensity / ate / t0 / effect）。实测：

- 连续：DR ATE 0.9984 vs 真值 1.0000。
- 二分类：DR ATE 0.1531 vs 真值 0.1288；`w` 全为 1（无删失），mu1 区间 [0.03, 0.93]。
- 生存（survdiff）：DR ATE 0.1576 vs 真值 0.1543；（rmst）DR 0.2496 vs ate_rmst 0.1964。

结论：该函数确实支持二分类与生存（survdiff + rmst）。观察性弱混杂下 DR 未必优于
未调整，但强混杂下 DR 显著纠偏——随机化未调整估计仍是金标准。

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

## [0.33] — 2026-10-22（首页瘦身 + 教程首页加包简介）

回应反馈：「这里不用有这个内容，另外就是在教程首页要用 300-500 字简要介绍这个包」。

- **首页删掉「这是什么」整段**（含 logo 图与三行结局对照表）。首页一进来就是六格矩阵。
- **教程首页开头新增段落「这个包做什么」**（中英双语，约 400 字），讲清三件事：
  1. 五种 meta-learner 的公式与结局类型无关，只跟「结局模型」打交道——
     连续返回 `E[Y|X]`、二分类返回 `P(Y=1|X)`、生存返回 `S(t0|X)`，
     CATE 随之是均值差 / 风险差 / t0 时点生存概率差；
  2. RCT 与观察性数据两档分别怎么处理（粗差分已无偏 vs. 必须先做 IPTW）；
  3. 七篇教程为什么分成「有真值对账」与「无真值排序评价」两组。

顺手修掉两个渲染 bug（都是新校验脚本 `dev/_validate.js` 跑出来的）：

- **代码块里的 `<dbl>` 不再消失。** 示例输出是把 R 控制台原文写进 `<pre>` 的，
  里面 tibble 的列类型行 `<dbl>` / `<int>` / `<chr>` 被浏览器当成未知标签直接吞掉。
  已把 149 个 pre 块内部的尖括号统一转义成 HTML 实体，真正的标记一个未动。
- **补上 3 个函数页缺失的 lede**：`metalearner()`、`ml_task()`、R6 Learner 三页
  此前标题下面直接跳正文。

新增 `dev/_validate.js`：一次性检查 44 个页面的中英段落 id 对齐、
HTML 标签闭合、站内 `#/` 链接是否有对应页面。

## [0.32] — 2026-10-22（函数文档全量拆分：每个函数一页）

回应反馈：「函数文档里面每个单独的函数都要有对应的页面，
每个函数都要有例子说明详细用法，例子是实测情况。」

- **25 个导出对象全部拆成独立页面**（中英双语）：
  `apimetalearner` / `apis` `apit` `apix` `apir` `apidr` / `apimltask` / `apilearner` /
  `apidemodata` `apidemobinary` `apidemoobs` `apidemoobsbinary` `apidemoobssurv` `apidemosurv` /
  `apiqinicurve` `apiqinicoef` `apicforbenefit` `apitoccurve` `apidrpseudo` /
  `apihtebenchmark` `apiplotbenchmark` / `apicateci` `apiplotqini` `apidag` / `apilrn`。
- **每个页面都带实测示例**：先写一个采集脚本
  把 25 个函数的代表性用法各跑一遍，输出落盘，
  再把代码与输出原样写进页面——所有数值都是跑出来的，没有手写。
- 5 个分组页（`apishortcuts` / `apidemo` / `apimetrics` / `apihelpers` /
  `apibenchmark`）改为<strong>索引页</strong>：列出组内每个函数并链接到详情页。
- 总索引页 `#/api` 重写为 25 行全量表（函数 / 类别 / 一句话说明）。
- 顶栏下拉菜单的兩个分组入口保持不变（共 9 项），点进去先看分组索引。
- 校验：自动化脚本逐页核对 44 个页面（国际化前 22 个）的
  `div/table/tr/td/th/ul/li/p/a/figure/pre/code/span/strong/em` 标筻配平，
  以及页面内所有 `#/xxx` 链接是否都能找到目标页——全部通过。
- 同步 DESCRIPTION / SITE_META / 缓存截 / CHANGELOG / content-changelog.js 至 v0.32。

## [0.31] — 2026-10-22（新增 RCT 基准测试：Qini / TOC / c-for-benefit）

新增两个导出函数，回答“没有真实 tau 的现实 RCT 数据怎么比较
learner”。前提在文档里写清楚了：**真实 CATE 只有模拟数据才给得出，
“跑 mlr3 benchmark 看 CATE 相关”只适用于模拟研究。**

- `R/benchmark.R`（新文件）：
  - `hte_benchmark(X, A, Y, ...)`：RCT 数据上对多个 meta-learner 做基准测试。
    指标 = 归一化 Qini 系数 + 绝对 Qini 系数 + TOC 增益 + c-for-benefit，
    全部建立在随机化带来的可交换性上，**不需要倾向得分**。
    可选 `tau` 参数：模拟数据上可以额多报 `tau_cor` / `tau_rmse` 两列。
  - 交叉拟合是强制的：每个 learner 在 K 折训练折上拟合、留出折上预测，
    折的划分**按处理组分层**。实测 in-fold 的 c-for-benefit 0.663
    **超过真实 tau 的 0.624**（把噪声也排序），交叉拟合后回落到 0.617。
  - `plot_hte_benchmark(x, metric, min_fraction = 0.05)`：Qini / TOC 曲线分面对比图，
    自动加参考线。
  - 三类结局（连续 / 二分类 / 生存）默认基学习器自动选（ranger /
    classif.ranger / coxph）；观察性数据传 DR 三件套即可。
- `tests/testthat/test-benchmark.R`（新建，32 个期望）：随机基线校准、
  in-fold vs out-of-fold 虚高校验、三类结局、种子复现、参数校验、
  观察性三件套、绘图。全量测试 FAIL 0 / PASS 347。
- `tutorial/code/14_RCT基准测试_Qini指标.R`（新建）：标尾建立、in-fold
  vs out-of-fold 对照、五族基准、三类结局、观察性、现实形态。
- 文档站：`#/tutorialbenchmark` 新文章（中英，教程目录变七篇）、
  `#/apibenchmark` 新函数页；两个下拉菜单各加一项；
  `docs/assets/img/benchmark/` 新增 Qini / TOC 对比图。
- `00_教程.md` 新增第 12 节（前提、交叉拟合、代码、实测结果）。
- 同步 DESCRIPTION / SITE_META / 缓存截 / CHANGELOG / content-changelog.js 至 v0.31。

## [0.30] — 2026-10-22（导航简化 + CATE 对账口径统一）

- 顶栏「场景教程与模型评价」改为「教程」（英文 Tutorial），字数缩短避免挤压其余项。
- **对账口径统一**：新增 `tutorialbasics` 页「对账指标约定」节（中英），
  明确模拟数据上要同时报 **ATE 偏差 / CATE 相关 / RMSE / 估计 SD vs 真实 SD /
  分位数对照**，不能只报 ATE；教程目录页 lede 同步说明。
- 脚本 02 / 04 / 06 的对账表补齐 `RMSE` / `估计SD` / `真实SD` 列（之前只报相关）；
  文档站 s2 / s4 / s6 表格按实跑数值补齐，并把相关/RMSE 写进各框架的「关键结论」。
- 场景 2 与场景 6 作为「ATE 对但 CATE 错」的现成反例写进教程（外部权重 + DR 的 ATE 偏差仅
  +0.007，但 CATE 相关只有 0.123、RMSE 0.563、估计 SD 超出真值 3.6 倍）。
- `00_教程.md` 新增「对账指标约定」小节，与文档站对齐。
- 同步 DESCRIPTION / SITE_META / 缓存截 / CHANGELOG / content-changelog.js 至 v0.30。

## [0.29] — 2026-10-22（顶栏导航改为下拉菜单）

- `content-home.js` 的 `SITE_NAV` 给「场景教程与模型评价」和「函数文档」两项加了
  `children` 子菜单（共 7 + 8 项）＋上 `content-tutorial.js` 拆分出来的 6 篇文章。
- `app.js` 的 `renderNavbar()` 支持 `children`：父项保留跳转（点标题进总览），右侧三角按钮负责展开；
  当前页命中子项时抽屉默认展开。交互：桌面端 hover 展开、点击切换、
  点外部关闭、Esc 关闭；子项高亮用精确匹配（不会让「目录」在子页上一起亮）。
- `style.css` 新增导航下拉样式（`.nav-item` / `.nav-caret` / `.nav-dropdown`，三角用 border 画不依赖字体）；
  窄屏（≤900px）拉下改为抽屉内静态展开；≤1180px 时先收搜索快捷键提示给三角让位。
- 同步 DESCRIPTION / SITE_META / 缓存截 / CHANGELOG / content-changelog.js 至 v0.29。

## [0.28] — 2026-10-22（教程拆成索引页 + 六篇独立文章）

### 文档
- 教程从「一个长页 + 右侧目录」改成 **pkgdown / dplyr Articles 的结构**：
  `#/tutorial` 只放目录（六篇的列表 + 六格速查表 + 脚本 + 环境），
  五大框架各自独立成页——`#/tutorialbasics`、`#/tutorialrct`、
  `#/tutorialobs`、`#/tutorialsurv`、`#/tutoriallearners`、`#/tutorialmetrics`。
  点导航进目录、再点条目进正文，每篇都能单独读、单独分享。
- 每篇文章的框架分隔节改名「本篇速览」，末尾加「继续读」导航（返回目录 /
  下一篇），形成可顺序阅读的链路。
- 旧锚点全部迁移（`#/tutorial/s1` → `#/tutorialrct/s1` 等），
  `content-guide.js` 里的两处引用同步改掉。
- `tutorial/00_教程.md` 的速览表改成六篇篇目表，附线上链接。

### 站点
- `style.css` 新增 `.article-list`（pkgdown 风格目录列表，深色主题自动适配）。
- 顶栏高亮支持子页：进入 `tutorialrct` 或 `apimetalearner` 时，
  所属的「教程」「函数文档」仍保持选中。
- 节级可选字段 `notoc`，用于让页内导航节不进右侧目录。

## [0.27] — 2026-10-22（教程首页改为框架优先 + 静态资源缓存戳）

### 文档
- 教程页把「五大框架导航」提到**页面最前面**（此前被一段很长的 DGP 压在中段，
  第一屏看起来和重构前一模一样）。原「六格导航」降级为「六格矩阵（速查）」，
  跟在框架卡片后面，负责查场景编号。
- 五个框架的分隔节由两句 `<ul>` 升级为「场景 / 脚本 / 关键结论」小表，
  每张表都填真实对账数值，点场景名直达对应小节。
- 顺手订正一处表述：观察性连续结局的加权偏差最大为 −0.043，
  原文写「压到 0.04 以内」，改为「≤ 0.05」。

### 构建
- `docs/index.html` 的 js/css 引用统一加 `?v=0.27` 缓存戳；`dev/bump_version.R`
  新增第 4 步自动改写该戳，`tests/testthat/test-version.R` 新增断言钉住，
  防止「推送了新 JS，用户刷新看到的还是旧页面」。

## [0.26] — 2026-10-22（教程重构为五大框架 + dplyr 风格导航）

### 文档
- 文档站「教程」从「六格逐个讲」重构为**五大框架**：RCT 设计分析 / 观察性分析 / 生存结局分析 / 换不同学习器 / 模型评价指标，每个框架下挂对应场景，并新增「五大框架导航」卡片索引（复用既有 `.cards`/`.card` 网格）。
- 教程页重排为框架分组：overview + DGP 作为共享前言，随后按五大框架排列各场景；索引卡片与各框架小节互链。
- `tutorial/00_教程.md` 顶部新增「五大框架速览」表，与文档站对齐。
- 设计语言沿用 dplyr.tidyverse.org 的「索引卡片 + 分主题」风格。

## [0.25] — 2026-10-22（函数 reference 拆分为索引页 + 每函数独立页）

### 文档
- 文档站「函数参考」从单页长文档重构为**索引页 + 每个函数分组一个独立网页**：
  `content-api.js` 现在导出 `SITE_PAGES.api`（总览索引）以及 `apimetalearner` /
  `apishortcuts` / `apimltask` / `apilearner` / `apidemo` / `apimetrics` / `apihelpers`
  七个独立详情页，每页用手写 `.fn` 模板，导航与站内搜索均可直达。
- 索引页总览表与各函数页互相链接，README 与教程也改指新链接形式（`#/apimetalearner` 等）。

## [0.24] — 2026-10-22（GitHub README 中英双语 + 顶部一键切换）

### 文档
- GitHub 仓库首页改为中英双语：新增 `README_EN.md`（完整英文版），`README.md`（中文）
  顶部均加入语言切换按钮，一键跳到另一语言。
- 两份 README 内容对齐（安装 / 函数式 API / R6 Learner / 方法学要点 / 文件结构 /
  依赖与运行环境 / 版本号规则），均指向双语文档站。

## [0.23] — 2026-10-22（补生成 man/ 文档）

### 文档
- 重新运行 `roxygen2::roxygenise()`，使 `man/metalearner.Rd` 与
  `man/LearnerRegrMetalearner.Rd` 同步到 0.22 新增的 roxygen 注释：
  `learner_base` / `learner_tau` 现在支持按角色命名的 list（T 两组、X 各阶段分别指定）。
  此前 0.22 只改了源码注释、漏跑 roxygenise，导致 `man/` 落后一个批次。

## [0.22] — 2026-10-21（学习器可按分组 / 阶段单独指定）

### 新增：learner_base / learner_tau 支持按角色命名的 list
- T-Learner：两组可各自指定不同算法，`learner_base = list(treated = ..., control = ...)`。
- X-Learner：两个结局模型可分别指定 `learner_base = list(m1 = ..., m0 = ...)`，
  两个效应回归可分别指定 `learner_tau = list(tau1 = ..., tau0 = ...)`；
  单 learner 仍是默认（所有分组 / 阶段共用），完全向后兼容。
- S / R / DR 与 `engine = "survlearners"` 只接受单个 learner，传命名 list 会明确报错。
- R6 Learner `lrn("regr.metalearner")` 的 `learner_base` / `learner_tau` 字段透传同一套规格。

### 新增：教程脚本 13 补回 kknn
- `kknn` 此前本机未装，演示被临时换成 `rpart`；现已安装，六类基学习器
  （ranger / xgboost / glmnet / rpart / kknn / lm）全部回归，并新增一节演示
  "每个分组 / 阶段单独换算法"。

### 测试
- 新增 `tests/testthat/test-learners-flexible.R`：覆盖 T 两组不同、X 各阶段不同、
  缺角色 / 未知角色 / S·R·DR 拒绝 list / 生存按组字符串 / R6 透传共 7 个 `test_that`。
- 全量测试 `FAIL 0 | WARN 2 | SKIP 0 | PASS 314`。

## [0.21] — 2026-10-21（版本号改为两位小数递增）

### 变更：版本号规则
- 版本号从 `0.2.0` 这类三段式改为**两位小数递增**（`0.20` → `0.21` → `0.22` …），
  每次推送更新 +0.01。历史批次按规则折算：`0.1.0` → `0.10`、`0.2.0` → `0.20`。
- 新增 `dev/bump_version.R`：一条命令改掉 `DESCRIPTION` 与站内 `SITE_META`
  的版本号，并扫出仍然引用旧版本号的文件（防止再出现"改了 DESCRIPTION、站内没跟上"）。
- 站内更新日志的历史小节标题（`v0.0.1` / `v0.1.0` / `v0.2.0`）一并改为两位小数，
  与 `README` §6.6 的版本号规则对齐。

### 订正：测试规模数字
- 文档里写的「288 个用例 / 55 个文件」与仓库实测不符（`tests/testthat/` 下只有
  8 个文件）。改为可复核的口径：**8 个测试文件 / 58 个 `test_that` 块 / 293 个期望，
  全部通过**（`FAIL 0 | WARN 2 | SKIP 0 | PASS 293`，两条警告均为 "built under R 4.5.3"）。
  README §6.1–6.2、环境页、教程页、`tutorial/00_教程.md` 同步订正。

### 修复：站内版本号一直是 0.1.0
- `docs/assets/js/content-home.js` 的 `SITE_META` 停在 `0.1.0 / 2026-10-20`，
  导致**页脚与更新日志页头都显示 v0.1.0**，而 `DESCRIPTION` 早已是 0.2.0。
  根因是该文件不在"发版清单"里，只改了 CHANGELOG。现在 `SITE_META` 与
  `DESCRIPTION` 统一为 `0.21`，并新增 `tests/testthat/test-version.R`
  断言两者一致（找不到 `docs/` 时跳过，`R CMD check` 下不会误报）。

## [0.20] — 2026-10-21（评价指标覆盖三类结局）

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

## [0.11] — 2026-10-21（评价指标可用于观察性数据 + DAG 箭头修复）

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

## [0.10] — 2026-10-20（生存第二套引擎：`engine = "survlearners"`）

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

## [0.10] — 2026-10-20（教程深化：DAG、DGP 讲解、真实输出、tidyverse 整理）

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

## [0.10] — 2026-10-20（消费路径修复：`lrn()` 再导出）

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

## [0.10] — 2026-10-20（收尾批次，commit `8e019b7`）

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

## [0.10] — 2026-10-20（消费者可复现性修复，commit 待定）

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

## [0.10] — 2026-10-20（首版 + 教程 + 站点）

初始交付：三类结局（连续 / 二分类 / 生存）× 随机化 / 观察性设计的 metalearner
（S / T / X / R / DR）CATE 估计；函数式 API `metalearner()` 与 R6 Learner
`lrn("regr.metalearner")`；`resample()` / `benchmark()` / `tune()` 集成；
`ml_task()` Task 编码辅助；配套教程（主文档 + 8 个实跑脚本）；双语文档站。
生存分支不依赖 mlr3proba（原生 `coxph` / `ranger` 实现）。
