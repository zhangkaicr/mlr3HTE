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
              '这是教学时最有用的部分——你可以直接看出哪个 learner 真的捕捉到了异质性。</p>'
      },

      {
        id: "s1",
        heading: "场景 1 · 连续结局 × RCT",
        body:
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
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>连续 + RCT，五种 learner 对账</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>连续 + 观察性，IPTW vs 未调整</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>二分类 + RCT，风险差尺度</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>二分类 + 观察性</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>生存 + RCT，t0 生存概率差</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>生存 + 观察性，IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>三种结局 × 五种 learner 对比表</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '</tbody></table></div>'
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
              'actually captured the heterogeneity.</p>'
      },

      {
        id: "s1",
        heading: "Scenario 1 · Continuous outcome × RCT",
        body:
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
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>Continuous + RCT, all five learners</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>Continuous + observational, IPTW vs unadjusted</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>Binary + RCT, risk-difference scale</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>Binary + observational</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>Survival + RCT, survival difference at t0</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>Survival + observational, IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>3 outcomes × 5 learners comparison tables</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '</tbody></table></div>'
      }
    ]
  }
};
