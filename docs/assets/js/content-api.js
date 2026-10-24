/* =====================================================================
   content-api.js —— 函数文档（中英双语）
   结构：SITE_PAGES.api = 索引页（总览表，链接到各独立函数页）；
   其余 SITE_PAGES.apixxx = 每个函数分组的独立详情页，均用手写 .fn 模板。
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

/* ===================== 索引页 ===================== */
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
          '<tr><td><code>learner_ps</code></td><td>倾向得分，<strong>仅 X / R / DR 使用</strong>（S / T 忽略）。三种形态：mlr3 分类学习器（默认 <code>classif.log_reg</code>）、常数标量（RCT 已知随机化概率，如 <code>0.5</code>）、或 <code>function(newX)</code>。</td></tr>' +
          '<tr><td><code>t0</code></td><td>生存结局的效应评估时点；<code>NULL</code> 时取事件时间中位数</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">v0.40 破坏性变更</div>' +
          '<p><code>weighting</code> / <code>weights</code> / <code>stabilize</code> 三个参数已移除。' +
          '经典 metalearner 文献（Künzel et al. 2019 PNAS、CausalML 的 BaseS/BaseT/BaseX）从不给 ' +
          'S/T/X 的结局模型套逆概率权重；只会重估结局模型的「单稳健」加权既不是文献做法，' +
          '也无法单独去混杂。去混杂现在写在各 learner 的定义里：S/T/X 把混杂因子放进 <code>X</code> ' +
          '条件化，R 走 Robinson 残差化，DR 走 AIPW 双重稳健。</p></div>' +
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
          '<code>$cate_train</code>、<code>$models</code>（每阶段训练好的 mlr3 模型）、' +
          '<code>$type</code>、<code>$outcome</code>、<code>$t0</code>。</p>' +
          '<pre><code class="language-r">fit &lt;- metalearner("T", X, A, Y,\n' +
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
          '<tr><td><code>learner_ps</code></td><td>Propensity score, <strong>used by X / R / DR only</strong> (ignored by S / T). Three forms: an mlr3 classification learner (default <code>classif.log_reg</code>), a constant scalar (known randomisation probability in an RCT, e.g. <code>0.5</code>), or <code>function(newX)</code>.</td></tr>' +
          '<tr><td><code>t0</code></td><td>Horizon for survival effects; <code>NULL</code> uses the median event time</td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"auto"</code> / <code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Breaking change in v0.40</div>' +
          '<p>The <code>weighting</code> / <code>weights</code> / <code>stabilize</code> arguments ' +
          'were removed. The classic meta-learner literature (Künzel et al. 2019 PNAS; CausalML ' +
          'BaseS/BaseT/BaseX) never applies inverse-probability weights to the S/T/X outcome models, ' +
          'and a "singly robust" weighting that only re-fits the outcome model is neither standard ' +
          'practice nor able to deconfound on its own. Deconfounding now lives in each learner\'s ' +
          'definition: S/T/X condition on confounders placed in <code>X</code>, R uses Robinson ' +
          'residualisation, DR uses AIPW double robustness.</p></div>' +
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
          '<code>$cate_train</code>, <code>$models</code> (one trained mlr3 model per stage and ' +
          'algorithm), <code>$type</code>, <code>$outcome</code> and <code>$t0</code>.</p>' +
          '<pre><code class="language-r">fit &lt;- metalearner("T", X, A, Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'fit$ate\n' +
          'fit$predict(newX)</code></pre>' +
          '</div>'
      }
    ]
  }
};

