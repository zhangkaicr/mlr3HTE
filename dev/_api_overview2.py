# 整块重写 SITE_PAGES.api（中文 + 英文），彻底避开字符串替换的脆弱匹配。
import io

P = "docs/assets/js/content-api.js"
lines = io.open(P, encoding="utf-8").read().split("\n")

start = next(i for i, l in enumerate(lines) if l.startswith("window.SITE_PAGES.api = {"))
end = next(i for i in range(start + 1, len(lines)) if lines[i] == "};")
print("替换区间: 第 %d – %d 行" % (start + 1, end + 1))

ZH = [
    ("apimetalearner",    "metalearner()",              "主拟合",     "拟合任意 metalearner，返回可重复预测的对象"),
    ("apis",              "s_learner()",                "便捷封装",   "S-learner 简写，直接返回 CATE 向量"),
    ("apit",              "t_learner()",                "便捷封装",   "T-learner 简写，两个模型相减"),
    ("apix",              "x_learner()",                "便捷封装",   "X-learner 简写，两阶段拟合"),
    ("apir",              "r_learner()",                "便捷封装",   "R-learner 简写，残差化后回归"),
    ("apidr",             "dr_learner()",               "便捷封装",   "DR-learner 简写，双重稳健伪结局"),
    ("apimltask",         "ml_task()",                  "Task 编码",  "把 X/A/Y 编码成 mlr3 Task，三类结局统一"),
    ("apilearner",        "LearnerRegrMetalearner",     "R6 Learner", '<code>lrn("regr.metalearner")</code>，接入 mlr3 工作流'),
    ("apicateci",         "cate_ci()",                  "辅助",       "CATE 的自助法置信区间（仅反映抽样波动）"),
    ("apiplotqini",       "plot_qini()",                "绘图",       "Qini 曲线，返回 ggplot 对象"),
    ("apidag",            "mlr3HTE_dag()",              "DAG",        "画 RCT / 观察性两种设计的因果结构图"),
    ("apidagdata",        "mlr3HTE_dag_data()",         "DAG",        "DAG 的节点表 / 边表 / 曲率路由结果"),
    ("apidemodata",       "mlr3HTE_demo_data()",        "演示数据",   "随机化 + 连续结局，带 tau / ate"),
    ("apidemobinary",     "mlr3HTE_demo_binary()",      "演示数据",   "随机化 + 二分类结局"),
    ("apidemoobs",        "mlr3HTE_demo_obs()",         "演示数据",   "观察性 + 连续结局，含真实 ps_true"),
    ("apidemoobsbinary",  "mlr3HTE_demo_obs_binary()",  "演示数据",   "观察性 + 二分类结局"),
    ("apidemoobssurv",    "mlr3HTE_demo_obs_surv()",    "演示数据",   "观察性 + 生存结局，混杂与删失并存"),
    ("apidemosurv",       "mlr3HTE_demo_surv()",        "演示数据",   "随机化 + 生存结局，只有删失"),
    ("apiqinicurve",      "qini_curve()",               "HTE 评价",   "Qini 曲线：累积增益随靶向比例的变化"),
    ("apiqinicoef",       "qini_coefficient()",         "HTE 评价",   "把 Qini 曲线压成一个数"),
    ("apicforbenefit",    "c_for_benefit()",            "HTE 评价",   "C 统计量：预测获益的配对一致性"),
    ("apitoccurve",       "toc_curve()",                "HTE 评价",   "顶部有序曲线，对照总体 ATE"),
    ("apidrpseudo",       "dr_pseudo_outcome()",        "观察性",     "一次拿到 propensity / mu1 / mu0 三件套，默认交叉拟合"),
    ("apihtebenchmark",   "hte_benchmark()",            "基准测试",   "RCT 上比较多个 learner，不依赖真实 tau"),
    ("apibenchdata",      "hte_benchmark_data()",       "基准测试",   "基准测试的曲线数据与参考线"),
    ("apiplotbenchmark",  "plot_hte_benchmark()",       "绘图",       "基准测试曲线分面对比，返回 ggplot"),
    ("apiscenarios",      "mlr3HTE_scenarios()",        "模拟数据",   "列出 10 个基准设计的结构标签"),
    ("apiscenario",       "mlr3HTE_scenario()",         "模拟数据",   "按场景 id 生成一份带真值的模拟数据"),
    ("apibench",          "mlr3HTE_bench()",            "模拟数据",   "取出随包发布的 30 份基准数据之一"),
    ("apibenchindex",     "mlr3HTE_bench_index()",      "模拟数据",   "打包数据中实际存在的键与真值 ATE"),
    ("apiexplainer",      "hte_explainer()",            "可解释性",   "把 CATE 模型包装为 DALEX 解释器（响应变量 = 伪结局）"),
    ("apisurrogate",      "hte_surrogate()",            "可解释性",   "用单一 mlr3 学习器重拟合 CATE 曲面得代理模型"),
    ("apiimportance",     "hte_feature_importance()",   "可解释性",   "置换法变量重要性（对伪结局的损失上升）"),
    ("apipdp",            "hte_pdp()",                  "可解释性",   "偏依赖 PDP 与累积局部效应 ALE"),
    ("apishap",           "hte_shap()",                 "可解释性",   "Kernel SHAP：个体 CATE 的变量分解"),
    ("apishapdata",       "hte_shap_data()",            "可解释性",   "把 shapviz 对象摊平为长表，便于导出自绘"),
    ("apiplotimportance", "plot_hte_importance()",      "绘图",       "重要性条形图，返回 ggplot"),
    ("apiplotpdp",        "plot_hte_pdp()",             "绘图",       "偏依赖曲线分面图，返回 ggplot"),
    ("apiplotshap",       "plot_hte_shap()",            "绘图",       "SHAP 四视图：重要性 / 蜂群 / 依赖 / 瀑布"),
    ("apilrn",            "lrn()",                      "再导出",     "从 mlr3 再导出，免额外加载"),
]

