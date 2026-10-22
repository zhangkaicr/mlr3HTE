/* =====================================================================
   content-api.js —— 函数文档（中英双语）
   结构：SITE_PAGES.api = 索引页（总览表，链接到各独立函数页）；
   其余 SITE_PAGES.apixxx = 每个函数分组的独立详情页，均用手写 .fn 模板。
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

/* ===================== 索引页 ===================== */
window.SITE_PAGES.api = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "函数文档",
    lede: "mlr3HTE 共导出 25 个对象：1 个主拟合函数、5 个便捷封装、1 个置信区间辅助、1 个 R6 " +
          "Learner 类、1 个 Task 编码函数、6 个演示数据集生成器、1 个 DAG 辅助、1 个 mlr3 再导出、" +
          "4 个 HTE 评价指标、1 个观察性数据干扰参数估计、1 个曲线绘图函数，以及 2 个 RCT 基准测试函数。点函数名进入各自的详细说明页。",
    sections: [

      {
        id: "overview",
        heading: "函数总览",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>函数</th><th>类别</th><th>一句话说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>主拟合</td><td>拟合任意 metalearner，返回可预测对象</td></tr>' +
          '<tr><td><a href="#/apishortcuts"><code>s_learner()</code> … <code>dr_learner()</code></a></td><td>便捷封装</td><td>直接返回训练集 CATE 向量</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task 编码</td><td>把 X/A/Y 编码成 mlr3 Task（三类结局统一）</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code>，接入 mlr3 工作流</td></tr>' +
          '<tr><td><a href="#/apidemo"><code>mlr3HTE_demo_*()</code></a></td><td>演示数据</td><td>6 个带真值的模拟数据集</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>qini_curve()</code> 等 5 个</a></td><td>HTE 评价</td><td>Qini 曲线 / 系数、c-for-benefit、TOC 曲线</td></tr>' +
          '<tr><td><a href="#/apibenchmark"><code>hte_benchmark()</code> / <code>plot_hte_benchmark()</code></a></td><td>基准测试</td><td>RCT 数据上用 Qini / TOC / c-for-benefit 比较多个 learner，不依赖真实 tau</td></tr>' +
          '<tr><td><a href="#/apihelpers"><code>cate_ci()</code> / <code>plot_qini()</code> / <code>mlr3HTE_dag()</code></a></td><td>辅助</td><td>CATE 自助置信区间、Qini 曲线绘图、因果 DAG 绘制</td></tr>' +
          '<tr><td><code>lrn()</code></td><td>再导出</td><td>从 mlr3 再导出，免额外加载</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "API Reference",
    lede: "mlr3HTE exports 25 objects: one main fitting function, five shortcuts, one " +
          "confidence-interval helper, one R6 Learner class, one Task-encoding helper, six " +
          "demo data generators, one DAG helper, one mlr3 re-export, four HTE evaluation " +
          "metrics, one nuisance-parameter estimator for observational data, and one " +
          "curve-plotting function. Click a function name to open its dedicated page.",
    sections: [

      {
        id: "overview",
        heading: "Overview",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Category</th><th>One-line description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>Main entry</td><td>Fit any meta-learner and return a predictive object</td></tr>' +
          '<tr><td><a href="#/apishortcuts"><code>s_learner()</code> … <code>dr_learner()</code></a></td><td>Shortcuts</td><td>Return the training-set CATE vector directly</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task encoding</td><td>Encode X/A/Y into an mlr3 Task (uniform across outcome types)</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code> for mlr3 workflows</td></tr>' +
          '<tr><td><a href="#/apidemo"><code>mlr3HTE_demo_*()</code></a></td><td>Demo data</td><td>Six simulated datasets with known ground truth</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>qini_curve()</code> &amp; 4 more</a></td><td>HTE evaluation</td><td>Qini curve / coefficient, c-for-benefit, TOC curve</td></tr>' +
          '<tr><td><a href="#/apihelpers"><code>cate_ci()</code> / <code>plot_qini()</code> / <code>mlr3HTE_dag()</code></a></td><td>Helpers</td><td>Bootstrap CI for CATE, Qini plotting, causal DAG drawing</td></tr>' +
          '<tr><td><code>lrn()</code></td><td>Re-export</td><td>Re-exported from mlr3 so you need not load it</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  }
};

/* ===================== metalearner() ===================== */
window.SITE_PAGES.apimetalearner = {
  zh: {
    title: "metalearner()",
    lede: "统一的 meta-learner 入口：用 metalearner = \"S\" / \"T\" / \"X\" / \"R\" / \"DR\" 切换五种配方，结局类型由传入的 data 自动判定。",
    sections: [
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
          '<tr><td><code>learner_base</code></td><td>结局模型基学习器。连续 → <code>regr.*</code>；二分类 → <code>classif.*</code>；生存 → <code>"coxph"</code> / <code>"ranger"</code>。也接受按角色命名的 list（见下）。</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>效应阶段回归学习器（X/R/DR 用）。<code>NULL</code> 时引擎建 <code>regr.ranger(min.node.size = 50)</code>；也接受命名 list。</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>倾向得分学习器；<code>weighting="iptw"</code> 时默认 <code>classif.log_reg</code></td></tr>' +
          '<tr><td><code>weighting</code></td><td><code>"none"</code>（RCT）/ <code>"iptw"</code> / <code>"external"</code></td></tr>' +
          '<tr><td><code>weights</code></td><td><code>weighting="external"</code> 时的权重向量（必填）</td></tr>' +
          '<tr><td><code>stabilize</code></td><td>IPTW 是否用稳定化权重（默认 <code>FALSE</code>）</td></tr>' +
          '<tr><td><code>t0</code></td><td>生存结局的效应评估时点；<code>NULL</code> 时取事件时间中位数</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<h4>按角色命名 list（v0.22+）</h4>' +
          '<p><code>learner_base</code> / <code>learner_tau</code> 既能传单个 mlr3 learner（所有分组 / 阶段共用），' +
          '也能传<strong>按角色命名的 list</strong>：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>写法</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>T-Learner</td><td><code>list(treated = ..., control = ...)</code>（两组各一套算法）</td></tr>' +
          '<tr><td>X-Learner 结局模型</td><td><code>list(m1 = ..., m0 = ...)</code></td></tr>' +
          '<tr><td>X-Learner 效应回归</td><td><code>list(tau1 = ..., tau0 = ...)</code></td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout"><div class="callout-title">护栏</div>' +
          '<p>S / R / DR 与 <code>engine = "survlearners"</code> 只接受单个 learner，传命名 list 会明确报错。</p></div>' +
          '<p><strong>返回</strong>：list，含 <code>$predict(newX)</code>、<code>$ate</code>、' +
          '<code>$cate_train</code>、<code>$type</code>、<code>$outcome</code>、<code>$weighting</code>、<code>$t0</code>。</p>' +
          '<pre><code>fit &lt;- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "metalearner()",
    lede: "The single meta-learner entry point: switch between the five recipes with metalearner = \"S\" / \"T\" / \"X\" / \"R\" / \"DR\"; the outcome type is inferred from the data you pass in.",
    sections: [
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
          '<tr><td><code>learner_base</code></td><td>Outcome-model base learner. Continuous → <code>regr.*</code>; binary → <code>classif.*</code>; survival → <code>"coxph"</code> / <code>"ranger"</code>. Also accepts a per-role named list (see below).</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>Stage-2 regression learner (for X/R/DR). <code>NULL</code> builds <code>regr.ranger(min.node.size = 50)</code>; also accepts a named list.</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>Propensity-score learner; defaults to <code>classif.log_reg</code> when <code>weighting="iptw"</code></td></tr>' +
          '<tr><td><code>weighting</code></td><td><code>"none"</code> (RCT) / <code>"iptw"</code> / <code>"external"</code></td></tr>' +
          '<tr><td><code>weights</code></td><td>Weight vector, required when <code>weighting="external"</code></td></tr>' +
          '<tr><td><code>stabilize</code></td><td>Use stabilised IPTW weights (default <code>FALSE</code>)</td></tr>' +
          '<tr><td><code>t0</code></td><td>Horizon for survival effects; <code>NULL</code> uses the median event time</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<h4>Per-role named list (v0.22+)</h4>' +
          '<p><code>learner_base</code> / <code>learner_tau</code> accept either a single mlr3 learner ' +
          '(shared by all groups / stages) or a <strong>per-role named list</strong>:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>Form</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>T-Learner</td><td><code>list(treated = ..., control = ...)</code> (separate algorithm per arm)</td></tr>' +
          '<tr><td>X-Learner outcome model</td><td><code>list(m1 = ..., m0 = ...)</code></td></tr>' +
          '<tr><td>X-Learner effect regression</td><td><code>list(tau1 = ..., tau0 = ...)</code></td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout"><div class="callout-title">Guardrail</div>' +
          '<p>S / R / DR and <code>engine = "survlearners"</code> accept only a single learner; passing a named list raises an explicit error.</p></div>' +
          '<p><strong>Returns</strong> a list with <code>$predict(newX)</code>, <code>$ate</code>, ' +
          '<code>$cate_train</code>, <code>$type</code>, <code>$outcome</code>, ' +
          '<code>$weighting</code> and <code>$t0</code>.</p>' +
          '<pre><code>fit &lt;- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== 便捷封装 ===================== */
window.SITE_PAGES.apishortcuts = {
  zh: {
    title: "s_learner() / t_learner() / x_learner() / r_learner() / dr_learner()",
    sections: [
      {
        id: "shortcuts",
        heading: "s_learner() / t_learner() / x_learner() / r_learner() / dr_learner()",
        body:
          '<div class="fn">' +
          '<div class="fn-name">s_learner()<span class="badge grey">以及 t_ / x_ / r_ / dr_</span></div>' +
          '<div class="fn-sig">s_learner(X, A, Y, learner_base = lrn("regr.ranger"), ...)</div>' +
          '<p>与课程脚本同款签名，直接返回<strong>训练集上的 CATE 向量</strong>（不是拟合对象）。' +
          '其余参数通过 <code>...</code> 原样传给 <code>metalearner()</code>。</p>' +
          '<pre><code>tau_S  &lt;- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR &lt;- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "s_learner() / t_learner() / x_learner() / r_learner() / dr_learner()",
    sections: [
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
          '<pre><code>tau_S  &lt;- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR &lt;- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== ml_task() ===================== */
window.SITE_PAGES.apimltask = {
  zh: {
    title: "ml_task()",
    lede: "把 X / A / Y 打包成带 HTE 元数据的 mlr3 Task，让 R6 Learner 能在 resample() 与 benchmark() 里正常取到处理、结局与 t0。",
    sections: [
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
          '<pre><code>task &lt;- ml_task(X, A, Y)                    # 连续 / 二分类\n' +
          'task &lt;- ml_task(X, A, Surv(time, status), t0 = 2)   # 生存\n' +
          'task &lt;- ml_task(X, A, Y, treatment_col = "trt")     # 自定义处理列名\n\n' +
          'task$extra_args</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "ml_task()",
    lede: "Wrap X / A / Y into an mlr3 Task that carries the HTE metadata, so the R6 Learner can still find the treatment, the outcome and t0 inside resample() and benchmark().",
    sections: [
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
          '<pre><code>task &lt;- ml_task(X, A, Y)                              # continuous / binary\n' +
          'task &lt;- ml_task(X, A, Surv(time, status), t0 = 2)     # survival\n' +
          'task &lt;- ml_task(X, A, Y, treatment_col = "trt")       # custom treatment column\n\n' +
          'task$extra_args</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== R6 Learner ===================== */
window.SITE_PAGES.apilearner = {
  zh: {
    title: "LearnerRegrMetalearner（R6 Learner）",
    lede: "mlr3 的 R6 学习器封装：把任意 meta-learner 接进 resample()、benchmark() 与超参数调优的标准工作流，与其他 mlr3 学习器同台比较。",
    sections: [
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
          '<tr><td><code>learner_base</code></td><td>结局模型基学习器（支持按角色命名 list）</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>效应阶段回归学习器（支持按角色命名 list）</td></tr>' +
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
          'task &lt;- ml_task(X, A, Y)\n' +
          'l    &lt;- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base &lt;- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n\n' +
          '# benchmark 里多个 learner 需要不同的 id\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "LearnerRegrMetalearner (R6 Learner)",
    lede: "The R6 mlr3 Learner wrapper: plug any meta-learner into the standard resample(), benchmark() and tuning workflow, and compare it head to head with other mlr3 learners.",
    sections: [
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
          '<tr><td><code>learner_base</code></td><td>Outcome-model base learner (per-role named list supported)</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>Stage-2 regression learner (per-role named list supported)</td></tr>' +
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
          'task &lt;- ml_task(X, A, Y)\n' +
          'l    &lt;- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base &lt;- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n\n' +
          '# benchmark needs distinct ids per learner\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== 演示数据集 ===================== */
window.SITE_PAGES.apidemo = {
  zh: {
    title: "mlr3HTE_demo_*() 演示数据集",
    sections: [
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
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# 对账\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y)\n' +
          'cor(fit$cate_train, d$tau)</code></pre>' +
          '<div class="callout"><div class="callout-title">观察性数据的混杂结构</div>' +
          '<p>三个 <code>*_obs_*</code> 数据集共用同一套混杂：' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>，即病情越重越容易接受处理。' +
          '所以未调整的差分必然有偏，正好用来演示 IPTW 的校正效果。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_demo_*() datasets",
    sections: [
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
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# Reconcile\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y)\n' +
          'cor(fit$cate_train, d$tau)</code></pre>' +
          '<div class="callout"><div class="callout-title">Confounding in the observational datasets</div>' +
          '<p>All three <code>*_obs_*</code> datasets share the same confounding mechanism: ' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code> — sicker patients are more likely to be ' +
          'treated. The crude difference is therefore biased by construction, which is exactly what ' +
          'IPTW is meant to fix.</p></div>'
      }
    ]
  }
};

/* ===================== HTE 评价指标 ===================== */
window.SITE_PAGES.apimetrics = {
  zh: {
    title: "HTE 评价指标",
    sections: [
      {
        id: "metrics",
        heading: "HTE 评价指标",
        body:
          '<p>给定模型的逐个体 CATE 估计，量化它区分"谁获益更多"的能力。每种方法都有文献依据。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>函数</th><th>度量</th><th>文献</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetrics"><code>qini_curve()</code></a></td><td>Qini 曲线（IPW 累积增益）</td><td>Sverdrup et al., JCGS 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>qini_coefficient()</code></a></td><td>曲线与随机线间面积</td><td>Sverdrup et al., JCGS 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>c_for_benefit()</code></a></td><td>预测获益的 C 统计量</td><td>van Klaveren et al., J Clin Epidemiol 2018</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>toc_curve()</code></a></td><td>靶向操作特征曲线</td><td>Yadlowsky et al., JASA 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>dr_pseudo_outcome()</code></a></td><td>双重稳健伪结局（含交叉拟合的 e / mu1 / mu0）</td><td>Yadlowsky et al., JASA 2025</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code>cate  &lt;- fit$predict(testX)      # 新数据上的逐人 CATE\n' +
          'crv   &lt;- qini_curve(cate, A_test, Y_test)\n' +
          'qini_coefficient(cate, A_test, Y_test)$qini_coefficient\n' +
          'c_for_benefit(cate, A_test, Y_test)$c_for_benefit\n' +
          'toc_curve(cate, A_test, Y_test)\n' +
          'plot_qini(crv)                    # 或 ggplot2 自绘</code></pre>' +
          '<div class="callout"><div class="callout-title">观察性数据怎么喂</div>' +
          '<p>Qini / TOC 传 <code>propensity</code> 即可；c-for-benefit 必须传 ' +
          '<code>propensity</code> + <code>mu1</code> + <code>mu0</code> 三件套' +
          '（只给倾向得分会报错——HT 评分噪声会把 C 统计量压到随机线以下）。' +
          '三件套用 <code>dr_pseudo_outcome(X, A, Y, seed = 1)</code> 一次拿到，默认 5 折交叉拟合。</p>' +
          '<pre><code>dr &lt;- dr_pseudo_outcome(X, A, Y, seed = 1)   # 返回 pseudo / mu1 / mu0 / propensity / ate\n' +
          'qini_coefficient(cate, A, Y, propensity = dr$propensity)\n' +
          'c_for_benefit(cate, A, Y, propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)</code></pre></div>' +
          '<div class="callout warn"><div class="callout-title">生存结局暂不支持</div>' +
          '<p>指标目前只接受连续 / 0-1 结局；生存需删失 IPCW，留作后续版本，' +
          '传入 <code>Surv</code> 会明确报错。</p></div>'
      }
    ]
  },
  en: {
    title: "HTE evaluation metrics",
    sections: [
      {
        id: "metrics",
        heading: "HTE evaluation metrics",
        body:
          '<p>Given a model\'s per-unit CATE estimates, quantify how well it separates ' +
          '"who benefits more". Every method carries a literature reference.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Measure</th><th>Reference</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetrics"><code>qini_curve()</code></a></td><td>Qini curve (IPW cumulative gain)</td><td>Sverdrup et al., JCGS 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>qini_coefficient()</code></a></td><td>Area between curve and random line</td><td>Sverdrup et al., JCGS 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>c_for_benefit()</code></a></td><td>C-statistic for predicted benefit</td><td>van Klaveren et al., J Clin Epidemiol 2018</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>toc_curve()</code></a></td><td>Targeting Operator Characteristic</td><td>Yadlowsky et al., JASA 2025</td></tr>' +
          '<tr><td><a href="#/apimetrics"><code>dr_pseudo_outcome()</code></a></td><td>Doubly-robust pseudo-outcome (with cross-fitted e / mu1 / mu0)</td><td>Yadlowsky et al., JASA 2025</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code>cate  &lt;- fit$predict(testX)      # per-unit CATE on new data\n' +
          'crv   &lt;- qini_curve(cate, A_test, Y_test)\n' +
          'qini_coefficient(cate, A_test, Y_test)$qini_coefficient\n' +
          'c_for_benefit(cate, A_test, Y_test)$c_for_benefit\n' +
          'toc_curve(cate, A_test, Y_test)\n' +
          'plot_qini(crv)                    # or draw with ggplot2</code></pre>' +
          '<div class="callout"><div class="callout-title">Feeding observational data</div>' +
          '<p>Qini / TOC only need <code>propensity</code>; c-for-benefit requires the full ' +
          '<code>propensity</code> + <code>mu1</code> + <code>mu0</code> triple (passing a ' +
          'propensity score alone errors out — Horvitz–Thompson noise drives the C-statistic ' +
          'below the random line). Get all three in one call with ' +
          '<code>dr_pseudo_outcome(X, A, Y, seed = 1)</code>, which cross-fits by default.</p>' +
          '<pre><code>dr &lt;- dr_pseudo_outcome(X, A, Y, seed = 1)   # pseudo / mu1 / mu0 / propensity / ate\n' +
          'qini_coefficient(cate, A, Y, propensity = dr$propensity)\n' +
          'c_for_benefit(cate, A, Y, propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)</code></pre></div>' +
          '<div class="callout warn"><div class="callout-title">Survival not yet supported</div>' +
          '<p>The metrics currently accept continuous / 0-1 outcomes only; survival needs ' +
          'censoring IPCW (planned). Passing a <code>Surv</code> object raises an explicit error.</p></div>'
      }
    ]
  }
};

/* ===================== 辅助函数 ===================== */
window.SITE_PAGES.apihelpers = {
  zh: {
    title: "辅助函数",
    sections: [
      {
        id: "helpers",
        heading: "辅助函数",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">不确定度</span></div>' +
          '<div class="fn-sig">cate_ci(fit, X, level = 0.95, n_boot = 200, seed = 1)</div>' +
          '<p>对训练好的 fit 做自助重采样，返回 CATE 的百分位自助置信区间。' +
          '权重抽样带蒙特卡洛噪声，务必固定 <code>seed</code> 才能复现。</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">绘图</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>base graphics 快速绘制 Qini 曲线与随机参考线；要精细控制可自行用 ggplot2 重绘。</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag()</div>' +
          '<p>画出 HTE 场景的因果图：X（协变量）同时影响处理 A 与结局 Y，' +
          'A 对 Y 的效应随 X 变化即异质性；用于说明为何要调整 X。</p></div>'
      }
    ]
  },
  en: {
    title: "Helpers",
    sections: [
      {
        id: "helpers",
        heading: "Helpers",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">Uncertainty</span></div>' +
          '<div class="fn-sig">cate_ci(fit, X, level = 0.95, n_boot = 200, seed = 1)</div>' +
          '<p>Bootstrap the fitted object to return a percentile interval for CATE. ' +
          'Weighted resampling carries Monte-Carlo noise, so always fix <code>seed</code> ' +
          'if you need reproducibility.</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">Plot</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>Quick base-graphics rendering of the Qini curve plus the random reference ' +
          'line; draw with ggplot2 yourself when you need finer control.</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag()</div>' +
          '<p>Draws the causal diagram for an HTE setting: covariates X affect both ' +
          'treatment A and outcome Y, and the A-to-Y effect varies with X. Useful for ' +
          'explaining why X must be adjusted for.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apibenchmark = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "hte_benchmark()",
    lede: "在随机化试验（RCT）数据上对多个 meta-learner 做基准测试。不依赖真实 CATE，因此现实 RCT 数据上同样可用。",
    sections: [

      {
        id: "why",
        heading: "为什么需要它",
        body:
          '<div class="callout ok"><div class="callout-title">真实 tau 只有模拟数据才有</div>' +
          '<p>教程 01–07 里的对账（CATE 相关 / RMSE）需要知道每个人的真实效应，' +
          '这只有自带真值的模拟数据才给得出。<strong>现实 RCT 数据永远拿不到 tau。</strong>' +
          '这个函数改问另一个问题：模型把"谁更获益"排到前面的能力如何。</p></div>' +
          '<p>三个指标全部建立在<strong>随机化</strong>带来的可交换性上，RCT 下不需要倾向得分：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>指标</th><th>随机基线</th><th>负责什么</th></tr></thead><tbody>' +
          '<tr><td><code>qini_normalized</code></td><td>≈ 0</td>' +
          '<td>按模型排序靶向，相对随机分配多挥发了多少额外增益</td></tr>' +
          '<tr><td><code>toc_gain</code></td><td>0</td>' +
          '<td>TOC 曲线与全样本 ATE 水平线夹的面积，量纲 = 结局单位</td></tr>' +
          '<tr><td><code>c_for_benefit</code></td><td>0.5</td>' +
          '<td>增益匹配后的 C 统计量</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">随机基线不是精确的 0</div>' +
          '<p>归一化的 Qini 除了随机线下面的面积，而那个面积本身就小，' +
          '所以单次随机排序的归一化 Qini 能在 ±0.25 左右摆。' +
          '<strong>比较多个模型时要看相对次序，不要拿绝对阈值当基线。</strong>' +
          '本包演示数据上（n = 1500）实测 10 次随机排序，' +
          '归一化 Qini 落在 −0.253 到 0.227。</p></div>'
      },

      {
        id: "crossfit",
        heading: "为什么必须交叉拟合",
        body:
          '<p>每个 meta-learner 都在 K 折的<strong>训练折</strong>上拟合、' +
          '在<strong>留出折</strong>上预测，最终用全部留出预测（out-of-fold）' +
          '拼成一条 CATE。若用全样本拟合后回代自己（in-fold），' +
          '模型会把训练噪声也排进序里，指标虚高。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>X-learner 的做法</th><th>qini_normalized</th>' +
          '<th>c_for_benefit</th></tr></thead><tbody>' +
          '<tr><td>in-fold（回代训练数据）</td><td>0.528</td><td><strong>0.663</strong></td></tr>' +
          '<tr><td>out-of-fold（5 折交叉拟合）</td><td>0.404</td><td>0.617</td></tr>' +
          '<tr><td>真实 tau（参考上界）</td><td>0.522</td><td>0.624</td></tr>' +
          '</tbody></table></div>' +
          '<p>in-fold 的 c-for-benefit <strong>0.663 超过了真实 tau 的 0.624</strong>——' +
          '那不是模型好，是把噪声也排序了。' +
          '交叉拟合后回落到 0.617，落在真值下方，才是该有的样子。</p>'
      },

      {
        id: "usage",
        heading: "用法",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X, A, Y</code></td><td>协变量、处理指示、结局（连续 / 0-1 / <code>Surv</code> 都行）</td></tr>' +
          '<tr><td><code>learners</code></td><td>要比较的 meta-learner，默认五族全上</td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认按结局类型自动选（连续 ranger / 二分类 ranger / 生存 coxph）。所有 learner 共用同一个，比出来的差异才归因于 meta-learner 而不是基学习器</td></tr>' +
          '<tr><td><code>metrics</code></td><td>要算哪些指标</td></tr>' +
          '<tr><td><code>n_folds</code></td><td>交叉拟合折数，默认 5。折的划分<strong>按处理组分层</strong>，保证每折两个臂都有样本</td></tr>' +
          '<tr><td><code>tau</code></td><td><strong>可选</strong>真实 CATE，只有模拟数据才有。给了就多输出 <code>tau_cor</code> / <code>tau_rmse</code> 两列</td></tr>' +
          '<tr><td><code>propensity, mu1, mu0</code></td><td><strong>可选</strong>观察性数据三件套（见 <a href="#/apimetrics">dr_pseudo_outcome()</a>）。RCT 下全部留空</td></tr>' +
          '<tr><td><code>seed</code></td><td>折划分的随机种子，固定后才能复现</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code># 现实 RCT 数据：没有 tau，输出里就不会出现 tau_cor / tau_rmse\n' +
          'bm &lt;- hte_benchmark(X, A, Y, seed = 1)\n' +
          'bm$table\n\n' +
          '# 模拟数据：有真值，可以两套指标照着看\n' +
          'bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 1)\n' +
          'bm$table   # qini_* / toc_gain / c_for_benefit + tau_cor / tau_rmse</code></pre>' +
          '<p>返回一个 list：<code>table</code>（一行一个 learner 的汇总表）、' +
          '<code>cate</code>（交叉拟合留出预测的长表）、' +
          '<code>curves</code>（Qini / TOC 曲线）、<code>truth</code>、<code>setup</code>。</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>把 <code>hte_benchmark()</code> 存下来的曲线按 learner 分面画出来，' +
          '并自动加上参考线（Qini 用随机靶向线，TOC 用全样本 ATE 水平线）。' +
          '<code>min_fraction</code> 默认 0.05：TOC / Qini 在最左端只对应一两个观测，' +
          '值是单个个体的效应，能把纵轴拉到几十倍 ATE，剩余曲线全被压扁。</p></div>'
      },

      {
        id: "results",
        heading: "三类结局的实测结果",
        body:
          '<p>n = 1500，5 折交叉拟合，seed = 42。' +
          '<code>tau_cor</code> / <code>tau_rmse</code> 两列只有模拟数据才给得出。</p>' +
          '<p><strong>连续 × RCT</strong>（真实 ATE 1.049）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>1.040</td><td>0.417</td><td>0.516</td><td>0.613</td><td>0.908</td></tr>' +
          '<tr><td>T</td><td>1.100</td><td>0.378</td><td>0.492</td><td>0.608</td><td>0.894</td></tr>' +
          '<tr><td>X</td><td>1.090</td><td>0.404</td><td>0.647</td><td>0.617</td><td>0.946</td></tr>' +
          '<tr><td>R</td><td>0.498</td><td>0.460</td><td>0.946</td><td>0.599</td><td>0.857</td></tr>' +
          '<tr><td>DR</td><td>1.090</td><td>0.413</td><td>0.568</td><td>0.617</td><td>0.932</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">别只看一列</div>' +
          '<p>R 的 ATE 只有 0.498（真值 1.049），但 qini_normalized 和 toc_gain 都是五个里最高的。' +
          '原因：R-learner 二阶段对伪结果做回归，<strong>没有尺度约束</strong>，' +
          'CATE 可以整体缩小到一半而排序不变。Qini / TOC 只看排序，' +
          '所以它们对尺度错误视而不见。<strong>报告时应该把 ATE 和 Qini 放在一起说，' +
          '分别回答"平均对不对"和"排序好不好"。</strong></p></div>' +
          '<p><strong>二分类 × RCT</strong>（真实 ATE 0.131）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.127</td><td>0.184</td><td>0.062</td><td>0.556</td><td>0.728</td></tr>' +
          '<tr><td>T</td><td>0.139</td><td>0.193</td><td>0.078</td><td>0.554</td><td>0.643</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.349</td><td>0.095</td><td>0.594</td><td>0.839</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.211</td><td>0.041</td><td>0.559</td><td>0.589</td></tr>' +
          '<tr><td>DR</td><td>0.143</td><td>0.296</td><td>0.086</td><td>0.577</td><td>0.713</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>生存 × RCT</strong>（t0 = 2，真实 ATE 0.152）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.159</td><td>−0.095</td><td>0.005</td><td>0.498</td><td>−0.052</td></tr>' +
          '<tr><td>T</td><td>0.151</td><td>0.707</td><td>0.208</td><td>0.554</td><td>0.950</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.462</td><td>0.125</td><td>0.544</td><td>0.884</td></tr>' +
          '<tr><td>R</td><td>0.126</td><td>0.098</td><td>0.038</td><td>0.497</td><td>0.419</td></tr>' +
          '<tr><td>DR</td><td>0.120</td><td>−0.045</td><td>0.025</td><td>0.496</td><td>0.380</td></tr>' +
          '</tbody></table></div>' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" ' +
          'alt="五种 meta-learner 的 Qini 曲线对比，按 learner 分面">' +
          '<figcaption>Qini 曲线对比（连续 × RCT）。' +
          '灰色虚线 = 随机靶向基线；前 5% 未画。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" ' +
          'alt="五种 meta-learner 的 TOC 曲线对比">' +
          '<figcaption>TOC 曲线对比。灰色虚线 = 全样本 ATE；' +
          '曲线始终在上方说明前排人群收益更高。</figcaption></figure>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "hte_benchmark()",
    lede: "Benchmark several meta-learners on randomized-trial data. Does not need the true CATE, so it works on real RCT data too.",
    sections: [

      {
        id: "why",
        heading: "Why this exists",
        body:
          '<div class="callout ok"><div class="callout-title">True tau only exists in simulated data</div>' +
          '<p>The reconciliation in tutorials 01-07 (CATE correlation / RMSE) requires knowing every ' +
          'patient&rsquo;s true effect, which only simulated data can give you. ' +
          '<strong>Real RCT data never has tau.</strong> This function asks a different question: ' +
          'how well does the model rank who benefits more?</p></div>' +
          '<p>All three metrics rest on the exchangeability that <strong>randomization</strong> buys, ' +
          'so no propensity score is needed:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Metric</th><th>Random baseline</th><th>What it measures</th></tr></thead><tbody>' +
          '<tr><td><code>qini_normalized</code></td><td>&asymp; 0</td>' +
          '<td>Extra gain from targeting by model ranking vs random assignment</td></tr>' +
          '<tr><td><code>toc_gain</code></td><td>0</td>' +
          '<td>Area between the TOC curve and the overall-ATE line; units = outcome</td></tr>' +
          '<tr><td><code>c_for_benefit</code></td><td>0.5</td>' +
          '<td>C statistic after gain matching</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">The random baseline is not exactly 0</div>' +
          '<p>Normalised Qini divides by the area under the random line, which is itself small, so a ' +
          'single random ranking can swing &plusmn;0.25. <strong>Compare models by relative order, not ' +
          'against an absolute threshold.</strong> On this package&rsquo;s demo data (n = 1500), ten random ' +
          'rankings gave normalised Qini between &minus;0.253 and 0.227.</p></div>'
      },

      {
        id: "crossfit",
        heading: "Why cross-fitting is mandatory",
        body:
          '<p>Every meta-learner is fitted on the <strong>training folds</strong> and predicts on the ' +
          '<strong>held-out folds</strong>; the held-out predictions (out-of-fold) are then pooled into ' +
          'one CATE vector. Fitting on the full sample and scoring it back (in-fold) lets the model rank ' +
          'its own training noise, inflating every metric.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>X-learner variant</th><th>qini_normalized</th>' +
          '<th>c_for_benefit</th></tr></thead><tbody>' +
          '<tr><td>in-fold (scored on training data)</td><td>0.528</td><td><strong>0.663</strong></td></tr>' +
          '<tr><td>out-of-fold (5-fold cross-fitting)</td><td>0.404</td><td>0.617</td></tr>' +
          '<tr><td>true tau (reference ceiling)</td><td>0.522</td><td>0.624</td></tr>' +
          '</tbody></table></div>' +
          '<p>The in-fold c-for-benefit of <strong>0.663 exceeds the true tau&rsquo;s 0.624</strong> &mdash; ' +
          'that is not a better model, that is ranking noise. Cross-fitting brings it back to 0.617, ' +
          'below the truth, which is what it should be.</p>'
      },

      {
        id: "usage",
        heading: "Usage",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X, A, Y</code></td><td>Covariates, treatment indicator, outcome (continuous / 0-1 / <code>Surv</code>)</td></tr>' +
          '<tr><td><code>learners</code></td><td>Which meta-learners to compare; all five by default</td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; auto-chosen by outcome type (ranger / classif.ranger / coxph). All learners share one, so differences are attributable to the meta-learner</td></tr>' +
          '<tr><td><code>metrics</code></td><td>Which metrics to compute</td></tr>' +
          '<tr><td><code>n_folds</code></td><td>Cross-fitting folds, default 5. Folds are <strong>stratified by treatment arm</strong> so every fold has both arms</td></tr>' +
          '<tr><td><code>tau</code></td><td><strong>Optional</strong> true CATE, only available in simulation. Supplying it adds <code>tau_cor</code> / <code>tau_rmse</code> columns</td></tr>' +
          '<tr><td><code>propensity, mu1, mu0</code></td><td><strong>Optional</strong> observational triple (see <a href="#/apimetrics">dr_pseudo_outcome()</a>). Leave empty for RCT</td></tr>' +
          '<tr><td><code>seed</code></td><td>Seed for fold assignment; fix it to reproduce</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code># Real RCT data: no tau, so tau_cor / tau_rmse never appear\n' +
          'bm &lt;- hte_benchmark(X, A, Y, seed = 1)\n' +
          'bm$table\n\n' +
          '# Simulated data: truth available, report both metric families\n' +
          'bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 1)\n' +
          'bm$table   # qini_* / toc_gain / c_for_benefit + tau_cor / tau_rmse</code></pre>' +
          '<p>Returns a list: <code>table</code> (one row per learner), <code>cate</code> (long-format ' +
          'out-of-fold predictions), <code>curves</code> (Qini / TOC curves), <code>truth</code>, ' +
          '<code>setup</code>.</p></div>' +
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>Faceted plot of the curves stored by <code>hte_benchmark()</code>, with the reference ' +
          'line added automatically (random targeting for Qini, overall ATE for TOC). ' +
          '<code>min_fraction</code> defaults to 0.05: at the far left of a TOC / Qini curve each ' +
          'point is one or two observations, whose individual effect can stretch the y-axis to tens of ' +
          'times the ATE and flatten everything else.</p></div>'
      },

      {
        id: "results",
        heading: "Measured results across outcome types",
        body:
          '<p>n = 1500, 5-fold cross-fitting, seed = 42. The <code>tau_cor</code> / <code>tau_rmse</code> ' +
          'columns only exist because this is simulated data.</p>' +
          '<p><strong>Continuous &times; RCT</strong> (true ATE 1.049):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>1.040</td><td>0.417</td><td>0.516</td><td>0.613</td><td>0.908</td></tr>' +
          '<tr><td>T</td><td>1.100</td><td>0.378</td><td>0.492</td><td>0.608</td><td>0.894</td></tr>' +
          '<tr><td>X</td><td>1.090</td><td>0.404</td><td>0.647</td><td>0.617</td><td>0.946</td></tr>' +
          '<tr><td>R</td><td>0.498</td><td>0.460</td><td>0.946</td><td>0.599</td><td>0.857</td></tr>' +
          '<tr><td>DR</td><td>1.090</td><td>0.413</td><td>0.568</td><td>0.617</td><td>0.932</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Do not read one column alone</div>' +
          '<p>R&rsquo;s ATE is 0.498 against a truth of 1.049, yet its qini_normalized and toc_gain are ' +
          'the highest of the five. Reason: the R-learner&rsquo;s second stage regresses ' +
          'pseudo-outcomes with <strong>no scale constraint</strong>, so its CATE can shrink by half ' +
          'while the ranking stays intact. Qini / TOC only look at ranking, so they are blind to scale ' +
          'errors. <strong>Report ATE and Qini together &mdash; they answer "is the average right" and ' +
          '"is the ranking good" respectively.</strong></p></div>' +
          '<p><strong>Binary &times; RCT</strong> (true ATE 0.131):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.127</td><td>0.184</td><td>0.062</td><td>0.556</td><td>0.728</td></tr>' +
          '<tr><td>T</td><td>0.139</td><td>0.193</td><td>0.078</td><td>0.554</td><td>0.643</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.349</td><td>0.095</td><td>0.594</td><td>0.839</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.211</td><td>0.041</td><td>0.559</td><td>0.589</td></tr>' +
          '<tr><td>DR</td><td>0.143</td><td>0.296</td><td>0.086</td><td>0.577</td><td>0.713</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>Survival &times; RCT</strong> (t0 = 2, true ATE 0.152):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.159</td><td>&minus;0.095</td><td>0.005</td><td>0.498</td><td>&minus;0.052</td></tr>' +
          '<tr><td>T</td><td>0.151</td><td>0.707</td><td>0.208</td><td>0.554</td><td>0.950</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.462</td><td>0.125</td><td>0.544</td><td>0.884</td></tr>' +
          '<tr><td>R</td><td>0.126</td><td>0.098</td><td>0.038</td><td>0.497</td><td>0.419</td></tr>' +
          '<tr><td>DR</td><td>0.120</td><td>&minus;0.045</td><td>0.025</td><td>0.496</td><td>0.380</td></tr>' +
          '</tbody></table></div>' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" ' +
          'alt="Qini curves for the five meta-learners, faceted by learner">' +
          '<figcaption>Qini curves (continuous &times; RCT). Grey dashed = random targeting baseline; ' +
          'the first 5% is not drawn.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" ' +
          'alt="TOC curves for the five meta-learners">' +
          '<figcaption>TOC curves. Grey dashed = overall ATE; a curve staying above it means the ' +
          'top-ranked group benefits more.</figcaption></figure>'
      }
    ]
  }
};

window.SITE_PAGES.apis = {

  zh: {
    title: "s_learner()",
    lede: "S-learner 快捷函数：一个模型学两个臂，直接返回 CATE 向量。",
    sections: [
      {
        id: "usage",
        heading: "签名与返回值",
        body:
          '<div class="fn">' +
          '<div class="fn-name">s_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">s_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>s_learner() 是 <code>metalearner("S", ...)</code> 的简写：' +
          '拟合后<strong>直接返回训练集上的 CATE 向量</strong>' +
          '（长度 = 行数），而不是可重复预测的 fit 对象。' +
          '需要对新数据预测时，用 <a href="#/apimetalearner">metalearner()</a>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：连续数值、0/1 二分类、或 <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认 <code>regr.ranger</code>。<strong>二分类结局必须换 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），生存结局用 <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>weighting</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- s_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.05    0.862 0.527</code></pre>' +
          '<div class="callout"><div class="callout-title">怎么读这三个数</div>' +
          '<ul>' +
          '<li><code>ATE</code> = CATE 的均值，看人群平均对不对；此处真值为 1.049。</li>' +
          '<li><code>与真相关</code> = cor(估计 CATE, 真实 tau)，看异质性捕捉能力。</li>' +
          '<li><code>RMSE</code> = 逐人误差的绝对尺度，可跨 learner 横向比。</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "特点与注意事项",
        body:
          '<p>一个模型同时学处理组与对照组，处理当普通特征。最少的参数、最快的速度，但当处理效应相对基线来说很小时，单个模型可能完全学不到异质性——它会把处理当成又一个协变量，而这个特征对结局的影响往往被其他协变量向咻（“正则化”效应）。</p>' +
          '<div class="callout warn"><div class="callout-title">只报一个数不够</div>' +
          '<p>ATE 对不代表 CATE 对，CATE 相关高也不代表绝对尺度对。' +
          '完整的对账口径见 <a href="#/tutorialbasics/recon">教程 · 对账指标约定</a>。' +
          '若数据没有真值（现实研究），改用 ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> 跑 Qini 三件套。</p></div>'
      }
    ]
  },

  en: {
    title: "s_learner()",
    lede: "S-learner shortcut: one model for both arms, returns the CATE vector directly.",
    sections: [
      {
        id: "usage",
        heading: "Signature and return value",
        body:
          '<div class="fn">' +
          '<div class="fn-name">s_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">s_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>s_learner() is shorthand for <code>metalearner("S", ...)</code>: it fits and ' +
          '<strong>returns the training-set CATE vector directly</strong> (length = number of ' +
          'rows) instead of a reusable fit object. Use <a href="#/apimetalearner">metalearner()</a> ' +
          'when you need to predict on new data.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: continuous, 0/1 binary, or <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; default <code>regr.ranger</code>. <strong>Binary outcomes need classif.*</strong> (with <code>predict_type = "prob"</code> set); survival uses <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>weighting</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- s_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.05    0.862 0.527</code></pre>' +
          '<div class="callout"><div class="callout-title">How to read the three numbers</div>' +
          '<ul>' +
          '<li><code>ATE</code> is the mean of CATE — whether the population average is right; truth here is 1.049.</li>' +
          '<li><code>与真相关</code> is cor(estimated CATE, true tau) — heterogeneity capture.</li>' +
          '<li><code>RMSE</code> is the absolute per-person error, comparable across learners.</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "Characteristics and caveats",
        body:
          '<p>One model learns both arms at once, treating treatment as an ordinary feature. Fewest parameters, fastest, but when the treatment effect is small relative to the baseline the single model may learn no heterogeneity at all — it treats treatment as just another covariate, and its effect gets swamped by the others (regularisation).</p>' +
          '<div class="callout warn"><div class="callout-title">One number is not enough</div>' +
          '<p>A right ATE does not mean a right CATE, and a high CATE correlation does not mean a ' +
          'right absolute scale. The full reconciliation template is in ' +
          '<a href="#/tutorialbasics/recon">the tutorial&rsquo;s metric conventions</a>. ' +
          'Without ground truth (real studies), use ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> for the Qini triple instead.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apit = {

  zh: {
    title: "t_learner()",
    lede: "T-learner 快捷函数：两个独立模型相减，直接返回 CATE 向量。",
    sections: [
      {
        id: "usage",
        heading: "签名与返回值",
        body:
          '<div class="fn">' +
          '<div class="fn-name">t_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">t_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>t_learner() 是 <code>metalearner("T", ...)</code> 的简写：' +
          '拟合后<strong>直接返回训练集上的 CATE 向量</strong>' +
          '（长度 = 行数），而不是可重复预测的 fit 对象。' +
          '需要对新数据预测时，用 <a href="#/apimetalearner">metalearner()</a>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：连续数值、0/1 二分类、或 <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认 <code>regr.ranger</code>。<strong>二分类结局必须换 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），生存结局用 <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>weighting</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- t_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.828 0.645</code></pre>' +
          '<div class="callout"><div class="callout-title">怎么读这三个数</div>' +
          '<ul>' +
          '<li><code>ATE</code> = CATE 的均值，看人群平均对不对；此处真值为 1.049。</li>' +
          '<li><code>与真相关</code> = cor(估计 CATE, 真实 tau)，看异质性捕捉能力。</li>' +
          '<li><code>RMSE</code> = 逐人误差的绝对尺度，可跨 learner 横向比。</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "特点与注意事项",
        body:
          '<p>两个独立的模型：一个只用处理组拟合，一个只用对照组拟合，CATE = 两个预测相减。比 S-learner 更能捕捉异质性，但每个组只用一半样本，小样本旰可能过拟合；且两个模型的误差不相干时相减会放大噪声。</p>' +
          '<div class="callout warn"><div class="callout-title">只报一个数不够</div>' +
          '<p>ATE 对不代表 CATE 对，CATE 相关高也不代表绝对尺度对。' +
          '完整的对账口径见 <a href="#/tutorialbasics/recon">教程 · 对账指标约定</a>。' +
          '若数据没有真值（现实研究），改用 ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> 跑 Qini 三件套。</p></div>'
      }
    ]
  },

  en: {
    title: "t_learner()",
    lede: "T-learner shortcut: two independent models differenced, returns the CATE vector directly.",
    sections: [
      {
        id: "usage",
        heading: "Signature and return value",
        body:
          '<div class="fn">' +
          '<div class="fn-name">t_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">t_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>t_learner() is shorthand for <code>metalearner("T", ...)</code>: it fits and ' +
          '<strong>returns the training-set CATE vector directly</strong> (length = number of ' +
          'rows) instead of a reusable fit object. Use <a href="#/apimetalearner">metalearner()</a> ' +
          'when you need to predict on new data.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: continuous, 0/1 binary, or <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; default <code>regr.ranger</code>. <strong>Binary outcomes need classif.*</strong> (with <code>predict_type = "prob"</code> set); survival uses <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>weighting</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- t_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.828 0.645</code></pre>' +
          '<div class="callout"><div class="callout-title">How to read the three numbers</div>' +
          '<ul>' +
          '<li><code>ATE</code> is the mean of CATE — whether the population average is right; truth here is 1.049.</li>' +
          '<li><code>与真相关</code> is cor(estimated CATE, true tau) — heterogeneity capture.</li>' +
          '<li><code>RMSE</code> is the absolute per-person error, comparable across learners.</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "Characteristics and caveats",
        body:
          '<p>Two independent models: one fitted on the treated only, one on the controls only; CATE is their difference. Captures heterogeneity better than the S-learner, but each arm uses only half the sample, so small samples may overfit; and when the two models\' errors are uncorrelated, differencing amplifies noise.</p>' +
          '<div class="callout warn"><div class="callout-title">One number is not enough</div>' +
          '<p>A right ATE does not mean a right CATE, and a high CATE correlation does not mean a ' +
          'right absolute scale. The full reconciliation template is in ' +
          '<a href="#/tutorialbasics/recon">the tutorial&rsquo;s metric conventions</a>. ' +
          'Without ground truth (real studies), use ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> for the Qini triple instead.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apix = {

  zh: {
    title: "x_learner()",
    lede: "X-learner 快捷函数：两阶段拟合，直接返回 CATE 向量。",
    sections: [
      {
        id: "usage",
        heading: "签名与返回值",
        body:
          '<div class="fn">' +
          '<div class="fn-name">x_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">x_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>x_learner() 是 <code>metalearner("X", ...)</code> 的简写：' +
          '拟合后<strong>直接返回训练集上的 CATE 向量</strong>' +
          '（长度 = 行数），而不是可重复预测的 fit 对象。' +
          '需要对新数据预测时，用 <a href="#/apimetalearner">metalearner()</a>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：连续数值、0/1 二分类、或 <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认 <code>regr.ranger</code>。<strong>二分类结局必须换 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），生存结局用 <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>weighting</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- x_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.950 0.340</code></pre>' +
          '<div class="callout"><div class="callout-title">怎么读这三个数</div>' +
          '<ul>' +
          '<li><code>ATE</code> = CATE 的均值，看人群平均对不对；此处真值为 1.049。</li>' +
          '<li><code>与真相关</code> = cor(估计 CATE, 真实 tau)，看异质性捕捉能力。</li>' +
          '<li><code>RMSE</code> = 逐人误差的绝对尺度，可跨 learner 横向比。</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "特点与注意事项",
        body:
          '<p>在 T-learner 之上多一层：用对照组模型预测处理组的“虚拟结局”，再对这个差做回归。当两组样本量不平衡（观察性数据常见）时，它通常比 T-learner 稳，因为效应阶段的回归用上了全部样本。本包演示数据上五族里相关最高。</p>' +
          '<div class="callout warn"><div class="callout-title">只报一个数不够</div>' +
          '<p>ATE 对不代表 CATE 对，CATE 相关高也不代表绝对尺度对。' +
          '完整的对账口径见 <a href="#/tutorialbasics/recon">教程 · 对账指标约定</a>。' +
          '若数据没有真值（现实研究），改用 ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> 跑 Qini 三件套。</p></div>'
      }
    ]
  },

  en: {
    title: "x_learner()",
    lede: "X-learner shortcut: two-stage fitting, returns the CATE vector directly.",
    sections: [
      {
        id: "usage",
        heading: "Signature and return value",
        body:
          '<div class="fn">' +
          '<div class="fn-name">x_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">x_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>x_learner() is shorthand for <code>metalearner("X", ...)</code>: it fits and ' +
          '<strong>returns the training-set CATE vector directly</strong> (length = number of ' +
          'rows) instead of a reusable fit object. Use <a href="#/apimetalearner">metalearner()</a> ' +
          'when you need to predict on new data.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: continuous, 0/1 binary, or <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; default <code>regr.ranger</code>. <strong>Binary outcomes need classif.*</strong> (with <code>predict_type = "prob"</code> set); survival uses <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>weighting</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- x_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.950 0.340</code></pre>' +
          '<div class="callout"><div class="callout-title">How to read the three numbers</div>' +
          '<ul>' +
          '<li><code>ATE</code> is the mean of CATE — whether the population average is right; truth here is 1.049.</li>' +
          '<li><code>与真相关</code> is cor(estimated CATE, true tau) — heterogeneity capture.</li>' +
          '<li><code>RMSE</code> is the absolute per-person error, comparable across learners.</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "Characteristics and caveats",
        body:
          '<p>One more stage than the T-learner: use the control model to predict a "pseudo-outcome" for the treated, then regress that difference. When the two arms are unbalanced in size (common in observational data) it is usually more stable than the T-learner, because the effect-stage regression uses the whole sample. Highest correlation of the five on this package\'s demo data.</p>' +
          '<div class="callout warn"><div class="callout-title">One number is not enough</div>' +
          '<p>A right ATE does not mean a right CATE, and a high CATE correlation does not mean a ' +
          'right absolute scale. The full reconciliation template is in ' +
          '<a href="#/tutorialbasics/recon">the tutorial&rsquo;s metric conventions</a>. ' +
          'Without ground truth (real studies), use ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> for the Qini triple instead.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apir = {

  zh: {
    title: "r_learner()",
    lede: "R-learner 快捷函数：残差化后回归，直接返回 CATE 向量。",
    sections: [
      {
        id: "usage",
        heading: "签名与返回值",
        body:
          '<div class="fn">' +
          '<div class="fn-name">r_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">r_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>r_learner() 是 <code>metalearner("R", ...)</code> 的简写：' +
          '拟合后<strong>直接返回训练集上的 CATE 向量</strong>' +
          '（长度 = 行数），而不是可重复预测的 fit 对象。' +
          '需要对新数据预测时，用 <a href="#/apimetalearner">metalearner()</a>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：连续数值、0/1 二分类、或 <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认 <code>regr.ranger</code>。<strong>二分类结局必须换 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），生存结局用 <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>weighting</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- r_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1 0.541    0.811 0.856</code></pre>' +
          '<div class="callout"><div class="callout-title">怎么读这三个数</div>' +
          '<ul>' +
          '<li><code>ATE</code> = CATE 的均值，看人群平均对不对；此处真值为 1.049。</li>' +
          '<li><code>与真相关</code> = cor(估计 CATE, 真实 tau)，看异质性捕捉能力。</li>' +
          '<li><code>RMSE</code> = 逐人误差的绝对尺度，可跨 learner 横向比。</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "特点与注意事项",
        body:
          '<p>先用残差法剔除协变量的主效应，再对虚拟残差做回归。统计效率高（Robinson 分解），但实现对干扰参数的估计质量敏感。<strong>本包演示数据上它的 ATE 只有 0.541（真值 1.049）</strong>——二阶段回归没有尺度约束，CATE 可以整体缩小而排序不变。所以它的相关 0.811 不低，但绝对尺度偏很大。</p>' +
          '<div class="callout warn"><div class="callout-title">只报一个数不够</div>' +
          '<p>ATE 对不代表 CATE 对，CATE 相关高也不代表绝对尺度对。' +
          '完整的对账口径见 <a href="#/tutorialbasics/recon">教程 · 对账指标约定</a>。' +
          '若数据没有真值（现实研究），改用 ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> 跑 Qini 三件套。</p></div>'
      }
    ]
  },

  en: {
    title: "r_learner()",
    lede: "R-learner shortcut: residualise then regress, returns the CATE vector directly.",
    sections: [
      {
        id: "usage",
        heading: "Signature and return value",
        body:
          '<div class="fn">' +
          '<div class="fn-name">r_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">r_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>r_learner() is shorthand for <code>metalearner("R", ...)</code>: it fits and ' +
          '<strong>returns the training-set CATE vector directly</strong> (length = number of ' +
          'rows) instead of a reusable fit object. Use <a href="#/apimetalearner">metalearner()</a> ' +
          'when you need to predict on new data.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: continuous, 0/1 binary, or <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; default <code>regr.ranger</code>. <strong>Binary outcomes need classif.*</strong> (with <code>predict_type = "prob"</code> set); survival uses <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>weighting</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- r_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1 0.541    0.811 0.856</code></pre>' +
          '<div class="callout"><div class="callout-title">How to read the three numbers</div>' +
          '<ul>' +
          '<li><code>ATE</code> is the mean of CATE — whether the population average is right; truth here is 1.049.</li>' +
          '<li><code>与真相关</code> is cor(estimated CATE, true tau) — heterogeneity capture.</li>' +
          '<li><code>RMSE</code> is the absolute per-person error, comparable across learners.</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "Characteristics and caveats",
        body:
          '<p>Removes the covariate main effects by residualisation, then regresses the pseudo residuals. Statistically efficient (Robinson decomposition), but sensitive to the quality of the nuisance estimates. <strong>On this package\'s demo data its ATE is only 0.541 against a truth of 1.049</strong> — the second-stage regression has no scale constraint, so CATE can shrink overall while the ranking survives. Its correlation of 0.811 is not low, but the absolute scale is badly off.</p>' +
          '<div class="callout warn"><div class="callout-title">One number is not enough</div>' +
          '<p>A right ATE does not mean a right CATE, and a high CATE correlation does not mean a ' +
          'right absolute scale. The full reconciliation template is in ' +
          '<a href="#/tutorialbasics/recon">the tutorial&rsquo;s metric conventions</a>. ' +
          'Without ground truth (real studies), use ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> for the Qini triple instead.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apidr = {

  zh: {
    title: "dr_learner()",
    lede: "DR-learner 快捷函数：双重健壮虚拟结局，直接返回 CATE 向量。",
    sections: [
      {
        id: "usage",
        heading: "签名与返回值",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">dr_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>dr_learner() 是 <code>metalearner("D", ...)</code> 的简写：' +
          '拟合后<strong>直接返回训练集上的 CATE 向量</strong>' +
          '（长度 = 行数），而不是可重复预测的 fit 对象。' +
          '需要对新数据预测时，用 <a href="#/apimetalearner">metalearner()</a>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 或逻辑）</td></tr>' +
          '<tr><td><code>Y</code></td><td>结局：连续数值、0/1 二分类、或 <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>基学习器；默认 <code>regr.ranger</code>。<strong>二分类结局必须换 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），生存结局用 <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>weighting</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- dr_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.08    0.916 0.419</code></pre>' +
          '<div class="callout"><div class="callout-title">怎么读这三个数</div>' +
          '<ul>' +
          '<li><code>ATE</code> = CATE 的均值，看人群平均对不对；此处真值为 1.049。</li>' +
          '<li><code>与真相关</code> = cor(估计 CATE, 真实 tau)，看异质性捕捉能力。</li>' +
          '<li><code>RMSE</code> = 逐人误差的绝对尺度，可跨 learner 横向比。</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "特点与注意事项",
        body:
          '<p>双重健壮学习器：虚拟结局同时用到处理指示、结局和倾向得分，<strong>结局模型与倾向得分模型只要有一个对就无偏</strong>。因此它对其中一个模型误差的宽容度高于 R-learner，但同样存在“二阶段旀4尺度约束”的问题。</p>' +
          '<div class="callout warn"><div class="callout-title">只报一个数不够</div>' +
          '<p>ATE 对不代表 CATE 对，CATE 相关高也不代表绝对尺度对。' +
          '完整的对账口径见 <a href="#/tutorialbasics/recon">教程 · 对账指标约定</a>。' +
          '若数据没有真值（现实研究），改用 ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> 跑 Qini 三件套。</p></div>'
      }
    ]
  },

  en: {
    title: "dr_learner()",
    lede: "DR-learner shortcut: doubly robust pseudo-outcomes, returns the CATE vector directly.",
    sections: [
      {
        id: "usage",
        heading: "Signature and return value",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_learner()<span class="badge">shortcut</span></div>' +
          '<div class="fn-sig">dr_learner()(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...)</div>' +
          '<p>dr_learner() is shorthand for <code>metalearner("D", ...)</code>: it fits and ' +
          '<strong>returns the training-set CATE vector directly</strong> (length = number of ' +
          'rows) instead of a reusable fit object. Use <a href="#/apimetalearner">metalearner()</a> ' +
          'when you need to predict on new data.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Argument</th><th>Notes</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame</td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 or logical)</td></tr>' +
          '<tr><td><code>Y</code></td><td>Outcome: continuous, 0/1 binary, or <code>survival::Surv(time, status)</code></td></tr>' +
          '<tr><td><code>learner_base</code></td><td>Base learner; default <code>regr.ranger</code>. <strong>Binary outcomes need classif.*</strong> (with <code>predict_type = "prob"</code> set); survival uses <code>"coxph"</code> / <code>"ranger"</code></td></tr>' +
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>weighting</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- dr_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.08    0.916 0.419</code></pre>' +
          '<div class="callout"><div class="callout-title">How to read the three numbers</div>' +
          '<ul>' +
          '<li><code>ATE</code> is the mean of CATE — whether the population average is right; truth here is 1.049.</li>' +
          '<li><code>与真相关</code> is cor(estimated CATE, true tau) — heterogeneity capture.</li>' +
          '<li><code>RMSE</code> is the absolute per-person error, comparable across learners.</li>' +
          '</ul></div>'
      },
      {
        id: "note",
        heading: "Characteristics and caveats",
        body:
          '<p>Doubly robust learner: the pseudo-outcome combines the treatment indicator, the outcome and the propensity score, and <strong>is unbiased as long as either the outcome model or the propensity model is correct</strong>. More forgiving of one model\'s misspecification than the R-learner, but shares the same missing scale constraint in the second stage.</p>' +
          '<div class="callout warn"><div class="callout-title">One number is not enough</div>' +
          '<p>A right ATE does not mean a right CATE, and a high CATE correlation does not mean a ' +
          'right absolute scale. The full reconciliation template is in ' +
          '<a href="#/tutorialbasics/recon">the tutorial&rsquo;s metric conventions</a>. ' +
          'Without ground truth (real studies), use ' +
          '<a href="#/apihtebenchmark">hte_benchmark()</a> for the Qini triple instead.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apidemodata = {

  zh: {
    title: "mlr3HTE_demo_data()",
    lede: "随机化试验 + 连续结局的演示数据，自带真实 tau 与 ate。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_data()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_data()(n = 2000, seed = NULL)</div>' +
          '<p>六种设计共用的基础版数据：处理完全随机化（A 与 X 独立），结局为连续型。没有混杂，算法间的差异等于方法本身的差异，适合做纯方法对比。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>连续数值（numeric）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1200, seed = 1201)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), CATE_min = min(d$tau),\n       CATE_max = max(d$tau), 处理率 = mean(d$A))\nnames(d$X)\nhead(d$X, 3)\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 5\n  真实ATE CATE_SD CATE_min CATE_max 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;  &lt;dbl&gt;\n1    1.05    1.06    -2.73     4.64    0.5\n\n--- X 的列与前 3 行 ---\n[1] "age"   "lac"   "tumor" "sex"  \n       age      lac    tumor sex\n1 38.60905 3.353193 3.876882   1\n2 55.35569 1.468101 5.906637   1\n3 50.67085 3.763216 3.162722   1\n\n--- 结局类型 ---\n[1] "numeric"\n[1] 8.416564 5.474692 9.719083</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 01（连续 × RCT）的数据源；也是 <a href="#/apimetalearner">metalearner()</a> 文档里所有示例的默认数据。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p><strong>真值 <code>tau</code> 只能在模拟数据里用。</strong>现实 RCT 数据没有这个字段，评价模型排序能力请改用 <a href="#/apihtebenchmark">hte_benchmark()</a>。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_data()",
    lede: "Demo data for a randomized trial with a continuous outcome; carries true tau and ate.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_data()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_data()(n = 2000, seed = NULL)</div>' +
          '<p>The base version shared by all six designs: treatment is fully randomized (A independent of X) and the outcome is continuous. With no confounding, any difference between estimators is purely methodological.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>continuous (numeric)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 1200, seed = 1201)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), CATE_min = min(d$tau),\n       CATE_max = max(d$tau), 处理率 = mean(d$A))\nnames(d$X)\nhead(d$X, 3)\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 5\n  真实ATE CATE_SD CATE_min CATE_max 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;  &lt;dbl&gt;\n1    1.05    1.06    -2.73     4.64    0.5\n\n--- X 的列与前 3 行 ---\n[1] "age"   "lac"   "tumor" "sex"  \n       age      lac    tumor sex\n1 38.60905 3.353193 3.876882   1\n2 55.35569 1.468101 5.906637   1\n3 50.67085 3.763216 3.162722   1\n\n--- 结局类型 ---\n[1] "numeric"\n[1] 8.416564 5.474692 9.719083</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 01 (continuous × RCT) and the default dataset in every <a href="#/apimetalearner">metalearner()</a> example.</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p><strong>The true <code>tau</code> only exists in simulated data.</strong> Real RCT datasets have no such field; to evaluate ranking power use <a href="#/apihtebenchmark">hte_benchmark()</a> instead.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemobinary = {

  zh: {
    title: "mlr3HTE_demo_binary()",
    lede: "随机化试验 + 二分类结局的演示数据。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_binary()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_binary()(n = 2000, seed = NULL)</div>' +
          '<p>与 <code>mlr3HTE_demo_data()</code> 同一个 DGP，但结局改为二分类。这时 CATE 落在<strong>风险差</strong>尺度上（不是 log-odds）。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>0/1 二分类（numeric）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_binary(n = 1200, seed = 1203)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A),\n       结局率 = mean(d$Y))\ntable(d$Y)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 4\n  真实ATE CATE_SD 处理率 结局率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n1   0.131   0.131    0.5  0.344\n\n--- Y 是 0/1 ---\n\n  0   1 \n787 413</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 03（二分类 × RCT）的数据源。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p><strong>基学习器必须换成 classif.*</strong>（并把 <code>predict_type = "prob"</code> 设好），否则报“结局类型不匹配”。风险差有自然上下界（此处 −0.23 到 0.56），所以 RMSE 的量纲与连续结局不可直接比。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_binary()",
    lede: "Demo data for a randomized trial with a binary outcome.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_binary()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_binary()(n = 2000, seed = NULL)</div>' +
          '<p>Same DGP as <code>mlr3HTE_demo_data()</code> but the outcome is binary. CATE now lives on the <strong>risk-difference</strong> scale (not log-odds).</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>0/1 binary (numeric)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_binary(n = 1200, seed = 1203)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A),\n       结局率 = mean(d$Y))\ntable(d$Y)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 4\n  真实ATE CATE_SD 处理率 结局率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n1   0.131   0.131    0.5  0.344\n\n--- Y 是 0/1 ---\n\n  0   1 \n787 413</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 03 (binary × RCT).</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p><strong>The base learner must be classif.*</strong> (with <code>predict_type = "prob"</code> set), otherwise you get an outcome-type mismatch error. Risk difference has natural bounds (−0.23 to 0.56 here), so its RMSE is not comparable in magnitude with the continuous outcome.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemoobs = {

  zh: {
    title: "mlr3HTE_demo_obs()",
    lede: "观察性设计 + 连续结局的演示数据，含已测量混杂。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs()(n = 2000, seed = NULL)</div>' +
          '<p>处理不再随机：<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>，病情越重越容易接受处理，而病情本身又影响结局。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>连续数值（numeric）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>ps_true</code></td><td>生成数据旰2用的<strong>真实倾向得分</strong>，可当“外部真实权重”验证校正效果</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A))\nd$X |&gt; mutate(A = d$A) |&gt; group_by(A) |&gt;\n  summarise(across(where(is.numeric), mean), .groups = "drop")\nrange(d$ps_true)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 3\n  真实ATE CATE_SD 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;\n1    1.04    1.03    0.4\n\n--- 两组基线差异（混杂的来源）---\n# A tibble: 2 × 5\n      A   age   lac tumor   sex\n  &lt;int&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1     0  59.7  2.17  4.77 0.431\n2     1  60.3  3.00  5.48 0.438\n\n--- ps_true 范围 ---\n[1] 0.01941862 0.94016139</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 02（连续 × 观察性）的数据源；<a href="#/apidrpseudo">dr_pseudo_outcome()</a> 示例也用它。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p><strong>混杂全部来自已测量协变变</strong>，因此 IPTW 等校正才能完全生效。现实研究里若有未测量混杂，任何方法都救不回来。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_obs()",
    lede: "Demo data for an observational design with a continuous outcome and measured confounding.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs()(n = 2000, seed = NULL)</div>' +
          '<p>Treatment is no longer random: <code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>, so sicker patients are more likely to be treated and severity also affects the outcome.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>continuous (numeric)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>ps_true</code></td><td>The <strong>true propensity score</strong> used to generate the data; usable as an external true weight to verify that correction works</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A))\nd$X |&gt; mutate(A = d$A) |&gt; group_by(A) |&gt;\n  summarise(across(where(is.numeric), mean), .groups = "drop")\nrange(d$ps_true)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 数据卡 ---\n# A tibble: 1 × 3\n  真实ATE CATE_SD 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;\n1    1.04    1.03    0.4\n\n--- 两组基线差异（混杂的来源）---\n# A tibble: 2 × 5\n      A   age   lac tumor   sex\n  &lt;int&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1     0  59.7  2.17  4.77 0.431\n2     1  60.3  3.00  5.48 0.438\n\n--- ps_true 范围 ---\n[1] 0.01941862 0.94016139</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 02 (continuous × observational); also used by the <a href="#/apidrpseudo">dr_pseudo_outcome()</a> example.</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p><strong>All confounding comes from measured covariates</strong>, which is why IPTW-style correction works perfectly here. In real studies, unmeasured confounding cannot be fixed by any method.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemoobsbinary = {

  zh: {
    title: "mlr3HTE_demo_obs_binary()",
    lede: "观察性设计 + 二分类结局的演示数据。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs_binary()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs_binary()(n = 2000, seed = NULL)</div>' +
          '<p>与 <code>mlr3HTE_demo_obs()</code> 同一套混杂，结局改为二分类，效应尺度为风险差。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>0/1 二分类（numeric）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>ps_true</code></td><td>生成数据旰2用的<strong>真实倾向得分</strong>，可当“外部真实权重”验证校正效果</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_binary(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, 处理率 = mean(d$A), 结局率 = mean(d$Y),\n       ps_true_min = min(d$ps_true), ps_true_max = max(d$ps_true))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 5\n  真实ATE 处理率 结局率 ps_true_min ps_true_max\n    &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;       &lt;dbl&gt;       &lt;dbl&gt;\n1   0.130    0.4  0.337      0.0194       0.940</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 04（二分类 × 观察性）的数据源。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p>基学习器同样要 classif.*；判断校正是否生效，看的是风险差误差从 +0.125 回落到什么范围。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_obs_binary()",
    lede: "Demo data for an observational design with a binary outcome.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs_binary()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs_binary()(n = 2000, seed = NULL)</div>' +
          '<p>Same confounding as <code>mlr3HTE_demo_obs()</code> with a binary outcome; the effect scale is risk difference.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>0/1 binary (numeric)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>ps_true</code></td><td>The <strong>true propensity score</strong> used to generate the data; usable as an external true weight to verify that correction works</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_binary(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, 处理率 = mean(d$A), 结局率 = mean(d$Y),\n       ps_true_min = min(d$ps_true), ps_true_max = max(d$ps_true))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 5\n  真实ATE 处理率 结局率 ps_true_min ps_true_max\n    &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;       &lt;dbl&gt;       &lt;dbl&gt;\n1   0.130    0.4  0.337      0.0194       0.940</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 04 (binary × observational).</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p>Base learner must again be classif.*; to check whether correction worked, watch the risk-difference bias fall from +0.125.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemoobssurv = {

  zh: {
    title: "mlr3HTE_demo_obs_surv()",
    lede: "观察性设计 + 生存结局的演示数据，含混杂与删失。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs_surv()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs_surv()(n = 2000, seed = NULL)</div>' +
          '<p>最复杂的一种：既有混杂（要 IPTW），又有删失（要 IPCW），两层权重相乘。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>生存对象 <code>survival::Surv(time, status)</code>（两列矩阵）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>t0</code></td><td>效应时点；CATE = S(t0) 差。不传时引擎取事件时间中位数</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.387    0.292\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.1362236</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 06（生存 × 观察性）的数据源。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p><strong>报告生存结果必须写清 <code>t0</code></strong>——生存效应是时间点依赖的。删失约 29%，不校正的话会把删失当成事件。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_obs_surv()",
    lede: "Demo data for an observational design with a survival outcome, including confounding and censoring.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_obs_surv()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_obs_surv()(n = 2000, seed = NULL)</div>' +
          '<p>The hardest of the six: confounding (needs IPTW) plus censoring (needs IPCW), with the two weight layers multiplied.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>survival object <code>survival::Surv(time, status)</code> (two-column matrix)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>t0</code></td><td>Effect time point; CATE = S(t0) difference. The engine defaults to the median event time when omitted</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.387    0.292\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.1362236</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 06 (survival × observational).</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p><strong>Always state <code>t0</code> when reporting survival results</strong> — the survival effect is time-point dependent. Censoring is about 29% here; ignoring it conflates censoring with events.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemosurv = {

  zh: {
    title: "mlr3HTE_demo_surv()",
    lede: "随机化试验 + 生存结局的演示数据，含删失但无混杂。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_surv()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_surv()(n = 2000, seed = NULL)</div>' +
          '<p>处理随机化，但结局是生存数据，删失约 30%。这时只需要 IPCW 校正，不需要 IPTW。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>内容</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>协变变 data.frame：cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>处理指示（0/1 整数）</td></tr>' +
          '<tr><td><code>Y</code></td><td>生存对象 <code>survival::Surv(time, status)</code>（两列矩阵）</td></tr>' +
          '<tr><td><code>ate</code></td><td>真实平均处理效应（可作对账标尾）</td></tr>' +
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>t0</code></td><td>效应时点；CATE = S(t0) 差。不传时引擎取事件时间中位数</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> 是样本量，<code>seed</code> 固定随机流；' +
          '不传 <code>seed</code> 时每次生成的数据不同，' +
          '但真值 <code>ate</code> / <code>tau</code> 由 DGP 决定，不随样本潮用而变。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>（n = 1200，seed 如代码所示）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.531    0.302\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.5624068</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 05（生存 × RCT）的数据源。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p>基学习器用字符串 <code>"coxph"</code> 或 <code>"ranger"</code>（原生引擎），不是 mlr3 learner 对象。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_demo_surv()",
    lede: "Demo data for a randomized trial with a survival outcome: censoring but no confounding.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_demo_surv()<span class="badge">demo data</span></div>' +
          '<div class="fn-sig">mlr3HTE_demo_surv()(n = 2000, seed = NULL)</div>' +
          '<p>Treatment is randomized, but the outcome is survival data with about 30% censoring. Only IPCW correction is needed here, not IPTW.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Contents</th></tr></thead><tbody>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame: cols = <code>age, lac, tumor, sex</code></td></tr>' +
          '<tr><td><code>A</code></td><td>Treatment indicator (0/1 integer)</td></tr>' +
          '<tr><td><code>Y</code></td><td>survival object <code>survival::Surv(time, status)</code> (two-column matrix)</td></tr>' +
          '<tr><td><code>ate</code></td><td>True average treatment effect (reconciliation anchor)</td></tr>' +
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>t0</code></td><td>Effect time point; CATE = S(t0) difference. The engine defaults to the median event time when omitted</td></tr>' +
          '</tbody></table></div>' +
          '<p><code>n</code> is the sample size and <code>seed</code> fixes the random stream; ' +
          'without a seed each call differs, but the true <code>ate</code> / <code>tau</code> are ' +
          'set by the DGP and do not drift with sampling noise.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong> (n = 1200, seed as shown).</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.531    0.302\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.5624068</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 05 (survival × RCT).</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p>Base learners are the strings <code>"coxph"</code> or <code>"ranger"</code> (native engine), not mlr3 learner objects.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiqinicurve = {

  zh: {
    title: "qini_curve()",
    lede: "Qini 曲线：按估计 CATE 降序排列后，逐步增大“目标群体”时的累积增益。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>把样本按估计 CATE 从高到低排序，对每个前 k 比例的子群，计算其累积增益（用 IPW 评分），再除以全样本量。返回两列的 data.frame：<code>fraction</code> 与 <code>qini</code>，并附属性 <code>qini_at_full</code>（Q(1)）。</p>' +
          '<p><strong>不需要真实 tau</strong>，只需要 A、Y 和 CATE 排序，因此 RCT 现实数据上可用。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
          '<div class="callout warn"><div class="callout-title">随机基线不是精确的 0</div><p>归一化的 Qini 除以了随机线下的面积，而那个面积本身就f，单次随机排序能在 &plusmn;0.25 摆。比较模型要看相对次序。本包演示数据（n = 1500）上 10 次随机排序落在 &minus;0.253 到 0.227。</p></div>'
      }
    ]
  },

  en: {
    title: "qini_curve()",
    lede: "Qini curve: cumulative gain as the targeted population grows, ordered by estimated CATE.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Sorts the sample by estimated CATE descending and, for each top-k fraction, computes the cumulative gain (using an IPW score), divided by the sample size. Returns a two-column data.frame, <code>fraction</code> and <code>qini</code>, plus the attribute <code>qini_at_full</code> (Q(1)).</p>' +
          '<p><strong>Needs no true tau</strong> — only A, Y and the CATE ranking, so it works on real RCT data.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
          '<div class="callout warn"><div class="callout-title">The random baseline is not exactly 0</div><p>Normalised Qini divides by the area under the random line, which is itself small, so a single random ranking can swing &plusmn;0.25. Compare models by relative order. On this package&rsquo;s demo data (n = 1500), ten random rankings gave &minus;0.253 to 0.227.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiqinicoef = {

  zh: {
    title: "qini_coefficient()",
    lede: "Qini 系数：Qini 曲线与“随机目标线”之间夹的面积，把曲线厀成一个数。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_coefficient()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_coefficient(cate, A, Y, propensity = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>计算曲线下面积（梯形法）与随机目标线下面积 <code>0.5 × Q(1)</code> 之差。返回 list：<code>qini_coefficient</code>（绝对面积）、<code>qini_normalized</code>（归一化）、<code>auc</code>、<code>qini_at_full</code>。随机模型约为 0，完美排序为正。</p>' +
          '<p>如果你只想报一个数，报 <code>qini_normalized</code> ——它可跨场景比较，而绝对值受结局尺度影响。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
          '<p>注意实测里<strong>模型的绝对 Qini 系数（0.283）稍高于真实 tau（0.280）</strong>：单次实验里这种差异属于采样噪声，不能由此得出“模型超过真值”的结论。想要稳定结论，应该用 <a href="#/apihtebenchmark">hte_benchmark()</a> 做交叉拟合后的多种子对比。</p>'
      }
    ]
  },

  en: {
    title: "qini_coefficient()",
    lede: "Qini coefficient: the area between the Qini curve and the random-targeting line.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_coefficient()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_coefficient(cate, A, Y, propensity = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Computes the area under the curve (trapezoid) minus the area under the random-targeting line <code>0.5 × Q(1)</code>. Returns a list with <code>qini_coefficient</code> (absolute area), <code>qini_normalized</code>, <code>auc</code> and <code>qini_at_full</code>. A random model gives about 0; perfect ranking gives a positive value.</p>' +
          '<p>If you report a single number, report <code>qini_normalized</code> — it is comparable across scenarios, while the absolute value depends on the outcome scale.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
          '<p>Note that in this single run the <strong>model&rsquo;s absolute coefficient (0.283) is slightly above the true tau&rsquo;s (0.280)</strong>: that gap is sampling noise, not evidence the model beats the truth. For stable conclusions use <a href="#/apihtebenchmark">hte_benchmark()</a>, which cross-fits and compares across seeds.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apicforbenefit = {

  zh: {
    title: "c_for_benefit()",
    lede: "c-for-benefit：把处理组按预测收益与对照组做增益匹配，再算 C 统计量。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">c_for_benefit()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">c_for_benefit(cate, A, Y, caliper = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>将处理组按估计 CATE 降序排列，依次与对照组中预测收益最接近者配对，看配对后“预测收益”与“观测收益”是否一致。返回 list，主要看 <code>c_for_benefit</code>：0.5 = 排序等于随机，越大越好。详情可看 <code>n_pairs</code> / <code>n_concordant</code> / <code>n_discordant</code>。</p>' +
          '<p><strong>观察性数据必须传三件套</strong>（<code>propensity</code> + <code>mu1</code> + <code>mu0</code>），只给 <code>propensity</code> 会直接报错——因为 HT 评分的采样噪声会把 C 统计量压到随机线以下。三件套可用 <a href="#/apidrpseudo">dr_pseudo_outcome()</a> 一次拿到。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
          '<p>本演示数据上模型值 0.663 高于真实 tau 的 0.624——这是因为 CATE 是在<strong>自己的训练数据上</strong>计的（in-fold）。做真实评价请用 <a href="#/apihtebenchmark">hte_benchmark()</a>，它强制交叉拟合，同一个 X-learner 会回落到 0.617。</p>'
      }
    ]
  },

  en: {
    title: "c_for_benefit()",
    lede: "c-for-benefit: C statistic after gain-matching treated to controls by predicted benefit.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">c_for_benefit()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">c_for_benefit(cate, A, Y, caliper = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Sorts the treated by estimated CATE descending and matches each to the control with the closest predicted benefit, then checks whether predicted and observed benefit agree. Returns a list; the headline is <code>c_for_benefit</code>: 0.5 means the ranking is as good as random, larger is better. Details in <code>n_pairs</code> / <code>n_concordant</code> / <code>n_discordant</code>.</p>' +
          '<p><strong>Observational data requires the full doubly-robust triple</strong> (<code>propensity</code> + <code>mu1</code> + <code>mu0</code>); passing only the propensity raises an error, because the Horvitz-Thompson score&rsquo;s sampling noise drives the C statistic below the random line. Get the triple from <a href="#/apidrpseudo">dr_pseudo_outcome()</a>.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
          '<p>On this demo data the model&rsquo;s 0.663 exceeds the true tau&rsquo;s 0.624 — because the CATE was computed <strong>in-fold</strong>, on its own training data. For an honest evaluation use <a href="#/apihtebenchmark">hte_benchmark()</a>, which enforces cross-fitting; the same X-learner then falls back to 0.617.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apitoccurve = {

  zh: {
    title: "toc_curve()",
    lede: "TOC 曲线：按效应排序后，各分位目标群体的平均处理效应。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">toc_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">toc_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>与 Qini 类似，但线的纲是<strong>平均效应</strong>而不是累积增益，所以可以直接和全样本 ATE（属性 <code>overall_ate</code>）比。俪用的是有效样本量 &Sigma;w 而不是 k，生存结局下 t0 前删失者权重为 0，用 k 会把平均效应稀释。</p>' +
          '<p>最左端（k 很小）只对应一两个观测，值是单个个体的效应，能把纵轴拉到几十倍 ATE。画图时建议从前 5% 开始（<a href="#/apiplotbenchmark">plot_hte_benchmark()</a> 默认就这样）。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
          '<p>实测里前 10% 目标群体的平均效应是 2.44，而全样本 ATE 是 1.07——前排人群的收益明显更高，说明排序有信息量。若曲线一直贴着水平线，则模型没分辩出可利用的异质性。</p>'
      }
    ]
  },

  en: {
    title: "toc_curve()",
    lede: "TOC curve: average treatment effect within each top-k targeted group, ordered by effect.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">toc_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">toc_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Similar to the Qini curve, but the y-axis is the <strong>average effect</strong> rather than cumulative gain, so it can be read directly against the overall ATE (attribute <code>overall_ate</code>). The denominator is the effective sample size &Sigma;w rather than k: under survival outcomes, those censored before t0 carry weight 0, and using k would dilute the average effect.</p>' +
          '<p>At the far left (very small k) each point is one or two observations, whose individual effect can stretch the y-axis to tens of times the ATE. Start plots at the first 5% (<a href="#/apiplotbenchmark">plot_hte_benchmark()</a> does this by default).</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
          '<p>In this run the top 10% group has an average effect of 2.44 against an overall ATE of 1.07 — the top-ranked group clearly benefits more, so the ranking carries information. If the curve hugs the horizontal line, the model found no exploitable heterogeneity.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidrpseudo = {

  zh: {
    title: "dr_pseudo_outcome()",
    lede: "双重健壮虚拟结局（AIPW）：观察性数据上做 HTE 评价的入口。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_pseudo_outcome()<span class="badge">observational</span></div>' +
          '<div class="fn-sig">dr_pseudo_outcome(X, A, Y, cross_fitting = TRUE, n_folds = 5L, learner_ps = classif.log_reg, learner_outcome = regr.ranger, t0 = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>计算 <code>Y*</code>：<code>Y* = (μ̂₁ - μ̂₀) + A(Y - μ̂₁)/e - (1-A)(Y - μ̂₀)/(1-e)</code>，满足 E[Y*|X] = τ(X)，且<strong>结局模型与倾向得分模型只要有一个对就无偏</strong>。返回 <code>pseudo</code>、<code>mu1</code>、<code>mu0</code>、<code>propensity</code>、<code>ate</code> 等。前三项正好是 <a href="#/apicforbenefit">c_for_benefit()</a> 需要的三件套。</p>' +
          '<div class="callout warn"><div class="callout-title">默认开交叉拟合，别关</div><p>干扰参数都在 K 折的<strong>训练折</strong>上拟合、留出折上预测。若用全样本拟合再回代自己（in-fold），Y* 里的 μ̂₁−μ̂₀ 与被评价的 CATE 出自同一个模型，配对时会把“观测收益”人为对齐到“预测收益”，导致 c-for-benefit 虚高。实测 in-fold 会出现“模型 0.754 &gt; 真 tau 0.717”的倒挂，交叉拟合后恢复为 0.662 ≤ 0.669。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\nnames(dr)\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"       \n[6] "t0"         "effect"    \n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
          '<p>实测里 DR 估计的 ATE 为 0.979，真值 1.04；这量级偏差在 n = 1200 上属于正常采样潮用，且它比未校正的算算本身（约 1.74）小一个数量级。</p>'
      }
    ]
  },

  en: {
    title: "dr_pseudo_outcome()",
    lede: "Doubly robust pseudo-outcomes (AIPW): the entry point for HTE evaluation on observational data.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_pseudo_outcome()<span class="badge">observational</span></div>' +
          '<div class="fn-sig">dr_pseudo_outcome(X, A, Y, cross_fitting = TRUE, n_folds = 5L, learner_ps = classif.log_reg, learner_outcome = regr.ranger, t0 = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Computes <code>Y*</code>: <code>Y* = (μ̂₁ - μ̂₀) + A(Y - μ̂₁)/e - (1-A)(Y - μ̂₀)/(1-e)</code>, which satisfies E[Y*|X] = τ(X) and is <strong>unbiased as long as either the outcome model or the propensity model is correct</strong>. Returns <code>pseudo</code>, <code>mu1</code>, <code>mu0</code>, <code>propensity</code>, <code>ate</code>, and more. The first three are exactly the triple <a href="#/apicforbenefit">c_for_benefit()</a> needs.</p>' +
          '<div class="callout warn"><div class="callout-title">Cross-fitting is on by default — leave it</div><p>Nuisance parameters are fitted on the <strong>training folds</strong> and predicted on held-out folds. With full-sample in-fold fitting, the μ̂₁−μ̂₀ inside Y* comes from the same model as the CATE being evaluated, and matching then artificially aligns observed to predicted benefit, inflating c-for-benefit. Measured: in-fold produces the inversion "model 0.754 &gt; true tau 0.717"; cross-fitting restores 0.662 ≤ 0.669.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\nnames(dr)\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"       \n[6] "t0"         "effect"    \n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
          '<p>The DR-estimated ATE here is 0.979 against a truth of 1.04; a gap of this size at n = 1200 is ordinary sampling noise, and it is an order of magnitude smaller than the unadjusted estimate (about 1.74).</p>'
      }
    ]
  }
};

window.SITE_PAGES.apihtebenchmark = {

  zh: {
    title: "hte_benchmark()",
    lede: "在 RCT 数据上对多个 meta-learner 做基准测试，指标不依赖真实 tau。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<p>用归一化 Qini 系数、绝对 Qini 系数、TOC 增益、c-for-benefit 四个指标比较多个 learner。返回 list：<code>table</code>（一行一个 learner）、<code>cate</code>（交叉拟合留出预测的长表）、<code>curves</code>、<code>truth</code>、<code>setup</code>。</p>' +
          '<div class="callout ok"><div class="callout-title">三件关键设计</div><ul><li><strong>交叉拟合强制</strong>：每个 learner 在 K 折训练折上拟合、留出折上预测，折<strong>按处理组分层</strong>。in-fold 会让 c-for-benefit 虚高到超过真实 tau（实测 0.663 &gt; 0.624）。</li><li><strong>不需要倾向得分</strong>：指标只依赖随机化带来的可交换性，因此现实 RCT 数据可用。</li><li><strong>可选 tau</strong>：模拟数据传了就多输出 <code>tau_cor</code> / <code>tau_rmse</code> 两列，两套指标可照着看。</li></ul></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>。</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
          '<p>实测里 <strong>R-learner 的 ATE 只有 0.498（真值 1.049），但 qini_normalized 和 toc_gain 都是五族里最高的</strong>。原因：R 二阶段对伪结果回归，没有尺度约束，CATE 可以整体缩小一半而排序不变；Qini / TOC 只看排序，对尺度错误视而不见。<strong>所以 ATE 和 Qini 必须一起报。</strong></p><p>观察性数据把 <code>propensity</code> / <code>mu1</code> / <code>mu0</code>（<a href="#/apidrpseudo">dr_pseudo_outcome()</a> 的输出）一起传进来即可，指标算法不变。</p>'
      }
    ]
  },

  en: {
    title: "hte_benchmark()",
    lede: "Benchmark several meta-learners on RCT data; the metrics need no true tau.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<p>Compares learners on normalised Qini coefficient, absolute Qini coefficient, TOC gain and c-for-benefit. Returns a list: <code>table</code> (one row per learner), <code>cate</code> (long-format out-of-fold predictions), <code>curves</code>, <code>truth</code>, <code>setup</code>.</p>' +
          '<div class="callout ok"><div class="callout-title">Three key design choices</div><ul><li><strong>Cross-fitting is enforced</strong>: each learner is fitted on K&minus;1 folds and predicts on the held-out fold, with folds <strong>stratified by treatment arm</strong>. In-fold scoring pushes c-for-benefit above the true tau (measured 0.663 &gt; 0.624).</li><li><strong>No propensity score needed</strong>: the metrics rest only on the exchangeability randomization buys, so real RCT data works.</li><li><strong>Optional tau</strong>: supplying it on simulated data adds <code>tau_cor</code> / <code>tau_rmse</code>, so both metric families can be read side by side.</li></ul></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
          '<p>In this run <strong>the R-learner&rsquo;s ATE is only 0.498 against a truth of 1.049, yet its qini_normalized and toc_gain are the highest of the five</strong>. Reason: the R-learner&rsquo;s second stage regresses pseudo-outcomes with no scale constraint, so CATE can shrink overall while the ranking survives; Qini / TOC look only at ranking and are blind to scale errors. <strong>So ATE and Qini must be reported together.</strong></p><p>For observational data, pass <code>propensity</code> / <code>mu1</code> / <code>mu0</code> (the output of <a href="#/apidrpseudo">dr_pseudo_outcome()</a>); the metric definitions are unchanged.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotbenchmark = {

  zh: {
    title: "plot_hte_benchmark()",
    lede: "把 hte_benchmark() 存下来的 Qini / TOC 曲线按 learner 分面画出来。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>一工式绘图：自动加参考线（Qini 用随机目标线，TOC 用全样本 ATE 水平线），按 learner 分面，图例隐去。返回一个 ggplot2 对象，可继续 <code>+ labs()</code> 定制。</p>' +
          '<p><code>min_fraction</code> 默认 0.05：TOC / Qini 在最左端只对应一两个观测，值是单个个体的效应，能把纵轴拉到几十倍 ATE，剩余曲线全被压扁。想看全局就传 <code>min_fraction = 0</code>。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>。</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>教程里嵌的两张对比图（<code>docs/assets/img/benchmark/qini_curves.png</code> 与 <code>toc_curves.png</code>）就是这个函数生成的。</p>'
      }
    ]
  },

  en: {
    title: "plot_hte_benchmark()",
    lede: "Faceted plot of the Qini / TOC curves stored by hte_benchmark().",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>One-call plotting: adds the reference line automatically (random targeting for Qini, overall ATE for TOC), facets by learner, and hides the legend since the facet titles already say it. Returns a ggplot2 object you can keep customising with <code>+ labs()</code>.</p>' +
          '<p><code>min_fraction</code> defaults to 0.05: at the far left of a TOC / Qini curve each point is one or two observations, whose individual effect can stretch the y-axis to tens of times the ATE and flatten everything else. Pass <code>min_fraction = 0</code> for the full view.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>The two comparison figures embedded in the tutorial (<code>docs/assets/img/benchmark/qini_curves.png</code> and <code>toc_curves.png</code>) were produced by this function.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apicateci = {

  zh: {
    title: "cate_ci()",
    lede: "CATE / ATE 的自助法置信区间。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">helper</span></div>' +
          '<div class="fn-sig">cate_ci(type, X, A, Y, B = 100, level = 0.95, seed = NULL, newX = NULL, ...)</div>' +
          '<p>对整条拟合流程做 B 次自助重采样（有放回抽同样本量的行），用百分位数法给出逐点 CATE 区间与 ATE 区间。返回 <code>cate_lo</code> / <code>cate_hi</code> / <code>ate_lo</code> / <code>ate_hi</code> / <code>cate_mean</code> / <code>ate</code> / <code>B</code> / <code>level</code>。</p>' +
          '<div class="callout warn"><div class="callout-title">区间只反是采样变异</div><p>这是<strong>非参数自助法</strong>，只覆盖采样噪声，不覆盖模型误定。每次要重新拟合，B 大时开销不小。若你关心的是排序能力而不是绝对尺度，请改用 <a href="#/apihtebenchmark">hte_benchmark()</a>。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 800, seed = 1201)</code>；为了速度 B 只取 30。</p>' +
          '<pre><code>ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
          '<p>实测里 ATE = 1.05，95% 区间 0.923–1.20（真值 1.049，落在区间内）。注意逐人 CATE 的区间宽得多（前 3 人宽度 0.86–2.35），这很正常——个体效应本来就比平均效应难估。</p>'
      }
    ]
  },

  en: {
    title: "cate_ci()",
    lede: "Bootstrap confidence intervals for CATE / ATE.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">helper</span></div>' +
          '<div class="fn-sig">cate_ci(type, X, A, Y, B = 100, level = 0.95, seed = NULL, newX = NULL, ...)</div>' +
          '<p>Resamples the whole fitting pipeline B times (rows drawn with replacement, same size) and gives percentile intervals for per-point CATE and for the ATE. Returns <code>cate_lo</code> / <code>cate_hi</code> / <code>ate_lo</code> / <code>ate_hi</code> / <code>cate_mean</code> / <code>ate</code> / <code>B</code> / <code>level</code>.</p>' +
          '<div class="callout warn"><div class="callout-title">Intervals cover sampling variation only</div><p>This is a <strong>non-parametric bootstrap</strong>: it reflects sampling variation, not model misspecification. Each replicate refits from scratch, so large B is expensive. If you care about ranking power rather than absolute scale, use <a href="#/apihtebenchmark">hte_benchmark()</a> instead.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 800, seed = 1201)</code>; B is only 30 for speed.</p>' +
          '<pre><code>ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
          '<p>Here ATE = 1.05 with a 95% interval of 0.923–1.20 (truth 1.049, inside the interval). Note how much wider the per-person CATE intervals are (widths 0.86–2.35 for the first three) — that is normal; individual effects are intrinsically harder to estimate than the average.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotqini = {

  zh: {
    title: "plot_qini()",
    lede: "快速画一条 Qini 曲线（base graphics）。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>用 base graphics 画 <code>qini_curve()</code> 的返回值，带上随机目标线（灰虚线），不返回可见值。需要分面对比多个 learner 时，用 <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>。</p>' +
          '<p>实测曲线共 1501 个点（n = 1500 加原点）。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据同 <a href="#/apiqinicurve">qini_curve()</a> 示例。</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>如果你已经在用 ggplot2，可以自己画：<code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>。这个函数的定位是快速看一眼。</p>'
      }
    ]
  },

  en: {
    title: "plot_qini()",
    lede: "Quick Qini curve plot (base graphics).",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>Plots the return value of <code>qini_curve()</code> with base graphics, including the random targeting line (grey dashed). Returns invisibly. For faceted multi-learner comparison use <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>.</p>' +
          '<p>The measured curve has 1501 points (n = 1500 plus the origin).</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Same background data as the <a href="#/apiqinicurve">qini_curve()</a> example.</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>If you already work with ggplot2 you can draw it yourself: <code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>. This function is positioned as a quick look.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidag = {

  zh: {
    title: "mlr3HTE_dag()",
    lede: "画 HTE 场景的因果图（ggplot2 对象）。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag(design = c("rct", "obs"), outcome = c("continuous", "binary", "survival"))</div>' +
          '<p>按设计（<code>rct</code> / <code>obs</code>）和结局类型返回一张 DAG：协变变 X 同时影响处理 A 与结局 Y，A→Y 的效应随 X 变化。用于说明为什么要调整 X。返回值是 ggplot2 对象，可继续 <code>+</code> 定制。</p>' +
          '<p>图层由 <code>GeomSegment</code>（边）与 <code>GeomLabel</code>（节点）组成，共 2 层。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。无额外输入。</p>' +
          '<pre><code>for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n        collapse = ", "), "\\n")\n}</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>===== design =  rct  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n===== design =  obs  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n# 直接把它 print 出来就是一张 DAG 图（见 docs/assets/img/dag/）</code></pre>' +
          '<p>教程与文档站里嵌的 DAG 图（<code>docs/assets/img/dag/</code>）就是这个函数生成后导出的。RCT 版没有 <code>X → A</code> 这条边，观察性版有——这就是两者的核心差异。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_dag()",
    lede: "Draws the causal diagram for an HTE setting (a ggplot2 object).",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag(design = c("rct", "obs"), outcome = c("continuous", "binary", "survival"))</div>' +
          '<p>Returns a DAG for a given design (<code>rct</code> / <code>obs</code>) and outcome type: covariates X affect both treatment A and outcome Y, and the A→Y effect varies with X. Useful for explaining why X must be adjusted for. The return value is a ggplot2 object.</p>' +
          '<p>The layers are <code>GeomSegment</code> (edges) plus <code>GeomLabel</code> (nodes), two in total.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. No extra input.</p>' +
          '<pre><code>for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n        collapse = ", "), "\\n")\n}</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>===== design =  rct  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n===== design =  obs  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n# 直接把它 print 出来就是一张 DAG 图（见 docs/assets/img/dag/）</code></pre>' +
          '<p>The DAG figures embedded in the tutorial and docs site (<code>docs/assets/img/dag/</code>) are exports of this function. The RCT version has no <code>X → A</code> edge while the observational version does — that is the core difference between the two.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apilrn = {

  zh: {
    title: "lrn()",
    lede: "从 mlr3 再导出的 lrn()，省得额外 library(mlr3)。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn()<span class="badge">re-export</span></div>' +
          '<div class="fn-sig">lrn(...)  # mlr3::lrn 的再导出</div>' +
          '<p>就是 <code>mlr3::lrn()</code>。再导出很实用：教程与示例里大量出现 <code>lrn("regr.ranger")</code>，加载了 mlr3HTE 就能用。</p>' +
          '<p>实测里 <code>identical(l, mlr3::lrn(...))</code> 返回 <code>FALSE</code>——这不是问题：R6 对象每次构造都是新实例，<code>identical()</code> 比较的是对象身份而不是类型与参数。要看类型就 <code>class(l)</code>，要看参数就 <code>l$param_set$values</code>。</p>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。无额外输入。</p>' +
          '<pre><code>l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
          '<p>所有可用的学习器列表见 mlr3 自己的文档；mlr3HTE 只负责把它们接进 meta-learner 框架。选择时要注意与结局类型匹配：连续用 <code>regr.*</code>，二分类用 <code>classif.*</code>，生存用字符串 <code>"coxph"</code> / <code>"ranger"</code>。</p>'
      }
    ]
  },

  en: {
    title: "lrn()",
    lede: "mlr3&rsquo;s lrn() re-exported, so you can skip loading mlr3 separately.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn()<span class="badge">re-export</span></div>' +
          '<div class="fn-sig">lrn(...)  # mlr3::lrn 的再导出</div>' +
          '<p>Simply <code>mlr3::lrn()</code>. The re-export is practical: tutorials and examples are full of <code>lrn("regr.ranger")</code>, and loading mlr3HTE alone is enough.</p>' +
          '<p>In the run, <code>identical(l, mlr3::lrn(...))</code> returns <code>FALSE</code> — that is not a problem: R6 objects are new instances each time, and <code>identical()</code> compares object identity, not class or parameters. Use <code>class(l)</code> for the type and <code>l$param_set$values</code> for the parameters.</p>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. No extra input.</p>' +
          '<pre><code>l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
          '<p>The full list of learners lives in mlr3&rsquo;s own documentation; mlr3HTE only wires them into the meta-learner framework. Match the learner to the outcome type: <code>regr.*</code> for continuous, <code>classif.*</code> for binary, and the strings <code>"coxph"</code> / <code>"ranger"</code> for survival.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apishortcuts = {

  zh: {
    title: "五种 meta-learner 快捷函数",
    lede: "metalearner() 的五个别名，拟合后直接返回训练集上的 CATE 向量。每个函数一个独立页面，含实测示例。",
    sections: [
      {
        id: "list",
        heading: "组内函数",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apis"><span class="art-num">S</span><span class="art-body"><strong>s_learner()</strong><em>一个模型学两个臂；最快，但异质性容易被“正则化”掉。</em></span></a></li>' +
          '<li><a href="#/apit"><span class="art-num">T</span><span class="art-body"><strong>t_learner()</strong><em>两个独立模型相减；每个臂只用一半样本。</em></span></a></li>' +
          '<li><a href="#/apix"><span class="art-num">X</span><span class="art-body"><strong>x_learner()</strong><em>两阶段：用对照组预测处理组虚拟结局再回归。本包演示数据上相关最高。</em></span></a></li>' +
          '<li><a href="#/apir"><span class="art-num">R</span><span class="art-body"><strong>r_learner()</strong><em>残差化后回归；统计效率高，但二阶段无尺度约束，ATE 可能偏很多。</em></span></a></li>' +
          '<li><a href="#/apidr"><span class="art-num">DR</span><span class="art-body"><strong>dr_learner()</strong><em>双重健壮虚拟结局：结局模型与倾向得分一个对就行。</em></span></a></li>' +
          '</ul>' +
          '<p>需要对新数据预测、或要改变权重 / 引擎等设定时，用 <a href="#/apimetalearner">metalearner()</a>。</p>'
      }
    ]
  },

  en: {
    title: "Five meta-learner shortcuts",
    lede: "Five aliases of metalearner() that return the training-set CATE vector directly. One page per function, each with a worked example.",
    sections: [
      {
        id: "list",
        heading: "Functions in this group",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apis"><span class="art-num">S</span><span class="art-body"><strong>s_learner()</strong><em>One model for both arms; fastest, but heterogeneity gets regularised away.</em></span></a></li>' +
          '<li><a href="#/apit"><span class="art-num">T</span><span class="art-body"><strong>t_learner()</strong><em>Two independent models differenced; each arm uses half the sample.</em></span></a></li>' +
          '<li><a href="#/apix"><span class="art-num">X</span><span class="art-body"><strong>x_learner()</strong><em>Two-stage: predict treated pseudo-outcomes with the control model, then regress. Highest correlation on this package\'s demo data.</em></span></a></li>' +
          '<li><a href="#/apir"><span class="art-num">R</span><span class="art-body"><strong>r_learner()</strong><em>Residualise then regress; efficient, but the second stage has no scale constraint so the ATE can be badly off.</em></span></a></li>' +
          '<li><a href="#/apidr"><span class="art-num">DR</span><span class="art-body"><strong>dr_learner()</strong><em>Doubly robust pseudo-outcomes: correct if either the outcome or the propensity model is right.</em></span></a></li>' +
          '</ul>' +
          '<p>To predict on new data, or to change the weighting / engine settings, use <a href="#/apimetalearner">metalearner()</a>.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidemo = {

  zh: {
    title: "演示数据集",
    lede: "六个自带真实 tau 与 ate 的模拟数据集，覆盖「三类结局 × 随机化/观察性」。每个生成器一个独立页面。",
    sections: [
      {
        id: "list",
        heading: "组内函数",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apidemodata"><span class="art-num">1</span><span class="art-body"><strong>mlr3HTE_demo_data()</strong><em>随机化 + 连续结局；无混杂，适合纯方法对比。</em></span></a></li>' +
          '<li><a href="#/apidemobinary"><span class="art-num">2</span><span class="art-body"><strong>mlr3HTE_demo_binary()</strong><em>随机化 + 二分类；CATE 落在风险差尺度。</em></span></a></li>' +
          '<li><a href="#/apidemoobs"><span class="art-num">3</span><span class="art-body"><strong>mlr3HTE_demo_obs()</strong><em>观察性 + 连续；含已测量混杂与真实 ps_true。</em></span></a></li>' +
          '<li><a href="#/apidemoobsbinary"><span class="art-num">4</span><span class="art-body"><strong>mlr3HTE_demo_obs_binary()</strong><em>观察性 + 二分类；同一套混杂。</em></span></a></li>' +
          '<li><a href="#/apidemoobssurv"><span class="art-num">5</span><span class="art-body"><strong>mlr3HTE_demo_obs_surv()</strong><em>观察性 + 生存：混杂与删失同时存在，两层权重相乘。</em></span></a></li>' +
          '<li><a href="#/apidemosurv"><span class="art-num">6</span><span class="art-body"><strong>mlr3HTE_demo_surv()</strong><em>随机化 + 生存；有删失但无混杂，只需 IPCW。</em></span></a></li>' +
          '</ul>' +
          '<p>真值 <code>tau</code> 只有模拟数据才给得出。现实 RCT 数据评价排序能力，请用 <a href="#/apihtebenchmark">hte_benchmark()</a>。</p>'
      }
    ]
  },

  en: {
    title: "Demo datasets",
    lede: "Six simulated datasets carrying true tau and ate, covering three outcome types by randomized / observational. One page per generator.",
    sections: [
      {
        id: "list",
        heading: "Functions in this group",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apidemodata"><span class="art-num">1</span><span class="art-body"><strong>mlr3HTE_demo_data()</strong><em>Randomized + continuous outcome; no confounding, ideal for clean method comparison.</em></span></a></li>' +
          '<li><a href="#/apidemobinary"><span class="art-num">2</span><span class="art-body"><strong>mlr3HTE_demo_binary()</strong><em>Randomized + binary outcome; CATE on the risk-difference scale.</em></span></a></li>' +
          '<li><a href="#/apidemoobs"><span class="art-num">3</span><span class="art-body"><strong>mlr3HTE_demo_obs()</strong><em>Observational + continuous; measured confounding plus the true ps_true.</em></span></a></li>' +
          '<li><a href="#/apidemoobsbinary"><span class="art-num">4</span><span class="art-body"><strong>mlr3HTE_demo_obs_binary()</strong><em>Observational + binary; same confounding structure.</em></span></a></li>' +
          '<li><a href="#/apidemoobssurv"><span class="art-num">5</span><span class="art-body"><strong>mlr3HTE_demo_obs_surv()</strong><em>Observational + survival: confounding and censoring together, two weight layers multiplied.</em></span></a></li>' +
          '<li><a href="#/apidemosurv"><span class="art-num">6</span><span class="art-body"><strong>mlr3HTE_demo_surv()</strong><em>Randomized + survival: censoring but no confounding, IPCW only.</em></span></a></li>' +
          '</ul>' +
          '<p>The true <code>tau</code> only exists in simulated data. To evaluate ranking power on real RCT data, use <a href="#/apihtebenchmark">hte_benchmark()</a>.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apimetrics = {

  zh: {
    title: "HTE 评价指标",
    lede: "四个指标加一个观察性数据的干扰参数估计器。每个函数一个独立页面，示例全部实测。",
    sections: [
      {
        id: "list",
        heading: "组内函数",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apiqinicurve"><span class="art-num">1</span><span class="art-body"><strong>qini_curve()</strong><em>Qini 曲线：累积增益随目标比例的变化。</em></span></a></li>' +
          '<li><a href="#/apiqinicoef"><span class="art-num">2</span><span class="art-body"><strong>qini_coefficient()</strong><em>把 Qini 曲线厎成一个数；报告时优先用归一化版。</em></span></a></li>' +
          '<li><a href="#/apicforbenefit"><span class="art-num">3</span><span class="art-body"><strong>c_for_benefit()</strong><em>增益匹配后的 C 统计量；0.5 = 排序等于随机。</em></span></a></li>' +
          '<li><a href="#/apitoccurve"><span class="art-num">4</span><span class="art-body"><strong>toc_curve()</strong><em>TOC 曲线：各分位目标群体的平均效应，可直接和 ATE 比。</em></span></a></li>' +
          '<li><a href="#/apidrpseudo"><span class="art-num">5</span><span class="art-body"><strong>dr_pseudo_outcome()</strong><em>双重健壮虚拟结局；观察性数据评价的入口。</em></span></a></li>' +
          '</ul>' +
          '<p>四个指标都<strong>不需要真实 tau</strong>，只依赖 A、Y 与 CATE 排序，因此 RCT 现实数据上可用。想一次比较多个 learner，用 <a href="#/apihtebenchmark">hte_benchmark()</a>。</p>'
      }
    ]
  },

  en: {
    title: "HTE evaluation metrics",
    lede: "Four metrics plus one nuisance-parameter estimator for observational data. One page per function, all examples actually run.",
    sections: [
      {
        id: "list",
        heading: "Functions in this group",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apiqinicurve"><span class="art-num">1</span><span class="art-body"><strong>qini_curve()</strong><em>Qini curve: cumulative gain against targeted fraction.</em></span></a></li>' +
          '<li><a href="#/apiqinicoef"><span class="art-num">2</span><span class="art-body"><strong>qini_coefficient()</strong><em>Collapses the Qini curve to one number; prefer the normalised version when reporting.</em></span></a></li>' +
          '<li><a href="#/apicforbenefit"><span class="art-num">3</span><span class="art-body"><strong>c_for_benefit()</strong><em>C statistic after gain matching; 0.5 means the ranking is as good as random.</em></span></a></li>' +
          '<li><a href="#/apitoccurve"><span class="art-num">4</span><span class="art-body"><strong>toc_curve()</strong><em>TOC curve: average effect per targeted fraction, readable against the ATE.</em></span></a></li>' +
          '<li><a href="#/apidrpseudo"><span class="art-num">5</span><span class="art-body"><strong>dr_pseudo_outcome()</strong><em>Doubly robust pseudo-outcomes; the entry point for observational evaluation.</em></span></a></li>' +
          '</ul>' +
          '<p>All four metrics <strong>need no true tau</strong> — only A, Y and the CATE ranking — so they work on real RCT data. To compare several learners at once, use <a href="#/apihtebenchmark">hte_benchmark()</a>.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apihelpers = {

  zh: {
    title: "辅助函数",
    lede: "置信区间、快速绘图与因果图。每个函数一个独立页面。",
    sections: [
      {
        id: "list",
        heading: "组内函数",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apicateci"><span class="art-num">1</span><span class="art-body"><strong>cate_ci()</strong><em>CATE / ATE 的自助法区间；只覆盖采样变异。</em></span></a></li>' +
          '<li><a href="#/apiplotqini"><span class="art-num">2</span><span class="art-body"><strong>plot_qini()</strong><em>快速画一条 Qini 曲线（base graphics）。</em></span></a></li>' +
          '<li><a href="#/apidag"><span class="art-num">3</span><span class="art-body"><strong>mlr3HTE_dag()</strong><em>画 HTE 场景的因果图；RCT 版没有 X → A 这条边。</em></span></a></li>' +
          '</ul>' +
          '<p>需要按 learner 分面的曲线对比，用 <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>。</p>'
      }
    ]
  },

  en: {
    title: "Helpers",
    lede: "Confidence intervals, quick plotting and causal diagrams. One page per function.",
    sections: [
      {
        id: "list",
        heading: "Functions in this group",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apicateci"><span class="art-num">1</span><span class="art-body"><strong>cate_ci()</strong><em>Bootstrap intervals for CATE / ATE; covers sampling variation only.</em></span></a></li>' +
          '<li><a href="#/apiplotqini"><span class="art-num">2</span><span class="art-body"><strong>plot_qini()</strong><em>Quick Qini curve plot (base graphics).</em></span></a></li>' +
          '<li><a href="#/apidag"><span class="art-num">3</span><span class="art-body"><strong>mlr3HTE_dag()</strong><em>Draws the HTE causal diagram; the RCT version has no X → A edge.</em></span></a></li>' +
          '</ul>' +
          '<p>For faceted curve comparison by learner, use <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apibenchmark = {

  zh: {
    title: "RCT 基准测试",
    lede: "在随机化试验数据上比较多个 meta-learner，指标不依赖真实 tau。",
    sections: [
      {
        id: "list",
        heading: "组内函数",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apihtebenchmark"><span class="art-num">1</span><span class="art-body"><strong>hte_benchmark()</strong><em>交叉拟合 + Qini / TOC / c-for-benefit 四个指标。</em></span></a></li>' +
          '<li><a href="#/apiplotbenchmark"><span class="art-num">2</span><span class="art-body"><strong>plot_hte_benchmark()</strong><em>按 learner 分面画曲线对比，自动加参考线。</em></span></a></li>' +
          '</ul>' +
          '<p>完整教程见 <a href="#/tutorialbenchmark">教程 · RCT 基准测试</a>。</p>'
      }
    ]
  },

  en: {
    title: "RCT benchmark",
    lede: "Compare several meta-learners on randomized-trial data; the metrics need no true tau.",
    sections: [
      {
        id: "list",
        heading: "Functions in this group",
        body:
          '<ul class="article-list">' +
          '<li><a href="#/apihtebenchmark"><span class="art-num">1</span><span class="art-body"><strong>hte_benchmark()</strong><em>Cross-fitting plus Qini / TOC / c-for-benefit.</em></span></a></li>' +
          '<li><a href="#/apiplotbenchmark"><span class="art-num">2</span><span class="art-body"><strong>plot_hte_benchmark()</strong><em>Faceted curve comparison with reference lines added.</em></span></a></li>' +
          '</ul>' +
          '<p>See the full walkthrough in <a href="#/tutorialbenchmark">the tutorial on RCT benchmarking</a>.</p>'
      }
    ]
  }
};
window.SITE_PAGES.api = {

  zh: {
    title: "函数文档",
    lede: "mlr3HTE 共导出 25 个对象：1 个主拟合函数、5 个 meta-learner 简写、1 个 Task 编码函数、1 个 R6 Learner 类、6 个演示数据集生成器、5 个 HTE 评价指标与干扰参数估计器、2 个基准测试函数、3 个辅助函数、1 个 mlr3 再导出。每个函数都有自己的页面，全部示例均为实测输出。",
    sections: [
      {
        id: "overview",
        heading: "函数总览",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>凂数</th><th>类别</th><th>一句话说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>主拟合</td><td>拟合任意 metalearner，返回可重复预测的对象</td></tr>' +
          '<tr><td><a href="#/apis"><code>s_learner()</code></a></td><td>便捷封装</td><td>S-learner 简写，直接返回 CATE 向量</td></tr>' +
          '<tr><td><a href="#/apit"><code>t_learner()</code></a></td><td>便捷封装</td><td>T-learner 简写，两个模型相减</td></tr>' +
          '<tr><td><a href="#/apix"><code>x_learner()</code></a></td><td>便捷封装</td><td>X-learner 简写，两阶段拟合</td></tr>' +
          '<tr><td><a href="#/apir"><code>r_learner()</code></a></td><td>便捷封装</td><td>R-learner 简写，残差化后回归</td></tr>' +
          '<tr><td><a href="#/apidr"><code>dr_learner()</code></a></td><td>便捷封装</td><td>DR-learner 简写，双重稳健伪结局</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task 编码</td><td>把 X/A/Y 编码成 mlr3 Task，三类结局统一</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td>lrn("regr.metalearner")，接入 mlr3 工作流</td></tr>' +
          '<tr><td><a href="#/apidemodata"><code>mlr3HTE_demo_data()</code></a></td><td>演示数据</td><td>随机化 + 连续结局</td></tr>' +
          '<tr><td><a href="#/apidemobinary"><code>mlr3HTE_demo_binary()</code></a></td><td>演示数据</td><td>随机化 + 二分类结局</td></tr>' +
          '<tr><td><a href="#/apidemoobs"><code>mlr3HTE_demo_obs()</code></a></td><td>演示数据</td><td>观察性 + 连续结局，含真实 ps_true</td></tr>' +
          '<tr><td><a href="#/apidemoobsbinary"><code>mlr3HTE_demo_obs_binary()</code></a></td><td>演示数据</td><td>观察性 + 二分类结局</td></tr>' +
          '<tr><td><a href="#/apidemoobssurv"><code>mlr3HTE_demo_obs_surv()</code></a></td><td>演示数据</td><td>观察性 + 生存结局，混杂与删失并存</td></tr>' +
          '<tr><td><a href="#/apidemosurv"><code>mlr3HTE_demo_surv()</code></a></td><td>演示数据</td><td>随机化 + 生存结局，只有删失</td></tr>' +
          '<tr><td><a href="#/apiqinicurve"><code>qini_curve()</code></a></td><td>HTE 评价</td><td>Qini 曲线：累积增益随靶向比例的变化</td></tr>' +
          '<tr><td><a href="#/apiqinicoef"><code>qini_coefficient()</code></a></td><td>HTE 评价</td><td>Qini 系数：把曲线压成一个数</td></tr>' +
          '<tr><td><a href="#/apicforbenefit"><code>c_for_benefit()</code></a></td><td>HTE 评价</td><td>增益匹配后的 C 统计量，0.5 = 随机</td></tr>' +
          '<tr><td><a href="#/apitoccurve"><code>toc_curve()</code></a></td><td>HTE 评价</td><td>TOC 曲线：各分位目标群的平均效应</td></tr>' +
          '<tr><td><a href="#/apidrpseudo"><code>dr_pseudo_outcome()</code></a></td><td>HTE 评价</td><td>双重稳健虚拟结局，观察性数据入口</td></tr>' +
          '<tr><td><a href="#/apihtebenchmark"><code>hte_benchmark()</code></a></td><td>基准测试</td><td>RCT 数据上比多个 learner，不依赖真实 tau</td></tr>' +
          '<tr><td><a href="#/apiplotbenchmark"><code>plot_hte_benchmark()</code></a></td><td>基准测试</td><td>按 learner 分面画 Qini / TOC 对比</td></tr>' +
          '<tr><td><a href="#/apicateci"><code>cate_ci()</code></a></td><td>辅助</td><td>CATE / ATE 的自助法置信区间</td></tr>' +
          '<tr><td><a href="#/apiplotqini"><code>plot_qini()</code></a></td><td>辅助</td><td>快速画一条 Qini 曲线</td></tr>' +
          '<tr><td><a href="#/apidag"><code>mlr3HTE_dag()</code></a></td><td>辅助</td><td>画 HTE 场景的因果图</td></tr>' +
          '<tr><td><a href="#/apilrn"><code>lrn()</code></a></td><td>再导出</td><td>从 mlr3 再导出，免额外加载</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  },

  en: {
    title: "API Reference",
    lede: "mlr3HTE exports 25 objects: one main fitting function, five meta-learner shorthands, one Task encoder, one R6 Learner class, six demo data generators, five HTE evaluation metrics plus a nuisance-parameter estimator, two benchmark functions, three helpers, and one mlr3 re-export. Every function has its own page, and every example is actually run.",
    sections: [
      {
        id: "overview",
        heading: "Function overview",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Category</th><th>In one line</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>Main fitting</td><td>Fit any meta-learner; returns a reusable object</td></tr>' +
          '<tr><td><a href="#/apis"><code>s_learner()</code></a></td><td>Shortcut</td><td>S-learner shorthand, returns the CATE vector</td></tr>' +
          '<tr><td><a href="#/apit"><code>t_learner()</code></a></td><td>Shortcut</td><td>T-learner shorthand, two models differenced</td></tr>' +
          '<tr><td><a href="#/apix"><code>x_learner()</code></a></td><td>Shortcut</td><td>X-learner shorthand, two-stage fitting</td></tr>' +
          '<tr><td><a href="#/apir"><code>r_learner()</code></a></td><td>Shortcut</td><td>R-learner shorthand, residualise then regress</td></tr>' +
          '<tr><td><a href="#/apidr"><code>dr_learner()</code></a></td><td>Shortcut</td><td>DR-learner shorthand, doubly robust pseudo-outcomes</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task encoding</td><td>Encode X/A/Y into an mlr3 Task, all outcome types</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td>lrn("regr.metalearner"), plugs into mlr3 workflows</td></tr>' +
          '<tr><td><a href="#/apidemodata"><code>mlr3HTE_demo_data()</code></a></td><td>Demo data</td><td>Randomized, continuous outcome</td></tr>' +
          '<tr><td><a href="#/apidemobinary"><code>mlr3HTE_demo_binary()</code></a></td><td>Demo data</td><td>Randomized, binary outcome</td></tr>' +
          '<tr><td><a href="#/apidemoobs"><code>mlr3HTE_demo_obs()</code></a></td><td>Demo data</td><td>Observational, continuous, with true ps_true</td></tr>' +
          '<tr><td><a href="#/apidemoobsbinary"><code>mlr3HTE_demo_obs_binary()</code></a></td><td>Demo data</td><td>Observational, binary outcome</td></tr>' +
          '<tr><td><a href="#/apidemoobssurv"><code>mlr3HTE_demo_obs_surv()</code></a></td><td>Demo data</td><td>Observational, survival; confounding and censoring</td></tr>' +
          '<tr><td><a href="#/apidemosurv"><code>mlr3HTE_demo_surv()</code></a></td><td>Demo data</td><td>Randomized, survival; censoring only</td></tr>' +
          '<tr><td><a href="#/apiqinicurve"><code>qini_curve()</code></a></td><td>HTE evaluation</td><td>Qini curve: cumulative gain vs targeted fraction</td></tr>' +
          '<tr><td><a href="#/apiqinicoef"><code>qini_coefficient()</code></a></td><td>HTE evaluation</td><td>Qini coefficient: collapses the curve to one number</td></tr>' +
          '<tr><td><a href="#/apicforbenefit"><code>c_for_benefit()</code></a></td><td>HTE evaluation</td><td>C statistic after gain matching; 0.5 = random</td></tr>' +
          '<tr><td><a href="#/apitoccurve"><code>toc_curve()</code></a></td><td>HTE evaluation</td><td>TOC curve: average effect per targeted fraction</td></tr>' +
          '<tr><td><a href="#/apidrpseudo"><code>dr_pseudo_outcome()</code></a></td><td>HTE evaluation</td><td>Doubly robust pseudo-outcomes; observational entry</td></tr>' +
          '<tr><td><a href="#/apihtebenchmark"><code>hte_benchmark()</code></a></td><td>Benchmark</td><td>Compare learners on RCT data, no true tau needed</td></tr>' +
          '<tr><td><a href="#/apiplotbenchmark"><code>plot_hte_benchmark()</code></a></td><td>Benchmark</td><td>Faceted Qini / TOC comparison by learner</td></tr>' +
          '<tr><td><a href="#/apicateci"><code>cate_ci()</code></a></td><td>Helper</td><td>Bootstrap confidence intervals for CATE / ATE</td></tr>' +
          '<tr><td><a href="#/apiplotqini"><code>plot_qini()</code></a></td><td>Helper</td><td>Quick single Qini curve plot</td></tr>' +
          '<tr><td><a href="#/apidag"><code>mlr3HTE_dag()</code></a></td><td>Helper</td><td>Draws the causal diagram for an HTE setting</td></tr>' +
          '<tr><td><a href="#/apilrn"><code>lrn()</code></a></td><td>Re-export</td><td>Re-exported from mlr3, no extra library call</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiqinicurve = {

  zh: {
    title: "qini_curve()",
    lede: "Qini 曲线：按估计 CATE 降序排列后，逐步增大“目标群体”时的累积增益。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>把样本按估计 CATE 从高到低排序，对每个前 k 比例的子群，计算其累积增益（用 IPW 评分），再除以全样本量。返回两列的 data.frame：<code>fraction</code> 与 <code>qini</code>，并附属性 <code>qini_at_full</code>（Q(1)）。</p>' +
          '<p><strong>不需要真实 tau</strong>，只需要 A、Y 和 CATE 排序，因此 RCT 现实数据上可用。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
          '<div class="callout warn"><div class="callout-title">随机基线不是精确的 0</div><p>归一化的 Qini 除以了随机线下的面积，而那个面积本身就f，单次随机排序能在 &plusmn;0.25 摆。比较模型要看相对次序。本包演示数据（n = 1500）上 10 次随机排序落在 &minus;0.253 到 0.227。</p></div>'
      }
    ]
  },

  en: {
    title: "qini_curve()",
    lede: "Qini curve: cumulative gain as the targeted population grows, ordered by estimated CATE.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Sorts the sample by estimated CATE descending and, for each top-k fraction, computes the cumulative gain (using an IPW score), divided by the sample size. Returns a two-column data.frame, <code>fraction</code> and <code>qini</code>, plus the attribute <code>qini_at_full</code> (Q(1)).</p>' +
          '<p><strong>Needs no true tau</strong> — only A, Y and the CATE ranking, so it works on real RCT data.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
          '<div class="callout warn"><div class="callout-title">The random baseline is not exactly 0</div><p>Normalised Qini divides by the area under the random line, which is itself small, so a single random ranking can swing &plusmn;0.25. Compare models by relative order. On this package&rsquo;s demo data (n = 1500), ten random rankings gave &minus;0.253 to 0.227.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiqinicoef = {

  zh: {
    title: "qini_coefficient()",
    lede: "Qini 系数：Qini 曲线与“随机目标线”之间夹的面积，把曲线厀成一个数。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_coefficient()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_coefficient(cate, A, Y, propensity = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>计算曲线下面积（梯形法）与随机目标线下面积 <code>0.5 × Q(1)</code> 之差。返回 list：<code>qini_coefficient</code>（绝对面积）、<code>qini_normalized</code>（归一化）、<code>auc</code>、<code>qini_at_full</code>。随机模型约为 0，完美排序为正。</p>' +
          '<p>如果你只想报一个数，报 <code>qini_normalized</code> ——它可跨场景比较，而绝对值受结局尺度影响。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
          '<p>注意实测里<strong>模型的绝对 Qini 系数（0.283）稍高于真实 tau（0.280）</strong>：单次实验里这种差异属于采样噪声，不能由此得出“模型超过真值”的结论。想要稳定结论，应该用 <a href="#/apihtebenchmark">hte_benchmark()</a> 做交叉拟合后的多种子对比。</p>'
      }
    ]
  },

  en: {
    title: "qini_coefficient()",
    lede: "Qini coefficient: the area between the Qini curve and the random-targeting line.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">qini_coefficient()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">qini_coefficient(cate, A, Y, propensity = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Computes the area under the curve (trapezoid) minus the area under the random-targeting line <code>0.5 × Q(1)</code>. Returns a list with <code>qini_coefficient</code> (absolute area), <code>qini_normalized</code>, <code>auc</code> and <code>qini_at_full</code>. A random model gives about 0; perfect ranking gives a positive value.</p>' +
          '<p>If you report a single number, report <code>qini_normalized</code> — it is comparable across scenarios, while the absolute value depends on the outcome scale.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
          '<p>Note that in this single run the <strong>model&rsquo;s absolute coefficient (0.283) is slightly above the true tau&rsquo;s (0.280)</strong>: that gap is sampling noise, not evidence the model beats the truth. For stable conclusions use <a href="#/apihtebenchmark">hte_benchmark()</a>, which cross-fits and compares across seeds.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apicforbenefit = {

  zh: {
    title: "c_for_benefit()",
    lede: "c-for-benefit：把处理组按预测收益与对照组做增益匹配，再算 C 统计量。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">c_for_benefit()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">c_for_benefit(cate, A, Y, caliper = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>将处理组按估计 CATE 降序排列，依次与对照组中预测收益最接近者配对，看配对后“预测收益”与“观测收益”是否一致。返回 list，主要看 <code>c_for_benefit</code>：0.5 = 排序等于随机，越大越好。详情可看 <code>n_pairs</code> / <code>n_concordant</code> / <code>n_discordant</code>。</p>' +
          '<p><strong>观察性数据必须传三件套</strong>（<code>propensity</code> + <code>mu1</code> + <code>mu0</code>），只给 <code>propensity</code> 会直接报错——因为 HT 评分的采样噪声会把 C 统计量压到随机线以下。三件套可用 <a href="#/apidrpseudo">dr_pseudo_outcome()</a> 一次拿到。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
          '<p>本演示数据上模型值 0.663 高于真实 tau 的 0.624——这是因为 CATE 是在<strong>自己的训练数据上</strong>计的（in-fold）。做真实评价请用 <a href="#/apihtebenchmark">hte_benchmark()</a>，它强制交叉拟合，同一个 X-learner 会回落到 0.617。</p>'
      }
    ]
  },

  en: {
    title: "c_for_benefit()",
    lede: "c-for-benefit: C statistic after gain-matching treated to controls by predicted benefit.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">c_for_benefit()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">c_for_benefit(cate, A, Y, caliper = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Sorts the treated by estimated CATE descending and matches each to the control with the closest predicted benefit, then checks whether predicted and observed benefit agree. Returns a list; the headline is <code>c_for_benefit</code>: 0.5 means the ranking is as good as random, larger is better. Details in <code>n_pairs</code> / <code>n_concordant</code> / <code>n_discordant</code>.</p>' +
          '<p><strong>Observational data requires the full doubly-robust triple</strong> (<code>propensity</code> + <code>mu1</code> + <code>mu0</code>); passing only the propensity raises an error, because the Horvitz-Thompson score&rsquo;s sampling noise drives the C statistic below the random line. Get the triple from <a href="#/apidrpseudo">dr_pseudo_outcome()</a>.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
          '<p>On this demo data the model&rsquo;s 0.663 exceeds the true tau&rsquo;s 0.624 — because the CATE was computed <strong>in-fold</strong>, on its own training data. For an honest evaluation use <a href="#/apihtebenchmark">hte_benchmark()</a>, which enforces cross-fitting; the same X-learner then falls back to 0.617.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apitoccurve = {

  zh: {
    title: "toc_curve()",
    lede: "TOC 曲线：按效应排序后，各分位目标群体的平均处理效应。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">toc_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">toc_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>与 Qini 类似，但线的纲是<strong>平均效应</strong>而不是累积增益，所以可以直接和全样本 ATE（属性 <code>overall_ate</code>）比。俪用的是有效样本量 &Sigma;w 而不是 k，生存结局下 t0 前删失者权重为 0，用 k 会把平均效应稀释。</p>' +
          '<p>最左端（k 很小）只对应一两个观测，值是单个个体的效应，能把纵轴拉到几十倍 ATE。画图时建议从前 5% 开始（<a href="#/apiplotbenchmark">plot_hte_benchmark()</a> 默认就这样）。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
          '<p>实测里前 10% 目标群体的平均效应是 2.44，而全样本 ATE 是 1.07——前排人群的收益明显更高，说明排序有信息量。若曲线一直贴着水平线，则模型没分辩出可利用的异质性。</p>'
      }
    ]
  },

  en: {
    title: "toc_curve()",
    lede: "TOC curve: average treatment effect within each top-k targeted group, ordered by effect.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">toc_curve()<span class="badge">metric</span></div>' +
          '<div class="fn-sig">toc_curve(cate, A, Y, propensity = NULL, n_bins = NULL, t0 = NULL, X = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Similar to the Qini curve, but the y-axis is the <strong>average effect</strong> rather than cumulative gain, so it can be read directly against the overall ATE (attribute <code>overall_ate</code>). The denominator is the effective sample size &Sigma;w rather than k: under survival outcomes, those censored before t0 carry weight 0, and using k would dilute the average effect.</p>' +
          '<p>At the far left (very small k) each point is one or two observations, whose individual effect can stretch the y-axis to tens of times the ATE. Start plots at the first 5% (<a href="#/apiplotbenchmark">plot_hte_benchmark()</a> does this by default).</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
          '<p>In this run the top 10% group has an average effect of 2.44 against an overall ATE of 1.07 — the top-ranked group clearly benefits more, so the ranking carries information. If the curve hugs the horizontal line, the model found no exploitable heterogeneity.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidrpseudo = {

  zh: {
    title: "dr_pseudo_outcome()",
    lede: "双重健壮虚拟结局（AIPW）：观察性数据上做 HTE 评价的入口。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_pseudo_outcome()<span class="badge">observational</span></div>' +
          '<div class="fn-sig">dr_pseudo_outcome(X, A, Y, cross_fitting = TRUE, n_folds = 5L, learner_ps = classif.log_reg, learner_outcome = regr.ranger, t0 = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>计算 <code>Y*</code>：<code>Y* = (μ̂₁ - μ̂₀) + A(Y - μ̂₁)/e - (1-A)(Y - μ̂₀)/(1-e)</code>，满足 E[Y*|X] = τ(X)，且<strong>结局模型与倾向得分模型只要有一个对就无偏</strong>。返回 <code>pseudo</code>、<code>mu1</code>、<code>mu0</code>、<code>propensity</code>、<code>ate</code> 等。前三项正好是 <a href="#/apicforbenefit">c_for_benefit()</a> 需要的三件套。</p>' +
          '<div class="callout warn"><div class="callout-title">默认开交叉拟合，别关</div><p>干扰参数都在 K 折的<strong>训练折</strong>上拟合、留出折上预测。若用全样本拟合再回代自己（in-fold），Y* 里的 μ̂₁−μ̂₀ 与被评价的 CATE 出自同一个模型，配对时会把“观测收益”人为对齐到“预测收益”，导致 c-for-benefit 虚高。实测 in-fold 会出现“模型 0.754 &gt; 真 tau 0.717”的倒挂，交叉拟合后恢复为 0.662 ≤ 0.669。</p></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。' +
          '背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code> 上拟合的 X-learner（ranger 300 树）。</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\nnames(dr)\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"       \n[6] "t0"         "effect"    \n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
          '<p>实测里 DR 估计的 ATE 为 0.979，真值 1.04；这量级偏差在 n = 1200 上属于正常采样潮用，且它比未校正的算算本身（约 1.74）小一个数量级。</p>'
      }
    ]
  },

  en: {
    title: "dr_pseudo_outcome()",
    lede: "Doubly robust pseudo-outcomes (AIPW): the entry point for HTE evaluation on observational data.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">dr_pseudo_outcome()<span class="badge">observational</span></div>' +
          '<div class="fn-sig">dr_pseudo_outcome(X, A, Y, cross_fitting = TRUE, n_folds = 5L, learner_ps = classif.log_reg, learner_outcome = regr.ranger, t0 = NULL, effect = c("survdiff", "rmst"))</div>' +
          '<p>Computes <code>Y*</code>: <code>Y* = (μ̂₁ - μ̂₀) + A(Y - μ̂₁)/e - (1-A)(Y - μ̂₀)/(1-e)</code>, which satisfies E[Y*|X] = τ(X) and is <strong>unbiased as long as either the outcome model or the propensity model is correct</strong>. Returns <code>pseudo</code>, <code>mu1</code>, <code>mu0</code>, <code>propensity</code>, <code>ate</code>, and more. The first three are exactly the triple <a href="#/apicforbenefit">c_for_benefit()</a> needs.</p>' +
          '<div class="callout warn"><div class="callout-title">Cross-fitting is on by default — leave it</div><p>Nuisance parameters are fitted on the <strong>training folds</strong> and predicted on held-out folds. With full-sample in-fold fitting, the μ̂₁−μ̂₀ inside Y* comes from the same model as the CATE being evaluated, and matching then artificially aligns observed to predicted benefit, inflating c-for-benefit. Measured: in-fold produces the inversion "model 0.754 &gt; true tau 0.717"; cross-fitting restores 0.662 ≤ 0.669.</p></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: an X-learner ' +
          '(ranger, 300 trees) fitted on <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\nnames(dr)\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"       \n[6] "t0"         "effect"    \n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
          '<p>The DR-estimated ATE here is 0.979 against a truth of 1.04; a gap of this size at n = 1200 is ordinary sampling noise, and it is an order of magnitude smaller than the unadjusted estimate (about 1.74).</p>'
      }
    ]
  }
};

window.SITE_PAGES.apihtebenchmark = {

  zh: {
    title: "hte_benchmark()",
    lede: "在 RCT 数据上对多个 meta-learner 做基准测试，指标不依赖真实 tau。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<p>用归一化 Qini 系数、绝对 Qini 系数、TOC 增益、c-for-benefit 四个指标比较多个 learner。返回 list：<code>table</code>（一行一个 learner）、<code>cate</code>（交叉拟合留出预测的长表）、<code>curves</code>、<code>truth</code>、<code>setup</code>。</p>' +
          '<div class="callout ok"><div class="callout-title">三件关键设计</div><ul><li><strong>交叉拟合强制</strong>：每个 learner 在 K 折训练折上拟合、留出折上预测，折<strong>按处理组分层</strong>。in-fold 会让 c-for-benefit 虚高到超过真实 tau（实测 0.663 &gt; 0.624）。</li><li><strong>不需要倾向得分</strong>：指标只依赖随机化带来的可交换性，因此现实 RCT 数据可用。</li><li><strong>可选 tau</strong>：模拟数据传了就多输出 <code>tau_cor</code> / <code>tau_rmse</code> 两列，两套指标可照着看。</li></ul></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>。</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
          '<p>实测里 <strong>R-learner 的 ATE 只有 0.498（真值 1.049），但 qini_normalized 和 toc_gain 都是五族里最高的</strong>。原因：R 二阶段对伪结果回归，没有尺度约束，CATE 可以整体缩小一半而排序不变；Qini / TOC 只看排序，对尺度错误视而不见。<strong>所以 ATE 和 Qini 必须一起报。</strong></p><p>观察性数据把 <code>propensity</code> / <code>mu1</code> / <code>mu0</code>（<a href="#/apidrpseudo">dr_pseudo_outcome()</a> 的输出）一起传进来即可，指标算法不变。</p>'
      }
    ]
  },

  en: {
    title: "hte_benchmark()",
    lede: "Benchmark several meta-learners on RCT data; the metrics need no true tau.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">hte_benchmark()<span class="badge">benchmark</span></div>' +
          '<div class="fn-sig">hte_benchmark(X, A, Y, t0 = NULL, learners = c("S","T","X","R","DR"), learner_base = NULL, metrics = c("qini","toc","c_for_benefit"), n_folds = 5L, tau = NULL, propensity = NULL, mu1 = NULL, mu0 = NULL, effect = "survdiff", seed = NULL)</div>' +
          '<p>Compares learners on normalised Qini coefficient, absolute Qini coefficient, TOC gain and c-for-benefit. Returns a list: <code>table</code> (one row per learner), <code>cate</code> (long-format out-of-fold predictions), <code>curves</code>, <code>truth</code>, <code>setup</code>.</p>' +
          '<div class="callout ok"><div class="callout-title">Three key design choices</div><ul><li><strong>Cross-fitting is enforced</strong>: each learner is fitted on K&minus;1 folds and predicts on the held-out fold, with folds <strong>stratified by treatment arm</strong>. In-fold scoring pushes c-for-benefit above the true tau (measured 0.663 &gt; 0.624).</li><li><strong>No propensity score needed</strong>: the metrics rest only on the exchangeability randomization buys, so real RCT data works.</li><li><strong>Optional tau</strong>: supplying it on simulated data adds <code>tau_cor</code> / <code>tau_rmse</code>, so both metric families can be read side by side.</li></ul></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
          '<p>In this run <strong>the R-learner&rsquo;s ATE is only 0.498 against a truth of 1.049, yet its qini_normalized and toc_gain are the highest of the five</strong>. Reason: the R-learner&rsquo;s second stage regresses pseudo-outcomes with no scale constraint, so CATE can shrink overall while the ranking survives; Qini / TOC look only at ranking and are blind to scale errors. <strong>So ATE and Qini must be reported together.</strong></p><p>For observational data, pass <code>propensity</code> / <code>mu1</code> / <code>mu0</code> (the output of <a href="#/apidrpseudo">dr_pseudo_outcome()</a>); the metric definitions are unchanged.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotbenchmark = {

  zh: {
    title: "plot_hte_benchmark()",
    lede: "把 hte_benchmark() 存下来的 Qini / TOC 曲线按 learner 分面画出来。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>一工式绘图：自动加参考线（Qini 用随机目标线，TOC 用全样本 ATE 水平线），按 learner 分面，图例隐去。返回一个 ggplot2 对象，可继续 <code>+ labs()</code> 定制。</p>' +
          '<p><code>min_fraction</code> 默认 0.05：TOC / Qini 在最左端只对应一两个观测，值是单个个体的效应，能把纵轴拉到几十倍 ATE，剩余曲线全被压扁。想看全局就传 <code>min_fraction = 0</code>。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>。</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>教程里嵌的两张对比图（<code>docs/assets/img/benchmark/qini_curves.png</code> 与 <code>toc_curves.png</code>）就是这个函数生成的。</p>'
      }
    ]
  },

  en: {
    title: "plot_hte_benchmark()",
    lede: "Faceted plot of the Qini / TOC curves stored by hte_benchmark().",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_hte_benchmark()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_hte_benchmark(x, metric = c("qini","toc"), title = NULL, min_fraction = 0.05)</div>' +
          '<p>One-call plotting: adds the reference line automatically (random targeting for Qini, overall ATE for TOC), facets by learner, and hides the legend since the facet titles already say it. Returns a ggplot2 object you can keep customising with <code>+ labs()</code>.</p>' +
          '<p><code>min_fraction</code> defaults to 0.05: at the far left of a TOC / Qini curve each point is one or two observations, whose individual effect can stretch the y-axis to tens of times the ATE and flatten everything else. Pass <code>min_fraction = 0</code> for the full view.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 1500, seed = 1201)</code>.</p>' +
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>The two comparison figures embedded in the tutorial (<code>docs/assets/img/benchmark/qini_curves.png</code> and <code>toc_curves.png</code>) were produced by this function.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apicateci = {

  zh: {
    title: "cate_ci()",
    lede: "CATE / ATE 的自助法置信区间。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">helper</span></div>' +
          '<div class="fn-sig">cate_ci(type, X, A, Y, B = 100, level = 0.95, seed = NULL, newX = NULL, ...)</div>' +
          '<p>对整条拟合流程做 B 次自助重采样（有放回抽同样本量的行），用百分位数法给出逐点 CATE 区间与 ATE 区间。返回 <code>cate_lo</code> / <code>cate_hi</code> / <code>ate_lo</code> / <code>ate_hi</code> / <code>cate_mean</code> / <code>ate</code> / <code>B</code> / <code>level</code>。</p>' +
          '<div class="callout warn"><div class="callout-title">区间只反是采样变异</div><p>这是<strong>非参数自助法</strong>，只覆盖采样噪声，不覆盖模型误定。每次要重新拟合，B 大时开销不小。若你关心的是排序能力而不是绝对尺度，请改用 <a href="#/apihtebenchmark">hte_benchmark()</a>。</p></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_data(n = 800, seed = 1201)</code>；为了速度 B 只取 30。</p>' +
          '<pre><code>ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
          '<p>实测里 ATE = 1.05，95% 区间 0.923–1.20（真值 1.049，落在区间内）。注意逐人 CATE 的区间宽得多（前 3 人宽度 0.86–2.35），这很正常——个体效应本来就比平均效应难估。</p>'
      }
    ]
  },

  en: {
    title: "cate_ci()",
    lede: "Bootstrap confidence intervals for CATE / ATE.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">cate_ci()<span class="badge">helper</span></div>' +
          '<div class="fn-sig">cate_ci(type, X, A, Y, B = 100, level = 0.95, seed = NULL, newX = NULL, ...)</div>' +
          '<p>Resamples the whole fitting pipeline B times (rows drawn with replacement, same size) and gives percentile intervals for per-point CATE and for the ATE. Returns <code>cate_lo</code> / <code>cate_hi</code> / <code>ate_lo</code> / <code>ate_hi</code> / <code>cate_mean</code> / <code>ate</code> / <code>B</code> / <code>level</code>.</p>' +
          '<div class="callout warn"><div class="callout-title">Intervals cover sampling variation only</div><p>This is a <strong>non-parametric bootstrap</strong>: it reflects sampling variation, not model misspecification. Each replicate refits from scratch, so large B is expensive. If you care about ranking power rather than absolute scale, use <a href="#/apihtebenchmark">hte_benchmark()</a> instead.</p></div>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_data(n = 800, seed = 1201)</code>; B is only 30 for speed.</p>' +
          '<pre><code>ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
          '<p>Here ATE = 1.05 with a 95% interval of 0.923–1.20 (truth 1.049, inside the interval). Note how much wider the per-person CATE intervals are (widths 0.86–2.35 for the first three) — that is normal; individual effects are intrinsically harder to estimate than the average.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotqini = {

  zh: {
    title: "plot_qini()",
    lede: "快速画一条 Qini 曲线（base graphics）。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>用 base graphics 画 <code>qini_curve()</code> 的返回值，带上随机目标线（灰虚线），不返回可见值。需要分面对比多个 learner 时，用 <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>。</p>' +
          '<p>实测曲线共 1501 个点（n = 1500 加原点）。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据同 <a href="#/apiqinicurve">qini_curve()</a> 示例。</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>如果你已经在用 ggplot2，可以自己画：<code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>。这个函数的定位是快速看一眼。</p>'
      }
    ]
  },

  en: {
    title: "plot_qini()",
    lede: "Quick Qini curve plot (base graphics).",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">plot_qini()<span class="badge">plot</span></div>' +
          '<div class="fn-sig">plot_qini(curve, main = "Qini curve", ...)</div>' +
          '<p>Plots the return value of <code>qini_curve()</code> with base graphics, including the random targeting line (grey dashed). Returns invisibly. For faceted multi-learner comparison use <a href="#/apiplotbenchmark">plot_hte_benchmark()</a>.</p>' +
          '<p>The measured curve has 1501 points (n = 1500 plus the origin).</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Same background data as the <a href="#/apiqinicurve">qini_curve()</a> example.</p>' +
          '<pre><code>cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>If you already work with ggplot2 you can draw it yourself: <code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>. This function is positioned as a quick look.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apidag = {

  zh: {
    title: "mlr3HTE_dag()",
    lede: "画 HTE 场景的因果图（ggplot2 对象）。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag(design = c("rct", "obs"), outcome = c("continuous", "binary", "survival"))</div>' +
          '<p>按设计（<code>rct</code> / <code>obs</code>）和结局类型返回一张 DAG：协变变 X 同时影响处理 A 与结局 Y，A→Y 的效应随 X 变化。用于说明为什么要调整 X。返回值是 ggplot2 对象，可继续 <code>+</code> 定制。</p>' +
          '<p>图层由 <code>GeomSegment</code>（边）与 <code>GeomLabel</code>（节点）组成，共 2 层。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。无额外输入。</p>' +
          '<pre><code>for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n        collapse = ", "), "\\n")\n}</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>===== design =  rct  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n===== design =  obs  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n# 直接把它 print 出来就是一张 DAG 图（见 docs/assets/img/dag/）</code></pre>' +
          '<p>教程与文档站里嵌的 DAG 图（<code>docs/assets/img/dag/</code>）就是这个函数生成后导出的。RCT 版没有 <code>X → A</code> 这条边，观察性版有——这就是两者的核心差异。</p>'
      }
    ]
  },

  en: {
    title: "mlr3HTE_dag()",
    lede: "Draws the causal diagram for an HTE setting (a ggplot2 object).",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">mlr3HTE_dag()<span class="badge">DAG</span></div>' +
          '<div class="fn-sig">mlr3HTE_dag(design = c("rct", "obs"), outcome = c("continuous", "binary", "survival"))</div>' +
          '<p>Returns a DAG for a given design (<code>rct</code> / <code>obs</code>) and outcome type: covariates X affect both treatment A and outcome Y, and the A→Y effect varies with X. Useful for explaining why X must be adjusted for. The return value is a ggplot2 object.</p>' +
          '<p>The layers are <code>GeomSegment</code> (edges) plus <code>GeomLabel</code> (nodes), two in total.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. No extra input.</p>' +
          '<pre><code>for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n        collapse = ", "), "\\n")\n}</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>===== design =  rct  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n===== design =  obs  =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg \ngeom layers: 2 \n图层类型： GeomSegment, GeomLabel \n\n# 直接把它 print 出来就是一张 DAG 图（见 docs/assets/img/dag/）</code></pre>' +
          '<p>The DAG figures embedded in the tutorial and docs site (<code>docs/assets/img/dag/</code>) are exports of this function. The RCT version has no <code>X → A</code> edge while the observational version does — that is the core difference between the two.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apilrn = {

  zh: {
    title: "lrn()",
    lede: "从 mlr3 再导出的 lrn()，省得额外 library(mlr3)。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn()<span class="badge">re-export</span></div>' +
          '<div class="fn-sig">lrn(...)  # mlr3::lrn 的再导出</div>' +
          '<p>就是 <code>mlr3::lrn()</code>。再导出很实用：教程与示例里大量出现 <code>lrn("regr.ranger")</code>，加载了 mlr3HTE 就能用。</p>' +
          '<p>实测里 <code>identical(l, mlr3::lrn(...))</code> 返回 <code>FALSE</code>——这不是问题：R6 对象每次构造都是新实例，<code>identical()</code> 比较的是对象身份而不是类型与参数。要看类型就 <code>class(l)</code>，要看参数就 <code>l$param_set$values</code>。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。无额外输入。</p>' +
          '<pre><code>l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code>[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
          '<p>所有可用的学习器列表见 mlr3 自己的文档；mlr3HTE 只负责把它们接进 meta-learner 框架。选择时要注意与结局类型匹配：连续用 <code>regr.*</code>，二分类用 <code>classif.*</code>，生存用字符串 <code>"coxph"</code> / <code>"ranger"</code>。</p>'
      }
    ]
  },

  en: {
    title: "lrn()",
    lede: "mlr3&rsquo;s lrn() re-exported, so you can skip loading mlr3 separately.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">lrn()<span class="badge">re-export</span></div>' +
          '<div class="fn-sig">lrn(...)  # mlr3::lrn 的再导出</div>' +
          '<p>Simply <code>mlr3::lrn()</code>. The re-export is practical: tutorials and examples are full of <code>lrn("regr.ranger")</code>, and loading mlr3HTE alone is enough.</p>' +
          '<p>In the run, <code>identical(l, mlr3::lrn(...))</code> returns <code>FALSE</code> — that is not a problem: R6 objects are new instances each time, and <code>identical()</code> compares object identity, not class or parameters. Use <code>class(l)</code> for the type and <code>l$param_set$values</code> for the parameters.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. No extra input.</p>' +
          '<pre><code>l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code>[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
          '<p>The full list of learners lives in mlr3&rsquo;s own documentation; mlr3HTE only wires them into the meta-learner framework. Match the learner to the outcome type: <code>regr.*</code> for continuous, <code>classif.*</code> for binary, and the strings <code>"coxph"</code> / <code>"ranger"</code> for survival.</p>'
      }
    ]
  }
};