/* ===================== 便捷封装 ===================== */
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
          '<pre><code class="language-r">task &lt;- ml_task(X, A, Y)                    # 连续 / 二分类\n' +
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
          '<pre><code class="language-r">task &lt;- ml_task(X, A, Y)                              # continuous / binary\n' +
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
          '    metalearner = "T")      # 可调参数</div>' +
          '<p>CATE 是连续量，所以只有<strong>一个</strong> Learner 类，三类结局通用' +
          '（结局类型由 <code>ml_task()</code> 写进 <code>extra_args</code>）。</p>' +
          '<h4>可调参数（可进 <code>tune()</code>）</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>参数</th><th>取值</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>metalearner</code></td><td>S / T / X / R / DR</td></tr>' +
          '</tbody></table></div>' +
          '<h4>可调字段（R6 public field，不是 param）</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>字段</th><th>说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>learner_base</code></td><td>结局模型基学习器（支持按角色命名 list）</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>效应阶段回归学习器（支持按角色命名 list）</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>倾向得分（X/R/DR 用）：mlr3 分类学习器 / 常数标量 / <code>function(newX)</code></td></tr>' +
          '<tr><td><code>treatment_col</code></td><td>处理列名，默认 <code>"A"</code></td></tr>' +
          '<tr><td><code>status_col</code></td><td>生存事件指示列名，默认 <code>".status"</code></td></tr>' +
          '<tr><td><code>t0</code></td><td>生存效应时点</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">为什么用字段而不是参数</div>' +
          '<p>paradox 1.0 的 <code>p_uty()</code> 只能存函数或 NULL，<strong>存不下 Learner 对象</strong>，' +
          '所以基学习器只能作为 R6 字段暴露。</p></div>' +
          '<pre><code class="language-r">library(mlr3)   # resample() / benchmark() / rsmp() 来自 mlr3\n' +
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
          '    metalearner = "T")      # tunable</div>' +
          '<p>CATE is a continuous quantity, so there is only <strong>one</strong> Learner class, ' +
          'shared by all three outcome types (the outcome type comes from ' +
          '<code>ml_task()</code> via <code>extra_args</code>).</p>' +
          '<h4>Tunable params (usable in <code>tune()</code>)</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Param</th><th>Values</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>metalearner</code></td><td>S / T / X / R / DR</td></tr>' +
          '</tbody></table></div>' +
          '<h4>Public fields (not params)</h4>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Field</th><th>Description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>learner_base</code></td><td>Outcome-model base learner (per-role named list supported)</td></tr>' +
          '<tr><td><code>learner_tau</code></td><td>Stage-2 regression learner (per-role named list supported)</td></tr>' +
          '<tr><td><code>learner_ps</code></td><td>Propensity score (for X/R/DR): mlr3 classification learner / constant scalar / <code>function(newX)</code></td></tr>' +
          '<tr><td><code>treatment_col</code></td><td>Treatment column name, default <code>"A"</code></td></tr>' +
          '<tr><td><code>status_col</code></td><td>Survival event column name, default <code>".status"</code></td></tr>' +
          '<tr><td><code>t0</code></td><td>Survival effect horizon</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Why fields instead of params</div>' +
          '<p>paradox 1.0\'s <code>p_uty()</code> only accepts functions or NULL — it ' +
          '<strong>cannot hold a Learner object</strong>, so base learners must be exposed as R6 ' +
          'fields.</p></div>' +
          '<pre><code class="language-r">library(mlr3)   # resample() / benchmark() / rsmp() 来自 mlr3\n' +
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
/* ===================== HTE 评价指标 ===================== */
/* ===================== 辅助函数 ===================== */
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
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>learner_ps</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- s_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.05    0.862 0.527</code></pre>' +
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
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>learner_ps</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- s_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.05    0.862 0.527</code></pre>' +
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
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>learner_ps</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- t_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.828 0.645</code></pre>' +
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
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>learner_ps</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- t_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.828 0.645</code></pre>' +
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
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>learner_ps</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- x_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.950 0.340</code></pre>' +
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
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>learner_ps</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- x_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.09    0.950 0.340</code></pre>' +
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
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>learner_ps</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- r_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1 0.541    0.811 0.856</code></pre>' +
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
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>learner_ps</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- r_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1 0.541    0.811 0.856</code></pre>' +
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
          '<tr><td><code>...</code></td><td>其余参数原样转给 <code>metalearner()</code>（<code>t0</code>、<code>learner_ps</code>、<code>learner_tau</code> 等）</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>下面的代码与输出都是<strong>真实跑出来的</strong>（n = 1500，seed = 1201，' +
          'ranger 300 树）。因为演示数据自带真值 <code>tau</code>，' +
          '所以可以把 ATE、CATE 相关、RMSE 三者一起报。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- dr_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.08    0.916 0.419</code></pre>' +
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
          '<tr><td><code>...</code></td><td>Everything else passes straight through to <code>metalearner()</code> (<code>t0</code>, <code>learner_ps</code>, <code>learner_tau</code>, ...)</td></tr>' +
          '</tbody></table></div></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both the code and the output below are <strong>actually run</strong> ' +
          '(n = 1500, seed = 1201, ranger with 300 trees). Because the demo data carries the ' +
          'true <code>tau</code>, ATE, CATE correlation and RMSE can all be reported together.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1500, seed = 1201)\ncate &lt;- dr_learner()(d$X, d$A, d$Y,\n             learner_base = lrn("regr.ranger", num.trees = 300, seed = 1L))\ntibble(ATE = mean(cate), 与真相关 = cor(cate, d$tau),\n       RMSE = sqrt(mean((cate - d$tau)^2)))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 3\n    ATE 与真相关  RMSE\n  &lt;dbl&gt;    &lt;dbl&gt; &lt;dbl&gt;\n1  1.08    0.916 0.419</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1200, seed = 1201)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), CATE_min = min(d$tau),\n       CATE_max = max(d$tau), 处理率 = mean(d$A))\ncat("\\n--- X 的列与前 3 行 ---\\n")\nnames(d$X)\nhead(d$X, 3)\ncat("\\n--- 结局类型 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 5\n  真实ATE CATE_SD CATE_min CATE_max 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;  &lt;dbl&gt;\n1    1.05    1.06    -2.73     4.64    0.5\n\n--- X 的列与前 3 行 ---\n[1] "age"   "lac"   "tumor" "sex"\n       age      lac    tumor sex\n1 38.60905 3.353193 3.876882   1\n2 55.35569 1.468101 5.906637   1\n3 50.67085 3.763216 3.162722   1\n\n--- 结局类型 ---\n[1] "numeric"\n[1] 8.416564 5.474692 9.719083</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_data(n = 1200, seed = 1201)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), CATE_min = min(d$tau),\n       CATE_max = max(d$tau), 处理率 = mean(d$A))\ncat("\\n--- X 的列与前 3 行 ---\\n")\nnames(d$X)\nhead(d$X, 3)\ncat("\\n--- 结局类型 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 5\n  真实ATE CATE_SD CATE_min CATE_max 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;  &lt;dbl&gt;\n1    1.05    1.06    -2.73     4.64    0.5\n\n--- X 的列与前 3 行 ---\n[1] "age"   "lac"   "tumor" "sex"\n       age      lac    tumor sex\n1 38.60905 3.353193 3.876882   1\n2 55.35569 1.468101 5.906637   1\n3 50.67085 3.763216 3.162722   1\n\n--- 结局类型 ---\n[1] "numeric"\n[1] 8.416564 5.474692 9.719083</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_binary(n = 1200, seed = 1203)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A),\n       结局率 = mean(d$Y))\ncat("\\n--- Y 是 0/1 ---\\n")\ntable(d$Y)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 4\n  真实ATE CATE_SD 处理率 结局率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n1   0.131   0.131    0.5  0.344\n\n--- Y 是 0/1 ---\n\n  0   1\n787 413</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_binary(n = 1200, seed = 1203)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A),\n       结局率 = mean(d$Y))\ncat("\\n--- Y 是 0/1 ---\\n")\ntable(d$Y)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 4\n  真实ATE CATE_SD 处理率 结局率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n1   0.131   0.131    0.5  0.344\n\n--- Y 是 0/1 ---\n\n  0   1\n787 413</code></pre>' +
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
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>ps_true</code></td><td>生成数据时用的<strong>真实倾向得分</strong>；封装成 <code>function(newX)</code> 喂给 <code>learner_ps</code>，可核查「用真倾向得分时的估计上限」</td></tr>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A))\ncat("\\n--- 两组基线差异（混杂的来源）---\\n")\nd$X |&gt; mutate(A = d$A) |&gt; group_by(A) |&gt;\n  summarise(across(where(is.numeric), mean), .groups = "drop")\ncat("\\n--- ps_true 范围 ---\\n")\nrange(d$ps_true)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 3\n  真实ATE CATE_SD 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;\n1    1.04    1.03    0.4\n\n--- 两组基线差异（混杂的来源）---\n# A tibble: 2 × 5\n      A   age   lac tumor   sex\n  &lt;int&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1     0  59.7  2.17  4.77 0.431\n2     1  60.3  3.00  5.48 0.438\n\n--- ps_true 范围 ---\n[1] 0.01941862 0.94016139</code></pre>' +
          '<div class="callout"><div class="callout-title">这份数据用来干什么</div>' +
          '<p>教程 02（连续 × 观察性）的数据源；<a href="#/apidrpseudo">dr_pseudo_outcome()</a> 示例也用它。</p></div>'
      },
      {
        id: "note",
        heading: "注意事项",
        body:
          '<p><strong>混杂全部来自已测量协变变</strong>，因此把混杂因子放进 <code>X</code> 做条件化即可完全校正。现实研究里若有未测量混杂，任何方法都救不回来。</p>'
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
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>ps_true</code></td><td>The <strong>true propensity score</strong> used to generate the data; wrap it as <code>function(newX)</code> and pass it to <code>learner_ps</code> to check the ceiling you would reach with the true score</td></tr>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ncat("--- 数据卡 ---\\n")\ntibble(真实ATE = d$ate, CATE_SD = sd(d$tau), 处理率 = mean(d$A))\ncat("\\n--- 两组基线差异（混杂的来源）---\\n")\nd$X |&gt; mutate(A = d$A) |&gt; group_by(A) |&gt;\n  summarise(across(where(is.numeric), mean), .groups = "drop")\ncat("\\n--- ps_true 范围 ---\\n")\nrange(d$ps_true)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 数据卡 ---\n# A tibble: 1 × 3\n  真实ATE CATE_SD 处理率\n    &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;\n1    1.04    1.03    0.4\n\n--- 两组基线差异（混杂的来源）---\n# A tibble: 2 × 5\n      A   age   lac tumor   sex\n  &lt;int&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1     0  59.7  2.17  4.77 0.431\n2     1  60.3  3.00  5.48 0.438\n\n--- ps_true 范围 ---\n[1] 0.01941862 0.94016139</code></pre>' +
          '<div class="callout"><div class="callout-title">What this dataset is for</div>' +
          '<p>Data source for tutorial 02 (continuous × observational); also used by the <a href="#/apidrpseudo">dr_pseudo_outcome()</a> example.</p></div>'
      },
      {
        id: "note",
        heading: "Caveats",
        body:
          '<p><strong>All confounding comes from measured covariates</strong>, which is why conditioning on them (placing them in <code>X</code>) works perfectly here. In real studies, unmeasured confounding cannot be fixed by any method.</p>'
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
          '<tr><td><code>tau</code></td><td>真实 CATE（可作对账标尾）</td></tr><tr><td><code>ps_true</code></td><td>生成数据时用的<strong>真实倾向得分</strong>；封装成 <code>function(newX)</code> 喂给 <code>learner_ps</code>，可核查「用真倾向得分时的估计上限」</td></tr>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs_binary(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, 处理率 = mean(d$A), 结局率 = mean(d$Y),\n       ps_true_min = min(d$ps_true), ps_true_max = max(d$ps_true))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 5\n  真实ATE 处理率 结局率 ps_true_min ps_true_max\n    &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;       &lt;dbl&gt;       &lt;dbl&gt;\n1   0.130    0.4  0.337      0.0194       0.940</code></pre>' +
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
          '<tr><td><code>tau</code></td><td>True CATE (reconciliation anchor)</td></tr><tr><td><code>ps_true</code></td><td>The <strong>true propensity score</strong> used to generate the data; wrap it as <code>function(newX)</code> and pass it to <code>learner_ps</code> to check the ceiling you would reach with the true score</td></tr>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs_binary(n = 1200, seed = 1204)\ntibble(真实ATE = d$ate, 处理率 = mean(d$A), 结局率 = mean(d$Y),\n       ps_true_min = min(d$ps_true), ps_true_max = max(d$ps_true))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 5\n  真实ATE 处理率 结局率 ps_true_min ps_true_max\n    &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;       &lt;dbl&gt;       &lt;dbl&gt;\n1   0.130    0.4  0.337      0.0194       0.940</code></pre>' +
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
          '<p>最复杂的一种：既有混杂（混杂因子须进 <code>X</code>），又有删矢（要 IPCW）。</p>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\ncat("\\n--- Y 是 Surv 矩阵 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.387    0.292\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.1362236</code></pre>' +
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
          '<p>The hardest of the six: confounding (confounders must go into <code>X</code>) plus censoring (handled by IPCW).</p>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\ncat("\\n--- Y 是 Surv 矩阵 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.387    0.292\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.1362236</code></pre>' +
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
          '<p>处理随机化，但结局是生存数据，删失约 30%。这时只有删失需要处理（IPCW），没有混杂。</p>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\ncat("\\n--- Y 是 Surv 矩阵 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.531    0.302\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.5624068</code></pre>' +
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
          '<p>Treatment is randomized, but the outcome is survival data with about 30% censoring. Only censoring needs handling here (IPCW); there is no confounding.</p>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 1200, seed = 1205)\ntibble(真实ATE = d$ate, t0 = d$t0, 处理率 = mean(d$A),\n       删失比例 = 1 - mean(d$Y[, 2L]))\ncat("\\n--- Y 是 Surv 矩阵 ---\\n")\nclass(d$Y)\nhead(d$Y, 3)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 4\n  真实ATE    t0 处理率 删失比例\n    &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;\n1   0.151     2  0.531    0.302\n\n--- Y 是 Surv 矩阵 ---\n[1] "Surv"\n[1] 8.7075197+ 0.7079554  0.5624068</code></pre>' +
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
          '<p>To predict on new data, or to change the learner / engine settings, use <a href="#/apimetalearner">metalearner()</a>.</p>'
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

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "函数文档",
    lede: "mlr3HTE 共导出 42 个对象：1 个主拟合函数、5 个 meta-learner 便捷封装、1 个 Task 编码函数、1 个 R6 Learner " +
          "类、1 个 CATE 置信区间辅助、1 个生存效应曲线函数、2 个 DAG 函数、6 个演示数据集生成器、4 个 HTE 评价指标、" +
          "1 个观察性数据干扰参数估计器、3 个 RCT 基准测试函数、4 个基准模拟数据函数、9 个 CATE 可解释性函数、" +
          "3 个配套绘图函数、1 个 mlr3 再导出。点函数名进入各自的详细说明页。",
    sections: [

      {
        id: "overview",
        heading: "函数总览",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>函数</th><th>类别</th><th>一句话说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>主拟合</td><td>拟合任意 metalearner，返回可重复预测的对象</td></tr>' +
          '<tr><td><a href="#/apis"><code>s_learner()</code></a></td><td>便捷封装</td><td>S-learner 简写，直接返回 CATE 向量</td></tr>' +
          '<tr><td><a href="#/apit"><code>t_learner()</code></a></td><td>便捷封装</td><td>T-learner 简写，两个模型相减</td></tr>' +
          '<tr><td><a href="#/apix"><code>x_learner()</code></a></td><td>便捷封装</td><td>X-learner 简写，两阶段拟合</td></tr>' +
          '<tr><td><a href="#/apir"><code>r_learner()</code></a></td><td>便捷封装</td><td>R-learner 简写，残差化后回归</td></tr>' +
          '<tr><td><a href="#/apidr"><code>dr_learner()</code></a></td><td>便捷封装</td><td>DR-learner 简写，双重稳健伪结局</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task 编码</td><td>把 X/A/Y 编码成 mlr3 Task，三类结局统一</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code>，接入 mlr3 工作流</td></tr>' +
          '<tr><td><a href="#/apicateci"><code>cate_ci()</code></a></td><td>辅助</td><td>CATE 的自助法置信区间（仅反映抽样波动）</td></tr>' +
          '<tr><td><a href="#/apisurvcurve"><code>surv_effect_curve()</code></a></td><td>生存曲线</td><td>逐点重拟合，给出效应随时间变化的曲线</td></tr>' +
          '<tr><td><a href="#/apisurvcurve"><code>plot_surv_effect_curve()</code></a></td><td>绘图</td><td>画效应—时间曲线，叠加个体 CATE 四分位带</td></tr>' +
          '<tr><td><a href="#/apiplotqini"><code>plot_qini()</code></a></td><td>绘图</td><td>Qini 曲线，返回 ggplot 对象</td></tr>' +
          '<tr><td><a href="#/apidag"><code>mlr3HTE_dag()</code></a></td><td>DAG</td><td>画 RCT / 观察性两种设计的因果结构图</td></tr>' +
          '<tr><td><a href="#/apidagdata"><code>mlr3HTE_dag_data()</code></a></td><td>DAG</td><td>DAG 的节点表 / 边表 / 曲率路由结果</td></tr>' +
          '<tr><td><a href="#/apidemodata"><code>mlr3HTE_demo_data()</code></a></td><td>演示数据</td><td>随机化 + 连续结局，带 tau / ate</td></tr>' +
          '<tr><td><a href="#/apidemobinary"><code>mlr3HTE_demo_binary()</code></a></td><td>演示数据</td><td>随机化 + 二分类结局</td></tr>' +
          '<tr><td><a href="#/apidemoobs"><code>mlr3HTE_demo_obs()</code></a></td><td>演示数据</td><td>观察性 + 连续结局，含真实 ps_true</td></tr>' +
          '<tr><td><a href="#/apidemoobsbinary"><code>mlr3HTE_demo_obs_binary()</code></a></td><td>演示数据</td><td>观察性 + 二分类结局</td></tr>' +
          '<tr><td><a href="#/apidemoobssurv"><code>mlr3HTE_demo_obs_surv()</code></a></td><td>演示数据</td><td>观察性 + 生存结局，混杂与删失并存</td></tr>' +
          '<tr><td><a href="#/apidemosurv"><code>mlr3HTE_demo_surv()</code></a></td><td>演示数据</td><td>随机化 + 生存结局，只有删失</td></tr>' +
          '<tr><td><a href="#/apiqinicurve"><code>qini_curve()</code></a></td><td>HTE 评价</td><td>Qini 曲线：累积增益随靶向比例的变化</td></tr>' +
          '<tr><td><a href="#/apiqinicoef"><code>qini_coefficient()</code></a></td><td>HTE 评价</td><td>把 Qini 曲线压成一个数</td></tr>' +
          '<tr><td><a href="#/apicforbenefit"><code>c_for_benefit()</code></a></td><td>HTE 评价</td><td>C 统计量：预测获益的配对一致性</td></tr>' +
          '<tr><td><a href="#/apitoccurve"><code>toc_curve()</code></a></td><td>HTE 评价</td><td>顶部有序曲线，对照总体 ATE</td></tr>' +
          '<tr><td><a href="#/apidrpseudo"><code>dr_pseudo_outcome()</code></a></td><td>观察性</td><td>一次拿到 propensity / mu1 / mu0 三件套，默认交叉拟合</td></tr>' +
          '<tr><td><a href="#/apihtebenchmark"><code>hte_benchmark()</code></a></td><td>基准测试</td><td>RCT 上比较多个 learner，不依赖真实 tau</td></tr>' +
          '<tr><td><a href="#/apibenchdata"><code>hte_benchmark_data()</code></a></td><td>基准测试</td><td>基准测试的曲线数据与参考线</td></tr>' +
          '<tr><td><a href="#/apiplotbenchmark"><code>plot_hte_benchmark()</code></a></td><td>绘图</td><td>基准测试曲线分面对比，返回 ggplot</td></tr>' +
          '<tr><td><a href="#/apiscenarios"><code>mlr3HTE_scenarios()</code></a></td><td>模拟数据</td><td>列出 10 个基准设计的结构标签</td></tr>' +
          '<tr><td><a href="#/apiscenario"><code>mlr3HTE_scenario()</code></a></td><td>模拟数据</td><td>按场景 id 生成一份带真值的模拟数据</td></tr>' +
          '<tr><td><a href="#/apibench"><code>mlr3HTE_bench()</code></a></td><td>模拟数据</td><td>取出随包发布的 30 份基准数据之一</td></tr>' +
          '<tr><td><a href="#/apibenchindex"><code>mlr3HTE_bench_index()</code></a></td><td>模拟数据</td><td>打包数据中实际存在的键与真值 ATE</td></tr>' +
          '<tr><td><a href="#/apiexplainer"><code>hte_explainer()</code></a></td><td>可解释性</td><td>把 CATE 模型包装为 DALEX 解释器（响应变量 = 伪结局）</td></tr>' +
          '<tr><td><a href="#/apisurrogate"><code>hte_surrogate()</code></a></td><td>可解释性</td><td>用单一 mlr3 学习器重拟合 CATE 曲面得代理模型</td></tr>' +
          '<tr><td><a href="#/apiimportance"><code>hte_feature_importance()</code></a></td><td>可解释性</td><td>置换法变量重要性（对伪结局的损失上升）</td></tr>' +
          '<tr><td><a href="#/apipdp"><code>hte_pdp()</code></a></td><td>可解释性</td><td>偏依赖 PDP 与累积局部效应 ALE</td></tr>' +
          '<tr><td><a href="#/apishap"><code>hte_shap()</code></a></td><td>可解释性</td><td>Kernel SHAP：个体 CATE 的变量分解</td></tr>' +
          '<tr><td><a href="#/apishapdata"><code>hte_shap_data()</code></a></td><td>可解释性</td><td>把 shapviz 对象摊平为长表，便于导出自绘</td></tr>' +
          '<tr><td><a href="#/apiplotimportance"><code>plot_hte_importance()</code></a></td><td>绘图</td><td>重要性条形图，返回 ggplot</td></tr>' +
          '<tr><td><a href="#/apiplotpdp"><code>plot_hte_pdp()</code></a></td><td>绘图</td><td>偏依赖曲线分面图，返回 ggplot</td></tr>' +
          '<tr><td><a href="#/apiplotshap"><code>plot_hte_shap()</code></a></td><td>绘图</td><td>SHAP 四视图：重要性 / 蜂群 / 依赖 / 瀑布</td></tr>' +
          '<tr><td><a href="#/apilrn"><code>lrn()</code></a></td><td>再导出</td><td>从 mlr3 再导出，免额外加载</td></tr>' +
          '</tbody></table></div>' +
          '<p class="text-muted">全部 42 个导出对象均有对应的说明页面，示例代码与输出都是实跑结果。标注「绘图」的函数一律返回 ggplot 对象，可用 <code>+</code> 叠加图层、用 <code>ggsave()</code> 导出；其底层数据由对应的数据函数单独取出：<code>hte_feature_importance()</code>、<code>hte_pdp()</code>、<code>hte_shap_data()</code>、<code>hte_benchmark_data()</code>、<code>qini_curve()</code>、<code>mlr3HTE_dag_data()</code>、<code>surv_effect_curve()</code>。</p>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "API Reference",
    lede: "mlr3HTE exports 42 objects: one main fitting function, five meta-learner " +
          "shortcuts, one Task-encoding helper, one R6 Learner class, one CATE " +
          "confidence-interval helper, one survival effect-curve function, two DAG " +
          "functions, six demo data generators, four " +
          "HTE evaluation metrics, one nuisance-parameter estimator for observational " +
          "data, three RCT benchmark functions, four benchmark simulation functions, nine " +
          "CATE interpretability functions, three companion plotting functions and one mlr3 " +
          "re-export. Click a function name to open its dedicated page.",
    sections: [

      {
        id: "overview",
        heading: "Overview",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Function</th><th>Category</th><th>One-line description</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><a href="#/apimetalearner"><code>metalearner()</code></a></td><td>Main entry</td><td>Fit any meta-learner and return a predictive object</td></tr>' +
          '<tr><td><a href="#/apis"><code>s_learner()</code></a></td><td>Shortcut</td><td>S-learner shorthand, returns the CATE vector directly</td></tr>' +
          '<tr><td><a href="#/apit"><code>t_learner()</code></a></td><td>Shortcut</td><td>T-learner shorthand, difference of two models</td></tr>' +
          '<tr><td><a href="#/apix"><code>x_learner()</code></a></td><td>Shortcut</td><td>X-learner shorthand, two-stage imputation</td></tr>' +
          '<tr><td><a href="#/apir"><code>r_learner()</code></a></td><td>Shortcut</td><td>R-learner shorthand, regression on residuals</td></tr>' +
          '<tr><td><a href="#/apidr"><code>dr_learner()</code></a></td><td>Shortcut</td><td>DR-learner shorthand, doubly robust pseudo-outcome</td></tr>' +
          '<tr><td><a href="#/apimltask"><code>ml_task()</code></a></td><td>Task encoding</td><td>Encode X/A/Y into an mlr3 Task, uniform across outcomes</td></tr>' +
          '<tr><td><a href="#/apilearner"><code>LearnerRegrMetalearner</code></a></td><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code> for mlr3 workflows</td></tr>' +
          '<tr><td><a href="#/apicateci"><code>cate_ci()</code></a></td><td>Helper</td><td>Bootstrap confidence interval for CATE (sampling noise only)</td></tr>' +
          '<tr><td><a href="#/apisurvcurve"><code>surv_effect_curve()</code></a></td><td>Survival curve</td><td>Refits point by point and returns the effect-over-time curve</td></tr>' +
          '<tr><td><a href="#/apisurvcurve"><code>plot_surv_effect_curve()</code></a></td><td>Plot</td><td>Draws the effect-over-time curve with an individual-CATE IQR band</td></tr>' +
          '<tr><td><a href="#/apiplotqini"><code>plot_qini()</code></a></td><td>Plot</td><td>Qini curve, returns a ggplot object</td></tr>' +
          '<tr><td><a href="#/apidag"><code>mlr3HTE_dag()</code></a></td><td>DAG</td><td>Causal diagram for the RCT and observational designs</td></tr>' +
          '<tr><td><a href="#/apidagdata"><code>mlr3HTE_dag_data()</code></a></td><td>DAG</td><td>Node and edge tables plus curvature routing for the DAG</td></tr>' +
          '<tr><td><a href="#/apidemodata"><code>mlr3HTE_demo_data()</code></a></td><td>Demo data</td><td>Randomised + continuous outcome, with tau / ate</td></tr>' +
          '<tr><td><a href="#/apidemobinary"><code>mlr3HTE_demo_binary()</code></a></td><td>Demo data</td><td>Randomised + binary outcome</td></tr>' +
          '<tr><td><a href="#/apidemoobs"><code>mlr3HTE_demo_obs()</code></a></td><td>Demo data</td><td>Observational + continuous outcome, with true ps_true</td></tr>' +
          '<tr><td><a href="#/apidemoobsbinary"><code>mlr3HTE_demo_obs_binary()</code></a></td><td>Demo data</td><td>Observational + binary outcome</td></tr>' +
          '<tr><td><a href="#/apidemoobssurv"><code>mlr3HTE_demo_obs_surv()</code></a></td><td>Demo data</td><td>Observational + survival, confounding and censoring</td></tr>' +
          '<tr><td><a href="#/apidemosurv"><code>mlr3HTE_demo_surv()</code></a></td><td>Demo data</td><td>Randomised + survival outcome, censoring only</td></tr>' +
          '<tr><td><a href="#/apiqinicurve"><code>qini_curve()</code></a></td><td>HTE metrics</td><td>Qini curve: cumulative gain against the targeted fraction</td></tr>' +
          '<tr><td><a href="#/apiqinicoef"><code>qini_coefficient()</code></a></td><td>HTE metrics</td><td>Compresses the Qini curve into a single number</td></tr>' +
          '<tr><td><a href="#/apicforbenefit"><code>c_for_benefit()</code></a></td><td>HTE metrics</td><td>C statistic: pairwise concordance of predicted benefit</td></tr>' +
          '<tr><td><a href="#/apitoccurve"><code>toc_curve()</code></a></td><td>HTE metrics</td><td>Top-ordered curve against the overall ATE</td></tr>' +
          '<tr><td><a href="#/apidrpseudo"><code>dr_pseudo_outcome()</code></a></td><td>Observational</td><td>Propensity / mu1 / mu0 in one call, cross-fitted by default</td></tr>' +
          '<tr><td><a href="#/apihtebenchmark"><code>hte_benchmark()</code></a></td><td>Benchmark</td><td>Compare learners on RCT data without a known tau</td></tr>' +
          '<tr><td><a href="#/apibenchdata"><code>hte_benchmark_data()</code></a></td><td>Benchmark</td><td>Benchmark curve data together with the reference lines</td></tr>' +
          '<tr><td><a href="#/apiplotbenchmark"><code>plot_hte_benchmark()</code></a></td><td>Plot</td><td>Faceted benchmark curves, returns a ggplot</td></tr>' +
          '<tr><td><a href="#/apiscenarios"><code>mlr3HTE_scenarios()</code></a></td><td>Simulation</td><td>Structural labels of the ten benchmark designs</td></tr>' +
          '<tr><td><a href="#/apiscenario"><code>mlr3HTE_scenario()</code></a></td><td>Simulation</td><td>Generate one simulated dataset with known ground truth</td></tr>' +
          '<tr><td><a href="#/apibench"><code>mlr3HTE_bench()</code></a></td><td>Simulation</td><td>Fetch one of the thirty bundled benchmark datasets</td></tr>' +
          '<tr><td><a href="#/apibenchindex"><code>mlr3HTE_bench_index()</code></a></td><td>Simulation</td><td>Keys present in the bundled data and their true ATE</td></tr>' +
          '<tr><td><a href="#/apiexplainer"><code>hte_explainer()</code></a></td><td>Interpret</td><td>Wrap a CATE model as a DALEX explainer (response = pseudo-outcome)</td></tr>' +
          '<tr><td><a href="#/apisurrogate"><code>hte_surrogate()</code></a></td><td>Interpret</td><td>Refit the CATE surface with one mlr3 learner as a surrogate</td></tr>' +
          '<tr><td><a href="#/apiimportance"><code>hte_feature_importance()</code></a></td><td>Interpret</td><td>Permutation importance (loss rise against the pseudo-outcome)</td></tr>' +
          '<tr><td><a href="#/apipdp"><code>hte_pdp()</code></a></td><td>Interpret</td><td>Partial dependence (PDP) and accumulated local effects (ALE)</td></tr>' +
          '<tr><td><a href="#/apishap"><code>hte_shap()</code></a></td><td>Interpret</td><td>Kernel SHAP: decomposition of an individual CATE</td></tr>' +
          '<tr><td><a href="#/apishapdata"><code>hte_shap_data()</code></a></td><td>Interpret</td><td>Flatten a shapviz object into a long table for export</td></tr>' +
          '<tr><td><a href="#/apiplotimportance"><code>plot_hte_importance()</code></a></td><td>Plot</td><td>Importance bar chart, returns a ggplot</td></tr>' +
          '<tr><td><a href="#/apiplotpdp"><code>plot_hte_pdp()</code></a></td><td>Plot</td><td>Faceted partial dependence curves, returns a ggplot</td></tr>' +
          '<tr><td><a href="#/apiplotshap"><code>plot_hte_shap()</code></a></td><td>Plot</td><td>Four SHAP views: importance / beeswarm / dependence / waterfall</td></tr>' +
          '<tr><td><a href="#/apilrn"><code>lrn()</code></a></td><td>Re-export</td><td>Re-exported from mlr3 so you need not load it</td></tr>' +
          '</tbody></table></div>' +
          '<p class="text-muted">All forty-two exported objects have a corresponding page, and every example is an actual run. The functions marked Plot return ggplot objects that accept further layers with <code>+</code> and export through <code>ggsave()</code>; their underlying data comes from the matching data function: <code>hte_feature_importance()</code>, <code>hte_pdp()</code>, <code>hte_shap_data()</code>, <code>hte_benchmark_data()</code>, <code>qini_curve()</code>, <code>mlr3HTE_dag_data()</code> and <code>surv_effect_curve()</code>.</p>'
      }
    ]
  },

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
          '<pre><code class="language-r">cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
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
          '<pre><code class="language-r">cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\ntail(cv, 3)\nattr(cv, "qini_at_full")</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 前 5 行 ---\n      fraction        qini\n1 0.0000000000 0.000000000\n2 0.0006666667 0.014940224\n3 0.0013333333 0.006970732\n4 0.0020000000 0.019672433\n5 0.0026666667 0.033119033\n\n--- 末 3 行 ---\n      fraction     qini\n1499 0.9986667 1.077251\n1500 0.9993333 1.081709\n1501 1.0000000 1.072626\n\n--- 属性 qini_at_full ---\n[1] 1.072626</code></pre>' +
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
          '<pre><code class="language-r">qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
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
          '<pre><code class="language-r">qini_coefficient(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       qini_coefficient = c(qini_coefficient(rnd, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(fit$cate_train, d$A, d$Y)$qini_coefficient,\n                            qini_coefficient(d$tau, d$A, d$Y)$qini_coefficient))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">$qini_coefficient\n[1] 0.2831499\n\n$qini_normalized\n[1] 0.5279564\n\n$auc\n[1] 0.8194629\n\n$qini_at_full\n[1] 1.072626\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     qini_coefficient\n  &lt;chr&gt;               &lt;dbl&gt;\n1 随机               -0.198\n2 模型                0.283\n3 真实 tau            0.280</code></pre>' +
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
          '<pre><code class="language-r">c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
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
          '<pre><code class="language-r">c_for_benefit(fit$cate_train, d$A, d$Y)\n\n# 用随机排序与真实 tau 当标尾\nset.seed(2)\nrnd &lt;- rnorm(nrow(d$X))\ntibble(来源 = c("随机", "模型", "真实 tau"),\n       c_for_benefit = c(c_for_benefit(rnd, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(fit$cate_train, d$A, d$Y)$c_for_benefit,\n                           c_for_benefit(d$tau, d$A, d$Y)$c_for_benefit))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">$c_for_benefit\n[1] 0.6634926\n\n$n_pairs\n[1] 713\n\n$n_concordant\n[1] 168413\n\n$n_discordant\n[1] 85415\n\n$n_tied_pred\n[1] 0\n\n\n--- 随机 vs 真实 tau 作标尺 ---\n# A tibble: 3 × 2\n  来源     c_for_benefit\n  &lt;chr&gt;            &lt;dbl&gt;\n1 随机             0.488\n2 模型             0.663\n3 真实 tau         0.624</code></pre>' +
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
          '<pre><code class="language-r">cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
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
          '<pre><code class="language-r">cv &lt;- toc_curve(fit$cate_train, d$A, d$Y)\nhead(cv, 5)\nattr(cv, "overall_ate")\n\n# 分位处的 TOC\ntibble(分位 = c("10%", "25%", "50%", "75%"),\n       TOC = sapply(c(.1, .25, .5, .75), function(f)\n         cv$toc[which.min(abs(cv$fraction - f))]))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 前 5 行 ---\n      fraction       toc\n1 0.0006666667 22.410337\n2 0.0013333333  5.228049\n3 0.0020000000  9.836217\n4 0.0026666667 12.419637\n5 0.0033333333  7.271920\n\n--- 属性 overall_ate ---\n[1] 1.072626\n\n--- 分位数处的 TOC ---\n# A tibble: 4 × 2\n  分位    TOC\n  &lt;chr&gt; &lt;dbl&gt;\n1 10%    2.44\n2 25%    2.14\n3 50%    1.89\n4 75%    1.51</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\ncat("--- 返回的字段 ---\\n")\nnames(dr)\ncat("\\n--- 伪结局的均值 = DR 估计的 ATE ---\\n")\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ncat("\\n--- 三件套的范围 ---\\n")\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"\n[6] "t0"         "effect"\n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
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
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_obs(n = 1200, seed = 1204)\ndr &lt;- dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)\ncat("--- 返回的字段 ---\\n")\nnames(dr)\ncat("\\n--- 伪结局的均值 = DR 估计的 ATE ---\\n")\ntibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)\ncat("\\n--- 三件套的范围 ---\\n")\ntibble(ps_min = min(dr$propensity), ps_max = max(dr$propensity),\n       mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">--- 返回的字段 ---\n[1] "pseudo"     "mu1"        "mu0"        "propensity" "ate"\n[6] "t0"         "effect"\n\n--- 伪结局的均值 = DR 估计的 ATE ---\n# A tibble: 1 × 2\n  DR_ATE 真实ATE\n   &lt;dbl&gt;   &lt;dbl&gt;\n1  0.979    1.04\n\n--- 三件套的范围 ---\n# A tibble: 1 × 4\n  ps_min ps_max mu1_mean mu0_mean\n   &lt;dbl&gt;  &lt;dbl&gt;    &lt;dbl&gt;    &lt;dbl&gt;\n1 0.0179  0.939     7.16     6.10</code></pre>' +
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
          '<pre><code class="language-r">bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
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
          '<pre><code class="language-r">bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\nbm$table\nbm$setup\ndim(bm$cate)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">learner    ate qini_coefficient qini_normalized toc_gain c_for_benefit\n1       S 1.0367           0.2235          0.4167   0.5160        0.6126\n2       T 1.0960           0.2025          0.3777   0.4915        0.6081\n3       X 1.0919           0.2167          0.4041   0.6466        0.6170\n4       R 0.4983           0.2469          0.4604   0.9460        0.5989\n5      DR 1.0887           0.2214          0.4129   0.5676        0.6173\n  tau_cor tau_rmse\n1  0.9077   0.4382\n2  0.8937   0.4810\n3  0.9455   0.3584\n4  0.8573   0.8540\n5  0.9319   0.3784\n\n--- setup ---\n$n\n[1] 1500\n\n$n_folds\n[1] 5\n\n$seed\n[1] 42\n\n$effect\n[1] "survdiff"\n\n$t0\nNULL\n\n$learners\n[1] "S"  "T"  "X"  "R"  "DR"\n\n$learner_base\n[1] "LearnerRegrRanger"\n\n$has_truth\n[1] TRUE\n\n\n--- cate 长表规模 ---\n[1] 7500    3</code></pre>' +
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
          '<pre><code class="language-r">bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="language-r">返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>教程里嵌的两张对比图（<code>docs/assets/img/benchmark/qini_curves.png</code> 与 <code>toc_curves.png</code>）就是这个函数生成的。</p>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" alt="Qini 曲线对比"><figcaption>三种 meta-learner 的 Qini 曲线，虚线为随机靶向参考线。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" alt="TOC 曲线对比"><figcaption>同一次基准测试的 TOC 曲线，水平线为总体 ATE。</figcaption></figure>' +
          '</div>'
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
          '<pre><code class="language-r">bm &lt;- hte_benchmark(d$X, d$A, d$Y, learners = c("S", "X"), seed = 42)\np &lt;- plot_hte_benchmark(bm, "qini")\nclass(p)\nlength(bm$curves$qini)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="language-r">返回类： ggplot2::ggplot ggplot ggplot2::gg S7_object gg \n曲线数： 2 \n默认 min_fraction = 0.05，即前 5% 不画</code></pre>' +
          '<p>The two comparison figures embedded in the tutorial (<code>docs/assets/img/benchmark/qini_curves.png</code> and <code>toc_curves.png</code>) were produced by this function.</p>'
      },
      {
        id: "fig",
        heading: "Figures from an actual run",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" alt="Qini curve comparison"><figcaption>Qini curves for three meta-learners; the dashed line is random targeting.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" alt="TOC curve comparison"><figcaption>TOC curves from the same benchmark run; the horizontal line is the overall ATE.</figcaption></figure>' +
          '</div>'
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
          '<pre><code class="language-r">ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
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
          '<pre><code class="language-r">ci &lt;- cate_ci("T", d$X, d$A, d$Y, B = 30, seed = 1,\n               learner_base = lrn("regr.ranger", num.trees = 150, seed = 1L))\ntibble(ATE = ci$ate, ATE_lo = ci$ate_lo, ATE_hi = ci$ate_hi,\n       B = ci$B, level = ci$level)\ntibble(lo = ci$cate_lo[1:3], hi = ci$cate_hi[1:3])</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out"># A tibble: 1 × 5\n    ATE ATE_lo ATE_hi     B level\n  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;\n1  1.05  0.923   1.20    30  0.95\n\n--- CATE 区间宽度（前 3 人）---\n# A tibble: 3 × 2\n      lo    hi\n   &lt;dbl&gt; &lt;dbl&gt;\n1 -0.058 2.26 \n2 -0.893 0.874\n3 -0.264 0.599</code></pre>' +
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
          '<pre><code class="language-r">cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>如果你已经在用 ggplot2，可以自己画：<code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>。这个函数的定位是快速看一眼。</p>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<figure class="fig"><img src="assets/img/metrics/qini_curve.png" alt="Qini 曲线">' +
          '<figcaption>连续结局 RCT 基准数据（<code>rct_lin</code>）上 DR-learner 的 Qini 曲线，虚线为随机靶向。曲线全程位于参考线上方，说明预测排序携带信息。</figcaption></figure>'
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
          '<pre><code class="language-r">cv &lt;- qini_curve(fit$cate_train, d$A, d$Y)\np &lt;- plot_qini(cv, main = "Qini curve")\nnrow(cv)</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">plot_qini 返回类： data.frame ；是不可见返回\n曲线点数： 1501</code></pre>' +
          '<p>If you already work with ggplot2 you can draw it yourself: <code>ggplot(cv, aes(fraction, qini)) + geom_line()</code>. This function is positioned as a quick look.</p>'
      },
      {
        id: "fig",
        heading: "Figure from an actual run",
        body:
          '<figure class="fig"><img src="assets/img/metrics/qini_curve.png" alt="Qini curve">' +
          '<figcaption>Qini curve of a DR-learner on the continuous RCT benchmark dataset (<code>rct_lin</code>); the dashed line is random targeting. The curve stays above the reference throughout, so the predicted ordering carries information.</figcaption></figure>'
      }
    ]
  }
};