EN = [
    ("apimetalearner",    "metalearner()",              "Main entry",    "Fit any meta-learner and return a predictive object"),
    ("apis",              "s_learner()",                "Shortcut",      "S-learner shorthand, returns the CATE vector directly"),
    ("apit",              "t_learner()",                "Shortcut",      "T-learner shorthand, difference of two models"),
    ("apix",              "x_learner()",                "Shortcut",      "X-learner shorthand, two-stage imputation"),
    ("apir",              "r_learner()",                "Shortcut",      "R-learner shorthand, regression on residuals"),
    ("apidr",             "dr_learner()",               "Shortcut",      "DR-learner shorthand, doubly robust pseudo-outcome"),
    ("apimltask",         "ml_task()",                  "Task encoding", "Encode X/A/Y into an mlr3 Task, uniform across outcomes"),
    ("apilearner",        "LearnerRegrMetalearner",     "R6 Learner",    '<code>lrn("regr.metalearner")</code> for mlr3 workflows'),
    ("apicateci",         "cate_ci()",                  "Helper",        "Bootstrap confidence interval for CATE (sampling noise only)"),
    ("apiplotqini",       "plot_qini()",                "Plot",          "Qini curve, returns a ggplot object"),
    ("apidag",            "mlr3HTE_dag()",              "DAG",           "Causal diagram for the RCT and observational designs"),
    ("apidagdata",        "mlr3HTE_dag_data()",         "DAG",           "Node and edge tables plus curvature routing for the DAG"),
    ("apidemodata",       "mlr3HTE_demo_data()",        "Demo data",     "Randomised + continuous outcome, with tau / ate"),
    ("apidemobinary",     "mlr3HTE_demo_binary()",      "Demo data",     "Randomised + binary outcome"),
    ("apidemoobs",        "mlr3HTE_demo_obs()",         "Demo data",     "Observational + continuous outcome, with true ps_true"),
    ("apidemoobsbinary",  "mlr3HTE_demo_obs_binary()",  "Demo data",     "Observational + binary outcome"),
    ("apidemoobssurv",    "mlr3HTE_demo_obs_surv()",    "Demo data",     "Observational + survival, confounding and censoring"),
    ("apidemosurv",       "mlr3HTE_demo_surv()",        "Demo data",     "Randomised + survival outcome, censoring only"),
    ("apiqinicurve",      "qini_curve()",               "HTE metrics",   "Qini curve: cumulative gain against the targeted fraction"),
    ("apiqinicoef",       "qini_coefficient()",         "HTE metrics",   "Compresses the Qini curve into a single number"),
    ("apicforbenefit",    "c_for_benefit()",            "HTE metrics",   "C statistic: pairwise concordance of predicted benefit"),
    ("apitoccurve",       "toc_curve()",                "HTE metrics",   "Top-ordered curve against the overall ATE"),
    ("apidrpseudo",       "dr_pseudo_outcome()",        "Observational", "Propensity / mu1 / mu0 in one call, cross-fitted by default"),
    ("apihtebenchmark",   "hte_benchmark()",            "Benchmark",     "Compare learners on RCT data without a known tau"),
    ("apibenchdata",      "hte_benchmark_data()",       "Benchmark",     "Benchmark curve data together with the reference lines"),
    ("apiplotbenchmark",  "plot_hte_benchmark()",       "Plot",          "Faceted benchmark curves, returns a ggplot"),
    ("apiscenarios",      "mlr3HTE_scenarios()",        "Simulation",    "Structural labels of the ten benchmark designs"),
    ("apiscenario",       "mlr3HTE_scenario()",         "Simulation",    "Generate one simulated dataset with known ground truth"),
    ("apibench",          "mlr3HTE_bench()",            "Simulation",    "Fetch one of the thirty bundled benchmark datasets"),
    ("apibenchindex",     "mlr3HTE_bench_index()",      "Simulation",    "Keys present in the bundled data and their true ATE"),
    ("apiexplainer",      "hte_explainer()",            "Interpret",     "Wrap a CATE model as a DALEX explainer (response = pseudo-outcome)"),
    ("apisurrogate",      "hte_surrogate()",            "Interpret",     "Refit the CATE surface with one mlr3 learner as a surrogate"),
    ("apiimportance",     "hte_feature_importance()",   "Interpret",     "Permutation importance (loss rise against the pseudo-outcome)"),
    ("apipdp",            "hte_pdp()",                  "Interpret",     "Partial dependence (PDP) and accumulated local effects (ALE)"),
    ("apishap",           "hte_shap()",                 "Interpret",     "Kernel SHAP: decomposition of an individual CATE"),
    ("apishapdata",       "hte_shap_data()",            "Interpret",     "Flatten a shapviz object into a long table for export"),
    ("apiplotimportance", "plot_hte_importance()",      "Plot",          "Importance bar chart, returns a ggplot"),
    ("apiplotpdp",        "plot_hte_pdp()",             "Plot",          "Faceted partial dependence curves, returns a ggplot"),
    ("apiplotshap",       "plot_hte_shap()",            "Plot",          "Four SHAP views: importance / beeswarm / dependence / waterfall"),
    ("apilrn",            "lrn()",                      "Re-export",     "Re-exported from mlr3 so you need not load it"),
]

