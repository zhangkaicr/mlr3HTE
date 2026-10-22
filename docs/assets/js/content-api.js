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
          '<pre><code>fit <- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "metalearner()",
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
          '<pre><code>fit <- metalearner("T", X, A, Y,\n' +
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
          '<pre><code>tau_S  <- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR <- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
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
          '<pre><code>tau_S  <- s_learner(X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'tau_DR <- dr_learner(X, A, Y, weighting = "iptw")</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== ml_task() ===================== */
window.SITE_PAGES.apimltask = {
  zh: {
    title: "ml_task()",
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
          '<pre><code>task <- ml_task(X, A, Y)                    # 连续 / 二分类\n' +
          'task <- ml_task(X, A, Surv(time, status), t0 = 2)   # 生存\n' +
          'task <- ml_task(X, A, Y, treatment_col = "trt")     # 自定义处理列名\n\n' +
          'task$extra_args</code></pre>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "ml_task()",
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
          '<pre><code>task <- ml_task(X, A, Y)                              # continuous / binary\n' +
          'task <- ml_task(X, A, Surv(time, status), t0 = 2)     # survival\n' +
          'task <- ml_task(X, A, Y, treatment_col = "trt")       # custom treatment column\n\n' +
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
      }
    ]
  },
  en: {
    title: "LearnerRegrMetalearner (R6 Learner)",
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
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# 对账\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y)\n' +
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
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000)\n' +
          'str(d)          # X, A, Y, tau, ate\n\n' +
          '# Reconcile\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y)\n' +
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
          '<pre><code>cate  <- fit$predict(testX)      # 新数据上的逐人 CATE\n' +
          'crv   <- qini_curve(cate, A_test, Y_test)\n' +
          'qini_coefficient(cate, A_test, Y_test)$qini_coefficient\n' +
          'c_for_benefit(cate, A_test, Y_test)$c_for_benefit\n' +
          'toc_curve(cate, A_test, Y_test)\n' +
          'plot_qini(crv)                    # 或 ggplot2 自绘</code></pre>' +
          '<div class="callout"><div class="callout-title">观察性数据怎么喂</div>' +
          '<p>Qini / TOC 传 <code>propensity</code> 即可；c-for-benefit 必须传 ' +
          '<code>propensity</code> + <code>mu1</code> + <code>mu0</code> 三件套' +
          '（只给倾向得分会报错——HT 评分噪声会把 C 统计量压到随机线以下）。' +
          '三件套用 <code>dr_pseudo_outcome(X, A, Y, seed = 1)</code> 一次拿到，默认 5 折交叉拟合。</p>' +
          '<pre><code>dr <- dr_pseudo_outcome(X, A, Y, seed = 1)   # 返回 pseudo / mu1 / mu0 / propensity / ate\n' +
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
          '<pre><code>cate  <- fit$predict(testX)      # per-unit CATE on new data\n' +
          'crv   <- qini_curve(cate, A_test, Y_test)\n' +
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
          '<pre><code>dr <- dr_pseudo_outcome(X, A, Y, seed = 1)   # pseudo / mu1 / mu0 / propensity / ate\n' +
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
