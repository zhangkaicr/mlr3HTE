/* =====================================================================
   content-api.js —— 全部导出函数的文档（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.api = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "函数文档",
    lede: "mlr3HTE 共导出 14 个对象：1 个主拟合函数、5 个便捷封装、1 个 R6 Learner 类、" +
          "1 个 Task 编码函数、6 个演示数据集生成器。",
    sections: [

      {
        id: "overview",
        heading: "函数总览",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>函数</th><th>类别</th><th>一句话说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/api/metalearner"><code>metalearner()</code></a></td><td>主拟合</td><td>拟合任意 metalearner，返回可预测对象</td></tr>' +
          '<tr><td><a href="#/api/shortcuts"><code>s_learner()</code> … <code>dr_learner()</code></a></td><td>便捷封装</td><td>直接返回训练集 CATE 向量</td></tr>' +
          '<tr><td><a href="#/api/ml_task"><code>ml_task()</code></a></td><td>Task 编码</td><td>把 X/A/Y 编码成 mlr3 Task（三类结局统一）</td></tr>' +
          '<tr><td><a href="#/api/learner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code>，接入 mlr3 工作流</td></tr>' +
          '<tr><td><a href="#/api/demo"><code>mlr3HTE_demo_*()</code></a></td><td>演示数据</td><td>6 个带真值的模拟数据集</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "metalearner",
        heading: "metalearner()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">metalearner()<span class="badge">主入口</span></div>' +
          '<div class="fn-sig">metalearner(type, X, A, Y,\n' +
          '            learner_base = lrn("regr.ranger"),\n' +
          '            learner_tau  = NULL,\n' +
          '            learner_ps   = NULL,\n' +
          '            weighting    = "none",\n' +
          '            weights      = NULL,\n' +
          '            stabilize    = FALSE,\n' +
          '            t0           = NULL,\n' +
          '            outcome      = "auto")</div>' +
          '<div class="table-wrap"><table class="fn-args">' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>type</code></td><td><code>"S"</code> / <code>"T"</code> / <code>"X"</code> / <code>"R"</code> / <code>"DR"</code></td></tr>' +
          '<tr><td><code>X</code></td><td>协变量 data.frame（不含处理与结局）</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：数值 / 0-1 或两水平因子 / <code>Surv</code> 对象</td></tr>' +
          '<tr><td><code>learner_base</code></td><td>结局模型基学习器。连续 → <code>regr.*</code>；二分类 → <code>classif.*</code>；生存 → <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>效应阶段回归学习器（X/R/DR 用）。<code>NULL</code> 时引擎建 <code>regr.ranger(min.node.size = 50)</code></td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>倾向得分学习器；<code>weighting="iptw"</code> 时默认 <code>classif.log_reg</code></td></tr>' +
          '<tr><td><code>weighting</code></td><td><code>"none"</code>（RCT）/ <code>"iptw"</code> / <code>"external"</code></td></tr>' +
          '<tr><td><code>weights</code></td><td><code>weighting="external"</code> 时的权重向量（必填）</td></tr>' +
          '<tr><td><code>stabilize</code></td><td>IPTW 是否用稳定化权重（默认 <code>FALSE</code>）</td></tr>' +
          '<tr><td><code>t0</code></td><td>生存结局的效应评估时点；<code>NULL</code> 时取事件时间中位数</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>返回</strong>：list，含 <code>$predict(newX)</code>、<code>$ate</code>、' +
          '<code>$cate_train</code>、<code>$type</code>、<code>$outcome</code>、<code>$weighting</code>、<code>$t0</code>。</p>' +
          '<pre><code>fit <- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      },

      {
        id: "shortcuts",
        heading: "s_learner() / t_learner() / x_learner() / r_learner() / dr_learner()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">s_learner()<span class="badge grey">以及 t_ / x_ / r_ / dr_</span></div>' +
          '<div class="fn-sig">s_learner(X, A, Y, learner_base = lrn("regr.ranger"), ...)</div>' +
          '<p>与课程脚本同款签名，直接返回<strong>训练集上的 CATE 向量</strong>（不是拟合对象）。' +
          '其余参数通过 <code>...</code> 原样传给 <code>metalearner()</code>。</p>' +
          '<pre><code>tau_S  <- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR <- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
          '</div>'
      },

      {
        id: "ml_task",
        heading: "ml_task()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">ml_task()<span class="badge">R6 Learner 配套</span></div>' +
          '<div class="fn-sig">ml_task(X, A, Y, t0 = NULL, id = "ml_hte", treatment_col = "A")</div>' +
          '<p>把原始数据编码成可直接喂给 <code>lrn("regr.metalearner")</code> 的 mlr3 Task。' +
          '因为 mlr3 的 Task 目标列装不下 <code>Surv</code> 对象，约定如下：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局</th><th>目标列 <code>.outcome</code></th><th>附带列</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>连续 / 二分类</td><td><code>Y</code>（二分类取 0/1）</td><td>—</td></tr>' +
          '<tr><td>生存</td><td>随访时间</td><td><code>.status</code> = 事件指示</td></tr>' +
          '</tbody></table></div>' +
          '<p>结局类型、状态列名、<code>t0</code>、处理列名都记在 <code>task$extra_args</code>——' +
          '该字段在 <code>clone(deep=TRUE)$filter()</code> 与序列化后都保留，' +
          '所以重抽样分折时元数据不丢。</p>' +
          '<pre><code>task <- ml_task(X, A, Y)                    # 连续 / 二分类\n' +
          'task <- ml_task(X, A, Surv(time, status), t0 = 2)   # 生存\n' +
          'task <- ml_task(X, A, Y, treatment_col = "trt")     # 自定义处理列名\n\n' +
          'task$extra_args</code></pre>' +
          '</div>'
      },

      {
        id: "learner",
        heading: "LearnerRegrMetalearner（R6 Learner）",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn("regr.metalearner")<span class="badge">mlr3 工作流</span></div>' +
          '<div class="fn-sig">lrn("regr.metalearner", id = NULL,\n' +
          '    metalearner = "T",      # 可调参数\n' +
          '    weighting   = "none")   # 可调参数</div>' +
          '<p>CATE 是连续量，所以只有<strong>一个</strong> Learner 类，三类结局通用' +
          '（结局类型由 <code>ml_task()</code> 写进 <code>extra_args</code>）。</p>' +
          '<h4>可调参数（可进 <code>tune()</code>）</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>取值</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>metalearner</code></td><td>S / T / X / R / DR</td></tr>' +
          '<tr><td><code>weighting</code></td><td>none / iptw / external</td></tr>' +
          '</tbody></table></div>' +
          '<h4>可调字段（R6 public field，不是 param）</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>learner_base</code></td><td>结局模型基学习器</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>效应阶段回归学习器</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>倾向得分学习器</td></tr>' +
          '<tr><td><code>treatment_col</code></td><td>处理列名，默认 <code>"A"</code></td></tr>' +
          '<tr><td><code>status_col</code></td><td>生存事件指示列名，默认 <code>".status"</code></td></tr>' +
          '<tr><td><code>t0</code></td><td>生存效应时点</td></tr>' +
          '<tr><td><code>stabilize</code></td><td>IPTW 是否用稳定化权重</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">为什么用字段而不是参数</div>' +
          '<p>paradox 1.0 的 <code>p_uty()</code> 只能存函数或 NULL，<strong>存不下 Learner 对象</strong>，' +
          '所以基学习器只能作为 R6 字段暴露。</p></div>' +
          '<pre><code>library(mlr3)   # resample() / benchmark() / rsmp() 来自 mlr3\n' +
          'task <- ml_task(X, A, Y)\n' +
          'l    <- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base <- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n\n' +
          '# benchmark 里多个 learner 需要不同的 id\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '</div>'
      },

      {
        id: "demo",
        heading: "mlr3HTE_demo_*() 演示数据集",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>函数</th><th>结局</th><th>数据</th><th>随数据返回</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>mlr3HTE_demo_data(n, treat_frac, seed)</code></td><td>连续</td><td>RCT</td><td><code>tau</code>, <code>ate</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_binary(n, treat_frac, seed)</code></td><td>二分类</td><td>RCT</td><td><code>tau</code>, <code>ate</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_surv(n, treat_frac, t0, seed)</code></td><td>生存</td><td>RCT</td><td><code>tau</code>, <code>ate</code>, <code>t0</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs(n, seed)</code></td><td>连续</td><td>观察性</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs_binary(n, seed)</code></td><td>二分类</td><td>观察性</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs_surv(n, t0, seed)</code></td><td>生存</td><td>观察性</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '</tbody></table></div>' +
          '<p>每个数据集都返回真实的 <code>tau</code>（逐人 CATE 真值）与 <code>ate</code>，' +
          '观察性版本还返回真实倾向得分 <code>ps_true</code>。这是做对账最方便的地方。</p>' +
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# 对账\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y)\n' +
          'cor(fit$cate_train, d$tau)</code></pre>' +
          '<div class="callout"><div class="callout-title">观察性数据的混杂结构</div>' +
          '<p>三个 <code>*_obs_*</code> 数据集共用同一套混杂：' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>，即病情越重越容易接受处理。' +
          '所以未调整的差分必然有偏，正好用来演示 IPTW 的校正效果。</p></div>' +
          '</div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "API Reference",
    lede: "mlr3HTE exports 14 objects: one main fitting function, five shortcuts, one R6 " +
          "Learner class, one Task-encoding helper, and six demo data generators.",
    sections: [

      {
        id: "overview",
        heading: "Overview",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Category</th><th>One-line description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/api/metalearner"><code>metalearner()</code></a></td><td>Main entry</td><td>Fit any meta-learner and return a predictive object</td></tr>' +
          '<tr><td><a href="#/api/shortcuts"><code>s_learner()</code> … <code>dr_learner()</code></a></td><td>Shortcuts</td><td>Return the training-set CATE vector directly</td></tr>' +
          '<tr><td><a href="#/api/ml_task"><code>ml_task()</code></a></td><td>Task encoding</td><td>Encode X/A/Y into an mlr3 Task (uniform across outcome types)</td></tr>' +
          '<tr><td><a href="#/api/learner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code> for mlr3 workflows</td></tr>' +
          '<tr><td><a href="#/api/demo"><code>mlr3HTE_demo_*()</code></a></td><td>Demo data</td><td>Six simulated datasets with known ground truth</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "metalearner",
        heading: "metalearner()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">metalearner()<span class="badge">Main entry</span></div>' +
          '<div class="fn-sig">metalearner(type, X, A, Y,\n' +
          '            learner_base = lrn("regr.ranger"),\n' +
          '            learner_tau  = NULL,\n' +
          '            learner_ps   = NULL,\n' +
          '            weighting    = "none",\n' +
          '            weights      = NULL,\n' +
          '            stabilize    = FALSE,\n' +
          '            t0           = NULL,\n' +
          '            outcome      = "auto")</div>' +
          '<div class="table-wrap"><table class="fn-args">' +
          '<thead><tr><th>Argument</th><th>Description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>type</code></td><td><code>"S"</code> / <code>"T"</code> / <code>"X"</code> / <code>"R"</code> / <code>"DR"</code></td></tr>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame (without treatment and outcome)</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: numeric / 0–1 or two-level factor / <code>Surv</code> object</td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Outcome-model base learner. Continuous → <code>regr.*</code>; binary → <code>classif.*</code>; survival → <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>Stage-2 regression learner (for X/R/DR). <code>NULL</code> builds <code>regr.ranger(min.node.size = 50)</code></td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>Propensity-score learner; defaults to <code>classif.log_reg</code> when <code>weighting="iptw"</code></td></tr>' +
          '<tr><td><code>weighting</code></td><td><code>"none"</code> (RCT) / <code>"iptw"</code> / <code>"external"</code></td></tr>' +
          '<tr><td><code>weights</code></td><td>Weight vector, required when <code>weighting="external"</code></td></tr>' +
          '<tr><td><code>stabilize</code></td><td>Use stabilised IPTW weights (default <code>FALSE</code>)</td></tr>' +
          '<tr><td><code>t0</code></td><td>Horizon for survival effects; <code>NULL</code> uses the median event time</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>Returns</strong> a list with <code>$predict(newX)</code>, <code>$ate</code>, ' +
          '<code>$cate_train</code>, <code>$type</code>, <code>$outcome</code>, ' +
          '<code>$weighting</code> and <code>$t0</code>.</p>' +
          '<pre><code>fit <- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      },

      {
        id: "shortcuts",
        heading: "s_learner() / t_learner() / x_learner() / r_learner() / dr_learner()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">s_learner()<span class="badge grey">and t_ / x_ / r_ / dr_</span></div>' +
          '<div class="fn-sig">s_learner(X, A, Y, learner_base = lrn("regr.ranger"), ...)</div>' +
          '<p>Same signature as the teaching scripts; returns the <strong>CATE vector on the ' +
          'training set</strong> (not a fitted object). All other arguments are forwarded to ' +
          '<code>metalearner()</code> via <code>...</code>.</p>' +
          '<pre><code>tau_S  <- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR <- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
          '</div>'
      },

      {
        id: "ml_task",
        heading: "ml_task()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">ml_task()<span class="badge">Companion to the R6 Learner</span></div>' +
          '<div class="fn-sig">ml_task(X, A, Y, t0 = NULL, id = "ml_hte", treatment_col = "A")</div>' +
          '<p>Encodes raw data into an mlr3 Task that <code>lrn("regr.metalearner")</code> can ' +
          'consume. Because an mlr3 Task target column cannot hold a <code>Surv</code> object:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th>Target column <code>.outcome</code></th><th>Extra column</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Continuous / binary</td><td><code>Y</code> (0/1 for binary)</td><td>—</td></tr>' +
          '<tr><td>Survival</td><td>follow-up time</td><td><code>.status</code> = event indicator</td></tr>' +
          '</tbody></table></div>' +
          '<p>Outcome type, status column name, <code>t0</code> and treatment column name are stored ' +
          'in <code>task$extra_args</code>, which survives ' +
          '<code>clone(deep=TRUE)$filter()</code> and serialisation — so metadata is never lost ' +
          'when resampling splits folds.</p>' +
          '<pre><code>task <- ml_task(X, A, Y)                              # continuous / binary\n' +
          'task <- ml_task(X, A, Surv(time, status), t0 = 2)     # survival\n' +
          'task <- ml_task(X, A, Y, treatment_col = "trt")       # custom treatment column\n\n' +
          'task$extra_args</code></pre>' +
          '</div>'
      },

      {
        id: "learner",
        heading: "LearnerRegrMetalearner (R6 Learner)",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn("regr.metalearner")<span class="badge">mlr3 workflows</span></div>' +
          '<div class="fn-sig">lrn("regr.metalearner", id = NULL,\n' +
          '    metalearner = "T",      # tunable\n' +
          '    weighting   = "none")   # tunable</div>' +
          '<p>CATE is a continuous quantity, so there is only <strong>one</strong> Learner class, ' +
          'shared by all three outcome types (the outcome type comes from ' +
          '<code>ml_task()</code> via <code>extra_args</code>).</p>' +
          '<h4>Tunable params (usable in <code>tune()</code>)</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Param</th><th>Values</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>metalearner</code></td><td>S / T / X / R / DR</td></tr>' +
          '<tr><td><code>weighting</code></td><td>none / iptw / external</td></tr>' +
          '</tbody></table></div>' +
          '<h4>Public fields (not params)</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>learner_base</code></td><td>Outcome-model base learner</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>Stage-2 regression learner</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>Propensity-score learner</td></tr>' +
          '<tr><td><code>treatment_col</code></td><td>Treatment column name, default <code>"A"</code></td></tr>' +
          '<tr><td><code>status_col</code></td><td>Survival event column name, default <code>".status"</code></td></tr>' +
          '<tr><td><code>t0</code></td><td>Survival effect horizon</td></tr>' +
          '<tr><td><code>stabilize</code></td><td>Use stabilised IPTW weights</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Why fields instead of params</div>' +
          '<p>paradox 1.0\'s <code>p_uty()</code> only accepts functions or NULL — it ' +
          '<strong>cannot hold a Learner object</strong>, so base learners must be exposed as R6 ' +
          'fields.</p></div>' +
          '<pre><code>library(mlr3)   # resample() / benchmark() / rsmp() 来自 mlr3\n' +
          'task <- ml_task(X, A, Y)\n' +
          'l    <- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base <- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n\n' +
          '# benchmark needs distinct ids per learner\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '</div>'
      },

      {
        id: "demo",
        heading: "mlr3HTE_demo_*() datasets",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Outcome</th><th>Setting</th><th>Returns</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>mlr3HTE_demo_data(n, treat_frac, seed)</code></td><td>Continuous</td><td>RCT</td><td><code>tau</code>, <code>ate</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_binary(n, treat_frac, seed)</code></td><td>Binary</td><td>RCT</td><td><code>tau</code>, <code>ate</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_surv(n, treat_frac, t0, seed)</code></td><td>Survival</td><td>RCT</td><td><code>tau</code>, <code>ate</code>, <code>t0</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs(n, seed)</code></td><td>Continuous</td><td>Observational</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs_binary(n, seed)</code></td><td>Binary</td><td>Observational</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '<tr><td><code>mlr3HTE_demo_obs_surv(n, t0, seed)</code></td><td>Survival</td><td>Observational</td><td><code>tau</code>, <code>ate</code>, <code>ps_true</code></td></tr>' +
          '</tbody></table></div>' +
          '<p>Every dataset returns the true per-unit <code>tau</code> and the true <code>ate</code>; ' +
          'the observational ones also return the true propensity score <code>ps_true</code>. ' +
          'That is what makes reconciliation straightforward.</p>' +
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# Reconcile\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y)\n' +
          'cor(fit$cate_train, d$tau)</code></pre>' +
          '<div class="callout"><div class="callout-title">Confounding in the observational datasets</div>' +
          '<p>All three <code>*_obs_*</code> datasets share the same confounding mechanism: ' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code> — sicker patients are more likely to be ' +
          'treated. The crude difference is therefore biased by construction, which is exactly what ' +
          'IPTW is meant to fix.</p></div>' +
          '</div>'
      }
    ]
  }
};
