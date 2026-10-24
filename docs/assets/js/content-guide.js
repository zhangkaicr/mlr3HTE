/* =====================================================================
   content-guide.js —— 架构与快速开始（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.guide = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "架构与快速开始",
    lede: "先建立统一的心智模型：结局模型抽象 → 五种 learner 的公式 → 倾向得分与去混杂 → 删矢的两层处理。",
    sections: [

      {
        id: "architecture",
        heading: "1. 统一架构：结局模型抽象",
        body:
          '<p>引擎里只有一个抽象：<strong>结局模型</strong>。它是一个 list，自带 ' +
          '<code>predict(newX)</code>，对三类结局分别返回：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局</th><th><code>predict(newX)</code> 返回</th><th>内部实现</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>连续</td><td><code>E[Y | X]</code></td><td>mlr3 <code>regr.*</code> 学习器</td></tr>' +
          '<tr><td>二分类</td><td><code>P(Y=1 | X)</code></td><td>mlr3 <code>classif.*</code> 学习器（<code>predict_type="prob"</code>）</td></tr>' +
          '<tr><td>生存</td><td><code>S(t0 | X)</code></td><td><code>survival::coxph</code> 或 <code>ranger</code> 生存森林</td></tr>' +
          '</tbody></table></div>' +
          '<p>五种 learner 于是写成一次、通吃三类结局：</p>' +
          '<pre><code class="r-out">S-Learner  = 把 A 当普通特征塞进结局模型，两个反事实预测相减\n' +
          'T-Learner  = 两组各拟合一个结局模型，预测相减\n' +
          'X-Learner  = 插补个体治疗效应，再按倾向得分 g(X) 加权融合\n' +
          'R-Learner  = Robinson 残差化 (Y - m(X)) / (A - e(X))，以 (A-e)² 加权回归\n' +
          'DR-Learner = 双重稳健伪结果 psi，回归一次</code></pre>' +
          '<div class="callout">' +
          '<div class="callout-title">基学习器类型必须与结局匹配</div>' +
          '<p>连续配 <code>regr.*</code>、二分类配 <code>classif.*</code>、生存配 ' +
          '<code>"coxph"</code> / <code>"ranger"</code>。不匹配会直接报错并给出提示。</p>' +
          '</div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">想看数据是怎么造出来的？</div>' +
          '<p>六个教程场景共用一套<strong>数据生成过程</strong>，附带 DAG、真实 CATE/ATE ' +
          '与分层真值表，见 <a href="#/tutorialbasics/dgp">数据生成机制与 DAG</a>。</p>' +
          '</div>'
      },

      {
        id: "learners",
        heading: "2. 五种 Meta-Learner：公式与选用",
        body:
          '<p>记 <code>m(x) = E[Y|X]</code>、<code>e(x) = P(A=1|X)</code>、' +
          '<code>m₁(x) = E[Y|X,A=1]</code>、<code>m₀(x) = E[Y|X,A=0]</code>。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>核心公式</th><th>优点</th><th>什么时候别用</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><strong>S</strong></td><td><code>m̂(x,A=1) - m̂(x,A=0)</code>，单模型</td>' +
          '<td>最省数据</td><td>基学习器不建模交互时 CATE 退化成常数（Cox 尤其明显）</td></tr>' +
          '<tr><td><strong>T</strong></td><td><code>m̂₁(x) - m̂₀(x)</code>，两组各一个</td>' +
          '<td>简单稳健、直观</td><td>两组样本量悬殊或某组很小时</td></tr>' +
          '<tr><td><strong>X</strong></td><td>插补 <code>D₁ = Y - m̂₀(x)</code>、<code>D₀ = m̂₁(x) - Y</code> → 回归出 <code>τ̂₁, τ̂₀</code> → <code>g·τ̂₀ + (1-g)·τ̂₁</code></td>' +
          '<td>组间不均衡时最好</td><td>两组都够大时收益不明显</td></tr>' +
          '<tr><td><strong>R</strong></td><td><code>Ỹ = (Y - m̂)/(A - ê)</code>，以 <code>(A-ê)²</code> 加权回归</td>' +
          '<td>理论性质好</td><td>伪结果噪声大，二阶段必须正则化</td></tr>' +
          '<tr><td><strong>DR</strong></td><td><code>ψ = m̂₁ - m̂₀ + A(Y-m̂₁)/ê - (1-A)(Y-m̂₀)/(1-ê)</code></td>' +
          '<td>双重稳健：m 或 e 任一正确即一致</td><td>同 R，二阶段要正则化</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">默认选用建议</div>' +
          '<p>两组样本量均充足、优先实现简洁 → <strong>T</strong>；两组样本量不均衡（观察性研究常见）→ <strong>X</strong>；' +
          '想要双重稳健保障 → <strong>DR</strong>；<strong>R</strong> 需要仔细调二阶段学习器。</p>' +
          '</div>'
      },

      {
        id: "interfaces",
        heading: "3. 两套接口，同一引擎",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>接口</th><th>用法</th><th>什么时候用</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>函数式</td><td><code>metalearner()</code> / <code>s_learner()</code> …</td>' +
          '<td>日常分析、教学演示、画图</td></tr>' +
          '<tr><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code> + <code>ml_task()</code></td>' +
          '<td>要进 <code>resample</code> / <code>benchmark</code> / <code>tune</code></td></tr>' +
          '</tbody></table></div>' +
          '<h3>函数式</h3>' +
          '<pre><code class="language-r">fit &lt;- metalearner("T", X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'fit$ate          # 平均治疗效应\n' +
          'fit$cate_train   # 逐人 CATE\n' +
          'fit$predict(newX)</code></pre>' +
          '<h3>R6 Learner（进 mlr3 工作流）</h3>' +
          '<pre><code class="language-r">library(mlr3)                     # resample()/benchmark()/rsmp() 来自 mlr3\n' +
          'task &lt;- ml_task(X, A, Y)          # 三类结局统一编码\n' +
          'l    &lt;- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base &lt;- lrn("regr.ranger")\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '<div class="callout warn">' +
          '<div class="callout-title">ml_task() 的编码约定</div>' +
          '<p>mlr3 的 Task 目标列装不下 <code>Surv</code> 对象，所以：</p>' +
          '<ul>' +
          '<li>连续 / 二分类：目标列 <code>.outcome</code> = Y（二分类取 0/1）</li>' +
          '<li>生存：目标列 <code>.outcome</code> = 随访时间，另加特征列 <code>.status</code> = 事件指示</li>' +
          '</ul>' +
          '<p>结局类型、状态列名、<code>t0</code> 都记在 <code>task$extra_args</code> 里——该字段在 ' +
          '<code>clone(deep=TRUE)$filter()</code> 与序列化后都保留，所以重抽样分折时元数据不丢。</p>' +
          '</div>'
      },

      {
        id: "confounding",
        heading: "4. 倾向得分与去混杂",
        body:
          '<p>v0.40 起移除了 <code>weighting</code> / <code>weights</code> / <code>stabilize</code>。' +
          '理由是经典 metalearner 文献（Künzel et al. 2019 PNAS 的 X-learner、CausalML 的 ' +
          'BaseS / BaseT / BaseX）<strong>从不给 S/T/X 的结局模型套逆概率权重</strong>；' +
          '而一个只会重估结局模型的「单稳健」加权既不是文献做法，也无法单独去混杂' +
          '（漏掉混杂因子时偏倚与朴素估计相同）。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>倾向得分用在哪</th><th>去混杂靠什么</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S / T</td><td>不使用</td><td>把混杂因子放进 <code>X</code>，由结局模型条件化</td></tr>' +
          '<tr><td>X</td><td>第三步 <code>g(x) = e(x)</code> 融合权重</td><td>同上（<code>m1</code> / <code>m0</code> 条件化）</td></tr>' +
          '<tr><td>R</td><td>Robinson 中心化 <code>A − e(x)</code></td><td>残差化本身</td></tr>' +
          '<tr><td>DR</td><td>AIPW 伪结果的分母</td><td>双重稳健：结局模型或倾向得分其一正确即一致</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r"># 观察性：DR 默认内部拟合倾向得分（classif.log_reg），双重稳健\n' +
          'fit &lt;- metalearner("DR", d$X, d$A, d$Y, cross_fitting = TRUE)\n\n' +
          '# RCT 已知随机化概率 0.5：直接给常数，免掉拟计入的噪声\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_ps = 0.5)\n\n' +
          '# 自己算好的倾向得分，封成函数传进来\n' +
          'fit &lt;- metalearner("R", d$X, d$A, d$Y,\n' +
          '                learner_ps = function(nx) predict(my_ps_model, newdata = nx))</code></pre>' +
          '<div class="callout warn">' +
          '<div class="callout-title">X-learner 的 g(x) 不是去混杂工具</div>' +
          '<p>它只在两组样本悬殊时给样本少的那侧插补更高权重以稳定融合，' +
          '前提是 <code>m1</code> / <code>m0</code> 已经通过条件化无偏。' +
          '「用了倾向得分」≠「处理了混杂」。</p>' +
          '</div>' +
          '<div class="callout">' +
          '<div class="callout-title">量化证据</div>' +
          '<p>见<a href="#/tutorial">场景教程 · 混杂强度扫描</a>：混杂强度从 0（RCT）加到 2 时，' +
          '未调整差值的偏差从 +0.01 涨到 +1.05，而五族的 CATE 相关基本是一条平线。</p>' +
          '</div>'
      },

      {
        id: "censoring",
        heading: "5. 生存结局的删矢：两层分工",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>删矢怎么处理</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S / T</td><td>结局模型本身就是生存模型（Cox 偏似然），删矢已在似然里正确处理，<strong>不需要额外权重</strong></td></tr>' +
          '<tr><td>X / R / DR</td><td>需要个体尺度结局，取 <code>I(T &gt; t0)</code>，此时乘上<strong>删矢 IPCW</strong> <code>1 / G(Tᵢ⁻)</code></td></tr>' +
          '</tbody></table></div>' +
          '<p><code>G</code> 由对删矢指示 <code>(1 - status)</code> 拟合的 Cox 模型得到，' +
          '权重截断在 <code>[0.01, 1]</code> 防止极端值搅坏估计。' +
          '这是估计量对删矢的标准处理（Hernán 体系），<strong>不是</strong>用户可开关的加权选项；' +
          '<code>effect = "rmst"</code> 时个体结局本身已含 IPCW，不再额外乘。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 4000, t0 = 2)\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # 平均 S₁(2) - S₀(2)\n\n' +
          '# t0 缺省时取事件时间中位数\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "coxph")$t0</code></pre>'
      },

      {
        id: "pitfalls",
        heading: "6. 调参要点",
        body:
          '<div class="callout danger">' +
          '<div class="callout-title">二阶段学习器需要正则化</div>' +
          '<p>X / R / DR 的第二阶段是对<strong>伪结果</strong>做回归，噪声结构与结局模型完全不同。' +
          'ranger 回归默认 <code>min.node.size = 5</code>，树太深会把噪声也拟合进去：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>设置</th><th>连续 R 相关</th><th>二分类 X 相关</th><th>生存 X 相关</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>min.node.size = 5</code>（ranger 默认）</td><td>0.668</td><td>0.599</td><td>0.652</td></tr>' +
          '<tr><td><code>min.node.size = 50</code>（引擎默认）</td><td><strong>0.904</strong></td><td><strong>0.779</strong></td><td><strong>0.872</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>引擎在 <code>learner_tau = NULL</code> 时<strong>不沿用</strong> <code>learner_base</code>，' +
          '而是单独建 <code>regr.ranger(num.trees = 500, min.node.size = 50)</code>。要覆盖：</p>' +
          '<pre><code class="language-r">metalearner("R", X, A, Y, learner_tau = lrn("regr.ranger", min.node.size = 20))\n' +
          'metalearner("R", X, A, Y, learner_tau = lrn("regr.lm"))   # 生存 R/DR 常常更好</code></pre>' +
          '</div>' +
          '<div class="callout warn">' +
          '<div class="callout-title">生存 R/DR 的 CATE 可能越出 [-1, 1]</div>' +
          '<p>二阶段回归不受概率尺度约束，个别点会越界——这是<strong>方法固有属性，不是 bug</strong>。' +
          'S / T 的 CATE 是两个生存概率之差，严格有界。</p>' +
          '</div>' +
          '<div class="callout">' +
          '<div class="callout-title">生存 S-Learner 的相关接近 0 是预期的</div>' +
          '<p>Cox 是比例风险 + 线性预测结构，A 作为普通协变量只能表达一个常数对数风险比，' +
          '无法表达 <code>A × X</code> 交互，CATE 自然退化成常数。要捕捉异质性请用 T 或 X。</p>' +
          '</div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "Architecture & Quickstart",
    lede: "Build one mental model: outcome-model abstraction → the five learner formulas → " +
          "propensity scores and deconfounding → two layers of censoring handling.",
    sections: [

      {
        id: "architecture",
        heading: "1. Unified architecture: the outcome-model abstraction",
        body:
          '<p>The engine has exactly one abstraction: the <strong>outcome model</strong>. It is a list ' +
          'exposing <code>predict(newX)</code>, which returns:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th><code>predict(newX)</code> returns</th><th>Implementation</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Continuous</td><td><code>E[Y | X]</code></td><td>mlr3 <code>regr.*</code> learner</td></tr>' +
          '<tr><td>Binary</td><td><code>P(Y=1 | X)</code></td><td>mlr3 <code>classif.*</code> learner (<code>predict_type="prob"</code>)</td></tr>' +
          '<tr><td>Survival</td><td><code>S(t0 | X)</code></td><td><code>survival::coxph</code> or a <code>ranger</code> survival forest</td></tr>' +
          '</tbody></table></div>' +
          '<p>The five learners are therefore written once and work for all three outcome types:</p>' +
          '<pre><code class="r-out">S-Learner  = one outcome model with A as a feature; difference of two counterfactual predictions\n' +
          'T-Learner  = one outcome model per arm; difference of predictions\n' +
          'X-Learner  = impute individual effects, then blend by the propensity score g(X)\n' +
          'R-Learner  = Robinson residualisation (Y - m(X)) / (A - e(X)), regressed with weights (A-e)²\n' +
          'DR-Learner = doubly robust pseudo-outcome psi, regressed once</code></pre>' +
          '<div class="callout">' +
          '<div class="callout-title">The base learner must match the outcome</div>' +
          '<p>Continuous → <code>regr.*</code>; binary → <code>classif.*</code>; survival → ' +
          '<code>"coxph"</code> / <code>"ranger"</code>. A mismatch raises an explicit error.</p>' +
          '</div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">Curious how the data is made?</div>' +
          '<p>All six tutorial scenarios share one <strong>data-generating process</strong>, with ' +
          'DAGs, the true CATE/ATE and stratified truth tables — see ' +
          '<a href="#/tutorialbasics/dgp">Data-generating process &amp; DAGs</a>.</p>' +
          '</div>'
      },

      {
        id: "learners",
        heading: "2. The five meta-learners: formulas and when to use them",
        body:
          '<p>Write <code>m(x) = E[Y|X]</code>, <code>e(x) = P(A=1|X)</code>, ' +
          '<code>m₁(x) = E[Y|X,A=1]</code>, <code>m₀(x) = E[Y|X,A=0]</code>.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>Core formula</th><th>Strength</th><th>Avoid when</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><strong>S</strong></td><td><code>m̂(x,A=1) - m̂(x,A=0)</code>, single model</td>' +
          '<td>Most data-efficient</td><td>Base learner ignores interactions — CATE collapses to a constant (very visible with Cox)</td></tr>' +
          '<tr><td><strong>T</strong></td><td><code>m̂₁(x) - m̂₀(x)</code>, one model per arm</td>' +
          '<td>Simple and robust</td><td>Arms are very unbalanced or one arm is tiny</td></tr>' +
          '<tr><td><strong>X</strong></td><td>Impute <code>D₁ = Y - m̂₀(x)</code>, <code>D₀ = m̂₁(x) - Y</code> → regress <code>τ̂₁, τ̂₀</code> → <code>g·τ̂₀ + (1-g)·τ̂₁</code></td>' +
          '<td>Best under arm imbalance</td><td>Little gain when both arms are large</td></tr>' +
          '<tr><td><strong>R</strong></td><td><code>Ỹ = (Y - m̂)/(A - ê)</code>, regressed with weights <code>(A-ê)²</code></td>' +
          '<td>Strong theory</td><td>Noisy pseudo-outcome; stage 2 must be regularised</td></tr>' +
          '<tr><td><strong>DR</strong></td><td><code>ψ = m̂₁ - m̂₀ + A(Y-m̂₁)/ê - (1-A)(Y-m̂₀)/(1-ê)</code></td>' +
          '<td>Doubly robust: consistent if m <em>or</em> e is correct</td><td>Like R: regularise stage 2</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">Default recommendations</div>' +
          '<p>Both arms large and you want something simple → <strong>T</strong>. Arms unbalanced ' +
          '(common in observational data) → <strong>X</strong>. Want double-robustness insurance → ' +
          '<strong>DR</strong>. <strong>R</strong> needs a carefully tuned stage-2 learner.</p>' +
          '</div>'
      },

      {
        id: "interfaces",
        heading: "3. Two interfaces, one engine",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Interface</th><th>Usage</th><th>Use when</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Functional</td><td><code>metalearner()</code> / <code>s_learner()</code> …</td>' +
          '<td>Everyday analysis, teaching, plotting</td></tr>' +
          '<tr><td>R6 Learner</td><td><code>lrn("regr.metalearner")</code> + <code>ml_task()</code></td>' +
          '<td>You need <code>resample</code> / <code>benchmark</code> / <code>tune</code></td></tr>' +
          '</tbody></table></div>' +
          '<h3>Functional</h3>' +
          '<pre><code class="language-r">fit &lt;- metalearner("T", X, A, Y, learner_base = lrn("regr.ranger"))\n' +
          'fit$ate          # average treatment effect\n' +
          'fit$cate_train   # CATE per unit\n' +
          'fit$predict(newX)</code></pre>' +
          '<h3>R6 Learner (mlr3 workflows)</h3>' +
          '<pre><code class="language-r">library(mlr3)                     # resample() / benchmark() / rsmp() live in mlr3\n' +
          'task &lt;- ml_task(X, A, Y)          # uniform encoding for all outcome types\n' +
          'l    &lt;- lrn("regr.metalearner", metalearner = "T")\n' +
          'l$learner_base &lt;- lrn("regr.ranger")\n\n' +
          'resample(task, l, rsmp("cv", folds = 5))\n' +
          'benchmark(benchmark_grid(task,\n' +
          '  list(lrn("regr.metalearner", id = "a", metalearner = "T"),\n' +
          '       lrn("regr.metalearner", id = "b", metalearner = "X")),\n' +
          '  rsmp("cv", folds = 5)))</code></pre>' +
          '<div class="callout warn">' +
          '<div class="callout-title">ml_task() encoding convention</div>' +
          '<p>An mlr3 Task target column cannot hold a <code>Surv</code> object, so:</p>' +
          '<ul>' +
          '<li>Continuous / binary: target column <code>.outcome</code> = Y (0/1 for binary)</li>' +
          '<li>Survival: target column <code>.outcome</code> = follow-up time, plus a feature column ' +
          '<code>.status</code> = event indicator</li>' +
          '</ul>' +
          '<p>Outcome type, status column name and <code>t0</code> live in <code>task$extra_args</code>, ' +
          'which survives <code>clone(deep=TRUE)$filter()</code> and serialisation — so metadata is ' +
          'never lost when resampling splits folds.</p>' +
          '</div>'
      },

      {
        id: "confounding",
        heading: "4. Propensity scores and deconfounding",
        body:
          '<p>v0.40 removed <code>weighting</code> / <code>weights</code> / <code>stabilize</code>. ' +
          'The reason: the classic meta-learner literature (Künzel et al. 2019 PNAS; CausalML ' +
          'BaseS / BaseT / BaseX) <strong>never applies inverse-probability weights to the S/T/X ' +
          'outcome models</strong>, and a "singly robust" weighting that only re-fits the outcome ' +
          'model is neither standard practice nor able to deconfound on its own (leave a confounder ' +
          'out and the bias equals the naive estimate).</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>Where the propensity score is used</th><th>What deconfounds</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S / T</td><td>Not used</td><td>Place the confounders in <code>X</code> and let the outcome model condition on them</td></tr>' +
          '<tr><td>X</td><td>The third-stage <code>g(x) = e(x)</code> combination weight</td><td>Same (conditioning inside <code>m1</code> / <code>m0</code>)</td></tr>' +
          '<tr><td>R</td><td>Robinson centring <code>A − e(x)</code></td><td>The residualisation itself</td></tr>' +
          '<tr><td>DR</td><td>The denominator of the AIPW pseudo-outcome</td><td>Double robustness: consistent if either the outcome models or the propensity score is right</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code class="language-r"># Observational: DR fits the propensity score internally (classif.log_reg)\n' +
          'fit &lt;- metalearner("DR", d$X, d$A, d$Y, cross_fitting = TRUE)\n\n' +
          '# RCT with a known randomisation probability of 0.5: pass the constant\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_ps = 0.5)\n\n' +
          '# Your own propensity score, wrapped in a function\n' +
          'fit &lt;- metalearner("R", d$X, d$A, d$Y,\n' +
          '                learner_ps = function(nx) predict(my_ps_model, newdata = nx))</code></pre>' +
          '<div class="callout warn">' +
          '<div class="callout-title">The X-learner\'s g(x) is not a deconfounding tool</div>' +
          '<p>It only gives the imputation from the smaller arm a higher weight when the arms are ' +
          'unbalanced, on the premise that <code>m1</code> / <code>m0</code> are already unbiased ' +
          'through conditioning. "Uses a propensity score" ≠ "handles confounding".</p>' +
          '</div>' +
          '<div class="callout">' +
          '<div class="callout-title">Quantitative evidence</div>' +
          '<p>See the <a href="#/tutorial">confounding-strength sweep</a>: as the strength goes ' +
          'from 0 (RCT) to 2, the naive difference\'s bias climbs from +0.01 to +1.05 while the ' +
          'CATE correlation of all five learners stays essentially flat.</p>' +
          '</div>'
      },

      {
        id: "censoring",
        heading: "5. Censoring in survival outcomes: two layers",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>How censoring is handled</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S / T</td><td>The outcome model <em>is</em> a survival model (Cox partial likelihood), so censoring is already handled inside the likelihood — <strong>no extra weights needed</strong></td></tr>' +
          '<tr><td>X / R / DR</td><td>They need an individual-level outcome, so <code>I(T &gt; t0)</code> is used and multiplied by <strong>censoring IPCW</strong> <code>1 / G(Tᵢ⁻)</code></td></tr>' +
          '</tbody></table></div>' +
          '<p><code>G</code> comes from a Cox model fitted to the censoring indicator ' +
          '<code>(1 - status)</code>; weights are clipped to <code>[0.01, 1]</code> to keep extreme ' +
          'values from wrecking the estimate. This is the standard treatment of censoring in the ' +
          'estimator (Hernán\'s framework), <strong>not</strong> a user-switchable weighting option; ' +
          'with <code>effect = "rmst"</code> the individual outcome already contains IPCW and ' +
          'nothing extra is multiplied.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_demo_surv(n = 4000, t0 = 2)\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # mean S₁(2) - S₀(2)\n\n' +
          '# If t0 is omitted, the median event time is used\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "coxph")$t0</code></pre>'
      },

      {
        id: "pitfalls",
        heading: "6. Tuning notes",
        body:
          '<div class="callout danger">' +
          '<div class="callout-title">Regularise the stage-2 learner (the most common pitfall)</div>' +
          '<p>X / R / DR regress a <strong>pseudo-outcome</strong> in stage 2, whose noise structure is ' +
          'completely different from the outcome model. Ranger\'s default <code>min.node.size = 5</code> ' +
          'grows very deep trees and fits the noise:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Setting</th><th>Continuous R corr.</th><th>Binary X corr.</th><th>Survival X corr.</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>min.node.size = 5</code> (ranger default)</td><td>0.668</td><td>0.599</td><td>0.652</td></tr>' +
          '<tr><td><code>min.node.size = 50</code> (engine default)</td><td><strong>0.904</strong></td><td><strong>0.779</strong></td><td><strong>0.872</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>When <code>learner_tau = NULL</code> the engine <strong>does not reuse</strong> ' +
          '<code>learner_base</code>; it builds a separate ' +
          '<code>regr.ranger(num.trees = 500, min.node.size = 50)</code>. To override:</p>' +
          '<pre><code class="language-r">metalearner("R", X, A, Y, learner_tau = lrn("regr.ranger", min.node.size = 20))\n' +
          'metalearner("R", X, A, Y, learner_tau = lrn("regr.lm"))   # often better for survival R/DR</code></pre>' +
          '</div>' +
          '<div class="callout warn">' +
          '<div class="callout-title">Survival R/DR CATEs can fall outside [-1, 1]</div>' +
          '<p>Stage-2 regression is not constrained to the probability scale, so individual points may ' +
          'exceed the range — this is <strong>inherent to the method, not a bug</strong>. S / T CATEs ' +
          'are differences of two survival probabilities and are strictly bounded.</p>' +
          '</div>' +
          '<div class="callout">' +
          '<div class="callout-title">A near-zero correlation for the survival S-learner is expected</div>' +
          '<p>Cox assumes proportional hazards with a linear predictor, so A entered as an ordinary ' +
          'covariate can only express a constant log hazard ratio — it cannot represent the ' +
          '<code>A × X</code> interaction, and the CATE degenerates to a constant. Use T or X to ' +
          'capture heterogeneity.</p>' +
          '</div>'
      }
    ]
  }
};
