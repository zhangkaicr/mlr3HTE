/* =====================================================================
   content-changelog.js —— 更新日志（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.changelog = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "更新日志",
    lede: "mlr3HTE 的版本历史与重要变更。当前版本 v0.2.0。",
    sections: [

      {
        id: "v020",
        heading: "v0.2.0 · 2026-10-21（当前版本）",
        body:
          '<div class="callout ok"><div class="callout-title">评价指标现在覆盖三类结局</div>' +
          '<p>Qini / TOC / c-for-benefit / DR 伪结局过去只接受数值型结局，' +
          '传 <code>Surv</code> 会直接报错。现在五个函数全部支持<strong>连续、二分类、生存</strong>，' +
          '生存走里程碑指标 <code>I(T &gt; t0)</code> + 删失 IPCW，' +
          '效应标尺与 <code>metalearner()</code> 的生存 CATE 对齐。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>五个评价函数新增 <code>t0</code> / <code>X</code> / <code>effect</code> 参数。' +
          '<code>t0</code> 不传时取事件时间中位数；<code>effect</code> 可选 ' +
          '<code>"survdiff"</code>（默认，S(t0) 差）或 <code>"rmst"</code>。</li>' +
          '<li><code>dr_pseudo_outcome()</code> 也支持生存结局：默认基学习器 ' +
          '<code>"coxph"</code>，返回伪结局并带回 <code>t0</code> 与 <code>effect</code>。</li>' +
          '<li><code>.surv_ipcw()</code> 新增 <code>at</code> 参数与 <code>X = NULL</code> 的' +
          '边际 Kaplan–Meier 分支，删失权重同时供引擎与指标使用。</li>' +
          '<li>教程脚本 <code>12_三类结局评价指标.R</code>：三类结局 × 三层排序对账，' +
          '各重复 8 次报均值 ± 标准差。</li>' +
          '</ul>' +
          '<h3>实测：为什么生存必须做删失校正</h3>' +
          '<ul>' +
          '<li>真值 ATE 0.1514：完整病例 IPCW 得 0.1424（偏差 −0.009）；' +
          '不做校正（<code>w = 1</code>）只有 0.1127（偏差 −0.039，低估约四分之一）。</li>' +
          '<li><code>toc_curve()</code> 的分母从 <code>k</code> 改为 <code>cumsum(w)</code>，' +
          '避免零权重的删失个体稀释均值。</li>' +
          '<li>已知限制：<code>effect = "rmst"</code> 在删失重时低估（权重截断在 100 以内，' +
          '删失 58% 时实测 0.043 vs 真值 0.184）。删失重请用默认 <code>survdiff</code>。</li>' +
          '</ul>' +
          '<h3>教程新增的一课：拟合顺序决定指标能不能信</h3>' +
          '<p>先在全集拟合、再切一块当留出集，等于把 <code>Y</code> 泄漏进 CATE。' +
          '二分类下最致命（观测获益就是 <code>Y<sub>treated</sub> − Y<sub>control</sub></code>）：' +
          'c-for-benefit 从 0.558 虚高到 <strong>0.891</strong>，反超 oracle 的 0.605，' +
          '尽管它与真 <em>τ</em> 的相关反而更低（0.542 &lt; 0.655）。<strong>先切分、后拟合。</strong></p>'
      },

      {
        id: "v010",
        heading: "v0.1.0 · 2026-10-20",
        body:
          '<div class="callout ok"><div class="callout-title">首个完整版本</div>' +
          '<p>S / T / X / R / DR 五种 Meta-Learner，覆盖连续、二分类、生存三类结局，' +
          '同时支持随机化试验与观察性研究。119 个测试全部通过，配套中英双语教程站。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>生存结局改为<strong>完全不依赖 mlr3proba</strong>：基学习器用原生 <code>"coxph"</code> / ' +
          '<code>"ranger"</code>。传 <code>lrn("surv.*")</code> 会明确报错并给出提示。</li>' +
          '<li>新增观察性的二分类与生存演示数据：<code>mlr3HTE_demo_obs_binary()</code>、' +
          '<code>mlr3HTE_demo_obs_surv()</code>，凑齐六格矩阵。</li>' +
          '<li>新增 <code>ml_task()</code> 导出函数，统一三类结局的 Task 编码。</li>' +
          '<li>配套教程：<code>tutorial/00_教程.md</code> + 8 个可运行脚本。</li>' +
          '<li>本双语文档站（全局搜索 / 中英切换 / 明暗主题）。</li>' +
          '</ul>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li><strong><code>.surv_at_t0()</code> 的 <code>ifelse</code> 陷阱</strong>：' +
          '<code>idx</code> 是标量而 <code>ifelse</code> 返回形状跟随 <code>test</code>，' +
          '导致所有样本拿到同一个预测值。ranger 生存分支的 CATE 方差变成 0，' +
          'ATE 甚至给出 −0.119 的错误符号（真值 +0.152）。改为普通分支 + 整列取值。</li>' +
          '<li>classif 学习器的 <code>predict_type = "prob"</code> 必须在 <code>$train()</code> ' +
          '<strong>之前</strong>设置，否则 <code>$prob</code> 为 NULL；训练后再改会触发断言错误。</li>' +
          '<li><code>mlr3HTE_demo_surv()</code> 里 <code>A</code> 用在定义之前。</li>' +
          '</ul>' +
          '<h3>行为调整</h3>' +
          '<ul>' +
          '<li><code>learner_tau</code> 不再沿用 <code>learner_base</code>：二阶段是对伪结果回归，' +
          'ranger 默认 <code>min.node.size = 5</code> 会过拟合噪声（CATE 相关从 0.9 掉到 0.2）。' +
          '现在默认建 <code>regr.ranger(num.trees = 500, min.node.size = 50)</code>。</li>' +
          '</ul>'
      },

      {
        id: "v001",
        heading: "v0.0.1 · 2026-10-18（初始骨架）",
        body:
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>引擎骨架：结局模型抽象 + 五种 Meta-Learner 公式。</li>' +
          '<li>连续结局 + RCT 全链路跑通；函数式 API 与 R6 Learner 两套接口。</li>' +
          '<li><code>resample()</code> / <code>benchmark()</code> 集成（曾出现段错误，已修）。</li>' +
          '</ul>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li><code>resample()</code> 段错误的真凶是 <code>PredictionRegr$new(truth = NULL)</code>——' +
          'measure 会对 <code>prediction$truth</code> 做 <code>assert_regr</code>。改为取自预测任务本身。</li>' +
          '<li>R6 钩子必须用<strong>私有</strong> <code>.train</code> / <code>.predict</code>；' +
          '覆盖公开方法会替换掉 <code>.__Learner__train</code>，导致 <code>state$train_task</code> 不被设置。</li>' +
          '<li>data.table 列选择陷阱：<code>dt[, char_vec, drop = FALSE]</code> 会把字符向量当成行索引。</li>' +
          '</ul>'
      },

      {
        id: "planned",
        heading: "计划中",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>事项</th><th>说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>R CMD check</code> 全量检查</td><td>本机无 Rtools 的编译型检查；可先跑纯 R 部分</td></tr>' +
          '<tr><td>roxygen2 生成 <code>man/</code></td><td>目前只有 NAMESPACE，没有 .Rd 帮助页</td></tr>' +
          '<tr><td>R / DR 的交叉拟合</td><td>伪结果应做 K 折 out-of-fold 拟合以降低过拟合偏倚</td></tr>' +
          '<tr><td>生存分支 RMST 选项</td><td>限制平均生存时间差，作为 t0 概率差之外的效应度量</td></tr>' +
          '<tr><td>CATE 不确定性量化</td><td>目前只给点估计，尚无置信区间</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "compat",
        heading: "环境与兼容性",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>项</th><th>要求 / 现状</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>R</td><td>4.5.1（开发机）</td></tr>' +
          '<tr><td>mlr3</td><td>1.8.0</td></tr>' +
          '<tr><td>paradox</td><td>1.0.1（注意：1.0 用 <code>p_fct</code>/<code>p_uty</code>，无 <code>ParamFct</code> 导出名）</td></tr>' +
          '<tr><td>mlr3proba</td><td><strong>不需要</strong>；已从依赖与代码路径中彻底移除</td></tr>' +
          '<tr><td>mlr3tuning</td><td>可选（<code>tune</code> 演示未包含）</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">mlr3 1.8 的限制</div>' +
          '<p>该版本的 Task / Learner 没有 case weights API，因此包内所有权重都通过' +
          '<strong>重要性重采样</strong>落地，会引入蒙特卡洛噪声。需要复现结果时请 ' +
          '<code>set.seed()</code>。</p></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "Changelog",
    lede: "Version history and notable changes for mlr3HTE. Current version: v0.2.0.",
    sections: [

      {
        id: "v020",
        heading: "v0.2.0 · 2026-10-21 (current)",
        body:
          '<div class="callout ok"><div class="callout-title">Evaluation metrics now cover all three outcome types</div>' +
          '<p>Qini / TOC / c-for-benefit / the DR pseudo-outcome used to accept numeric outcomes ' +
          'only and raised an error on <code>Surv</code>. All five functions now handle ' +
          '<strong>continuous, binary and survival</strong> outcomes; survival is reduced to the ' +
          'milestone indicator <code>I(T &gt; t0)</code> with censoring IPCW, so the effect scale ' +
          'matches the survival CATE reported by <code>metalearner()</code>.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>New <code>t0</code> / <code>X</code> / <code>effect</code> arguments on all five ' +
          'functions. <code>t0</code> defaults to the median event time; <code>effect</code> takes ' +
          '<code>"survdiff"</code> (default, S(t0) difference) or <code>"rmst"</code>.</li>' +
          '<li><code>dr_pseudo_outcome()</code> now supports survival outcomes too: default base ' +
          'learner <code>"coxph"</code>, returns the pseudo-outcome plus <code>t0</code> and ' +
          '<code>effect</code>.</li>' +
          '<li><code>.surv_ipcw()</code> gained an <code>at</code> argument and a marginal ' +
          'Kaplan–Meier branch for <code>X = NULL</code>, so censoring weights serve both the ' +
          'engine and the metrics.</li>' +
          '<li>Tutorial script <code>12_三类结局评价指标.R</code>: three outcomes x three ' +
          'rankings, averaged over 8 replicates.</li>' +
          '</ul>' +
          '<h3>Measured: why censoring correction is mandatory for survival</h3>' +
          '<ul>' +
          '<li>True ATE 0.1514: complete-case IPCW gives 0.1424 (bias −0.009), while ' +
          'no correction (<code>w = 1</code>) gives only 0.1127 (bias −0.039, about a quarter ' +
          'too low).</li>' +
          '<li><code>toc_curve()</code> now divides by <code>cumsum(w)</code> instead of ' +
          '<code>k</code>, so censored subjects with zero weight no longer dilute the average.</li>' +
          '<li>Known limitation: <code>effect = "rmst"</code> under-estimates under heavy censoring ' +
          '(weights are capped at 100; measured 0.043 vs a true 0.184 at 58% censoring). ' +
          'Prefer the default <code>survdiff</code> when censoring is heavy.</li>' +
          '</ul>' +
          '<h3>New tutorial lesson: fit order decides whether a metric is trustworthy</h3>' +
          '<p>Fitting on the full sample and then carving out a holdout leaks <code>Y</code> into ' +
          'the CATE. Binary outcomes make it brutal (observed benefit is ' +
          '<code>Y<sub>treated</sub> − Y<sub>control</sub></code>): c-for-benefit jumps from 0.558 ' +
          'to <strong>0.891</strong>, beating the oracle\'s 0.605, even though its correlation ' +
          'with the true <em>τ</em> is <em>worse</em> (0.542 &lt; 0.655). ' +
          '<strong>Split first, fit second.</strong></p>'
      },

      {
        id: "v010",
        heading: "v0.1.0 · 2026-10-20",
        body:
          '<div class="callout ok"><div class="callout-title">First complete release</div>' +
          '<p>The S, T, X, R and DR meta-learners covering continuous, binary and survival ' +
          'outcomes, for both randomized trials and observational studies. 119 tests passing, ' +
          'shipped with a bilingual (CN/EN) tutorial site.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Survival branch is now <strong>completely free of mlr3proba</strong>: base learners ' +
          'are native <code>"coxph"</code> / <code>"ranger"</code>. Passing <code>lrn("surv.*")</code> ' +
          'raises an explicit, helpful error.</li>' +
          '<li>Observational demo data for binary and survival outcomes: ' +
          '<code>mlr3HTE_demo_obs_binary()</code> and <code>mlr3HTE_demo_obs_surv()</code>, ' +
          'completing the six-cell matrix.</li>' +
          '<li>New exported <code>ml_task()</code> for uniform Task encoding across outcome types.</li>' +
          '<li>Tutorial: <code>tutorial/00_教程.md</code> plus 8 runnable scripts.</li>' +
          '<li>This bilingual documentation site (global search / CN-EN switch / light-dark theme).</li>' +
          '</ul>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li><strong>The <code>ifelse</code> trap in <code>.surv_at_t0()</code></strong>: ' +
          '<code>idx</code> is a scalar and <code>ifelse</code> shapes its result after ' +
          '<code>test</code>, so every observation received the same predicted value. The ranger ' +
          'survival branch ended up with zero CATE variance and an ATE of the wrong sign ' +
          '(−0.119 vs a true +0.152). Replaced with a plain branch plus whole-column indexing.</li>' +
          '<li>A classif learner\'s <code>predict_type = "prob"</code> must be set <strong>before</strong> ' +
          '<code>$train()</code>, otherwise <code>$prob</code> is NULL; changing it afterwards ' +
          'triggers an assertion error.</li>' +
          '<li><code>mlr3HTE_demo_surv()</code> used <code>A</code> before it was defined.</li>' +
          '</ul>' +
          '<h3>Changed</h3>' +
          '<ul>' +
          '<li><code>learner_tau</code> no longer reuses <code>learner_base</code>: stage 2 regresses ' +
          'a pseudo-outcome, and ranger\'s default <code>min.node.size = 5</code> overfits the noise ' +
          '(CATE correlation dropped from 0.9 to 0.2). It now builds ' +
          '<code>regr.ranger(num.trees = 500, min.node.size = 50)</code> by default.</li>' +
          '</ul>'
      },

      {
        id: "v001",
        heading: "v0.0.1 · 2026-10-18 (initial scaffold)",
        body:
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Engine scaffold: outcome-model abstraction plus the five meta-learner formulas.</li>' +
          '<li>End-to-end path for continuous outcomes in RCTs; both the functional API and the ' +
          'R6 Learner.</li>' +
          '<li><code>resample()</code> / <code>benchmark()</code> integration (a segfault here was ' +
          'fixed).</li>' +
          '</ul>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li>The <code>resample()</code> segfault was caused by ' +
          '<code>PredictionRegr$new(truth = NULL)</code> — measures run ' +
          '<code>assert_regr</code> on <code>prediction$truth</code>. Truth is now taken from the ' +
          'prediction task itself.</li>' +
          '<li>R6 hooks must be the <strong>private</strong> <code>.train</code> / ' +
          '<code>.predict</code>; overriding the public methods replaces ' +
          '<code>.__Learner__train</code> and leaves <code>state$train_task</code> unset.</li>' +
          '<li>data.table column-selection trap: <code>dt[, char_vec, drop = FALSE]</code> treats a ' +
          'character vector as row indices.</li>' +
          '</ul>'
      },

      {
        id: "planned",
        heading: "Planned",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Item</th><th>Note</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Full <code>R CMD check</code></td><td>No Rtools on the dev machine for compiled checks; the pure-R part can be run first</td></tr>' +
          '<tr><td>roxygen2 <code>man/</code> pages</td><td>Currently only NAMESPACE exists — no .Rd help files yet</td></tr>' +
          '<tr><td>Cross-fitting for R / DR</td><td>Pseudo-outcomes should be fit K-fold out-of-fold to reduce overfitting bias</td></tr>' +
          '<tr><td>RMST option for survival</td><td>Restricted mean survival time difference, as an alternative effect measure</td></tr>' +
          '<tr><td>Uncertainty quantification</td><td>Only point estimates so far — no confidence intervals</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "compat",
        heading: "Environment & compatibility",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Item</th><th>Requirement / current state</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>R</td><td>4.5.1 (dev machine)</td></tr>' +
          '<tr><td>mlr3</td><td>1.8.0</td></tr>' +
          '<tr><td>paradox</td><td>1.0.1 (note: 1.0 uses <code>p_fct</code>/<code>p_uty</code>; there is no exported <code>ParamFct</code>)</td></tr>' +
          '<tr><td>mlr3proba</td><td><strong>Not needed</strong> — removed from dependencies and code paths</td></tr>' +
          '<tr><td>mlr3tuning</td><td>Optional (tuning demo not included)</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">mlr3 1.8 limitation</div>' +
          '<p>This version has no case-weights API on Task / Learner, so all weights are applied ' +
          'via <strong>importance resampling</strong>, which injects Monte-Carlo noise. Call ' +
          '<code>set.seed()</code> when you need reproducible results.</p></div>'
      }
    ]
  }
};