window.SITE_PAGES.apisurvcurve = {

  zh: {
    title: "surv_effect_curve()",
    lede: "生存结局的效应—时间曲线：在一组时点上逐个重拟合 metalearner。",
    sections: [
      {
        id: "what",
        heading: "返回什么",
        body:
          '<div class="fn">' +
          '<div class="fn-name">surv_effect_curve()<span class="badge">survival</span></div>' +
          '<div class="fn-sig">surv_effect_curve(type, X, A, Y, times = NULL, n_times = 20L, effect = c("survdiff", "rmst"), learner_base = "coxph", newX = NULL, ...)</div>' +
          '<p><code>metalearner()</code> 的生存效应只在<strong>一个</strong>时点 <code>t0</code> 上有定义，' +
          '但临床解释常要回答「效应随时间怎么变」。本函数把一组时点逐个跑一遍，' +
          '返回两列：<code>time</code> 与 <code>ate</code>；属性里的 <code>cate</code> 是 ' +
          '<code>nrow(newX) × length(times)</code> 矩阵，第 j 列就是第 j 个时点上各样本的 CATE。</p>' +
          '<p><code>times = NULL</code> 时取<strong>事件时间</strong>的 10%–90% 分位数共 ' +
          '<code>n_times</code> 个——避开两端是因为尾部事件数少、估计不稳。' +
          '<code>effect</code> 与 <code>metalearner()</code> 完全对齐：<code>"survdiff"</code> 给 ' +
          '<code>ΔS(t)</code>，<code>"rmst"</code> 给限制到 τ 的平均生存时间差（每个 τ 各自重拟合，' +
          '因为伪结局 ξ 本身随 τ 变化）。</p>' +
          '</div>' +
          '<div class="callout warn"><div class="callout-title">实现方式：逐点重拟合，五族行为完全一致</div>' +
          '<p>曲线上第 g 个点就是 <code>metalearner(type, X, A, Y, t0 = times[g])</code> 的估计结果，' +
          '没有任何近似或复用。S/T 的结局模型本身是生存模型、理论上能一次拟合出整条曲线，' +
          '但那样接口行为会按 learner 类型分叉，用户得先记住「我是 S 还是 DR」才知道函数做了什么。' +
          '这里宁可慢，也要语义单一。</p>' +
          '<p><strong>代价</strong>：G 个时点 = G 次完整拟合，倾向得分模型也会重复训练 G 次。' +
          '默认 <code>n_times = 20</code>；换成 <code>learner_base = "ranger"</code> 后会明显变慢。</p></div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。背景数据：<code>mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)</code>。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)\ncv &lt;- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 4)\ncv\ndim(attr(cv, "cate"))\nattr(cv, "n_fits")</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">       time       ate\n1 0.2514014 0.1090892\n2 0.9880915 0.1513944\n3 2.2045829 0.1655446\n4 5.3669247 0.1084557\n[1] 600   4\n[1] 4</code></pre>' +
          '<p>最后一行的 <code>4</code> 是实际重拟合次数，等于时点个数——可用它核对没有偷偷复用模型。</p>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/surv/curve_survdiff.png" alt="生存概率差随时间的曲线"><figcaption><code>effect = "survdiff"</code>：每个点是该时点的生存概率差。逐点独立拟合，所以曲线会抖——抖动本身反映了单点估计的抽样噪声，不是 bug。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/surv/curve_rmst.png" alt="RMST 差随时间的曲线"><figcaption><code>effect = "rmst"</code>：ΔRMST(τ) 是 ΔS 在 [0, τ] 上的积分，因此随 τ 单调累积上升。阴影带是该时点个体 CATE 的 25%–75% 分位范围。</figcaption></figure>' +
          '</div>' +
          '<p>两张图都来自 <code>plot_surv_effect_curve()</code>，返回 ggplot 对象，可继续用 <code>+</code> 叠加图层。</p>'
      }
    ]
  },

  en: {
    title: "surv_effect_curve()",
    lede: "Effect-over-time curve for survival outcomes: refits the metalearner at every time point.",
    sections: [
      {
        id: "what",
        heading: "What it returns",
        body:
          '<div class="fn">' +
          '<div class="fn-name">surv_effect_curve()<span class="badge">survival</span></div>' +
          '<div class="fn-sig">surv_effect_curve(type, X, A, Y, times = NULL, n_times = 20L, effect = c("survdiff", "rmst"), learner_base = "coxph", newX = NULL, ...)</div>' +
          '<p>The survival effect of <code>metalearner()</code> is defined at a <strong>single</strong> ' +
          'time point <code>t0</code>, yet clinical interpretation usually asks how the effect evolves. ' +
          'This function runs a whole grid of time points and returns two columns, <code>time</code> and ' +
          '<code>ate</code>; the <code>cate</code> attribute is a ' +
          '<code>nrow(newX) × length(times)</code> matrix whose j-th column holds the individual CATEs ' +
          'at the j-th time point.</p>' +
          '<p>With <code>times = NULL</code> the grid is the 10%–90% quantiles of the ' +
          '<strong>event</strong> times, <code>n_times</code> of them — the tails are skipped because few ' +
          'events fall there and the estimates get unstable. <code>effect</code> mirrors ' +
          '<code>metalearner()</code>: <code>"survdiff"</code> gives <code>ΔS(t)</code>, ' +
          '<code>"rmst"</code> gives the difference in restricted mean survival up to τ (each τ is refitted ' +
          'separately, since the pseudo-outcome ξ itself depends on τ).</p>' +
          '</div>' +
          '<div class="callout warn"><div class="callout-title">Implementation: point-by-point refitting, identical across all five learners</div>' +
          '<p>The g-th point of the curve <em>is</em> <code>metalearner(type, X, A, Y, t0 = times[g])</code>, ' +
          'with no approximation and no reuse. For S/T the outcome model is itself a survival model, so one ' +
          'fit could in principle produce the whole curve — but then the behaviour of the interface would ' +
          'diverge by learner type, and users would have to remember whether they are on S or DR before ' +
          'knowing what the function does. We choose slower but uniform semantics.</p>' +
          '<p><strong>Cost</strong>: G time points means G complete fits, and the propensity model is also ' +
          'retrained G times. The default is <code>n_times = 20</code>; switching to ' +
          '<code>learner_base = "ranger"</code> makes it noticeably slower.</p></div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. Background data: <code>mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)</code>.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 600, t0 = 2, seed = 103)\ncv &lt;- surv_effect_curve("T", d$X, d$A, d$Y, n_times = 4)\ncv\ndim(attr(cv, "cate"))\nattr(cv, "n_fits")</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">       time       ate\n1 0.2514014 0.1090892\n2 0.9880915 0.1513944\n3 2.2045829 0.1655446\n4 5.3669247 0.1084557\n[1] 600   4\n[1] 4</code></pre>' +
          '<p>The final <code>4</code> is the number of refits, equal to the number of time points — use it to confirm no model was quietly reused.</p>'
      },
      {
        id: "fig",
        heading: "Figures from an actual run",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/surv/curve_survdiff.png" alt="Survival difference over time"><figcaption><code>effect = "survdiff"</code>: each point is the survival difference at that time. Every point is fitted independently, so the curve is jagged — that jaggedness is the sampling noise of a single-time estimate, not a bug.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/surv/curve_rmst.png" alt="RMST difference over time"><figcaption><code>effect = "rmst"</code>: ΔRMST(τ) integrates ΔS over [0, τ], so it rises monotonically with τ. The shaded band is the 25%–75% quantile range of the individual CATE at that time.</figcaption></figure>' +
          '</div>' +
          '<p>Both figures come from <code>plot_surv_effect_curve()</code>, which returns a ggplot object you can keep customising with <code>+</code>.</p>'
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
          '<p>按设计（<code>rct</code> / <code>obs</code>）和结局类型返回一张 DAG：协变量 X 同时影响处理 A 与结局 Y，A→Y 的效应随 X 变化。用于说明为什么要调整 X。返回值是 ggplot2 对象，可继续 <code>+</code> 定制。</p>' +
          '<p>边的图层是 <code>GeomCurve</code>（曲率不同的边各占一层，避免任意两节点之间出现重复箭头），节点是 <code>GeomLabel</code>；当前布局下所有边曲率为 0，因此共 2 层。</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "实测示例",
        body:
          '<p>代码与输出均为<strong>真实跑出</strong>。无额外输入。</p>' +
          '<pre><code class="language-r">for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("=====", "design =", k, "=====", "\\n")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n                         collapse = ", "), "\\n\\n")\n}</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="r-out">===== design = rct =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg\ngeom layers: 2\n图层类型： GeomCurve, GeomLabel\n\n===== design = obs =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg\ngeom layers: 2\n图层类型： GeomCurve, GeomLabel</code></pre>' +
          '<p>教程与文档站里嵌的 DAG 图（<code>docs/assets/img/dag/</code>）就是这个函数生成后导出的。RCT 版没有 <code>X → A</code> 这条边，观察性版有——这就是两者的核心差异。</p>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" alt="RCT 设计的 DAG"><figcaption>RCT × 连续结局：<code>A</code> 无父节点，不存在 <code>X → A</code> 这条打开后门的路径。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" alt="观察性设计的 DAG"><figcaption>观察性 × 连续结局：<code>X → e → A</code> 与 <code>X → mu → Y</code> 同时存在，必须校正。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" alt="RCT 二分类结局的 DAG"><figcaption>RCT × 二分类结局：因果结构完全不变，只是效应尺度换成风险差。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" alt="观察性二分类结局的 DAG"><figcaption>观察性 × 二分类结局：后门 <code>X → e → A</code> 照旧要校正，结局换成 0/1。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" alt="RCT 生存结局的 DAG"><figcaption>RCT × 生存结局：结构不变；实际分析还要处理右删失（IPCW），删失节点未画出。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" alt="观察性生存结局的 DAG"><figcaption>观察性 × 生存结局：混杂靠把混杂因子放进 X 条件化，删矢由引擎自动做 IPCW。</figcaption></figure>' +
          '</div>'
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
          '<p>The edge layer is <code>GeomCurve</code> (edges with different curvature each get their own layer, so no node pair ever shows two arrows) and the nodes are <code>GeomLabel</code>. With the current layout every edge has zero curvature, hence two layers in total.</p>' +
          '</div>'
      },
      {
        id: "example",
        heading: "Worked example (real output)",
        body:
          '<p>Both code and output are <strong>actually run</strong>. No extra input.</p>' +
          '<pre><code class="language-r">for (k in c("rct", "obs")) {\n  g &lt;- mlr3HTE_dag(k, "continuous")\n  cat("=====", "design =", k, "=====", "\\n")\n  cat("class:", paste(class(g), collapse = " / "), "\\n")\n  cat("geom layers:", length(g$layers), "\\n")\n  cat("图层类型：", paste(vapply(g$layers, function(l) class(l$geom)[1], ""),\n                         collapse = ", "), "\\n\\n")\n}</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="r-out">===== design = rct =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg\ngeom layers: 2\n图层类型： GeomCurve, GeomLabel\n\n===== design = obs =====\nclass: ggplot2::ggplot / ggplot / ggplot2::gg / S7_object / gg\ngeom layers: 2\n图层类型： GeomCurve, GeomLabel</code></pre>' +
          '<p>The DAG figures embedded in the tutorial and docs site (<code>docs/assets/img/dag/</code>) are exports of this function. The RCT version has no <code>X → A</code> edge while the observational version does — that is the core difference between the two.</p>'
      },
      {
        id: "fig",
        heading: "Figures from an actual run",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" alt="DAG of the RCT design"><figcaption>RCT × continuous: <code>A</code> has no parent, so no <code>X → A</code> path opens a back door.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" alt="DAG of the observational design"><figcaption>Observational × continuous: both <code>X → e → A</code> and <code>X → mu → Y</code> are present and must be adjusted for.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" alt="DAG of the binary-outcome RCT"><figcaption>RCT × binary: the causal structure is unchanged; only the effect scale becomes a risk difference.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" alt="DAG of the binary-outcome observational design"><figcaption>Observational × binary: the <code>X → e → A</code> back door still needs adjustment; Y is just 0/1.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" alt="DAG of the survival-outcome RCT"><figcaption>RCT × survival: structure unchanged; the analysis additionally handles right-censoring via IPCW (the censoring node is not drawn).</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" alt="DAG of the survival-outcome observational design"><figcaption>Observational × survival: confounding is handled by putting the confounders in X, and censoring IPCW is applied automatically by the engine.</figcaption></figure>' +
          '</div>'
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
          '<pre><code class="language-r">l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>实测输出：</p>' +
          '<pre><code class="language-r">[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
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
          '<pre><code class="language-r">l &lt;- lrn("regr.ranger", num.trees = 100)\nclass(l)\nl$id\nidentical(l, mlr3::lrn("regr.ranger", num.trees = 100))</code></pre>' +
          '<p>Output:</p>' +
          '<pre><code class="language-r">[1] "LearnerRegrRanger" "LearnerRegr"       "Learner"          \n[4] "R6"               \n[1] "regr.ranger"\n\n--- 与 mlr3::lrn 同一个对象 ---\n[1] FALSE</code></pre>' +
          '<p>The full list of learners lives in mlr3&rsquo;s own documentation; mlr3HTE only wires them into the meta-learner framework. Match the learner to the outcome type: <code>regr.*</code> for continuous, <code>classif.*</code> for binary, and the strings <code>"coxph"</code> / <code>"ranger"</code> for survival.</p>'
      }
    ]
  }
};


