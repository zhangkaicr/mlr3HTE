/* =====================================================================
   content-tutorial.js —— 六种场景教程（中英双语）
   每一格：数据 → 代码 → 要点 → 与真值对账表
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

var TUT_MATRIX = {
  zh: '<div class="table-wrap"><table>' +
      '<thead><tr><th></th><th>随机化试验（RCT）</th><th>观察性研究</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>连续</strong></td><td><a href="#/tutorial/s1">场景 1</a></td><td><a href="#/tutorial/s2">场景 2</a></td></tr>' +
      '<tr><td><strong>二分类</strong></td><td><a href="#/tutorial/s3">场景 3</a></td><td><a href="#/tutorial/s4">场景 4</a></td></tr>' +
      '<tr><td><strong>生存</strong></td><td><a href="#/tutorial/s5">场景 5</a></td><td><a href="#/tutorial/s6">场景 6</a></td></tr>' +
      '</tbody></table></div>',
  en: '<div class="table-wrap"><table>' +
      '<thead><tr><th></th><th>Randomized trial (RCT)</th><th>Observational study</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>Continuous</strong></td><td><a href="#/tutorial/s1">Scenario 1</a></td><td><a href="#/tutorial/s2">Scenario 2</a></td></tr>' +
      '<tr><td><strong>Binary</strong></td><td><a href="#/tutorial/s3">Scenario 3</a></td><td><a href="#/tutorial/s4">Scenario 4</a></td></tr>' +
      '<tr><td><strong>Survival</strong></td><td><a href="#/tutorial/s5">Scenario 5</a></td><td><a href="#/tutorial/s6">Scenario 6</a></td></tr>' +
      '</tbody></table></div>'
};

window.SITE_PAGES.tutorial = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "六种场景教程",
    lede: "三类结局 × 随机/观察性，共六格。每格都用自带真值的模拟数据，可逐人对账。",
    sections: [

      {
        id: "overview",
        heading: "六格导航",
        body: TUT_MATRIX.zh +
              '<p>所有演示数据都返回真实的 <code>tau</code> 与 <code>ate</code>，' +
              '这是教学时最有用的部分——你可以直接看出哪个 learner 真的捕捉到了异质性。</p>' +
              '<pre><code>library(mlr3HTE)   # 装完只需这一行：lrn() 已从 mlr3 再导出</code></pre>' +
              '<div class="callout"><div class="callout-title">运行前准备</div>' +
              '<p>本页每一格的代码都只依赖 <code>library(mlr3HTE)</code>——' +
              '<code>lrn()</code> 由本包从 mlr3 再导出，不用额外 <code>library(mlr3)</code>。' +
              '但如果你要自己接 <code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code> ' +
              '这些 mlr3 工作流函数，请再补一行 <code>library(mlr3)</code>。</p></div>'
      },

      {
        id: "dgp",
        heading: "数据生成机制与 DAG（先读这个）",
        body:
          '<p>六个场景共用同一套<strong>数据生成过程（DGP）</strong>，只在两处不同：' +
          '结局的分布形态（连续 / 二分类 / 生存），以及处理 <code>A</code> 怎么来' +
          '（随机化 / 由协变量决定）。理解 DGP 是读懂后面每一格的前提——' +
          '因为只有数据自己知道真值，你才能判断估计方法到底行不行。' +
          '下面所有公式逐行照抄包内 <code>R/api.R</code> 的生成逻辑。</p>' +

          '<h3>共同骨架：协变量</h3>' +
          '<div class="formula">' +
          'age ~ N(60, 12)    lac ~ N(2.5, 1.2)    tumor ~ N(5, 2)    sex ~ Bern(0.45)<br>' +
          'z1 = scale(lac)    z2 = scale(tumor)   ' +
          '# z1 乳酸（越高病情越重），z2 瘤负荷</div>' +

          '<h3>三种结局，三套方程</h3>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局</th><th>生成方程（源码原文）</th><th>效应尺度</th></tr></thead><tbody>' +
          '<tr><td>连续</td><td><code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code><br>' +
          '<code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code><br>' +
          '<code>Y = mu + A·tau + N(0,1)</code></td>' +
          '<td>均值差 <code>tau</code></td></tr>' +
          '<tr><td>二分类</td><td><code>p0 = plogis(−1.2 + 0.5·z1 + 0.4·z2 + 0.1·(age−60)/12 + 0.2·sex)</code><br>' +
          '<code>tau_logit = 0.6 + 0.5·z1 − 0.4·z2</code>（对数几率尺度）<br>' +
          '<code>p1 = plogis(qlogis(p0) + tau_logit)</code>；<code>Y ~ Bern(p_A)</code></td>' +
          '<td>风险差 <code>p1 − p0</code></td></tr>' +
          '<tr><td>生存</td><td><code>tau = 0.5 + 0.4·z1 − 0.3·z2</code>（对数风险尺度）<br>' +
          '<code>base_rate = exp(−1.0 + 0.3·z1 + 0.2·z2 + 0.1·(age−60)/12 + 0.15·sex)</code><br>' +
          '<code>rate = base_rate·exp(−A·tau)</code>；<code>T ~ Exp(rate)</code>；' +
          '删失 <code>C ~ Exp(0.12)</code>，<code>time = min(T,C)</code></td>' +
          '<td><code>S(t₀)</code> 差（默认 t₀=2），另报 RMST 差</td></tr>' +
          '</tbody></table></div>' +
          '<p>注意连续结局的 <code>tau</code> 里有一项<strong>交互</strong>：' +
          '只有当「乳酸高 <em>且</em> 瘤负荷低」时处理效应才额外 +0.6——' +
          '这就是异质性的来源，只会报一个平均数的方法是抓不到它的。</p>' +

          '<h3>两种处理分配机制，两张 DAG</h3>' +
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="RCT 的 DAG：A 随机化，与 X 无关">' +
          '<figcaption>RCT：<code>A</code> 由抛硬币决定，没有父节点</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="观察性研究的 DAG：X → e → A 存在混杂">' +
          '<figcaption>观察性：<code>X → e → A</code>，红色即开放的后门路径</figcaption></figure>' +
          '</div>' +
          '<p>随机化时 <code>A ~ Bern(0.5)</code>，<code>A ⊥ X</code>，' +
          '协变量只是效应修饰者，不混杂；观察性研究中处理概率 ' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>，' +
          '于是 <code>X</code> 同时是 <code>A</code> 和 <code>Y</code> 的共同原因——' +
          '后门路径 <code>A ← e ← X → 结局 → Y</code> 开放，粗差分有偏。</p>' +

          '<div class="callout ok"><div class="callout-title">真值都随数据返回</div>' +
          '<p>每个 <code>mlr3HTE_demo_*</code> 函数都返回 <code>tau</code>（逐人真实 CATE）、' +
          '<code>ate</code>（真实平均效应）、<code>ps_true</code>（观察性场景的真实倾向得分）。' +
          '跑 <code>00_数据生成机制与DAG.R</code> 可以逐条打印这些真值，并按协变量分四层展示。</p></div>' +

          '<h3>实际输出：六个数据集的真值一览</h3>' +
          '<p>下面是 <code>00_数据生成机制与DAG.R</code> 的真实运行结果（tidyverse tibble 原样输出）：</p>' +
          '<pre><code># A tibble: 6 × 8\n' +
          '  数据集          结局类型        真实ATE CATE均值 CATE标准差 CATE最小 CATE最大 ATE_RMST\n' +
          '  &lt;chr&gt;           &lt;chr&gt;           &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n' +
          '1 连续 × RCT      连续             1.05   1.05   1.04  -2.58   4.85   NA\n' +
          '2 二分类 × RCT    二分类(风险差)    0.131  0.131  0.133 -0.232  0.563  NA\n' +
          '3 生存 × RCT      生存(S(t0)差)    0.152  0.152  0.151 -0.460  0.590  0.192\n' +
          '4 连续 × 观察性   连续             1.05   1.05   1.04  -2.14   5.03   NA\n' +
          '5 二分类 × 观察性  二分类(风险差)   0.131  0.131  0.132 -0.243  0.616  NA\n' +
          '6 生存 × 观察性   生存(S(t0)差)    0.152  0.152  0.150 -0.371  0.664  0.192\n\n' +
          '# A tibble: 3 × 2      # 观察性数据的粗差分 vs 真值\n' +
          '  指标                                值\n' +
          '  &lt;chr&gt;                            &lt;dbl&gt;\n' +
          '1 未调整差 mean(Y|A=1)-mean(Y|A=0)  1.74\n' +
          '2 真实 ATE                         1.05\n' +
          '3 未调整偏倚                        0.689\n\n' +
          'ℹ 生存数据删失比例 = 0.299</code></pre>' +
          '<p>三个要点：<strong>①</strong> CATE 均值恒等于 ATE，但标准差高达 1.0+——' +
          '平均值掩盖了个体间的巨大差异；<strong>②</strong> 生存场景额外给出 ' +
          '<code>ATE_RMST = 0.192</code>（限制平均生存时间差），与 t₀=2 的概率差 0.152 ' +
          '是同一个效应的两种尺度；<strong>③</strong> 观察性数据的真实 ATE 与 RCT ' +
          '完全相同（1.05 / 0.131 / 0.152），差别只在<strong>分配机制</strong>——' +
          '所以粗差分偏出 +0.69 纯粹是混杂造成的，不是效应真的变了。</p>'
      },

      {
        id: "s1",
        heading: "场景 1 · 连续结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="场景 1 的 DAG：随机化连续结局">' +
          '<figcaption>图 1 · 场景 1 因果图：<code>A</code> 随机分配，<code>X</code> 只修饰效应、不混杂</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000, seed = 1201)\n' +
          'lb <- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'for (tp in c("S","T","X","R","DR")) {\n' +
          '  fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)\n' +
          '  cat(tp, fit$ate, cor(fit$cate_train, d$tau), "\\n")\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">数据生成过程</div>' +
          '<p>真实 CATE <code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code>；' +
          '真实基线 <code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code>。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.935</td><td>0.895</td><td>0.483</td></tr>' +
          '<tr><td>T</td><td>0.951</td><td>0.845</td><td>0.653</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.950</td><td><strong>0.963</strong></td><td><strong>0.296</strong></td></tr>' +
          '<tr><td>R</td><td>0.450</td><td>0.812</td><td>0.907</td></tr>' +
          '<tr><td>DR</td><td>0.954</td><td>0.924</td><td>0.430</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>1.048</strong>。X-learner 最好；R 的 ATE 明显偏低，' +
          '是伪结果噪声 + 二阶段正则化不足所致（见<a href="#/guide/pitfalls">调参要点</a>）。</p>'
      },

      {
        id: "s2",
        heading: "场景 2 · 连续结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="场景 2 的 DAG：观察性连续结局，X 混杂">' +
          '<figcaption>图 2 · 场景 2 因果图：红色路径 <code>X → e → A</code> 使 ' +
          '<code>X</code> 成为共同原因，粗差分有偏</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs(n = 4000, seed = 1204)   # 含混杂\n\n' +
          'naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])     # 有偏\n' +
          'fit   <- metalearner("X", d$X, d$A, d$Y, weighting = "iptw")\n\n' +
          '# 用真实 PS 走外部权重\n' +
          'w <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)\n' +
          'metalearner("DR", d$X, d$A, d$Y, weighting = "external", weights = w)</code></pre>' +
          '<div class="callout danger"><div class="callout-title">混杂结构</div>' +
          '<p>病情越重（<code>z1</code> 高）越容易接受处理，而病情本身又影响结局。' +
          '所以粗差分会同时混进病情的影响。实测两组基线：对照组 lac 均值 2.15，处理组 3.03。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>偏差</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整差分</td><td>1.738</td><td><strong>+0.689</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>1.007</td><td>−0.043</td></tr>' +
          '<tr><td>IPTW（稳定化）+ X</td><td>1.011</td><td>−0.038</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>1.086</td><td>+0.037</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>1.049</strong>。加权把 +0.69 的偏差压到 0.04 以内。</p>' +
          '<div class="callout warn"><div class="callout-title">提醒</div>' +
          '<p>本数据的混杂全部来自<strong>已测量</strong>协变量，所以校正能奏效。' +
          '真实研究里若有未测量混杂，任何方法都救不回来。</p></div>'
      },

      {
        id: "s3",
        heading: "场景 3 · 二分类结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" ' +
          'alt="场景 3 的 DAG：随机化二分类结局">' +
          '<figcaption>图 3 · 场景 3 因果图：结构与场景 1 相同，结局换成 ' +
          '<code>Y ~ Bern(plogis(qlogis(p0) + tau_logit))</code></figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_binary(n = 4000, seed = 1202)\n' +
          'lb <- lrn("classif.ranger", num.trees = 300, seed = 1)\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)\n' +
          'fit$ate   # 平均风险差</code></pre>' +
          '<div class="callout ok"><div class="callout-title">效应尺度是风险差</div>' +
          '<p>基学习器必须是 <code>classif.*</code>，引擎自动判定 <code>outcome = "binary"</code>，' +
          '结局模型返回 <code>P(Y=1|X)</code>，所以 CATE 天然落在<strong>风险差</strong>尺度上' +
          '（不是对数比、不是比值比）。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.129</td><td>0.603</td><td>0.157</td></tr>' +
          '<tr><td>T</td><td>0.128</td><td>0.492</td><td>0.223</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>0.794</strong></td><td><strong>0.096</strong></td></tr>' +
          '<tr><td>R</td><td>0.078</td><td>0.477</td><td>0.167</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>0.601</td><td>0.172</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE（风险差）= <strong>0.131</strong>。</p>'
      },

      {
        id: "s4",
        heading: "场景 4 · 二分类结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" ' +
          'alt="场景 4 的 DAG：观察性二分类结局">' +
          '<figcaption>图 4 · 场景 4 因果图：同样的混杂结构，未调整风险差 ' +
          '0.256 vs 真实 0.131</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)\n\n' +
          'naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1),\n' +
          '                   weighting = "iptw")</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>真实 ATE</th><th>偏差</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整风险差</td><td>0.256</td><td>0.131</td><td><strong>+0.125</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.146</td><td>0.131</td><td>+0.015</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>0.163</td><td>0.131</td><td>+0.033</td></tr>' +
          '</tbody></table></div>' +
          '<p>五种 learner 在 IPTW 下的表现：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>偏差</th><th>与真相关</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.144</td><td>+0.013</td><td>0.552</td></tr>' +
          '<tr><td>T</td><td>0.117</td><td>−0.014</td><td>0.444</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>−0.002</strong></td><td><strong>0.742</strong></td></tr>' +
          '<tr><td>R</td><td>0.109</td><td>−0.022</td><td>0.423</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>+0.001</td><td>0.426</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "s5",
        heading: "场景 5 · 生存结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" ' +
          'alt="场景 5 的 DAG：随机化生存结局">' +
          '<figcaption>图 5 · 场景 5 因果图：<code>Y</code> 是 (时间, 事件) 二元组，' +
          '另有指数删失（图中略）</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_surv(n = 4000, t0 = 2, seed = 1203)\n\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # 平均 S₁(2) − S₀(2)\n\n' +
          '# 也可以换非线性基学习器\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "ranger", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">效应是时间点依赖的</div>' +
          '<p>生存概率差在不同 <code>t0</code> 上取值不同，报告时必须写清 <code>t0</code>：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>t0</th><th>1</th><th>2</th><th>4</th></tr></thead>' +
          '<tbody><tr><td>ATE</td><td>0.104</td><td>0.129</td><td>0.124</td></tr></tbody></table></div>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.130</td><td><strong>−0.017</strong></td><td>0.153</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.129</td><td><strong>0.993</strong></td><td><strong>0.030</strong></td></tr>' +
          '<tr><td>X</td><td>0.123</td><td>0.840</td><td>0.088</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.261</td><td>0.305</td></tr>' +
          '<tr><td>DR</td><td>0.088</td><td>0.232</td><td>0.304</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>0.152</strong>，删失 29.9%。</p>' +
          '<div class="callout warn"><div class="callout-title">S 的相关接近 0 是预期的</div>' +
          '<p>Cox 是比例风险 + 线性预测，A 作为普通协变量无法表达 <code>A × X</code> 交互，' +
          'CATE 退化成常数。要捕捉异质性请用 T 或 X。</p></div>'
      },

      {
        id: "s6",
        heading: "场景 6 · 生存结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" ' +
          'alt="场景 6 的 DAG：观察性生存结局">' +
          '<figcaption>图 6 · 场景 6 因果图：混杂（红）之外还有删失，' +
          'IPTW × IPCW 两层权重相乘</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs_surv(n = 4000, t0 = 2, seed = 1206)\n\n' +
          '# 未调整：分两组做 Kaplan-Meier，再取 t0 处差值\n' +
          'km    <- survfit(Surv(d$Y[,1], d$Y[,2]) ~ d$A)\n' +
          's_at  <- summary(km, times = 2)$surv\n' +
          'naive <- s_at[2] - s_at[1]\n\n' +
          '# IPTW（混杂）× IPCW（删失）\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y, learner_base = "coxph",\n' +
          '                   weighting = "iptw", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">两层权重是相乘的</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>权重</th><th>最小值</th><th>中位数</th><th>最大值</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>IPTW（混杂）</td><td>1.02</td><td>1.66</td><td>16.73</td></tr>' +
          '<tr><td>IPCW（删失）</td><td>0.10</td><td>0.85</td><td>1.00</td></tr>' +
          '<tr><td>相乘后</td><td>0.14</td><td>1.37</td><td>12.28</td></tr>' +
          '</tbody></table></div></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>真实 ATE</th><th>偏差</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整 KM 差</td><td>0.079</td><td>0.152</td><td><strong>−0.072</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.125</td><td>0.152</td><td>−0.027</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>0.159</td><td>0.152</td><td>+0.007</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "scripts",
        heading: "配套可运行脚本",
        body:
          '<p>在 <code>mlr3HTE/</code> 目录下：</p>' +
          '<pre><code>Rscript tutorial/code/01_连续结局_随机化RCT.R</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>脚本</th><th>内容</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>00_数据生成机制与DAG.R</code></td><td><strong>先跑这个</strong>：DGP 逐步展开、DAG、真值分层表</td></tr>' +
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>连续 + RCT，五种 learner 对账</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>连续 + 观察性，IPTW vs 未调整</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>二分类 + RCT，风险差尺度</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>二分类 + 观察性</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>生存 + RCT，t0 生存概率差</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>生存 + 观察性，IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>三种结局 × 五种 learner 对比表</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '<tr><td><code>09_生存结局_survlearners引擎.R</code></td><td>生存第二套引擎 <code>engine="survlearners"</code>，与原生引擎同题对比</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "sl-engine",
        heading: "生存结局的第二套引擎：survlearners（脚本 09）",
        body:
          '<p>生存结局除了默认的<strong>原生引擎</strong>（<code>engine = "native"</code>，' +
          'Cox/ranger 实现，五族齐全），还可以显式切换到 <code>engine = "survlearners"</code>，' +
          '把估计整体委托给 <a href="https://som-shahlab.github.io/survlearners/">survlearners</a> ' +
          '（Shah Lab，GPL-3）。该包只发布在 GitHub，所以 mlr3HTE 把它放在 Suggests，' +
          '未安装时会给出明确提示：</p>' +
          '<pre><code>remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")\n\n' +
          'd <- mlr3HTE_demo_surv(n = 2000, t0 = 2, seed = 1203)\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y, learner_base = "grf",\n' +
          '                   t0 = 2, engine = "survlearners")</code></pre>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>能力</th><th>native（默认）</th><th>survlearners</th></tr></thead><tbody>' +
          '<tr><td>metalearner</td><td>S/T/X/R/DR 五族</td><td>S/T/X/R（没有 DR，另有一个 M）</td></tr>' +
          '<tr><td>效应尺度</td><td>S(t0) 差 + RMST 差</td><td>只有 S(t0) 差</td></tr>' +
          '<tr><td>基学习器</td><td><code>"coxph"</code>/<code>"ranger"</code> + 任意 mlr3 learner</td>' +
          '<td><code>"coxph"</code>/<code>"grf"</code>/<code>"lasso"</code>（<code>"ranger"</code> 是 grf 的别名）</td></tr>' +
          '<tr><td>删失 / 交叉拟合</td><td>IPTW × IPCW；<code>cross_fitting=TRUE</code></td>' +
          '<td>包内 IPCW；R 族内部自带 K 折交叉拟合</td></tr>' +
          '</tbody></table></div>' +

          '<h3>实际输出：n=2000 全组合对账（真值 ATE = 0.151）</h3>' +
          '<pre><code># A tibble: 11 × 5\n' +
          '   tp    kind    ATE  相关   偏差\n' +
          ' 1 S     coxph 0.156 0.993  0.005\n' +
          ' 2 S     grf   0.129 0.910 -0.022\n' +
          ' 3 S     lasso 0.156 0.997  0.006\n' +
          ' 4 T     coxph 0.067 0.952 -0.084   # 避开这一格，见下\n' +
          ' 5 T     grf   0.147 0.922 -0.004\n' +
          ' 6 T     lasso 0.146 0.992 -0.004\n' +
          ' 7 X     grf   0.149 0.934 -0.001\n' +
          ' 8 X     lasso 0.150 0.978 -0.001\n' +
          ' 9 R     coxph 0.152 0.963  0.001\n' +
          '10 R     grf   0.152 0.923  0.001\n' +
          '11 R     lasso 0.155 0.961  0.004</code></pre>' +

          '<div class="callout warn"><div class="callout-title">避开 T-coxph 这一格</div>' +
          '<p>实测 T-coxph 的 ATE 只有 0.067（偏差 −0.084），同族 T-grf/T-lasso 却正常。' +
          '读源码 + 验证后的机制：<code>surv_tl_coxph</code> 把<strong>未中心化</strong>的基线累积危险 ' +
          '（<code>basehaz(centered = FALSE)</code>）与 <code>predict(type = "risk")</code> 相乘，' +
          '而后者的线性预测器<strong>以样本均值为参照</strong>，两个基准不一致会扭曲 S(t0)。' +
          '对照 <code>surv_sl_coxph</code> 手算未中心化链接，所以 S-coxph 是准的。' +
          '要 Cox 做 T-learner，请用原生引擎。</p></div>' +

          '<div class="callout"><div class="callout-title">复现性</div>' +
          '<p>grf 族在 mlr3HTE 引擎内固定 <code>seed = 1</code>，两次运行逐位相同；' +
          'lasso 族内部用 glmnet 交叉验证选 lambda、折序随机（survlearners 未暴露 foldid），' +
          '两次运行有 ~0.001 量级抖动——如实说明，不假装确定。</p></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "Tutorial: 6 Scenarios",
    lede: "Three outcome types × randomized / observational = six cells. Every cell uses " +
          "simulated data with known ground truth, so you can check estimates unit by unit.",
    sections: [

      {
        id: "overview",
        heading: "The six cells",
        body: TUT_MATRIX.en +
              '<p>Every demo dataset returns the true <code>tau</code> and <code>ate</code> — ' +
              'the most useful part for teaching, since you can see directly which learner ' +
              'actually captured the heterogeneity.</p>' +
              '<pre><code>library(mlr3HTE)   # the only line you need: lrn() is re-exported from mlr3</code></pre>' +
              '<div class="callout"><div class="callout-title">Before you run</div>' +
              '<p>Every code block on this page relies on <code>library(mlr3HTE)</code> alone — ' +
              '<code>lrn()</code> is re-exported from mlr3, so no extra <code>library(mlr3)</code> ' +
              'is required. If you chain into mlr3 workflow functions such as ' +
              '<code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code>, add ' +
              '<code>library(mlr3)</code> as well.</p></div>'
      },

      {
        id: "dgp",
        heading: "Data-generating process & DAGs (read this first)",
        body:
          '<p>All six scenarios share one <strong>data-generating process (DGP)</strong>. ' +
          'Only two things change: the outcome distribution (continuous / binary / survival) ' +
          'and how treatment <code>A</code> arises (randomised / driven by covariates). ' +
          'Understanding the DGP is a prerequisite for every scenario below — only the data ' +
          'itself knows the truth, and that is how you judge whether an estimator works. ' +
          'Every formula below is copied line by line from <code>R/api.R</code>.</p>' +

          '<h3>Shared skeleton: covariates</h3>' +
          '<div class="formula">' +
          'age ~ N(60, 12)    lac ~ N(2.5, 1.2)    tumor ~ N(5, 2)    sex ~ Bern(0.45)<br>' +
          'z1 = scale(lac)    z2 = scale(tumor)   ' +
          '# z1 lactate (higher = sicker), z2 tumor burden</div>' +

          '<h3>Three outcomes, three sets of equations</h3>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th>Generating equations (verbatim from source)</th><th>Effect scale</th></tr></thead><tbody>' +
          '<tr><td>Continuous</td><td><code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code><br>' +
          '<code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code><br>' +
          '<code>Y = mu + A·tau + N(0,1)</code></td>' +
          '<td>mean difference <code>tau</code></td></tr>' +
          '<tr><td>Binary</td><td><code>p0 = plogis(−1.2 + 0.5·z1 + 0.4·z2 + 0.1·(age−60)/12 + 0.2·sex)</code><br>' +
          '<code>tau_logit = 0.6 + 0.5·z1 − 0.4·z2</code> (log-odds scale)<br>' +
          '<code>p1 = plogis(qlogis(p0) + tau_logit)</code>; <code>Y ~ Bern(p_A)</code></td>' +
          '<td>risk difference <code>p1 − p0</code></td></tr>' +
          '<tr><td>Survival</td><td><code>tau = 0.5 + 0.4·z1 − 0.3·z2</code> (log-hazard scale)<br>' +
          '<code>base_rate = exp(−1.0 + 0.3·z1 + 0.2·z2 + 0.1·(age−60)/12 + 0.15·sex)</code><br>' +
          '<code>rate = base_rate·exp(−A·tau)</code>; <code>T ~ Exp(rate)</code>; ' +
          'censoring <code>C ~ Exp(0.12)</code>, <code>time = min(T,C)</code></td>' +
          '<td>difference in <code>S(t₀)</code> (default t₀=2), plus an RMST difference</td></tr>' +
          '</tbody></table></div>' +
          '<p>Note the <strong>interaction</strong> inside the continuous ' +
          '<code>tau</code>: the treatment effect only gains an extra +0.6 when lactate is ' +
          'high <em>and</em> tumor burden is low — that is where heterogeneity comes from, ' +
          'and any method that reports a single average cannot capture it.</p>' +

          '<h3>Two assignment mechanisms, two DAGs</h3>' +
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="RCT DAG: A randomised, independent of X">' +
          '<figcaption>RCT: <code>A</code> is a coin flip, no parents</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="Observational DAG: X → e → A confounding">' +
          '<figcaption>Observational: <code>X → e → A</code>; the red path is the open backdoor</figcaption></figure>' +
          '</div>' +
          '<p>Under randomisation <code>A ~ Bern(0.5)</code> and <code>A ⊥ X</code>, so ' +
          'covariates only modify the effect and never confound. In the observational design ' +
          'the treatment probability is <code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>, ' +
          'making <code>X</code> a common cause of both <code>A</code> and <code>Y</code> — ' +
          'the backdoor path <code>A ← e ← X → outcome → Y</code> is open, so crude ' +
          'differences are biased.</p>' +

          '<div class="callout ok"><div class="callout-title">Truth ships with the data</div>' +
          '<p>Every <code>mlr3HTE_demo_*</code> function returns <code>tau</code> (unit-level ' +
          'true CATE), <code>ate</code> (true average effect) and, for observational scenarios, ' +
          '<code>ps_true</code> (the true propensity score). Run ' +
          '<code>00_数据生成机制与DAG.R</code> to print these truths and stratify them by ' +
          'covariates.</p></div>' +

          '<h3>Actual output: truths for all six datasets</h3>' +
          '<p>Below is the real console output of <code>00_数据生成机制与DAG.R</code> ' +
          '(tidyverse tibbles, verbatim):</p>' +
          '<pre><code># A tibble: 6 × 8\n' +
          '  dataset         outcome       true_ate cate_mean cate_sd cate_min cate_max ate_rmst\n' +
          '  &lt;chr&gt;           &lt;chr&gt;        &lt;dbl&gt;   &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;   &lt;dbl&gt;\n' +
          '1 cont × RCT      continuous   1.05    1.05    1.04  -2.58   4.85   NA\n' +
          '2 binary × RCT    risk diff    0.131   0.131   0.133 -0.232  0.563  NA\n' +
          '3 surv × RCT      S(t0) diff   0.152   0.152   0.151 -0.460  0.590  0.192\n' +
          '4 cont × obs      continuous   1.05    1.05    1.04  -2.14   5.03   NA\n' +
          '5 binary × obs    risk diff    0.131   0.131   0.132 -0.243  0.616  NA\n' +
          '6 surv × obs      S(t0) diff   0.152   0.152   0.150 -0.371  0.664  0.192\n\n' +
          '# A tibble: 3 × 2      # crude difference vs truth (observational)\n' +
          '  quantity                             value\n' +
          '  &lt;chr&gt;                                &lt;dbl&gt;\n' +
          '1 crude diff mean(Y|A=1)-mean(Y|A=0)  1.74\n' +
          '2 true ATE                            1.05\n' +
          '3 crude bias                          0.689\n\n' +
          'ℹ survival censoring proportion = 0.299</code></pre>' +
          '<p>Three takeaways: <strong>(1)</strong> the mean CATE always equals the ATE, but the ' +
          'standard deviation exceeds 1.0 — the average hides enormous unit-level variation; ' +
          '<strong>(2)</strong> survival scenarios additionally report ' +
          '<code>ATE_RMST = 0.192</code> (difference in restricted mean survival time), the same ' +
          'effect as the 0.152 probability difference at t₀=2 on a different scale; ' +
          '<strong>(3)</strong> the true ATEs for the observational datasets are identical to ' +
          'their RCT counterparts (1.05 / 0.131 / 0.152) — only the <strong>assignment ' +
          'mechanism</strong> differs, so the +0.69 crude bias is pure confounding, not a real ' +
          'change in the effect.</p>'
      },

      {
        id: "s1",
        heading: "Scenario 1 · Continuous outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="Scenario 1 DAG: randomised continuous outcome">' +
          '<figcaption>Figure 1 · Scenario 1 DAG: <code>A</code> is randomised; ' +
          '<code>X</code> modifies the effect but does not confound</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_data(n = 4000, seed = 1201)\n' +
          'lb <- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'for (tp in c("S","T","X","R","DR")) {\n' +
          '  fit <- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)\n' +
          '  cat(tp, fit$ate, cor(fit$cate_train, d$tau), "\\n")\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">Data-generating process</div>' +
          '<p>True CATE <code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code>; ' +
          'true baseline <code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code>.</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.935</td><td>0.895</td><td>0.483</td></tr>' +
          '<tr><td>T</td><td>0.951</td><td>0.845</td><td>0.653</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.950</td><td><strong>0.963</strong></td><td><strong>0.296</strong></td></tr>' +
          '<tr><td>R</td><td>0.450</td><td>0.812</td><td>0.907</td></tr>' +
          '<tr><td>DR</td><td>0.954</td><td>0.924</td><td>0.430</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>1.048</strong>. X wins; R\'s ATE is clearly low because of ' +
          'pseudo-outcome noise plus insufficient stage-2 regularisation ' +
          '(see <a href="#/guide/pitfalls">tuning notes</a>).</p>'
      },

      {
        id: "s2",
        heading: "Scenario 2 · Continuous outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="Scenario 2 DAG: observational continuous outcome with confounding">' +
          '<figcaption>Figure 2 · Scenario 2 DAG: the red path <code>X → e → A</code> makes ' +
          '<code>X</code> a common cause; crude differences are biased</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs(n = 4000, seed = 1204)   # confounded\n\n' +
          'naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])     # biased\n' +
          'fit   <- metalearner("X", d$X, d$A, d$Y, weighting = "iptw")\n\n' +
          '# External weights from the true PS\n' +
          'w <- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)\n' +
          'metalearner("DR", d$X, d$A, d$Y, weighting = "external", weights = w)</code></pre>' +
          '<div class="callout danger"><div class="callout-title">Confounding structure</div>' +
          '<p>Sicker patients (higher <code>z1</code>) are more likely to be treated, and severity ' +
          'also affects the outcome — so the crude difference picks up severity as well. ' +
          'Observed baseline: mean lac 2.15 in controls vs 3.03 in treated.</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>Bias</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted difference</td><td>1.738</td><td><strong>+0.689</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>1.007</td><td>−0.043</td></tr>' +
          '<tr><td>Stabilised IPTW + X</td><td>1.011</td><td>−0.038</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>1.086</td><td>+0.037</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>1.049</strong>. Weighting shrinks a +0.69 bias to under 0.04.</p>' +
          '<div class="callout warn"><div class="callout-title">Caveat</div>' +
          '<p>All confounding here comes from <strong>measured</strong> covariates, so correction ' +
          'works. With unmeasured confounding in a real study, no method can save you.</p></div>'
      },

      {
        id: "s3",
        heading: "Scenario 3 · Binary outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" ' +
          'alt="Scenario 3 DAG: randomised binary outcome">' +
          '<figcaption>Figure 3 · Scenario 3 DAG: same structure as Scenario 1, with the ' +
          'outcome swapped for <code>Y ~ Bern(plogis(qlogis(p0) + tau_logit))</code></figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_binary(n = 4000, seed = 1202)\n' +
          'lb <- lrn("classif.ranger", num.trees = 300, seed = 1)\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y, learner_base = lb)\n' +
          'fit$ate   # average risk difference</code></pre>' +
          '<div class="callout ok"><div class="callout-title">The effect scale is the risk difference</div>' +
          '<p>The base learner must be <code>classif.*</code>; the engine detects ' +
          '<code>outcome = "binary"</code>, the outcome model returns <code>P(Y=1|X)</code>, and the ' +
          'CATE therefore lives on the <strong>risk-difference</strong> scale (not log-odds, not ' +
          'odds ratio).</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.129</td><td>0.603</td><td>0.157</td></tr>' +
          '<tr><td>T</td><td>0.128</td><td>0.492</td><td>0.223</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>0.794</strong></td><td><strong>0.096</strong></td></tr>' +
          '<tr><td>R</td><td>0.078</td><td>0.477</td><td>0.167</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>0.601</td><td>0.172</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE (risk difference) = <strong>0.131</strong>.</p>'
      },

      {
        id: "s4",
        heading: "Scenario 4 · Binary outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" ' +
          'alt="Scenario 4 DAG: observational binary outcome">' +
          '<figcaption>Figure 4 · Scenario 4 DAG: the same confounding structure; ' +
          'unadjusted risk difference 0.256 vs true 0.131</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)\n\n' +
          'naive <- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1),\n' +
          '                   weighting = "iptw")</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>True ATE</th><th>Bias</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted risk difference</td><td>0.256</td><td>0.131</td><td><strong>+0.125</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.146</td><td>0.131</td><td>+0.015</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>0.163</td><td>0.131</td><td>+0.033</td></tr>' +
          '</tbody></table></div>' +
          '<p>All five learners under IPTW:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>Bias</th><th>Corr. with truth</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.144</td><td>+0.013</td><td>0.552</td></tr>' +
          '<tr><td>T</td><td>0.117</td><td>−0.014</td><td>0.444</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>−0.002</strong></td><td><strong>0.742</strong></td></tr>' +
          '<tr><td>R</td><td>0.109</td><td>−0.022</td><td>0.423</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>+0.001</td><td>0.426</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "s5",
        heading: "Scenario 5 · Survival outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" ' +
          'alt="Scenario 5 DAG: randomised survival outcome">' +
          '<figcaption>Figure 5 · Scenario 5 DAG: <code>Y</code> is a (time, event) pair; ' +
          'exponential censoring applies on top (omitted from the figure)</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_surv(n = 4000, t0 = 2, seed = 1203)\n\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # mean S₁(2) − S₀(2)\n\n' +
          '# Or a non-linear base learner\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "ranger", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">The effect is time-point dependent</div>' +
          '<p>The survival difference takes different values at different <code>t0</code>; always ' +
          'report the horizon:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>t0</th><th>1</th><th>2</th><th>4</th></tr></thead>' +
          '<tbody><tr><td>ATE</td><td>0.104</td><td>0.129</td><td>0.124</td></tr></tbody></table></div>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.130</td><td><strong>−0.017</strong></td><td>0.153</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.129</td><td><strong>0.993</strong></td><td><strong>0.030</strong></td></tr>' +
          '<tr><td>X</td><td>0.123</td><td>0.840</td><td>0.088</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.261</td><td>0.305</td></tr>' +
          '<tr><td>DR</td><td>0.088</td><td>0.232</td><td>0.304</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>0.152</strong>, 29.9% censoring.</p>' +
          '<div class="callout warn"><div class="callout-title">Near-zero correlation for S is expected</div>' +
          '<p>Cox is proportional hazards with a linear predictor, so A entered as an ordinary ' +
          'covariate cannot express the <code>A × X</code> interaction and the CATE degenerates to a ' +
          'constant. Use T or X to capture heterogeneity.</p></div>'
      },

      {
        id: "s6",
        heading: "Scenario 6 · Survival outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" ' +
          'alt="Scenario 6 DAG: observational survival outcome">' +
          '<figcaption>Figure 6 · Scenario 6 DAG: on top of confounding (red) there is ' +
          'censoring, so IPTW × IPCW layers are multiplied</figcaption></figure>' +
          '<pre><code>d <- mlr3HTE_demo_obs_surv(n = 4000, t0 = 2, seed = 1206)\n\n' +
          '# Unadjusted: separate Kaplan-Meier per arm, take the difference at t0\n' +
          'km    <- survfit(Surv(d$Y[,1], d$Y[,2]) ~ d$A)\n' +
          's_at  <- summary(km, times = 2)$surv\n' +
          'naive <- s_at[2] - s_at[1]\n\n' +
          '# IPTW (confounding) × IPCW (censoring)\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y, learner_base = "coxph",\n' +
          '                   weighting = "iptw", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">Two layers of weights are multiplied</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Weights</th><th>Min</th><th>Median</th><th>Max</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>IPTW (confounding)</td><td>1.02</td><td>1.66</td><td>16.73</td></tr>' +
          '<tr><td>IPCW (censoring)</td><td>0.10</td><td>0.85</td><td>1.00</td></tr>' +
          '<tr><td>Multiplied</td><td>0.14</td><td>1.37</td><td>12.28</td></tr>' +
          '</tbody></table></div></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>True ATE</th><th>Bias</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted KM difference</td><td>0.079</td><td>0.152</td><td><strong>−0.072</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.125</td><td>0.152</td><td>−0.027</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>0.159</td><td>0.152</td><td>+0.007</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "scripts",
        heading: "Runnable companion scripts",
        body:
          '<p>From the <code>mlr3HTE/</code> directory:</p>' +
          '<pre><code>Rscript tutorial/code/01_continuous_RCT.R</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Script</th><th>Content</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>00_数据生成机制与DAG.R</code></td><td><strong>Run this first</strong>: the DGP step by step, DAGs, truth tables</td></tr>' +
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>Continuous + RCT, all five learners</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>Continuous + observational, IPTW vs unadjusted</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>Binary + RCT, risk-difference scale</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>Binary + observational</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>Survival + RCT, survival difference at t0</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>Survival + observational, IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>3 outcomes × 5 learners comparison tables</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '<tr><td><code>09_生存结局_survlearners引擎.R</code></td><td>The second survival engine <code>engine="survlearners"</code>, head-to-head with native</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "sl-engine",
        heading: "A second survival engine: survlearners (script 09)",
        body:
          '<p>Besides the default <strong>native engine</strong> (<code>engine = "native"</code>, ' +
          'Cox/ranger, all five learners), survival outcomes can explicitly switch to ' +
          '<code>engine = "survlearners"</code>, delegating estimation to ' +
          '<a href="https://som-shahlab.github.io/survlearners/">survlearners</a> ' +
          '(Shah Lab, GPL-3). It lives on GitHub only, so mlr3HTE keeps it in Suggests ' +
          'and prints an install hint when missing:</p>' +
          '<pre><code>remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")\n\n' +
          'd <- mlr3HTE_demo_surv(n = 2000, t0 = 2, seed = 1203)\n' +
          'fit <- metalearner("X", d$X, d$A, d$Y, learner_base = "grf",\n' +
          '                   t0 = 2, engine = "survlearners")</code></pre>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Capability</th><th>native (default)</th><th>survlearners</th></tr></thead><tbody>' +
          '<tr><td>Metalearners</td><td>S/T/X/R/DR</td><td>S/T/X/R (no DR; an extra M)</td></tr>' +
          '<tr><td>Effect scale</td><td>S(t0) difference + RMST difference</td><td>S(t0) difference only</td></tr>' +
          '<tr><td>Base learners</td><td><code>"coxph"</code>/<code>"ranger"</code> + any mlr3 learner</td>' +
          '<td><code>"coxph"</code>/<code>"grf"</code>/<code>"lasso"</code> (<code>"ranger"</code> aliases grf)</td></tr>' +
          '<tr><td>Censoring / cross-fitting</td><td>IPTW × IPCW; <code>cross_fitting=TRUE</code></td>' +
          '<td>built-in IPCW; R family cross-fits internally</td></tr>' +
          '</tbody></table></div>' +

          '<h3>Actual output: full grid at n=2000 (true ATE = 0.151)</h3>' +
          '<pre><code># A tibble: 11 × 5\n' +
          '   tp    kind    ATE  cor   bias\n' +
          ' 1 S     coxph 0.156 0.993  0.005\n' +
          ' 2 S     grf   0.129 0.910 -0.022\n' +
          ' 3 S     lasso 0.156 0.997  0.006\n' +
          ' 4 T     coxph 0.067 0.952 -0.084   # avoid this cell, see below\n' +
          ' 5 T     grf   0.147 0.922 -0.004\n' +
          ' 6 T     lasso 0.146 0.992 -0.004\n' +
          ' 7 X     grf   0.149 0.934 -0.001\n' +
          ' 8 X     lasso 0.150 0.978 -0.001\n' +
          ' 9 R     coxph 0.152 0.963  0.001\n' +
          '10 R     grf   0.152 0.923  0.001\n' +
          '11 R     lasso 0.155 0.961  0.004</code></pre>' +

          '<div class="callout warn"><div class="callout-title">Avoid the T-coxph cell</div>' +
          '<p>Measured ATE for T-coxph is only 0.067 (bias −0.084) while T-grf/T-lasso are fine. ' +
          'Mechanism (read from source and verified, not guessed): <code>surv_tl_coxph</code> multiplies ' +
          'the <strong>uncentred</strong> baseline cumulative hazard (<code>basehaz(centered = FALSE)</code>) ' +
          'with <code>predict(type = "risk")</code>, whose linear predictor is <strong>centred at the ' +
          'training-sample mean</strong>; the mismatched reference scales distort S(t0). By contrast ' +
          '<code>surv_sl_coxph</code> builds its links manually (uncentred), so S-coxph is accurate. ' +
          'For a Cox-based T-learner, use the native engine.</p></div>' +

          '<div class="callout"><div class="callout-title">Reproducibility</div>' +
          '<p>The grf family is seeded (<code>seed = 1</code>) inside the mlr3HTE engine, so repeated ' +
          'runs are bit-identical. The lasso family cross-validates lambda with glmnet using random ' +
          'folds (survlearners exposes no foldid), so repeated runs jitter by ~0.001 — stated plainly ' +
          'rather than pretended away.</p></div>'
      }
    ]
  }
};
