
/* ================= v0.34 新增内容 ================= */

window.SITE_PAGES.tutorialbenchgrid = {
  zh: {
    title: "7 基准模拟数据网格",
    lede: '10 个设计 × 3 类结局 = 30 份固定数据，真值齐备；四个结构维度相互独立，可固定其余、只改一个来做方法学对照。',
    sections: [
      {
        id: "why",
        heading: "为什么要把数据固定下来",
        body:
          '<p>方法学比较只有在同一份数据上才可比。若每次分析各自重新模拟，两个 learner 之间的差距里就混进了随机抽样噪声，同一段代码换一台机器可能给出相反的结论。因此本包把 <code>mlr3HTE_scenario()</code> 按 10 个设计 × 3 类结局预生成完毕，以 <code>n = 2000</code>、固定种子打包在 <code>data/mlr3hte_bench_data.rda</code> 中随包发布，用 <code>mlr3HTE_bench()</code> 取用。</p>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>需要真值以外的结构（更大的样本量、不同的效应强度、新的混杂形式）时，用 <code>mlr3HTE_scenario()</code> 按同一生成器扩展，并在报告中写明参数；不要直接改打包数据。</p></div>'
      },
      {
        id: "grid",
        heading: "四个结构维度",
        body:
          '<p>四个维度相互独立，取值如下。</p>' +
          '<div class="table-wrap"><table><thead><tr><th>维度</th><th>取值</th><th>含义</th></tr></thead><tbody><tr><td>研究设计</td><td><code>rct</code> / <code>obs</code></td><td>随机化（无混杂）/ 观察性（存在混杂）</td></tr><tr><td>混杂形式</td><td><code>none</code> / <code>linear</code> / <code>nonlinear</code></td><td>处理分配模型对协变量的函数形式</td></tr><tr><td>效应异质性形式</td><td><code>linear</code> / <code>nonlinear</code></td><td>真实 CATE 对协变量的函数形式（后者含 <code>sin</code> 与二次项）</td></tr><tr><td>共用变量</td><td><code>TRUE</code> / <code>FALSE</code></td><td>是否存在既进入处理分配模型、又进入真实 CATE 的协变量</td></tr></tbody></table></div>' +
          '<pre><code class="language-r">mlr3HTE_scenarios()</code></pre><pre><code class="r-out">                          id design confounding       hte shared\n1                    rct_lin    rct        none    linear  FALSE\n2                 rct_nonlin    rct        none nonlinear  FALSE\n3        obs_lin_lin_sharedF    obs      linear    linear  FALSE\n4        obs_lin_lin_sharedT    obs      linear    linear   TRUE\n5     obs_lin_nonlin_sharedF    obs      linear nonlinear  FALSE\n6     obs_lin_nonlin_sharedT    obs      linear nonlinear   TRUE\n7     obs_nonlin_lin_sharedF    obs   nonlinear    linear  FALSE\n8     obs_nonlin_lin_sharedT    obs   nonlinear    linear   TRUE\n9  obs_nonlin_nonlin_sharedF    obs   nonlinear nonlinear  FALSE\n10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p><code>shared = TRUE</code> 是四种维度里最容易被忽略、却对结论影响最大的一个。它对应现实里最常见也最棘手的结构：<strong>同一个变量既是混杂因子、又是效应修饰因子</strong>——例如疾病严重度既影响医生是否用药，又决定患者能从药里获益多少。此时校正该变量与估计效应修饰用的是同一批信息，任何一步出错都会被放大。</p></div>'
      },
      {
        id: "access",
        heading: "取用与索引",
        body:
          '<pre><code class="language-r">idx &lt;- mlr3HTE_bench_index()\ndim(idx)\nutils::head(idx, 6)</code></pre><pre><code class="r-out">[1] 30  5\n                    key         id    outcome       ate    n\n1    rct_lin.continuous    rct_lin continuous 1.0000000 2000\n2        rct_lin.binary    rct_lin     binary 0.1288110 2000\n3      rct_lin.survival    rct_lin   survival 0.1542625 2000\n4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000\n5     rct_nonlin.binary rct_nonlin     binary 0.1367614 2000\n6   rct_nonlin.survival rct_nonlin   survival 0.1573606 2000</code></pre>' +
          '<pre><code class="language-r">b &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\nnames(b)\nc(n = nrow(b$X), ate = b$ate,\n  cor_tau_lac = round(cor(b$tau, b$X$lac), 3),\n  ps_range = paste(round(range(b$ps_true), 3), collapse = " - "))</code></pre><pre><code class="r-out"> [1] "X"        "A"        "Y"        "tau"      "ate"      "ps_true"\n [7] "t0"       "meta"     "tau_rmst" "ate_rmst"\n                 n                ate        cor_tau_lac           ps_range\n            "2000" "0.98512652714735"            "0.633"     "0.01 - 0.841" </code></pre>' +
          '<p>每份数据都带 <code>tau</code>（逐人真实 CATE）、<code>ate</code>、<code>ps_true</code>（真实倾向得分）与 <code>meta</code>（结构标签与生成参数）；生存结局额外提供 <code>tau_rmst</code> 与 <code>ate_rmst</code>。</p>'
      },
      {
        id: "confounding",
        heading: "混杂强度的量化标尺",
        body:
          '<p>判断某个方法是否真的校正了混杂，需要一把标尺。在没有未测混杂的前提下，<strong>未调整差值与真值 ATE 之差</strong>就是该份数据上混杂偏差的规模：方法跑完之后，估计值与真值的距离应当显著小于它。</p>' +
          '<pre><code class="language-r">naive &lt;- function(b) mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])\ngrid_ids &lt;- c("rct_lin", "rct_nonlin",\n              "obs_lin_lin_sharedF", "obs_lin_lin_sharedT",\n              "obs_nonlin_lin_sharedF", "obs_nonlin_lin_sharedT")\nbias_tab &lt;- do.call(rbind, lapply(grid_ids, function(id) {\n  bb &lt;- mlr3HTE_bench(id, "continuous")\n  data.frame(id = id, ate_true = bb$ate, naive = naive(bb),\n             bias = naive(bb) - bb$ate)\n}))\nbias_tab</code></pre><pre><code class="r-out">                      id  ate_true     naive        bias\n1                rct_lin 1.0000000 0.9873591 -0.01264090\n2             rct_nonlin 0.9939152 1.0305439  0.03662868\n3    obs_lin_lin_sharedF 1.0000000 1.0925908  0.09259077\n4    obs_lin_lin_sharedT 1.0000000 1.6061261  0.60612614\n5 obs_nonlin_lin_sharedF 1.0000000 1.2359830  0.23598304\n6 obs_nonlin_lin_sharedT 1.0000000 1.4690571  0.46905707</code></pre>' +
          '<p>三个层次很清楚：随机化设计的偏差在 ±0.04 以内（纯抽样波动）；观察性设计在 0.09–0.24 之间；而一旦存在共用变量，偏差放大到 0.47–0.61，是真值的一半以上。后续任何方法学比较都应按这一梯度分层报告，而不是把 30 份数据混成一个平均指标。</p>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>这里的“未调整差值”只是偏差标尺，不是估计量。真值 ATE 只有模拟数据才有，现实研究里这把尺子不存在——这正是为什么观察性分析必须事先把混杂结构写清楚，而不是指望事后用指标判断。</p></div>'
      },
      {
        id: "hte-form",
        heading: "线性与非线性 HTE 的可估性",
        body:
          '<p>固定“观察性 + 非线性混杂 + 共用变量”，只改 HTE 形式，比较 T-Learner 配线性模型与随机森林时的 CATE 相关性。</p>' +
          '<pre><code class="language-r"># CATE 相关必须在留出集上算：t_learner() 返回的是训练集 CATE，\n# 柔性学习器会记住训练噪声，回代自己必然虚高。\nbb &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\ntr &lt;- sample(seq_len(nrow(bb$X)), size = floor(0.7 * nrow(bb$X)))\nte &lt;- setdiff(seq_len(nrow(bb$X)), tr)\nf &lt;- metalearner("T", bb$X[tr, ], bb$A[tr], bb$Y[tr],\n                 learner_base = lrn("regr.ranger", num.trees = 300))\ncor(f$predict(bb$X[te, ]), bb$tau[te])</code></pre><pre><code class="r-out">        hte     learner   cor\n1    linear     regr.lm 0.994\n2    linear regr.ranger 0.894\n3 nonlinear     regr.lm 0.564\n4 nonlinear regr.ranger 0.819</code></pre>' +
          '<p>结果与理论一致：真实 CATE 为线性时，线性模型的留出相关为 0.994，高于随机森林的 0.894；真实 CATE 含 <code>sin</code> 与二次项时，线性模型降到 0.564，随机森林为 0.819。这说明<strong>基学习器的函数形式必须覆盖真实 CATE 的形式</strong>，否则再多的样本量也补不回来——这是偏差，不是方差。</p>'
      },
      {
        id: "survival",
        heading: "生存结局的两种效应标尺",
        body:
          '<pre><code class="language-r">s &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "survival")\nc(ate_survdiff = s$ate, ate_rmst = s$ate_rmst, t0 = s$t0)</code></pre><pre><code class="r-out">ate_survdiff     ate_rmst           t0\n   0.1590526    0.2011652    2.0000000</code></pre>' +
          '<p>生存结局同时给出 <code>t0</code> 时点生存概率差与 RMST 差两套真值，二者量纲不同、数值也不同（上例 0.159 与 0.201），报告时必须写明用的是哪一种。RMST 差不依赖比例风险假设，在风险曲线交叉时更稳健。</p>'
      },
      {
        id: "convention",
        heading: "使用约定",
        body:
          '<ol class="ref-list"><li>方法学比较统一使用 <code>mlr3HTE_bench()</code>，不要在论文或报告里各自重新模拟。</li><li>结果按研究设计、混杂形式、HTE 形式、共用变量四个维度分层报告，不做跨维度平均。</li><li>报告 CATE 精度时注明是在留出集还是训练集上算的；两者不可比。</li><li>生存结局必须写明效应标尺（<code>survdiff</code> 还是 <code>rmst</code>）与 <code>t0</code>。</li></ol>'
      }
    ]
  },
  en: {
    title: "7 Benchmark simulation grid",
    lede: 'Ten designs by three outcomes give thirty fixed datasets with complete ground truth; the four structural dimensions are independent, so any one can be varied while the others are held fixed.',
    sections: [
      {
        id: "why",
        heading: "Why the data must be fixed",
        body:
          '<p>Method comparisons are only comparable on the same data. If each analysis simulates afresh, the gap between two learners is contaminated by sampling noise and the same code can rank them differently on another machine. This package therefore pre-generates <code>mlr3HTE_scenario()</code> over 10 designs x 3 outcomes at <code>n = 2000</code> with fixed seeds, ships the result in <code>data/mlr3hte_bench_data.rda</code>, and exposes it via <code>mlr3HTE_bench()</code>.</p>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>When a structure beyond the shipped grid is needed (larger n, different effect strength, a new confounding form), extend it with <code>mlr3HTE_scenario()</code> and report the arguments; do not modify the bundled data.</p></div>'
      },
      {
        id: "grid",
        heading: "Four structural dimensions",
        body:
          '<p>The four dimensions are independent. Their levels are as follows.</p>' +
          '<div class="table-wrap"><table><thead><tr><th>Dimension</th><th>Levels</th><th>Meaning</th></tr></thead><tbody><tr><td>研究设计</td><td><code>rct</code> / <code>obs</code></td><td>随机化（无混杂）/ 观察性（存在混杂）</td></tr><tr><td>混杂形式</td><td><code>none</code> / <code>linear</code> / <code>nonlinear</code></td><td>处理分配模型对协变量的函数形式</td></tr><tr><td>效应异质性形式</td><td><code>linear</code> / <code>nonlinear</code></td><td>真实 CATE 对协变量的函数形式（后者含 <code>sin</code> 与二次项）</td></tr><tr><td>共用变量</td><td><code>TRUE</code> / <code>FALSE</code></td><td>是否存在既进入处理分配模型、又进入真实 CATE 的协变量</td></tr></tbody></table></div>' +
          '<pre><code class="language-r">mlr3HTE_scenarios()</code></pre><pre><code class="r-out">                          id design confounding       hte shared\n1                    rct_lin    rct        none    linear  FALSE\n2                 rct_nonlin    rct        none nonlinear  FALSE\n3        obs_lin_lin_sharedF    obs      linear    linear  FALSE\n4        obs_lin_lin_sharedT    obs      linear    linear   TRUE\n5     obs_lin_nonlin_sharedF    obs      linear nonlinear  FALSE\n6     obs_lin_nonlin_sharedT    obs      linear nonlinear   TRUE\n7     obs_nonlin_lin_sharedF    obs   nonlinear    linear  FALSE\n8     obs_nonlin_lin_sharedT    obs   nonlinear    linear   TRUE\n9  obs_nonlin_nonlin_sharedF    obs   nonlinear nonlinear  FALSE\n10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p><code>shared = TRUE</code> is the dimension most easily overlooked and yet the most consequential. It encodes the structure that is both common and awkward in practice: <strong>the same variable is a confounder and an effect modifier</strong> — disease severity, for instance, drives the prescribing decision and also determines how much a patient benefits. Correcting for it and estimating modification then draw on the same information, so any error is amplified.</p></div>'
      },
      {
        id: "access",
        heading: "Access and index",
        body:
          '<pre><code class="language-r">idx &lt;- mlr3HTE_bench_index()\ndim(idx)\nutils::head(idx, 6)</code></pre><pre><code class="r-out">[1] 30  5\n                    key         id    outcome       ate    n\n1    rct_lin.continuous    rct_lin continuous 1.0000000 2000\n2        rct_lin.binary    rct_lin     binary 0.1288110 2000\n3      rct_lin.survival    rct_lin   survival 0.1542625 2000\n4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000\n5     rct_nonlin.binary rct_nonlin     binary 0.1367614 2000\n6   rct_nonlin.survival rct_nonlin   survival 0.1573606 2000</code></pre>' +
          '<pre><code class="language-r">b &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\nnames(b)\nc(n = nrow(b$X), ate = b$ate,\n  cor_tau_lac = round(cor(b$tau, b$X$lac), 3),\n  ps_range = paste(round(range(b$ps_true), 3), collapse = " - "))</code></pre><pre><code class="r-out"> [1] "X"        "A"        "Y"        "tau"      "ate"      "ps_true"\n [7] "t0"       "meta"     "tau_rmst" "ate_rmst"\n                 n                ate        cor_tau_lac           ps_range\n            "2000" "0.98512652714735"            "0.633"     "0.01 - 0.841" </code></pre>' +
          '<p>Every dataset carries <code>tau</code> (true individual CATE), <code>ate</code>, <code>ps_true</code> (true propensity score) and <code>meta</code> (structural labels and generation arguments); survival outcomes additionally provide <code>tau_rmst</code> and <code>ate_rmst</code>.</p>'
      },
      {
        id: "confounding",
        heading: "Quantifying the strength of confounding",
        body:
          '<p>Assessing whether a method truly removed confounding requires a yardstick. Absent unmeasured confounding, the <strong>difference between the unadjusted contrast and the true ATE</strong> is the size of the confounding bias in that dataset: after adjustment, the distance between the estimate and the truth should be substantially smaller.</p>' +
          '<pre><code class="language-r">naive &lt;- function(b) mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])\ngrid_ids &lt;- c("rct_lin", "rct_nonlin",\n              "obs_lin_lin_sharedF", "obs_lin_lin_sharedT",\n              "obs_nonlin_lin_sharedF", "obs_nonlin_lin_sharedT")\nbias_tab &lt;- do.call(rbind, lapply(grid_ids, function(id) {\n  bb &lt;- mlr3HTE_bench(id, "continuous")\n  data.frame(id = id, ate_true = bb$ate, naive = naive(bb),\n             bias = naive(bb) - bb$ate)\n}))\nbias_tab</code></pre><pre><code class="r-out">                      id  ate_true     naive        bias\n1                rct_lin 1.0000000 0.9873591 -0.01264090\n2             rct_nonlin 0.9939152 1.0305439  0.03662868\n3    obs_lin_lin_sharedF 1.0000000 1.0925908  0.09259077\n4    obs_lin_lin_sharedT 1.0000000 1.6061261  0.60612614\n5 obs_nonlin_lin_sharedF 1.0000000 1.2359830  0.23598304\n6 obs_nonlin_lin_sharedT 1.0000000 1.4690571  0.46905707</code></pre>' +
          '<p>Three tiers are evident: randomised designs stay within ±0.04 (pure sampling variation); observational designs fall between 0.09 and 0.24; and once a shared variable is present the bias rises to 0.47–0.61, more than half the true effect. Subsequent comparisons should report results stratified along this gradient rather than averaging all thirty datasets into a single number.</p>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The unadjusted contrast here is a bias yardstick, not an estimator. The true ATE exists only in simulation, so this yardstick has no counterpart in real studies — which is precisely why observational analyses must specify the confounding structure in advance instead of hoping a metric will reveal it afterwards.</p></div>'
      },
      {
        id: "hte-form",
        heading: "Estimability under linear and nonlinear HTE",
        body:
          '<p>Holding the design at "observational + nonlinear confounding + shared variable" and varying only the HTE form, the correlation between the estimated and true CATE is compared for a T-Learner with a linear model against one with a random forest.</p>' +
          '<pre><code class="language-r"># CATE 相关必须在留出集上算：t_learner() 返回的是训练集 CATE，\n# 柔性学习器会记住训练噪声，回代自己必然虚高。\nbb &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\ntr &lt;- sample(seq_len(nrow(bb$X)), size = floor(0.7 * nrow(bb$X)))\nte &lt;- setdiff(seq_len(nrow(bb$X)), tr)\nf &lt;- metalearner("T", bb$X[tr, ], bb$A[tr], bb$Y[tr],\n                 learner_base = lrn("regr.ranger", num.trees = 300))\ncor(f$predict(bb$X[te, ]), bb$tau[te])</code></pre><pre><code class="r-out">        hte     learner   cor\n1    linear     regr.lm 0.994\n2    linear regr.ranger 0.894\n3 nonlinear     regr.lm 0.564\n4 nonlinear regr.ranger 0.819</code></pre>' +
          '<p>The pattern matches theory: with a linear true CATE the linear model attains a held-out correlation of 0.994 against 0.894 for the random forest; when the true CATE contains a <code>sin</code> term and a quadratic term, the linear model drops to 0.564 while the forest reaches 0.819. The implication is that the <strong>base learner\'s function class must cover the true CATE</strong>; more data will not repair the gap, because this is bias rather than variance.</p>'
      },
      {
        id: "survival",
        heading: "Two effect scales for survival outcomes",
        body:
          '<pre><code class="language-r">s &lt;- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "survival")\nc(ate_survdiff = s$ate, ate_rmst = s$ate_rmst, t0 = s$t0)</code></pre><pre><code class="r-out">ate_survdiff     ate_rmst           t0\n   0.1590526    0.2011652    2.0000000</code></pre>' +
          '<p>Survival outcomes provide ground truth on two scales — the difference in survival probability at <code>t0</code> and the RMST difference — with different units and different values (0.159 versus 0.201 above), so reports must state which one is used. The RMST difference does not rely on the proportional hazards assumption and is more robust when hazard curves cross.</p>'
      },
      {
        id: "convention",
        heading: "Conventions",
        body:
          '<ol class="ref-list"><li>Use <code>mlr3HTE_bench()</code> for all method comparisons; do not re-simulate separately in a paper or report.</li><li>Report results stratified by design, confounding form, HTE form and shared variable; do not average across those dimensions.</li><li>When reporting CATE accuracy, state whether it was computed out-of-sample or in-sample; the two are not comparable.</li><li>For survival outcomes, always state the effect scale (<code>survdiff</code> or <code>rmst</code>) and <code>t0</code>.</li></ol>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialexplain = {
  zh: {
    title: "8 CATE 模型可解释性",
    lede: '把估计出的 CATE 曲面当成一个模型来解释：哪些变量驱动了效应异质性、效应随某变量如何变化、单个个体的效应由哪些变量推高或拉低。解释对象是双重稳健伪结局，不是原始结局。',
    sections: [
      {
        id: "target",
        heading: "一、解释对象必须是伪结局",
        body:
          '<p>可解释性工具衡量的是<strong>响应变量</strong>与模型预测之间的关系。若直接把原始结局 <code>Y</code> 当作响应变量，置换重要性与偏依赖衡量的是该变量对基线预后 <code>mu(X)</code> 的贡献——一个强预后因子即使完全不修饰疗效，也会排在重要性榜首。这与“谁更获益”是两件事。</p>' +
          '<p>双重稳健伪结局 <code>Y*</code> 满足 <code>E[Y*|X] = tau(X)</code>，其条件期望就是 CATE。因此把 <code>Y*</code> 作为响应变量，置换重要性与偏依赖衡量的才是效应异质性。本包的 <code>hte_explainer()</code> 在未显式传入 <code>pseudo</code> 时，会自动调用 <code>dr_pseudo_outcome()</code> 计算它。</p>'
      },
      {
        id: "fit",
        heading: "二、先确认估计质量",
        body:
          '<p>解释一个拟合失败的 CATE 曲面没有任何意义。第一步永远是看估计值与真值的距离。</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y,\n                   learner_base = lrn("regr.ranger", num.trees = 300))\ntau_hat &lt;- fit$predict(d$X)\nc(ate_hat = mean(tau_hat), ate_true = d$ate,\n  cor = round(cor(tau_hat, d$tau), 3))</code></pre><pre><code class="r-out"> ate_hat ate_true      cor\n1.116643 1.002500 0.769000</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>留出集上的相关才是可信指标；训练集回代会系统性虚高。上面的 0.769 是训练集相关，只用于演示，正式比较请按教程 7 的做法做显式划分。</p></div>'
      },
      {
        id: "explainer",
        heading: "三、包装为 DALEX 解释器",
        body:
          '<pre><code class="language-r">ex &lt;- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\nlength(ex$pseudo)\nround(cor(ex$pseudo, d$tau), 3)</code></pre><pre><code class="r-out">[1] 600\n[1] 0.39</code></pre>' +
          '<p>伪结局是逐人的无偏估计，方差很大：上例中它与真值 <code>tau</code> 的相关只有 0.39。这不影响它作为解释目标的资格——<code>E[Y*|X] = tau(X)</code> 是<strong>条件期望</strong>层面的性质，与单点噪声无关。若需要逐点精度，应当看 metalearner 的 CATE 估计而非伪结局。</p>'
      },
      {
        id: "surrogate",
        heading: "四、代理模型",
        body:
          '<p>若原始 CATE 曲面由多阶段、带权重、带交叉拟合的过程得到，结构复杂难以直接解读，可以用单一学习器把它重拟合一遍，得到一个可解释的代理模型。</p>' +
          '<pre><code class="language-r">sur &lt;- hte_surrogate(d$X, tau_hat)\nsur$learner_id\nround(cor(sur$predict(d$X), tau_hat), 3)</code></pre><pre><code class="r-out">[1] "regr.ranger"\n[1] 0.937</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>代理模型只用于解释与可视化，不应替代原 metalearner 做效应估计：它把多阶段过程压缩成单一回归，精度必然下降（上例与原模型相关 0.937，不等于与原模型等价）。</p></div>'
      },
      {
        id: "importance",
        heading: "五、置换重要性",
        body:
          '<p>把某个协变量随机打乱后，模型相对伪结局的损失上升多少。上升越多，说明模型越依赖该变量来区分个体效应。</p>' +
          '<pre><code class="language-r">imp &lt;- hte_feature_importance(ex, B = 10, N = 600, seed = 1)\nimp</code></pre><pre><code class="r-out">  variable dropout_loss baseline    dropout dropout_pct\n2      lac     2.232817 1.657445 0.57537262   34.714435\n4    tumor     2.158512 1.657445 0.50106702   30.231294\n1      age     1.974394 1.657445 0.31694939   19.122771\n3      sex     1.746382 1.657445 0.08893715    5.365919</code></pre>' +
          '<pre><code class="language-r">p_imp &lt;- plot_hte_importance(imp)\nggplot2::ggsave("15_importance.png", p_imp, width = 7, height = 4, dpi = 150)</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>这是对<strong>模型</strong>的解释，不是因果效应分解。重要性高只说明模型用到了该变量，不说明该变量真的修饰了治疗效果；判断后者需要设计层面的证据，例如随机化下的分层分析或预先设定的交互项检验。</p></div>'
      },
      {
        id: "pdp",
        heading: "六、偏依赖与累积局部效应",
        body:
          '<p>把某个协变量固定在网格上逐点变动、其余变量保持观测分布，看平均预测 CATE 如何变化。这是回答“效应随这个变量怎么变”的直接手段。</p>' +
          '<pre><code class="language-r">pd &lt;- hte_pdp(ex, variables = "lac", grid_points = 40)\nutils::head(pd, 6)</code></pre><pre><code class="r-out">  variable           x      yhat    type\n1      lac -1.35582624 0.7757646 partial\n2      lac -0.08519213 0.3333775 partial\n3      lac  0.35384536 0.3611582 partial\n4      lac  0.67263365 0.2769214 partial\n5      lac  0.84518778 0.3285855 partial\n6      lac  0.99896256 0.1739816 partial</code></pre>' +
          '<pre><code class="language-r"># 协变量相关时 PDP 会在观测支撑集之外外推，ALE 更稳健\npd_ale &lt;- hte_pdp(ex, variables = "lac", grid_points = 40,\n                  type = "accumulated")\nutils::head(pd_ale, 3)</code></pre><pre><code class="r-out">  variable           x      yhat        type\n1      lac -1.35582624 0.9545599 accumulated\n2      lac -0.08519213 0.4735859 accumulated\n3      lac  0.35384536 0.4951885 accumulated</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p><code>hte_pdp()</code> 默认 <code>center = FALSE</code>，纵轴保留<strong>绝对的平均预测 CATE</strong>。CATE 语境下这一点很重要：曲线围绕 0 波动会掩盖效应水平本身，而“平均获益 1.2”与“平均获益 0.2”是两个完全不同的临床结论。DALEX 的 <code>model_profile()</code> 默认 <code>center = TRUE</code>，本包显式覆盖。</p></div>'
      },
      {
        id: "shap",
        heading: "七、Kernel SHAP",
        body:
          '<p>SHAP 把每个个体的 CATE 分解为基线值加各协变量的贡献，同时给出<strong>全局重要性</strong>（贡献的跨度）与<strong>局部归因</strong>（这一个体身上各变量贡献多少）。这是偏依赖图无法提供的信息。</p>' +
          '<pre><code class="language-r">sv &lt;- hte_shap(ex, n_background = 100, seed = 1)\nutils::head(hte_shap_data(sv), 4)\nattr(hte_shap_data(sv), "baseline")</code></pre><pre><code class="r-out">  id variable    value       shap\n1  1      age 52.48255 -0.1364983\n2  2      age 62.20372 -0.5994672\n3  3      age 49.97246 -0.2239525\n4  4      age 79.14337 -0.1643312\n[1] 1.261608</code></pre>' +
          '<p>可加性是检验实现是否正确的直接手段：<code>phi_0 + sum(phi_j)</code> 必须等于模型对该个体的预测值，残差应在机器精度量级。</p>' +
          '<pre><code class="language-r">S &lt;- as.matrix(sv$S)\nmax(abs(as.numeric(sv$baseline) + rowSums(S) - tau_hat))</code></pre><pre><code class="r-out">[1] 4.440892e-16</code></pre>' +
          '<pre><code class="language-r">plot_hte_shap(sv, "beeswarm")\nplot_hte_shap(sv, "dependence", variable = "lac")\nplot_hte_shap(sv, "waterfall", variable = 1)</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>协变量数 <em>p</em> 不大时 Kernel SHAP 走精确枚举（<code>2^p</code> 个联盟）；<em>p</em> 较大时 kernelshap 自动切换为采样近似，结果随 <code>seed</code> 有轻微波动。报告时请固定 <code>seed</code>。</p></div>'
      },
      {
        id: "export",
        heading: "八、图形与数据分离",
        body:
          '<p>本包所有 <code>plot_*</code> 函数都返回 <strong>ggplot 对象</strong>，可用 <code>+</code> 叠加图层、用 <code>ggsave()</code> 导出；绘图所用的原始数据同时可单独取出落盘。二者分离，便于按期刊要求重画。</p>' +
          '<pre><code class="language-r">qd &lt;- hte_shap_data(sv)\nutils::write.csv(qd, "15_shap_values.csv", row.names = FALSE)\n\nggplot2::ggplot(qd, ggplot2::aes(x = value, y = shap)) +\n  ggplot2::geom_point(alpha = 0.5, colour = "#1B6CA8") +\n  ggplot2::geom_hline(yintercept = 0, linetype = 2, colour = "grey60") +\n  ggplot2::facet_wrap(~ variable, scales = "free_x") +\n  ggplot2::labs(x = "协变量取值", y = "SHAP 贡献",\n                title = "SHAP 依赖图（用导出数据自行绘制）") +\n  ggplot2::theme_minimal(base_size = 12)</code></pre>' +
          '<div class="table-wrap"><table><thead><tr><th>绘图函数</th><th>对应的数据函数</th></tr></thead><tbody><tr><td><code>plot_hte_importance()</code></td><td><code>hte_feature_importance()</code></td></tr><tr><td><code>plot_hte_pdp()</code></td><td><code>hte_pdp()</code></td></tr><tr><td><code>plot_hte_shap()</code></td><td><code>hte_shap_data()</code></td></tr><tr><td><code>plot_hte_benchmark()</code></td><td><code>hte_benchmark_data()</code></td></tr><tr><td><code>plot_qini()</code></td><td><code>qini_curve()</code></td></tr><tr><td><code>mlr3HTE_dag()</code></td><td><code>mlr3HTE_dag_data()</code></td></tr></tbody></table></div>'
      },
      {
        id: "survival",
        heading: "九、生存结局同样可解释",
        body:
          '<pre><code class="language-r">s &lt;- mlr3HTE_scenario("rct_lin", "survival", n = 400, seed = 1)\nfit_s &lt;- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0)\nex_s &lt;- hte_explainer(fit_s, s$X, s$A, s$Y, t0 = s$t0,\n                     effect = "survdiff", seed = 1)\nlength(ex_s$pseudo)\nex_s$t0\nhte_feature_importance(ex_s, B = 5, N = 400, seed = 1)</code></pre><pre><code class="r-out">[1] 400\n[1] 2\n  variable dropout_loss baseline      dropout dropout_pct\n4    tumor     1.183836 1.170557 1.327878e-02 1.134398187\n2      lac     1.181124 1.170557 1.056649e-02 0.902689305\n3      sex     1.172480 1.170557 1.922358e-03 0.164225871\n1      age     1.170578 1.170557 2.079801e-05 0.001776762</code></pre>' +
          '<div class="callout warn"><div class="callout-title">使用要点</div><p>生存分支的伪结局已用删失 IPCW 校正，效应标尺由 <code>effect</code> 指定（<code>"survdiff"</code> 或 <code>"rmst"</code>）。切换标尺会改变伪结局的量纲，重要性排序也可能随之改变，报告时须写明。</p></div>'
      },
      {
        id: "boundary",
        heading: "十、能力边界",
        body:
          '<ol class="ref-list"><li>可解释性工具解释的是<strong>模型</strong>，不是数据生成机制。模型错了，解释再漂亮也是错的。</li><li>变量重要性不构成因果结论。判断某变量是否真为效应修饰因子，需要设计层面的证据（随机化下的分层分析、预先设定的交互项检验），或在目标试验模拟框架下预先申明。</li><li>SHAP 的可加性是数学恒等式，不保证各分项可单独干预。</li><li>偏依赖在观测支撑集之外做外推；协变量相关时应改用 ALE。</li></ol>'
      }
    ]
  },
  en: {
    title: "8 Interpreting the CATE model",
    lede: 'Treat the estimated CATE surface as a model to be explained: which variables drive effect heterogeneity, how the effect varies with a covariate, and which variables push an individual\'s effect up or down. The object of explanation is the doubly robust pseudo-outcome, not the raw outcome.',
    sections: [
      {
        id: "target",
        heading: "1. The object of explanation",
        body:
          '<p>Interpretability tools measure the relationship between the <strong>response</strong> and the model\'s predictions. With the raw outcome <code>Y</code> as the response, permutation importance and partial dependence measure a variable\'s contribution to the baseline prognosis <code>mu(X)</code>: a strong prognostic factor tops the ranking even when it does not modify the effect at all. That is a different question from who benefits more.</p>' +
          '<p>The doubly robust pseudo-outcome <code>Y*</code> satisfies <code>E[Y*|X] = tau(X)</code>, so its conditional expectation is the CATE. Using <code>Y*</code> as the response makes permutation importance and partial dependence quantify effect heterogeneity instead. <code>hte_explainer()</code> calls <code>dr_pseudo_outcome()</code> automatically when <code>pseudo</code> is not supplied.</p>'
      },
      {
        id: "fit",
        heading: "2. Check estimation quality first",
        body:
          '<p>Explaining a poorly fitted CATE surface is meaningless. The first step is always to check how close the estimates are to the truth.</p>' +
          '<pre><code class="language-r">d &lt;- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)\nfit &lt;- metalearner("T", d$X, d$A, d$Y,\n                   learner_base = lrn("regr.ranger", num.trees = 300))\ntau_hat &lt;- fit$predict(d$X)\nc(ate_hat = mean(tau_hat), ate_true = d$ate,\n  cor = round(cor(tau_hat, d$tau), 3))</code></pre><pre><code class="r-out"> ate_hat ate_true      cor\n1.116643 1.002500 0.769000</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>Only out-of-sample correlation is trustworthy; in-sample values are systematically inflated. The 0.769 above is an in-sample figure used for demonstration only — formal comparisons should use an explicit split as in Tutorial 7.</p></div>'
      },
      {
        id: "explainer",
        heading: "3. Wrapping it as a DALEX explainer",
        body:
          '<pre><code class="language-r">ex &lt;- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\nlength(ex$pseudo)\nround(cor(ex$pseudo, d$tau), 3)</code></pre><pre><code class="r-out">[1] 600\n[1] 0.39</code></pre>' +
          '<p>The pseudo-outcome is an unbiased but high-variance individual-level estimate: its correlation with the true <code>tau</code> is only 0.39 above. That does not disqualify it as an explanation target, because <code>E[Y*|X] = tau(X)</code> is a property of the <strong>conditional expectation</strong> rather than of individual noise. For point-wise accuracy, consult the metalearner\'s CATE estimate instead.</p>'
      },
      {
        id: "surrogate",
        heading: "4. Surrogate model",
        body:
          '<p>When the CATE surface comes from a multi-stage, weighted, cross-fitted procedure whose structure resists direct reading, a single learner can refit it into an interpretable surrogate.</p>' +
          '<pre><code class="language-r">sur &lt;- hte_surrogate(d$X, tau_hat)\nsur$learner_id\nround(cor(sur$predict(d$X), tau_hat), 3)</code></pre><pre><code class="r-out">[1] "regr.ranger"\n[1] 0.937</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>The surrogate serves explanation and visualisation only; it should not replace the original metalearner for effect estimation, because compressing a multi-stage procedure into a single regression necessarily loses precision (the correlation of 0.937 above does not imply equivalence).</p></div>'
      },
      {
        id: "importance",
        heading: "5. Permutation importance",
        body:
          '<p>How much the loss against the pseudo-outcome rises after a covariate is randomly permuted. A larger rise means the model relies more on that variable to discriminate individual effects.</p>' +
          '<pre><code class="language-r">imp &lt;- hte_feature_importance(ex, B = 10, N = 600, seed = 1)\nimp</code></pre><pre><code class="r-out">  variable dropout_loss baseline    dropout dropout_pct\n2      lac     2.232817 1.657445 0.57537262   34.714435\n4    tumor     2.158512 1.657445 0.50106702   30.231294\n1      age     1.974394 1.657445 0.31694939   19.122771\n3      sex     1.746382 1.657445 0.08893715    5.365919</code></pre>' +
          '<pre><code class="language-r">p_imp &lt;- plot_hte_importance(imp)\nggplot2::ggsave("15_importance.png", p_imp, width = 7, height = 4, dpi = 150)</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>This explains the <strong>model</strong>, not a causal decomposition. High importance means only that the model relied on the variable; it does not establish that the variable truly modifies the treatment effect, which requires design-level evidence such as a stratified analysis under randomisation or a pre-specified interaction test.</p></div>'
      },
      {
        id: "pdp",
        heading: "6. Partial dependence and accumulated local effects",
        body:
          '<p>Fix a covariate at successive grid points while holding the others at their observed distribution, and record how the average predicted CATE changes. This answers directly how the effect varies with that variable.</p>' +
          '<pre><code class="language-r">pd &lt;- hte_pdp(ex, variables = "lac", grid_points = 40)\nutils::head(pd, 6)</code></pre><pre><code class="r-out">  variable           x      yhat    type\n1      lac -1.35582624 0.7757646 partial\n2      lac -0.08519213 0.3333775 partial\n3      lac  0.35384536 0.3611582 partial\n4      lac  0.67263365 0.2769214 partial\n5      lac  0.84518778 0.3285855 partial\n6      lac  0.99896256 0.1739816 partial</code></pre>' +
          '<pre><code class="language-r"># 协变量相关时 PDP 会在观测支撑集之外外推，ALE 更稳健\npd_ale &lt;- hte_pdp(ex, variables = "lac", grid_points = 40,\n                  type = "accumulated")\nutils::head(pd_ale, 3)</code></pre><pre><code class="r-out">  variable           x      yhat        type\n1      lac -1.35582624 0.9545599 accumulated\n2      lac -0.08519213 0.4735859 accumulated\n3      lac  0.35384536 0.4951885 accumulated</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p><code>hte_pdp()</code> defaults to <code>center = FALSE</code>, keeping the <strong>absolute</strong> average predicted CATE on the vertical axis. That matters here: a curve oscillating about zero conceals the effect level itself, and an average benefit of 1.2 is a very different clinical statement from one of 0.2. DALEX\'s <code>model_profile()</code> defaults to <code>center = TRUE</code>; this package overrides it explicitly.</p></div>'
      },
      {
        id: "shap",
        heading: "7. Kernel SHAP",
        body:
          '<p>SHAP decomposes each individual CATE into a baseline plus per-covariate contributions, giving both <strong>global importance</strong> (the spread of contributions) and <strong>local attribution</strong> (each variable\'s contribution for one individual). Partial dependence cannot provide this.</p>' +
          '<pre><code class="language-r">sv &lt;- hte_shap(ex, n_background = 100, seed = 1)\nutils::head(hte_shap_data(sv), 4)\nattr(hte_shap_data(sv), "baseline")</code></pre><pre><code class="r-out">  id variable    value       shap\n1  1      age 52.48255 -0.1364983\n2  2      age 62.20372 -0.5994672\n3  3      age 49.97246 -0.2239525\n4  4      age 79.14337 -0.1643312\n[1] 1.261608</code></pre>' +
          '<p>Additivity is a direct check on the implementation: <code>phi_0 + sum(phi_j)</code> must equal the model\'s prediction for that individual, with a residual at machine precision.</p>' +
          '<pre><code class="language-r">S &lt;- as.matrix(sv$S)\nmax(abs(as.numeric(sv$baseline) + rowSums(S) - tau_hat))</code></pre><pre><code class="r-out">[1] 4.440892e-16</code></pre>' +
          '<pre><code class="language-r">plot_hte_shap(sv, "beeswarm")\nplot_hte_shap(sv, "dependence", variable = "lac")\nplot_hte_shap(sv, "waterfall", variable = 1)</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>With a small number of covariates <em>p</em>, Kernel SHAP enumerates all <code>2^p</code> coalitions exactly; for larger <em>p</em>, kernelshap switches to a sampling approximation and results fluctuate slightly with <code>seed</code>. Fix the seed when reporting.</p></div>'
      },
      {
        id: "export",
        heading: "8. Separating plot from data",
        body:
          '<p>Every <code>plot_*</code> function returns a <strong>ggplot object</strong> that can be extended with <code>+</code> and exported with <code>ggsave()</code>; the underlying data is available separately for writing to disk. Keeping the two apart makes it straightforward to redraw figures to a journal\'s specification.</p>' +
          '<pre><code class="language-r">qd &lt;- hte_shap_data(sv)\nutils::write.csv(qd, "15_shap_values.csv", row.names = FALSE)\n\nggplot2::ggplot(qd, ggplot2::aes(x = value, y = shap)) +\n  ggplot2::geom_point(alpha = 0.5, colour = "#1B6CA8") +\n  ggplot2::geom_hline(yintercept = 0, linetype = 2, colour = "grey60") +\n  ggplot2::facet_wrap(~ variable, scales = "free_x") +\n  ggplot2::labs(x = "协变量取值", y = "SHAP 贡献",\n                title = "SHAP 依赖图（用导出数据自行绘制）") +\n  ggplot2::theme_minimal(base_size = 12)</code></pre>' +
          '<div class="table-wrap"><table><thead><tr><th>Plot function</th><th>Corresponding data function</th></tr></thead><tbody><tr><td><code>plot_hte_importance()</code></td><td><code>hte_feature_importance()</code></td></tr><tr><td><code>plot_hte_pdp()</code></td><td><code>hte_pdp()</code></td></tr><tr><td><code>plot_hte_shap()</code></td><td><code>hte_shap_data()</code></td></tr><tr><td><code>plot_hte_benchmark()</code></td><td><code>hte_benchmark_data()</code></td></tr><tr><td><code>plot_qini()</code></td><td><code>qini_curve()</code></td></tr><tr><td><code>mlr3HTE_dag()</code></td><td><code>mlr3HTE_dag_data()</code></td></tr></tbody></table></div>'
      },
      {
        id: "survival",
        heading: "9. Survival outcomes too",
        body:
          '<pre><code class="language-r">s &lt;- mlr3HTE_scenario("rct_lin", "survival", n = 400, seed = 1)\nfit_s &lt;- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0)\nex_s &lt;- hte_explainer(fit_s, s$X, s$A, s$Y, t0 = s$t0,\n                     effect = "survdiff", seed = 1)\nlength(ex_s$pseudo)\nex_s$t0\nhte_feature_importance(ex_s, B = 5, N = 400, seed = 1)</code></pre><pre><code class="r-out">[1] 400\n[1] 2\n  variable dropout_loss baseline      dropout dropout_pct\n4    tumor     1.183836 1.170557 1.327878e-02 1.134398187\n2      lac     1.181124 1.170557 1.056649e-02 0.902689305\n3      sex     1.172480 1.170557 1.922358e-03 0.164225871\n1      age     1.170578 1.170557 2.079801e-05 0.001776762</code></pre>' +
          '<div class="callout warn"><div class="callout-title">Notes</div><p>In the survival branch the pseudo-outcome is corrected for censoring by IPCW, and the effect scale is set by <code>effect</code> (<code>"survdiff"</code> or <code>"rmst"</code>). Changing the scale changes the units of the pseudo-outcome and may change the importance ranking, so the choice must be stated.</p></div>'
      },
      {
        id: "boundary",
        heading: "10. Limits",
        body:
          '<ol class="ref-list"><li>Interpretability tools explain the <strong>model</strong>, not the data-generating mechanism. If the model is wrong, an elegant explanation is still wrong.</li><li>Variable importance is not a causal conclusion. Establishing that a variable truly modifies the effect requires design-level evidence (stratified analysis under randomisation, a pre-specified interaction test) or a pre-specified estimand in a target trial emulation.</li><li>SHAP additivity is a mathematical identity; it does not license intervening on individual components.</li><li>Partial dependence extrapolates beyond the observed support; use ALE when covariates are correlated.</li></ol>'
      }
    ]
  }
};