/* ================= v0.34 新增函数文档（每函数一页） ================= */

window.SITE_PAGES.apiscenarios = {
  zh: {
    title: "mlr3HTE_scenarios()",
    lede: '列出 10 个基准模拟设计的结构标签（研究设计 / 混杂形式 / HTE 形式 / 是否共用变量）。',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_scenarios()",
        body:
          '<p>返回 data.frame，每行一个设计。四个维度相互独立，便于固定其余结构、只改变一个维度做对照。</p>' +
          '<pre><code class="language-r">mlr3HTE_scenarios()</code></pre>' +
          '<pre><code class="r-out">                          id design confounding       hte shared\n1                    rct_lin    rct        none    linear  FALSE\n2                 rct_nonlin    rct        none nonlinear  FALSE\n3        obs_lin_lin_sharedF    obs      linear    linear  FALSE\n4        obs_lin_lin_sharedT    obs      linear    linear   TRUE\n5     obs_lin_nonlin_sharedF    obs      linear nonlinear  FALSE\n6     obs_lin_nonlin_sharedT    obs      linear nonlinear   TRUE\n7     obs_nonlin_lin_sharedF    obs   nonlinear    linear  FALSE\n8     obs_nonlin_lin_sharedT    obs   nonlinear    linear   TRUE\n9  obs_nonlin_nonlin_sharedF    obs   nonlinear nonlinear  FALSE\n10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p><code>shared = TRUE</code> 表示存在既进入处理分配模型、又进入真实 CATE 的协变量，即混杂因子兼效应修饰因子。这类变量在观察性研究中是偏差的主要来源。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_scenarios()",
    lede: 'Lists the structural labels of the ten benchmark simulation designs (design, confounding form, HTE form, shared variable).',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_scenarios()",
        body:
          '<p>Returns a data.frame with one row per design. The four dimensions are independent, so one can be varied while the rest are held fixed.</p>' +
          '<pre><code class="language-r">mlr3HTE_scenarios()</code></pre>' +
          '<pre><code class="r-out">                          id design confounding       hte shared\n1                    rct_lin    rct        none    linear  FALSE\n2                 rct_nonlin    rct        none nonlinear  FALSE\n3        obs_lin_lin_sharedF    obs      linear    linear  FALSE\n4        obs_lin_lin_sharedT    obs      linear    linear   TRUE\n5     obs_lin_nonlin_sharedF    obs      linear nonlinear  FALSE\n6     obs_lin_nonlin_sharedT    obs      linear nonlinear   TRUE\n7     obs_nonlin_lin_sharedF    obs   nonlinear    linear  FALSE\n8     obs_nonlin_lin_sharedT    obs   nonlinear    linear   TRUE\n9  obs_nonlin_nonlin_sharedF    obs   nonlinear nonlinear  FALSE\n10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p><code>shared = TRUE</code> indicates a covariate that enters both the treatment assignment model and the true CATE, i.e. a confounder that is also an effect modifier. Such variables dominate the bias in observational studies.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiscenario = {
  zh: {
    title: "mlr3HTE_scenario()",
    lede: '按场景 id 生成一份带真值的模拟数据，同一参数组合完全可复现。',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_scenario()",
        body:
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>id</code></td><td>场景 id，取值见 <code>mlr3HTE_scenarios()</code></td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '<tr><td><code>n</code></td><td>样本量，默认 2000</td></tr>' +
          '<tr><td><code>seed</code></td><td>随机种子；缺省时按 id 与结局派生，保证可复现</td></tr>' +
          '<tr><td><code>t0</code></td><td>生存结局的效应评估时点，默认 2</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">s &lt;- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)\nc(ate = s$ate, ate_rmst = s$ate_rmst)</code></pre>' +
          '<pre><code class="r-out">      ate  ate_rmst\n0.1623314 0.2063841</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>真值 <code>tau</code> 的尺度随结局变化：连续结局为均值差，二分类为风险差，生存为 t0 时点生存概率差；生存结局另给 RMST 尺度的 <code>tau_rmst</code>。ATE 一律等于 <code>mean(tau)</code>。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_scenario()",
    lede: 'Generates one simulated dataset with known ground truth for a given scenario id; identical arguments reproduce identical data.',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_scenario()",
        body:
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>id</code></td><td>Scenario id, see <code>mlr3HTE_scenarios()</code></td></tr>' +
          '<tr><td><code>outcome</code></td><td><code>"continuous"</code> / <code>"binary"</code> / <code>"survival"</code></td></tr>' +
          '<tr><td><code>n</code></td><td>Sample size, default 2000</td></tr>' +
          '<tr><td><code>seed</code></td><td>Seed; derived from id and outcome when omitted</td></tr>' +
          '<tr><td><code>t0</code></td><td>Evaluation time for survival outcomes, default 2</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">s &lt;- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)\nc(ate = s$ate, ate_rmst = s$ate_rmst)</code></pre>' +
          '<pre><code class="r-out">      ate  ate_rmst\n0.1623314 0.2063841</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The scale of <code>tau</code> depends on the outcome: a mean difference for continuous outcomes, a risk difference for binary outcomes, and a difference in survival probability at t0 for survival outcomes, which additionally return <code>tau_rmst</code>. The ATE always equals <code>mean(tau)</code>.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apibench = {
  zh: {
    title: "mlr3HTE_bench()",
    lede: '取出随包发布的基准数据（10 个设计 × 3 类结局，n = 2000，固定种子）。',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_bench()",
        body:
          '<pre><code class="language-r">b &lt;- mlr3HTE_bench("rct_lin", "continuous")\nlist(n = nrow(b$X), ate = b$ate, all_ps_half = all(b$ps_true == 0.5))</code></pre>' +
          '<pre><code class="r-out">$n\n[1] 2000\n\n$ate\n[1] 1\n\n$all_ps_half\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>方法学比较应统一使用这一份数据，避免各自重新模拟导致结论不可比。若请求的组合不存在，会即时按同一生成器重算，结果一致但更慢。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_bench()",
    lede: 'Returns the benchmark data shipped with the package (10 designs x 3 outcomes, n = 2000, fixed seeds).',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_bench()",
        body:
          '<pre><code class="language-r">b &lt;- mlr3HTE_bench("rct_lin", "continuous")\nlist(n = nrow(b$X), ate = b$ate, all_ps_half = all(b$ps_true == 0.5))</code></pre>' +
          '<pre><code class="r-out">$n\n[1] 2000\n\n$ate\n[1] 1\n\n$all_ps_half\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>Method comparisons should use this single dataset so that conclusions remain comparable. If a requested combination is absent, it is recomputed from the same generator: identical results, but slower.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apibenchindex = {
  zh: {
    title: "mlr3HTE_bench_index()",
    lede: '列出打包数据中实际存在的键、真值 ATE 与样本量，便于批量循环。',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_bench_index()",
        body:
          '<pre><code class="language-r">idx &lt;- mlr3HTE_bench_index()\ndim(idx)\nutils::head(idx, 4)</code></pre>' +
          '<pre><code class="r-out">dim: 30 5\n                    key         id    outcome       ate    n\n1    rct_lin.continuous    rct_lin continuous 1.0000000 2000\n2        rct_lin.binary    rct_lin     binary 0.1288110 2000\n3      rct_lin.survival    rct_lin   survival 0.1542625 2000\n4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>共 30 行（10 设计 × 3 结局）。键的格式为 <code>&lt;场景 id&gt;.&lt;结局&gt;</code>。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_bench_index()",
    lede: 'Lists the keys present in the bundled data together with the true ATE and sample size, for batch iteration.',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_bench_index()",
        body:
          '<pre><code class="language-r">idx &lt;- mlr3HTE_bench_index()\ndim(idx)\nutils::head(idx, 4)</code></pre>' +
          '<pre><code class="r-out">dim: 30 5\n                    key         id    outcome       ate    n\n1    rct_lin.continuous    rct_lin continuous 1.0000000 2000\n2        rct_lin.binary    rct_lin     binary 0.1288110 2000\n3      rct_lin.survival    rct_lin   survival 0.1542625 2000\n4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>Thirty rows in total (10 designs x 3 outcomes). Keys follow the pattern <code>&lt;scenario id&gt;.&lt;outcome&gt;</code>.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiexplainer = {
  zh: {
    title: "hte_explainer()",
    lede: '把 CATE 模型包装为 DALEX 解释器；响应变量取双重稳健伪结局，而非原始 Y。',
    sections: [
      {
        id: "fn",
        heading: "hte_explainer()",
        body:
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>fit</code></td><td><code>metalearner()</code> 的返回对象，或任何带 <code>$predict(newX)</code> 的对象</td></tr>' +
          '<tr><td><code>X</code></td><td>协变量 data.frame，解释所依据的样本</td></tr>' +
          '<tr><td><code>A / Y</code></td><td>处理与结局；未提供 <code>pseudo</code> 时用于计算伪结局</td></tr>' +
          '<tr><td><code>pseudo</code></td><td>已算好的逐人伪结局，可复用 <code>dr_pseudo_outcome()</code> 的结果</td></tr>' +
          '<tr><td><code>t0 / effect</code></td><td>生存结局的评估时点与效应尺度</td></tr>' +
          '<tr><td><code>label / verbose</code></td><td>解释器显示名 / 是否打印 DALEX 进度</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y,\n                   learner_base = lrn("regr.ranger", num.trees = 200))\nex &lt;- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\nc(n = length(ex$pseudo), cor_pseudo_tau = round(cor(ex$pseudo, d$tau), 3))</code></pre>' +
          '<pre><code class="r-out">             n cor_pseudo_tau\n       400.000          0.326</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>伪结局与真值 <code>tau</code> 的相关通常不高（上例 0.326）：它是逐人的无偏估计，方差很大，个别取值可能远离真值。这不影响它作为解释目标的资格——<code>E[Y*|X] = tau(X)</code> 是<strong>条件期望</strong>层面的性质，与单点噪声无关。若要逐点精度，应看 metalearner 的 CATE 估计，而非伪结局。</p></div>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>响应变量必须是伪结局。若直接用 <code>Y</code>，置换重要性与 PDP 衡量的将是「该变量对基线预后 <code>mu(X)</code> 的重要性」，与效应异质性无关。伪结局满足 <code>E[Y*|X] = tau(X)</code>，因此解释目标才是 CATE。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_explainer()",
    lede: 'Wraps a CATE model as a DALEX explainer whose response is the doubly robust pseudo-outcome rather than the raw outcome.',
    sections: [
      {
        id: "fn",
        heading: "hte_explainer()",
        body:
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>fit</code></td><td>A <code>metalearner()</code> fit, or any object with <code>$predict(newX)</code></td></tr>' +
          '<tr><td><code>X</code></td><td>Covariate data.frame used for explanation</td></tr>' +
          '<tr><td><code>A / Y</code></td><td>Treatment and outcome; used to compute the pseudo-outcome when <code>pseudo</code> is omitted</td></tr>' +
          '<tr><td><code>pseudo</code></td><td>Precomputed pseudo-outcome, e.g. from <code>dr_pseudo_outcome()</code></td></tr>' +
          '<tr><td><code>t0 / effect</code></td><td>Evaluation time and effect scale for survival outcomes</td></tr>' +
          '<tr><td><code>label / verbose</code></td><td>Explainer label / whether to print DALEX progress</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y,\n                   learner_base = lrn("regr.ranger", num.trees = 200))\nex &lt;- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\nc(n = length(ex$pseudo), cor_pseudo_tau = round(cor(ex$pseudo, d$tau), 3))</code></pre>' +
          '<pre><code class="r-out">             n cor_pseudo_tau\n       400.000          0.326</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The correlation between the pseudo-outcome and the true <code>tau</code> is usually modest (0.326 above): it is an unbiased but high-variance individual-level estimate. That does not disqualify it as an explanation target — <code>E[Y*|X] = tau(X)</code> is a property of the <strong>conditional expectation</strong>, not of individual noise. For point-wise accuracy, use the metalearner\'s CATE estimate instead.</p></div>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The response must be the pseudo-outcome. With the raw <code>Y</code>, permutation importance and partial dependence measure how strongly a variable drives the baseline prognosis <code>mu(X)</code>, which is unrelated to effect heterogeneity. The pseudo-outcome satisfies <code>E[Y*|X] = tau(X)</code>, so the explanation target is the CATE itself.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apisurrogate = {
  zh: {
    title: "hte_surrogate()",
    lede: '用单一 mlr3 学习器重拟合 CATE 曲面，得到一个结构简单、可解释的代理模型。',
    sections: [
      {
        id: "fn",
        heading: "hte_surrogate()",
        body:
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = lrn("regr.ranger", num.trees = 200))\nsur &lt;- hte_surrogate(d$X, fit$predict(d$X))\nlist(learner = sur$learner_id,\n     cor = round(cor(sur$predict(d$X), fit$predict(d$X)), 3))</code></pre>' +
          '<pre><code class="r-out">$learner\n[1] "regr.ranger"\n\n$cor\n[1] 0.913</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>代理模型只用于解释与可视化，不应替代原 metalearner 做效应估计：它把多阶段、带权重、带交叉拟合的过程压缩成单一回归，精度必然下降。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_surrogate()",
    lede: 'Refits the CATE surface with a single mlr3 learner to obtain a compact, interpretable surrogate model.',
    sections: [
      {
        id: "fn",
        heading: "hte_surrogate()",
        body:
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = lrn("regr.ranger", num.trees = 200))\nsur &lt;- hte_surrogate(d$X, fit$predict(d$X))\nlist(learner = sur$learner_id,\n     cor = round(cor(sur$predict(d$X), fit$predict(d$X)), 3))</code></pre>' +
          '<pre><code class="r-out">$learner\n[1] "regr.ranger"\n\n$cor\n[1] 0.913</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The surrogate is intended for explanation and visualisation only and should not replace the original metalearner for effect estimation: it compresses a multi-stage, weighted, cross-fitted procedure into a single regression and necessarily loses precision.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiimportance = {
  zh: {
    title: "hte_feature_importance()",
    lede: '置换法变量重要性：打乱某个协变量后，模型相对伪结局的损失上升多少。',
    sections: [
      {
        id: "fn",
        heading: "hte_feature_importance()",
        body:
          '<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>d</code> / <code>fit</code> / <code>ex</code> 三个对象。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>explainer</code></td><td><code>hte_explainer()</code> 的结果</td></tr>' +
          '<tr><td><code>loss</code></td><td><code>"rmse"</code>（默认）/ <code>"mse"</code>，也可传函数</td></tr>' +
          '<tr><td><code>B</code></td><td>置换次数，默认 10</td></tr>' +
          '<tr><td><code>variables</code></td><td>只评估部分变量</td></tr>' +
          '<tr><td><code>N</code></td><td>用于计算损失的抽样行数</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">hte_feature_importance(ex, B = 5, N = 400, seed = 1)</code></pre>' +
          '<pre><code class="r-out">  variable dropout_loss baseline    dropout dropout_pct\n2      lac     2.412783 1.876112 0.53667133   28.605513\n4    tumor     2.272273 1.876112 0.39616112   21.116075\n1      age     2.185380 1.876112 0.30926804   16.484523\n3      sex     1.940157 1.876112 0.06404511    3.413716</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>这是对<strong>模型</strong>的解释，不是因果效应分解。重要性高只说明模型用到了该变量，不说明它真的修饰了治疗效果；判断后者需要设计层面的证据，例如随机化下的分层分析或预先设定的交互项检验。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_feature_importance()",
    lede: 'Permutation importance: how much the loss against the pseudo-outcome increases when a covariate is permuted.',
    sections: [
      {
        id: "fn",
        heading: "hte_feature_importance()",
        body:
          '<p>The example below reuses the <code>d</code> / <code>fit</code> / <code>ex</code> objects built on the <code>hte_explainer()</code> page.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>explainer</code></td><td>An <code>hte_explainer()</code> result</td></tr>' +
          '<tr><td><code>loss</code></td><td><code>"rmse"</code> (default) / <code>"mse"</code>, or a function</td></tr>' +
          '<tr><td><code>B</code></td><td>Number of permutations, default 10</td></tr>' +
          '<tr><td><code>variables</code></td><td>Restrict to a subset of variables</td></tr>' +
          '<tr><td><code>N</code></td><td>Number of rows sampled for the loss</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">hte_feature_importance(ex, B = 5, N = 400, seed = 1)</code></pre>' +
          '<pre><code class="r-out">  variable dropout_loss baseline    dropout dropout_pct\n2      lac     2.412783 1.876112 0.53667133   28.605513\n4    tumor     2.272273 1.876112 0.39616112   21.116075\n1      age     2.185380 1.876112 0.30926804   16.484523\n3      sex     1.940157 1.876112 0.06404511    3.413716</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>This explains the <strong>model</strong>, not a causal decomposition. High importance only means the model relied on the variable; it does not establish that the variable truly modifies the treatment effect. The latter requires design-level evidence, such as stratified analysis under randomisation or a pre-specified interaction test.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apipdp = {
  zh: {
    title: "hte_pdp()",
    lede: '偏依赖（PDP）与累积局部效应（ALE）：固定某个协变量，看平均预测 CATE 如何变化。',
    sections: [
      {
        id: "fn",
        heading: "hte_pdp()",
        body:
          '<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>explainer</code></td><td><code>hte_explainer()</code> 的结果</td></tr>' +
          '<tr><td><code>variables</code></td><td>要计算的变量名；缺省为全部协变量</td></tr>' +
          '<tr><td><code>grid_points</code></td><td>网格点数，默认 101</td></tr>' +
          '<tr><td><code>type</code></td><td><code>"partial"</code>（PDP）或 <code>"accumulated"</code>（ALE）</td></tr>' +
          '<tr><td><code>center</code></td><td>是否减去平均预测值，默认 <code>FALSE</code>（保留绝对水平）</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">utils::head(hte_pdp(ex, variables = "lac", grid_points = 20), 6)</code></pre>' +
          '<pre><code class="r-out">   variable          x        yhat    type\n1       lac -1.1096583  0.25542452 partial\n2       lac  0.3741624  0.17344583 partial\n3       lac  0.8527465  0.15291082 partial\n4       lac  1.1359194  0.12182969 partial\n5       lac  1.3229172  0.03643026 partial\n6       lac  1.5764892 -0.06165269 partial</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>变量间存在相关时，PDP 在观测支撑集之外做外推，可能给出不存在的组合；此时改用 <code>type = "accumulated"</code>（ALE）更稳健。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_pdp()",
    lede: 'Partial dependence (PDP) and accumulated local effects (ALE): how the average predicted CATE changes as one covariate is varied.',
    sections: [
      {
        id: "fn",
        heading: "hte_pdp()",
        body:
          '<p>The example below reuses the <code>ex</code> object built on the <code>hte_explainer()</code> page.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>explainer</code></td><td>An <code>hte_explainer()</code> result</td></tr>' +
          '<tr><td><code>variables</code></td><td>Variables to compute; all covariates by default</td></tr>' +
          '<tr><td><code>grid_points</code></td><td>Number of grid points, default 101</td></tr>' +
          '<tr><td><code>type</code></td><td><code>"partial"</code> (PDP) or <code>"accumulated"</code> (ALE)</td></tr>' +
          '<tr><td><code>center</code></td><td>Whether to subtract the mean prediction; <code>FALSE</code> by default, preserving the absolute level</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">utils::head(hte_pdp(ex, variables = "lac", grid_points = 20), 6)</code></pre>' +
          '<pre><code class="r-out">   variable          x        yhat    type\n1       lac -1.1096583  0.25542452 partial\n2       lac  0.3741624  0.17344583 partial\n3       lac  0.8527465  0.15291082 partial\n4       lac  1.1359194  0.12182969 partial\n5       lac  1.3229172  0.03643026 partial\n6       lac  1.5764892 -0.06165269 partial</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>When covariates are correlated, PDP extrapolates outside the observed support and may evaluate combinations that never occur. In that situation <code>type = "accumulated"</code> (ALE) is more robust.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apishap = {
  zh: {
    title: "hte_shap()",
    lede: 'Kernel SHAP：把每个个体的 CATE 分解为基线值加各协变量的贡献，满足可加性。',
    sections: [
      {
        id: "fn",
        heading: "hte_shap()",
        body:
          '<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>d</code> / <code>fit</code> / <code>ex</code> 三个对象。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>object</code></td><td><code>hte_explainer()</code> 的结果，或带 <code>$predict</code> 的对象</td></tr>' +
          '<tr><td><code>X</code></td><td>计算 SHAP 的样本；缺省用解释器里的 <code>X</code></td></tr>' +
          '<tr><td><code>bg_X</code></td><td>背景数据，用于估计联盟的边际期望</td></tr>' +
          '<tr><td><code>n_background</code></td><td>背景样本量，默认 100</td></tr>' +
          '<tr><td><code>seed / verbose</code></td><td>抽背景集的种子 / 是否显示进度条</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">sv &lt;- hte_shap(ex, n_background = 50, seed = 1)\nS &lt;- as.matrix(sv$S)\nmax(abs(as.numeric(sv$baseline) + rowSums(S) - fit$predict(d$X)))</code></pre>' +
          '<pre><code class="r-out">baseline = 0.912867\nmax |baseline + rowSums(S) - predict| = 4.44e-16</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>协变量数 <em>p</em> 不大时 Kernel SHAP 走精确枚举（<code>2^p</code> 个联盟）；<em>p</em> 较大时 kernelshap 自动切换为采样近似，此时结果随 <code>seed</code> 有轻微波动。上式的可加性残差是检验实现是否正确的直接手段，应为机器精度量级。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_shap()",
    lede: 'Kernel SHAP: decomposes each individual CATE into a baseline plus per-covariate contributions, satisfying additivity.',
    sections: [
      {
        id: "fn",
        heading: "hte_shap()",
        body:
          '<p>The example below reuses the <code>d</code> / <code>fit</code> / <code>ex</code> objects built on the <code>hte_explainer()</code> page.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>object</code></td><td>An <code>hte_explainer()</code> result, or an object with <code>$predict</code></td></tr>' +
          '<tr><td><code>X</code></td><td>Rows to explain; defaults to the explainer data</td></tr>' +
          '<tr><td><code>bg_X</code></td><td>Background data for the coalition marginals</td></tr>' +
          '<tr><td><code>n_background</code></td><td>Background size, default 100</td></tr>' +
          '<tr><td><code>seed / verbose</code></td><td>Seed for background sampling / progress bar</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">sv &lt;- hte_shap(ex, n_background = 50, seed = 1)\nS &lt;- as.matrix(sv$S)\nmax(abs(as.numeric(sv$baseline) + rowSums(S) - fit$predict(d$X)))</code></pre>' +
          '<pre><code class="r-out">baseline = 0.912867\nmax |baseline + rowSums(S) - predict| = 4.44e-16</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>For a small number of covariates <em>p</em>, Kernel SHAP enumerates all <code>2^p</code> coalitions exactly; for larger <em>p</em>, kernelshap switches to a sampling approximation and results fluctuate slightly with <code>seed</code>. The additivity residual above is a direct check on the implementation and should be at machine precision.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apishapdata = {
  zh: {
    title: "hte_shap_data()",
    lede: '把 shapviz 对象摊平为长表，便于导出 CSV 或自行用 ggplot2 重画。',
    sections: [
      {
        id: "fn",
        heading: "hte_shap_data()",
        body:
          '<p>下例沿用 <code>hte_shap()</code> 页面建立的 <code>sv</code> 对象。</p>' +
          '<pre><code class="language-r">utils::head(hte_shap_data(sv), 4)</code></pre>' +
          '<pre><code class="r-out">  id variable    value        shap\n1  1      age 52.48255  0.16783351\n2  2      age 62.20372  0.09710957\n3  3      age 49.97246  0.21584552\n4  4      age 79.14337 -0.09103024</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>基线值 <code>phi_0</code> 放在返回值的 <code>baseline</code> 属性里，每行只记录单个变量对单个样本的贡献。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_shap_data()",
    lede: 'Flattens a shapviz object into a long table for CSV export or custom ggplot2 redrawing.',
    sections: [
      {
        id: "fn",
        heading: "hte_shap_data()",
        body:
          '<p>The example below reuses the <code>sv</code> object built on the <code>hte_shap()</code> page.</p>' +
          '<pre><code class="language-r">utils::head(hte_shap_data(sv), 4)</code></pre>' +
          '<pre><code class="r-out">  id variable    value        shap\n1  1      age 52.48255  0.16783351\n2  2      age 62.20372  0.09710957\n3  3      age 49.97246  0.21584552\n4  4      age 79.14337 -0.09103024</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The baseline <code>phi_0</code> is stored in the <code>baseline</code> attribute; each row records one variable\'s contribution to one observation.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotimportance = {
  zh: {
    title: "plot_hte_importance()",
    lede: '画置换重要性的条形图，返回 ggplot 对象。',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_importance()",
        body:
          '<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>' +
          '<pre><code class="language-r">imp &lt;- hte_feature_importance(ex, B = 3, N = 300, seed = 1)\np &lt;- plot_hte_importance(imp)\nc(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))</code></pre>' +
          '<pre><code class="r-out">$classes\n[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"\n\n$is_ggplot\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>返回的是 ggplot 对象，可直接用 <code>+</code> 叠加主题与标度，或用 <code>ggsave()</code> 导出；绘图数据就是 <code>hte_feature_importance()</code> 的返回值，可单独落盘。</p></div>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<figure class="fig"><img src="assets/img/explain/importance.png" alt="置换重要性条形图">' +
          '<figcaption>连续结局 RCT 基准数据（<code>rct_lin</code>，n = 2000）上，T-learner 配 <code>regr.ranger</code> 拟合后，以 <code>B = 5</code>、<code>N = 500</code>、种子 1 计算的置换重要性。<code>lac</code> 居首，与数据生成机制一致——该变量的效应修饰作用最强。</figcaption></figure>'
      }
    ]
  },
  en: {
    title: "plot_hte_importance()",
    lede: 'Draws a bar chart of permutation importance and returns a ggplot object.',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_importance()",
        body:
          '<p>The example below reuses the <code>ex</code> object built on the <code>hte_explainer()</code> page.</p>' +
          '<pre><code class="language-r">imp &lt;- hte_feature_importance(ex, B = 3, N = 300, seed = 1)\np &lt;- plot_hte_importance(imp)\nc(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))</code></pre>' +
          '<pre><code class="r-out">$classes\n[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"\n\n$is_ggplot\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The returned ggplot object can be extended with <code>+</code> or exported with <code>ggsave()</code>. The underlying data is exactly the value returned by <code>hte_feature_importance()</code> and can be written to disk separately.</p></div>'
      },
      {
        id: "fig",
        heading: "Figure from an actual run",
        body:
          '<figure class="fig"><img src="assets/img/explain/importance.png" alt="Bar chart of permutation importance">' +
          '<figcaption>Permutation importance on the continuous RCT benchmark dataset (<code>rct_lin</code>, n = 2000): a T-learner with <code>regr.ranger</code>, computed with <code>B = 5</code>, <code>N = 500</code> and seed 1. <code>lac</code> ranks first, matching the data-generating process, where that covariate carries the strongest effect modification.</figcaption></figure>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotpdp = {
  zh: {
    title: "plot_hte_pdp()",
    lede: '画偏依赖曲线，按变量分面，返回 ggplot 对象。',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_pdp()",
        body:
          '<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>' +
          '<pre><code class="language-r">pd &lt;- hte_pdp(ex, variables = "lac", grid_points = 20)\np &lt;- plot_hte_pdp(pd)\nc(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))</code></pre>' +
          '<pre><code class="r-out">$classes\n[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"\n\n$is_ggplot\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p><code>free_y</code> 默认 <code>TRUE</code>：不同变量的 CATE 量级可能相差数倍，共用纵轴会把次要变量压成一条平线。若要跨变量比较绝对幅度，设为 <code>FALSE</code>。</p></div>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<figure class="fig"><img src="assets/img/explain/pdp.png" alt="偏依赖曲线分面图">' +
          '<figcaption>同上模型，<code>lac</code> 与 <code>age</code> 各取 41 个网格点。纵轴是绝对的平均预测 CATE（未中心化）——<code>age</code> 的曲线在 0.9–1.4 之间起伏，说明年龄改变的是效应大小而非方向。</figcaption></figure>'
      }
    ]
  },
  en: {
    title: "plot_hte_pdp()",
    lede: 'Draws partial dependence curves faceted by variable and returns a ggplot object.',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_pdp()",
        body:
          '<p>The example below reuses the <code>ex</code> object built on the <code>hte_explainer()</code> page.</p>' +
          '<pre><code class="language-r">pd &lt;- hte_pdp(ex, variables = "lac", grid_points = 20)\np &lt;- plot_hte_pdp(pd)\nc(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))</code></pre>' +
          '<pre><code class="r-out">$classes\n[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"\n\n$is_ggplot\n[1] TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p><code>free_y</code> defaults to <code>TRUE</code> because the CATE magnitudes of different covariates can differ several-fold and a shared axis would flatten the minor ones. Set it to <code>FALSE</code> to compare absolute magnitudes across variables.</p></div>'
      },
      {
        id: "fig",
        heading: "Figure from an actual run",
        body:
          '<figure class="fig"><img src="assets/img/explain/pdp.png" alt="Faceted partial dependence curves">' +
          '<figcaption>Same model, 41 grid points each for <code>lac</code> and <code>age</code>. The vertical axis is the absolute mean predicted CATE (not centred): the curve for <code>age</code> ranges over 0.9–1.4, so age changes the size of the effect rather than its direction.</figcaption></figure>'
      }
    ]
  }
};

window.SITE_PAGES.apiplotshap = {
  zh: {
    title: "plot_hte_shap()",
    lede: 'SHAP 的四种视图：重要性条形图、蜂群图、依赖图、单样本瀑布图，均返回 ggplot。',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_shap()",
        body:
          '<p>下例沿用 <code>hte_shap()</code> 页面建立的 <code>sv</code> 对象。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>sv</code></td><td><code>hte_shap()</code> 返回的 shapviz 对象</td></tr>' +
          '<tr><td><code>kind</code></td><td><code>"importance"</code> / <code>"beeswarm"</code> / <code>"dependence"</code> / <code>"waterfall"</code></td></tr>' +
          '<tr><td><code>variable</code></td><td><code>dependence</code> 传变量名，<code>waterfall</code> 传样本行号</td></tr>' +
          '<tr><td><code>max_vars</code></td><td>最多显示多少个变量，默认 8</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">c(imp = inherits(plot_hte_shap(sv, "importance"), "ggplot"),\n  dep = inherits(plot_hte_shap(sv, "dependence", variable = "lac"), "ggplot"),\n  wf  = inherits(plot_hte_shap(sv, "waterfall", variable = 1), "ggplot"))</code></pre>' +
          '<pre><code class="r-out"> imp  dep   wf\nTRUE TRUE TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>蜂群图同时给出三件事：变量的重要性（横轴跨度）、效应方向（正负）、以及取值高低与效应方向的关系（颜色梯度）。这是 PDP 无法提供的信息。</p></div>'
      },
      {
        id: "fig",
        heading: "实跑图形",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/explain/shap_beeswarm.png" alt="SHAP 蜂群图"><figcaption>蜂群图：每个点是一个个体，横坐标为 SHAP 值，颜色为变量取值。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/explain/shap_dependence.png" alt="SHAP 依赖图"><figcaption>依赖图：<code>lac</code> 的取值与其 SHAP 贡献，斜率即效应修饰的局部强度。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/explain/shap_waterfall.png" alt="SHAP 瀑布图"><figcaption>瀑布图：第 1 号个体的 CATE 如何从基线 E[f(x)] = 1.02 被逐项推到 0.338。</figcaption></figure>' +
          '</div>'
      }
    ]
  },
  en: {
    title: "plot_hte_shap()",
    lede: 'Four SHAP views — importance bars, beeswarm, dependence and a single-observation waterfall — all returning ggplot objects.',
    sections: [
      {
        id: "fn",
        heading: "plot_hte_shap()",
        body:
          '<p>The example below reuses the <code>sv</code> object built on the <code>hte_shap()</code> page.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody>' +
          '<tr><td><code>sv</code></td><td>A shapviz object from <code>hte_shap()</code></td></tr>' +
          '<tr><td><code>kind</code></td><td><code>"importance"</code> / <code>"beeswarm"</code> / <code>"dependence"</code> / <code>"waterfall"</code></td></tr>' +
          '<tr><td><code>variable</code></td><td>Variable name for <code>dependence</code>, row index for <code>waterfall</code></td></tr>' +
          '<tr><td><code>max_vars</code></td><td>Maximum number of variables shown, default 8</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r">c(imp = inherits(plot_hte_shap(sv, "importance"), "ggplot"),\n  dep = inherits(plot_hte_shap(sv, "dependence", variable = "lac"), "ggplot"),\n  wf  = inherits(plot_hte_shap(sv, "waterfall", variable = 1), "ggplot"))</code></pre>' +
          '<pre><code class="r-out"> imp  dep   wf\nTRUE TRUE TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The beeswarm plot conveys three things at once: importance (horizontal spread), direction of effect (sign), and how the covariate value relates to that direction (colour gradient). Partial dependence cannot provide this.</p></div>'
      },
      {
        id: "fig",
        heading: "Figures from an actual run",
        body:
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/explain/shap_beeswarm.png" alt="SHAP beeswarm"><figcaption>Beeswarm: one dot per individual, horizontal position is the SHAP value, colour is the covariate value.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/explain/shap_dependence.png" alt="SHAP dependence"><figcaption>Dependence: the value of <code>lac</code> against its SHAP contribution; the slope is the local strength of effect modification.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/explain/shap_waterfall.png" alt="SHAP waterfall"><figcaption>Waterfall: how the CATE of individual 1 is moved term by term from the baseline E[f(x)] = 1.02 to 0.338.</figcaption></figure>' +
          '</div>'
      }
    ]
  }
};

window.SITE_PAGES.apidagdata = {
  zh: {
    title: "mlr3HTE_dag_data()",
    lede: 'DAG 图的节点表与边表，含每条边的路由结果（曲率）。',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_dag_data()",
        body:
          '<pre><code class="language-r">dd &lt;- mlr3HTE_dag_data("rct", "continuous")\ndd$edges[, c("from", "to", "type", "curve")]</code></pre>' +
          '<pre><code class="r-out">  from  to type curve\n1    X tau base     0\n2    X  mu base     0\n3    A   Y base     0\n4  tau   Y base     0\n5   mu   Y base     0</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>任意两个节点之间只保留一条有向边。若某条边会从第三个节点身上穿过，自动加曲率绕行，<code>curve</code> 列即该边采用的曲率（0 表示直线）。绘图时按曲率分组，一层一个 <code>geom_curve</code>。</p></div>'
      }
    ]
  },
  en: {
    title: "mlr3HTE_dag_data()",
    lede: 'The node and edge tables behind the DAG plot, including the routing result (curvature) of every edge.',
    sections: [
      {
        id: "fn",
        heading: "mlr3HTE_dag_data()",
        body:
          '<pre><code class="language-r">dd &lt;- mlr3HTE_dag_data("rct", "continuous")\ndd$edges[, c("from", "to", "type", "curve")]</code></pre>' +
          '<pre><code class="r-out">  from  to type curve\n1    X tau base     0\n2    X  mu base     0\n3    A   Y base     0\n4  tau   Y base     0\n5   mu   Y base     0</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>At most one directed edge is kept between any pair of nodes. If an edge would pass through a third node, a curvature is added automatically and recorded in the <code>curve</code> column (0 means a straight line). The plot is then drawn with one <code>geom_curve</code> layer per curvature value.</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.apibenchdata = {
  zh: {
    title: "hte_benchmark_data()",
    lede: '取出 hte_benchmark() 的曲线绘图数据，附各 learner 的参考线。',
    sections: [
      {
        id: "fn",
        heading: "hte_benchmark_data()",
        body:
          '<pre><code class="language-r"># bm 见 hte_benchmark() 页面\nqd &lt;- hte_benchmark_data(bm, "qini")\nprint(head(qd[qd$learner == "T", c("learner", "fraction", "qini")], 3),\n      row.names = FALSE)\nprint(attr(qd, "reference"), row.names = FALSE)</code></pre>' +
          '<pre><code class="r-out"> learner fraction      qini\n       T   0.0500 0.1272805\n       T   0.0525 0.1669598\n       T   0.0550 0.2083948\n learner intercept   slope\n       S         0 0.68891\n       T         0 0.68891</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>Qini 面板的参考线是从原点到该 learner <code>Q(1)</code> 的随机靶向线；TOC 面板的参考线是全样本 ATE 的水平线（<code>slope = 0</code>）。<code>min_fraction</code> 控制左端截断，避免单个观测把纵轴拉爆。</p></div>'
      }
    ]
  },
  en: {
    title: "hte_benchmark_data()",
    lede: 'Returns the curve data used by hte_benchmark() plots, with the reference line for each learner attached.',
    sections: [
      {
        id: "fn",
        heading: "hte_benchmark_data()",
        body:
          '<pre><code class="language-r"># bm 见 hte_benchmark() 页面\nqd &lt;- hte_benchmark_data(bm, "qini")\nprint(head(qd[qd$learner == "T", c("learner", "fraction", "qini")], 3),\n      row.names = FALSE)\nprint(attr(qd, "reference"), row.names = FALSE)</code></pre>' +
          '<pre><code class="r-out"> learner fraction      qini\n       T   0.0500 0.1272805\n       T   0.0525 0.1669598\n       T   0.0550 0.2083948\n learner intercept   slope\n       S         0 0.68891\n       T         0 0.68891</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>In the Qini panel the reference is the random-targeting line from the origin to that learner\'s <code>Q(1)</code>; in the TOC panel it is the horizontal line at the overall ATE (<code>slope = 0</code>). <code>min_fraction</code> truncates the left tail so that a single observation cannot dominate the vertical axis.</p></div>'
      }
    ]
  }
};



/* ================= v0.34 新增内容 ================= */

window.SITE_PAGES.apisim = {
  zh: {
    title: "模拟数据与 DAG",
    lede: '按结构可控、真值已知的原则生成模拟数据：10 个设计 × 3 类结局打包随包发布，并提供因果结构图（DAG）的数据与绘图。',
    sections: [
      {
        id: "index",
        heading: "模拟数据与 DAG",
        body:
          '<p>这一组函数回答“用什么数据做比较”与“因果结构长什么样”。四个结构维度（研究设计 / 混杂形式 / HTE 形式 / 共用变量）相互独立，便于固定其余、只改一个来做对照。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>函数</th><th>用途</th></tr></thead><tbody><tr><td><a href="#/apiscenarios">mlr3HTE_scenarios()</a></td><td>列出 10 个基准设计的结构标签</td></tr><tr><td><a href="#/apiscenario">mlr3HTE_scenario()</a></td><td>按场景 id 生成一份带真值的模拟数据</td></tr><tr><td><a href="#/apibench">mlr3HTE_bench()</a></td><td>取出随包发布的基准数据（10 设计 × 3 结局）</td></tr><tr><td><a href="#/apibenchindex">mlr3HTE_bench_index()</a></td><td>列出打包数据中实际存在的键与真值 ATE</td></tr><tr><td><a href="#/apidagdata">mlr3HTE_dag_data() · mlr3HTE_dag()()</a></td><td>DAG 的节点表、边表与绘图，含每条边的曲率路由</td></tr><tr><td><a href="#/apibenchdata">hte_benchmark_data()</a></td><td>取出基准测试的曲线绘图数据与参考线</td></tr></tbody></table></div>'
      },
      {
        id: "dag",
        heading: "DAG 的唯一箭头约定",
        body:
          '<p>任意两个节点之间只保留一条有向边；若某条边会从第三个节点身上穿过，<code>mlr3HTE_dag_data()</code> 会自动加曲率绕行，曲率记在 <code>curve</code> 列（0 表示直线）。绘图时按曲率分组，一层一个 <code>geom_curve</code>——因为 <code>curvature</code> 是参数而非美学映射，不能直接写进 <code>aes()</code>。</p>'
      }
    ]
  },
  en: {
    title: "Simulation data & DAG",
    lede: 'Simulated data generated under controllable structures with known ground truth: ten designs by three outcomes ship with the package, together with the data and plot for the causal structure diagram (DAG).',
    sections: [
      {
        id: "index",
        heading: "Simulation data & DAG",
        body:
          '<p>These functions answer which data to compare on and what the causal structure looks like. The four structural dimensions (design, confounding form, HTE form, shared variable) are independent, so one can be varied while the rest are held fixed.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>Function</th><th>Purpose</th></tr></thead><tbody><tr><td><a href="#/apiscenarios">mlr3HTE_scenarios()</a></td><td>Lists the structural labels of the ten benchmark designs</td></tr><tr><td><a href="#/apiscenario">mlr3HTE_scenario()</a></td><td>Generates one simulated dataset with known ground truth</td></tr><tr><td><a href="#/apibench">mlr3HTE_bench()</a></td><td>Returns the bundled benchmark data (10 designs x 3 outcomes)</td></tr><tr><td><a href="#/apibenchindex">mlr3HTE_bench_index()</a></td><td>Lists the keys present in the bundled data and the true ATE</td></tr><tr><td><a href="#/apidagdata">mlr3HTE_dag_data() · mlr3HTE_dag()()</a></td><td>Node and edge tables plus the DAG plot, including curvature routing</td></tr><tr><td><a href="#/apibenchdata">hte_benchmark_data()</a></td><td>Returns benchmark curve data with the reference lines</td></tr></tbody></table></div>'
      },
      {
        id: "dag",
        heading: "One arrow per pair of nodes",
        body:
          '<p>At most one directed edge is kept between any pair of nodes. If an edge would pass through a third node, <code>mlr3HTE_dag_data()</code> adds curvature automatically and records it in the <code>curve</code> column (0 means a straight line). The plot is drawn with one <code>geom_curve</code> layer per curvature value, because <code>curvature</code> is a parameter rather than an aesthetic and cannot go inside <code>aes()</code>.</p>'
      }
    ]
  }
};

window.SITE_PAGES.apiexplain = {
  zh: {
    title: "CATE 可解释性",
    lede: '把估计出的 CATE 曲面当作模型来解释：置换重要性、偏依赖与累积局部效应、Kernel SHAP，以及配套的三个绘图函数。解释对象是双重稳健伪结局。',
    sections: [
      {
        id: "index",
        heading: "CATE 可解释性",
        body:
          '<p>这一组函数回答“模型为什么给出这个 CATE”。它们衡量的是<strong>模型</strong>对变量的依赖，不构成因果效应分解。响应变量一律取双重稳健伪结局 <code>Y*</code>，因其满足 <code>E[Y*|X] = tau(X)</code>；若改用原始 <code>Y</code>，衡量的将是基线预后而非效应异质性。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>函数</th><th>用途</th></tr></thead><tbody><tr><td><a href="#/apiexplainer">hte_explainer()</a></td><td>把 CATE 模型包装为 DALEX 解释器（响应变量 = 伪结局）</td></tr><tr><td><a href="#/apisurrogate">hte_surrogate()</a></td><td>用单一 mlr3 学习器重拟合 CATE 曲面得到代理模型</td></tr><tr><td><a href="#/apiimportance">hte_feature_importance()</a></td><td>置换法变量重要性（相对伪结局的损失上升）</td></tr><tr><td><a href="#/apipdp">hte_pdp()</a></td><td>偏依赖（PDP）与累积局部效应（ALE）</td></tr><tr><td><a href="#/apishap">hte_shap()</a></td><td>Kernel SHAP：把个体 CATE 分解为基线加各变量贡献</td></tr><tr><td><a href="#/apishapdata">hte_shap_data()</a></td><td>把 shapviz 对象摊平为长表，便于导出与自绘</td></tr><tr><td><a href="#/apiplotimportance">plot_hte_importance()</a></td><td>重要性条形图（返回 ggplot）</td></tr><tr><td><a href="#/apiplotpdp">plot_hte_pdp()</a></td><td>偏依赖曲线分面图（返回 ggplot）</td></tr><tr><td><a href="#/apiplotshap">plot_hte_shap()</a></td><td>SHAP 四视图：重要性 / 蜂群 / 依赖 / 瀑布（返回 ggplot）</td></tr></tbody></table></div>'
      },
      {
        id: "workflow",
        heading: "推荐顺序",
        body:
          '<ol class="ref-list"><li>先确认估计质量（留出集上的 CATE 相关或 RMSE），再谈解释。</li><li><code>hte_explainer()</code> 建立解释器，响应变量自动取伪结局。</li><li><code>hte_feature_importance()</code> 看全局排序。</li><li><code>hte_pdp()</code> 看效应随单个变量如何变化（相关时用 ALE）。</li><li><code>hte_shap()</code> 做个体归因，并用可加性残差校验实现。</li><li>图形用 <code>ggsave()</code> 导出，数据用对应 <code>hte_*()</code> 落盘。</li></ol>'
      }
    ]
  },
  en: {
    title: "CATE interpretability",
    lede: 'Treats the estimated CATE surface as a model to be explained: permutation importance, partial dependence and accumulated local effects, Kernel SHAP, and the three companion plotting functions. The object of explanation is the doubly robust pseudo-outcome.',
    sections: [
      {
        id: "index",
        heading: "CATE interpretability",
        body:
          '<p>These functions answer why the model produced a given CATE. They measure the <strong>model\'s</strong> reliance on variables and do not constitute a causal decomposition. The response is always the doubly robust pseudo-outcome <code>Y*</code>, which satisfies <code>E[Y*|X] = tau(X)</code>; with the raw <code>Y</code> they would measure baseline prognosis rather than effect heterogeneity.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>Function</th><th>Purpose</th></tr></thead><tbody><tr><td><a href="#/apiexplainer">hte_explainer()</a></td><td>Wraps a CATE model as a DALEX explainer (response = pseudo-outcome)</td></tr><tr><td><a href="#/apisurrogate">hte_surrogate()</a></td><td>Refits the CATE surface with one mlr3 learner as a surrogate</td></tr><tr><td><a href="#/apiimportance">hte_feature_importance()</a></td><td>Permutation importance (rise in loss against the pseudo-outcome)</td></tr><tr><td><a href="#/apipdp">hte_pdp()</a></td><td>Partial dependence (PDP) and accumulated local effects (ALE)</td></tr><tr><td><a href="#/apishap">hte_shap()</a></td><td>Kernel SHAP: decomposes an individual CATE into a baseline plus contributions</td></tr><tr><td><a href="#/apishapdata">hte_shap_data()</a></td><td>Flattens a shapviz object into a long table for export and redrawing</td></tr><tr><td><a href="#/apiplotimportance">plot_hte_importance()</a></td><td>Importance bar chart (returns a ggplot)</td></tr><tr><td><a href="#/apiplotpdp">plot_hte_pdp()</a></td><td>Faceted partial dependence curves (returns a ggplot)</td></tr><tr><td><a href="#/apiplotshap">plot_hte_shap()</a></td><td>Four SHAP views: importance / beeswarm / dependence / waterfall (ggplot)</td></tr></tbody></table></div>'
      },
      {
        id: "workflow",
        heading: "Recommended order",
        body:
          '<ol class="ref-list"><li>Check estimation quality first (out-of-sample CATE correlation or RMSE); only then interpret.</li><li>Build the explainer with <code>hte_explainer()</code>; the response is the pseudo-outcome by default.</li><li>Rank globally with <code>hte_feature_importance()</code>.</li><li>Trace how the effect varies with one covariate using <code>hte_pdp()</code> (ALE when covariates are correlated).</li><li>Attribute individual effects with <code>hte_shap()</code> and verify the implementation via the additivity residual.</li><li>Export figures with <code>ggsave()</code> and write the data out with the corresponding <code>hte_*()</code> function.</li></ol>'
      }
    ]
  }
};