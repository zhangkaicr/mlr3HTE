/* =====================================================================
   content-changelog.js —— 更新日志（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.changelog = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "更新日志",
    lede: "mlr3HTE 的版本历史与重要变更。当前版本 v0.24。",
    sections: [



      {
        id: "v024",
        heading: "v0.24 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">GitHub README 中英双语 + 顶部一键切换</div>' +
          '<p>仓库首页改为中英双语：新增 <code>README_EN.md</code>（完整英文版），' +
          '<code>README.md</code>（中文）顶部都加了语言切换按钮，一键跳到另一语言。' +
          '两份 README 内容对齐（安装 / 函数式 API / R6 Learner / 方法学要点 / 文件结构 / ' +
          '依赖与运行环境 / 版本号规则），均指向双语文档站。</p></div>'
      },

      {
        id: "v023",
        heading: "v0.23 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">补生成 man/ 文档</div>' +
          '<p>重新运行 <code>roxygen2::roxygenise()</code>，让 <code>man/metalearner.Rd</code> 与 ' +
          '<code>man/LearnerRegrMetalearner.Rd</code> 同步到 0.22 新增的 roxygen 注释：' +
          '<code>learner_base</code> / <code>learner_tau</code> 现在支持按角色命名的 list' +
          '（T 两组、X 各阶段分别指定）。此前 0.22 只改了源码注释、漏跑 roxygenise，' +
          '导致 <code>man/</code> 落后一个批次。</p></div>'
      },

      {
        id: "v022",
        heading: "v0.22 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">学习器可按分组 / 阶段单独指定</div>' +
          '<p>除了「整包换一个基学习器」，现在还能为每个分组、每个阶段分别选算法：' +
          'T-Learner 用 <code>list(treated = ..., control = ...)</code> 让两组各用一套；' +
          'X-Learner 用 <code>list(m1 = ..., m0 = ...)</code> 指定两个结局模型，' +
          '用 <code>list(tau1 = ..., tau0 = ...)</code> 指定两个效应回归。' +
          '单 learner 仍是默认（全部共用），完全向后兼容；S / R / DR 与 ' +
          '<code>survlearners</code> 引擎传命名 list 会明确报错。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>教程脚本 13 补回 <code>kknn</code>（此前本机未装、临时换成 rpart），' +
          '六类基学习器 ranger / xgboost / glmnet / rpart / kknn / lm 全部回归，' +
          '并新增一节演示「每个分组 / 阶段单独换算法」。</li>' +
          '<li>新增 <code>tests/testthat/test-learners-flexible.R</code>（7 个 ' +
          '<code>test_that</code>）：覆盖 T 两组不同、X 各阶段不同、缺角色 / 未知角色 / ' +
          'S·R·DR 拒绝 list / 生存按组字符串 / R6 透传。</li>' +
          '</ul>' +
          '<h3>测试</h3>' +
          '<ul>' +
          '<li>全量测试 <strong>FAIL 0 | WARN 2 | SKIP 0 | PASS 314</strong>。</li>' +
          '</ul>'
      },

      {
        id: "v021",
        heading: "v0.21 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">版本号改为两位小数递增，每次推送 +0.01</div>' +
          '<p>版本号不再用三段式，改成两位小数的批次计数：<code>0.20</code> → <code>0.21</code> → ' +
          '<code>0.22</code> …，每推送一次更新加 0.01。历史批次按规则折算（<code>0.1.0</code> → ' +
          '<code>0.10</code>、<code>0.2.0</code> → <code>0.20</code>）。</p></div>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li>站内版本号此前一直停在 <strong>v0.1.0</strong>：<code>SITE_META</code> 没跟着 ' +
          '<code>DESCRIPTION</code> 更新，页脚和更新日志页头都在报旧版本。现在统一为 v0.21。</li>' +
          '<li>新增 <code>tests/testthat/test-version.R</code>：断言 <code>DESCRIPTION</code> 的 ' +
          '<code>Version:</code> 与站内 <code>SITE_META.version</code> 一致（<code>docs/</code> ' +
          '不存在时跳过，不影响 <code>R CMD check</code>）。</li>' +
          '</ul>' +
          '<h3>工程</h3>' +
          '<ul>' +
          '<li>新增 <code>dev/bump_version.R</code>：<code>Rscript dev/bump_version.R 0.22</code> ' +
          '一条命令写好 <code>DESCRIPTION</code> 与 <code>SITE_META</code>，并列出仍在引用旧版本号的文件。</li>' +
          '</ul>' +
          '<h3>订正</h3>' +
          '<ul>' +
          '<li>文档里的「288 个用例 / 55 个文件」与实测不符（<code>tests/testthat/</code> 下只有 8 个文件）。' +
          '改为可复核的口径：<strong>8 个测试文件 / 58 个 <code>test_that</code> 块 / 293 个期望，全部通过</strong>。</li>' +
          '</ul>'
      },

      {
        id: "v020",
        heading: "v0.20 · 2026-10-21",
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
          '尽管它与真 <em>τ</em> 的相关反而更低（0.542 &lt; 0.655）。<strong>先切分、后拟合。</strong></p>' +
          '<h3>文档站</h3>' +
          '<ul>' +
          '<li>新增独立的 <a href="#/references">参考文献</a> 页（博士论文式：按主题分节、' +
          '全局连续编号、每条注明在本包中的用途与引用位置），' +
          '收录 meta-learner 五族、HTE 评价指标、生存删失、因果基础等全部出处。' +
          '中文 18 条、英文 18 条，中英两版同步。</li>' +
          '<li>新增教程脚本 <code>13_换基学习器_基准对比.R</code> 与教程页「换基学习器：mlr3 生态随便挑」小节' +
          '（中英）：演示用 mlr3 体系换基学习器只需改 <code>learner_base = lrn("regr.xxx")</code> 一行，' +
          '并复用 <code>benchmark()</code> 横向对比；README 顶部也加了一段「为什么基于 mlr3：基学习器想换就换」callout。</li>' +
          '<li>新增独立的 <a href="#/environment">运行环境与依赖版本</a> 页（中英），列出完整测试环境' +
          '（R 4.5.1 / Windows 11 / 288 用例 / ubuntu-latest CI）与全部依赖版本——直接依赖、建议依赖、' +
          '关键传递依赖及 <strong>完整 89 个递归依赖清单</strong>；README §6 与教程主文档同步补齐。</li>' +
          '</ul>'
      },

      {
        id: "v010",
        heading: "v0.10 · 2026-10-20",
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
        heading: "v0.01 · 2026-10-18（初始骨架）",
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
    lede: "Version history and notable changes for mlr3HTE. Current version: v0.24.",
    sections: [



      {
        id: "v024",
        heading: "v0.24 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">GitHub README bilingual (CN/EN) + one-click top switch</div>' +
          '<p>The repo landing page is now bilingual: a new <code>README_EN.md</code> (full English) ' +
          'plus <code>README.md</code> (Chinese), each with a language-switch button at the top that ' +
          'jumps to the other language. Both READMEs are kept in sync (install / functional API / ' +
          'R6 Learner / methodology / files / dependencies / version rule) and link to the bilingual docs site.</p></div>'
      },

      {
        id: "v023",
        heading: "v0.23 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Regenerate man/ docs</div>' +
          '<p>Re-ran <code>roxygen2::roxygenise()</code> so <code>man/metalearner.Rd</code> and ' +
          '<code>man/LearnerRegrMetalearner.Rd</code> catch up with the 0.22 roxygen comments: ' +
          '<code>learner_base</code> / <code>learner_tau</code> now accept a named list per role ' +
          '(separate learner for each T-Learner arm, each X-Learner stage). The 0.22 batch edited ' +
          'the source comments but skipped roxygenise, leaving <code>man/</code> one batch behind.</p></div>'
      },

      {
        id: "v022",
        heading: "v0.22 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">Learners can now be specified per group / per stage</div>' +
          '<p>Beyond swapping one base learner for the whole recipe, you can now pick a different ' +
          'algorithm for each group and each stage: T-Learner takes ' +
          '<code>list(treated = ..., control = ...)</code> for the two arms; X-Learner takes ' +
          '<code>list(m1 = ..., m0 = ...)</code> for the two outcome models and ' +
          '<code>list(tau1 = ..., tau0 = ...)</code> for the two effect regressions. ' +
          'A single learner is still the default (shared everywhere) and remains fully backward ' +
          'compatible; S / R / DR and <code>survlearners</code> reject a named list with a clear error.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Tutorial script 13 brings back <code>kknn</code> (it was unavailable locally and ' +
          'temporarily swapped for rpart): all six base learners ranger / xgboost / glmnet / rpart / ' +
          'kknn / lm are restored, with a new section demonstrating per-group / per-stage swapping.</li>' +
          '<li>New <code>tests/testthat/test-learners-flexible.R</code> (7 <code>test_that</code> blocks): ' +
          'T with distinct arms, X with distinct stages, missing / unknown role, S·R·DR rejecting the ' +
          'list, survival per-group strings, and R6 pass-through.</li>' +
          '</ul>' +
          '<h3>Tests</h3>' +
          '<ul>' +
          '<li>Full suite: <strong>FAIL 0 | WARN 2 | SKIP 0 | PASS 314</strong>.</li>' +
          '</ul>'
      },

      {
        id: "v021",
        heading: "v0.21 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">Version now increments by 0.01 on every push</div>' +
          '<p>The version is no longer three-part: it is a two-decimal batch counter, ' +
          '<code>0.20</code> → <code>0.21</code> → <code>0.22</code> …, with a +0.01 bump on every ' +
          'pushed update. Earlier batches were renumbered accordingly (<code>0.1.0</code> → ' +
          '<code>0.10</code>, <code>0.2.0</code> → <code>0.20</code>).</p></div>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li>The site version had been stuck at <strong>v0.1.0</strong>: <code>SITE_META</code> was ' +
          'never updated alongside <code>DESCRIPTION</code>, so the footer and the changelog header ' +
          'both advertised a stale version. Both now read v0.21.</li>' +
          '<li>New <code>tests/testthat/test-version.R</code>: asserts that ' +
          '<code>DESCRIPTION</code>\'s <code>Version:</code> matches <code>SITE_META.version</code> ' +
          '(skipped when <code>docs/</code> is absent, so <code>R CMD check</code> is unaffected).</li>' +
          '</ul>' +
          '<h3>Engineering</h3>' +
          '<ul>' +
          '<li>New <code>dev/bump_version.R</code>: <code>Rscript dev/bump_version.R 0.22</code> writes ' +
          'both <code>DESCRIPTION</code> and <code>SITE_META</code> and lists any file still referencing ' +
          'the old version.</li>' +
          '</ul>' +
          '<h3>Correction</h3>' +
          '<ul>' +
          '<li>The docs claimed 288 cases / 55 files, which did not match the repo ' +
          '(<code>tests/testthat/</code> holds only 8 files). Restated in a checkable form: ' +
          '<strong>8 test files / 58 <code>test_that</code> blocks / 293 expectations, all passing</strong>.</li>' +
          '</ul>'
      },

      {
        id: "v020",
        heading: "v0.20 · 2026-10-21",
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
          '<strong>Split first, fit second.</strong></p>' +
          '<h3>Docs site</h3>' +
          '<ul>' +
          '<li>New standalone <a href="#/references">References</a> page (thesis-style: ' +
          'sectioned, globally numbered, each entry annotated with its use in this package), ' +
          'covering meta-learner families, HTE metrics, survival censoring and causal foundations. ' +
          '18 entries per language, synced across zh and en.</li>' +
          '<li>New tutorial script <code>13_换基学习器_基准对比.R</code> and the tutorial section ' +
          '"Swap the base learner: pick any algorithm in the mlr3 ecosystem" (zh + en): ' +
          'swapping the base learner in the mlr3 system is a one-line <code>learner_base = lrn("regr.xxx")</code> change, ' +
          'and <code>benchmark()</code> reuses the workflow directly. The README top also gained a ' +
          '"why mlr3: swap the base learner freely" callout.</li>' +
          '<li>New standalone <a href="#/environment">Environment &amp; dependency versions</a> page (zh + en) ' +
          'listing the full testing environment (R 4.5.1 / Windows 11 / 288 cases / ubuntu-latest CI) and every ' +
          'dependency version — direct, suggested, key transitive, and the <strong>full 89-package recursive list</strong>; ' +
          'README §6 and the tutorial main doc were updated to match.</li>' +
          '</ul>'
      },

      {
        id: "v010",
        heading: "v0.10 · 2026-10-20",
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
        heading: "v0.01 · 2026-10-18 (initial scaffold)",
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
