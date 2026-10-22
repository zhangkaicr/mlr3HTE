
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