assert len(ZH) == 40 and len(EN) == 40

ZH_NOTE = ("全部 40 个导出对象均另有独立页面，示例代码与输出都是实跑结果。标注「绘图」的六个函数"
           "一律返回 ggplot 对象，可用 <code>+</code> 叠加图层、用 <code>ggsave()</code> 导出；"
           "其底层数据由对应的数据函数单独取出：<code>hte_feature_importance()</code>、"
           "<code>hte_pdp()</code>、<code>hte_shap_data()</code>、"
           "<code>hte_benchmark_data()</code>、<code>qini_curve()</code>、"
           "<code>mlr3HTE_dag_data()</code>。")

EN_NOTE = ("All forty exported objects have a dedicated page, and every example is an actual run. "
           "The six functions marked Plot return ggplot objects that accept further layers with "
           "<code>+</code> and export through <code>ggsave()</code>; their underlying data comes "
           "from the matching data function: <code>hte_feature_importance()</code>, "
           "<code>hte_pdp()</code>, <code>hte_shap_data()</code>, "
           "<code>hte_benchmark_data()</code>, <code>qini_curve()</code> and "
           "<code>mlr3HTE_dag_data()</code>.")

out = ["window.SITE_PAGES.api = {", ""]
for lang, rows, title, lede, hdr_fn, hdr_cat, hdr_desc, note in (
    ("zh", ZH, "函数文档",
     "mlr3HTE 共导出 40 个对象：1 个主拟合函数、5 个 meta-learner 便捷封装、1 个 Task 编码函数、"
     "1 个 R6 Learner 类、1 个 CATE 置信区间辅助、2 个 DAG 函数、6 个演示数据集生成器、"
     "4 个 HTE 评价指标、1 个观察性数据干扰参数估计器、3 个 RCT 基准测试函数、"
     "4 个基准模拟数据函数、6 个 CATE 可解释性函数、6 个绘图函数、1 个 mlr3 再导出。"
     "点函数名进入各自的详细说明页。",
     "函数", "类别", "一句话说明", ZH_NOTE),
    ("en", EN, "API Reference",
     "mlr3HTE exports 40 objects: one main fitting function, five meta-learner shortcuts, one "
     "Task-encoding helper, one R6 Learner class, one CATE confidence-interval helper, two DAG "
     "functions, six demo data generators, four HTE evaluation metrics, one nuisance-parameter "
     "estimator for observational data, three RCT benchmark functions, four benchmark simulation "
     "functions, six CATE interpretability functions, six plotting functions and one mlr3 "
     "re-export. Click a function name to open its dedicated page.",
     "Function", "Category", "One-line description", EN_NOTE),
):
    out.append("  /* ---------------- %s ---------------- */" % ("中文" if lang == "zh" else "English"))
    out.append("  %s: {" % lang)
    out.append('    title: "%s",' % title)
    # lede 手动折行，每行以 " + 收尾
    words, cur, chunks = lede.split(" "), "", []
    for w in words:
        if len(cur) + len(w) + 1 > 78:
            chunks.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    chunks.append(cur)
    if len(chunks) == 1:
        out.append('    lede: "%s",' % chunks[0])
    else:
        out.append('    lede: "%s " +' % chunks[0])
        for c in chunks[1:-1]:
            out.append('          "%s " +' % c)
        out.append('          "%s",' % chunks[-1])
    out.append("    sections: [")
    out.append("")
    out.append("      {")
    out.append('        id: "overview",')
    out.append('        heading: "%s",' % ("函数总览" if lang == "zh" else "Overview"))
    out.append("        body:")
    out.append("          '<div class=\"table-wrap\"><table>' +")
    out.append("          '<thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead>' +" % (hdr_fn, hdr_cat, hdr_desc))
    out.append("          '<tbody>' +")
    for page, fn, cat, desc in rows:
        out.append("          '<tr><td><a href=\"#/%s\"><code>%s</code></a></td><td>%s</td><td>%s</td></tr>' +"
                   % (page, fn, cat, desc))
    out.append("          '</tbody></table></div>' +")
    # 注脚按 78 列折行
    words, cur, chunks = note.split(" "), "", []
    for w in words:
        if len(cur) + len(w) + 1 > 74:
            chunks.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    chunks.append(cur)
    out.append("          '<p class=\"text-muted\">%s</p>'" % " ".join(chunks))
    out.append("      }")
    out.append("    ]")
    out.append("  },")
    out.append("")
out.append("};")

lines[start:end + 1] = out
io.open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("已整块重写 SITE_PAGES.api")
