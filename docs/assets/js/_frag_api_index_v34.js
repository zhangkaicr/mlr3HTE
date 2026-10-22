
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
