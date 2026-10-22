# 给六个绘图函数的 API 文档页各加一个「实跑图形」小节（中英双语）。
# 图片均由 dev/_make_plot_figs.R 现场拟合后 ggsave 生成，参数写进图注。
import io

P = "docs/assets/js/content-api.js"
s = io.open(P, encoding="utf-8").read()


def fig_block(page_id, zh, en):
    """在 page_id 页的 zh / en 两个 sections 末尾各插一个 fig 小节。"""
    global s
    start = s.index("window.SITE_PAGES.%s = {" % page_id)
    end = s.index("\n};", start)
    block = s[start:end]
    marker = "\n    ]\n"
    parts = block.split(marker)
    if len(parts) != 3:                      # 前面 + zh 段 + en 段
        raise SystemExit("%s 的 sections 结构异常（split=%d）" % (page_id, len(parts)))

    def sec(heading, body_lines):
        out = ["      {", '        id: "fig",', '        heading: "%s",' % heading, "        body:"]
        out += ["          " + b for b in body_lines]
        out += ["      }"]
        return "\n".join(out)

    new_parts = [parts[0] + "\n" + sec(zh[0], zh[1]), parts[1] + "\n" + sec(en[0], en[1]), parts[2]]
    s = s[:start] + marker.join(new_parts) + s[end:]
    print("已插图:", page_id)


# 1 plot_hte_importance ----
fig_block("apiplotimportance",
    ("实跑图形",
     ["'<figure class=\"fig\"><img src=\"assets/img/explain/importance.png\" "
      "alt=\"置换重要性条形图\">' +",
      "'<figcaption>连续结局 RCT 基准数据（<code>rct_lin</code>，n = 2000）上，"
      "T-learner 配 <code>regr.ranger</code> 拟合后，以 <code>B = 5</code>、"
      "<code>N = 500</code>、种子 1 计算的置换重要性。<code>lac</code> 居首，"
      "与数据生成机制一致——该变量的效应修饰作用最强。</figcaption></figure>'"]),
    ("Figure from an actual run",
     ["'<figure class=\"fig\"><img src=\"assets/img/explain/importance.png\" "
      "alt=\"Bar chart of permutation importance\">' +",
      "'<figcaption>Permutation importance on the continuous RCT benchmark dataset "
      "(<code>rct_lin</code>, n = 2000): a T-learner with <code>regr.ranger</code>, "
      "computed with <code>B = 5</code>, <code>N = 500</code> and seed 1. "
      "<code>lac</code> ranks first, matching the data-generating process, where that "
      "covariate carries the strongest effect modification.</figcaption></figure>'"]))

# 2 plot_hte_pdp ----
fig_block("apiplotpdp",
    ("实跑图形",
     ["'<figure class=\"fig\"><img src=\"assets/img/explain/pdp.png\" "
      "alt=\"偏依赖曲线分面图\">' +",
      "'<figcaption>同上模型，<code>lac</code> 与 <code>age</code> 各取 41 个网格点。"
      "纵轴是绝对的平均预测 CATE（未中心化）——<code>age</code> 的曲线在 0.9–1.4 之间起伏，"
      "说明年龄改变的是效应大小而非方向。</figcaption></figure>'"]),
    ("Figure from an actual run",
     ["'<figure class=\"fig\"><img src=\"assets/img/explain/pdp.png\" "
      "alt=\"Faceted partial dependence curves\">' +",
      "'<figcaption>Same model, 41 grid points each for <code>lac</code> and "
      "<code>age</code>. The vertical axis is the absolute mean predicted CATE (not "
      "centred): the curve for <code>age</code> ranges over 0.9–1.4, so age changes the "
      "size of the effect rather than its direction.</figcaption></figure>'"]))

# 3 plot_hte_shap ----
fig_block("apiplotshap",
    ("实跑图形",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_beeswarm.png\" "
      "alt=\"SHAP 蜂群图\"><figcaption>蜂群图：每个点是一个个体，横坐标为 SHAP 值，"
      "颜色为变量取值。</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_dependence.png\" "
      "alt=\"SHAP 依赖图\"><figcaption>依赖图：<code>lac</code> 的取值与其 SHAP 贡献，"
      "斜率即效应修饰的局部强度。</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_waterfall.png\" "
      "alt=\"SHAP 瀑布图\"><figcaption>瀑布图：第 1 号个体的 CATE 如何从基线 "
      "E[f(x)] = 1.02 被逐项推到 0.338。</figcaption></figure>' +",
      "'</div>'"]),
    ("Figures from an actual run",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_beeswarm.png\" "
      "alt=\"SHAP beeswarm\"><figcaption>Beeswarm: one dot per individual, horizontal "
      "position is the SHAP value, colour is the covariate value.</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_dependence.png\" "
      "alt=\"SHAP dependence\"><figcaption>Dependence: the value of <code>lac</code> "
      "against its SHAP contribution; the slope is the local strength of effect "
      "modification.</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/explain/shap_waterfall.png\" "
      "alt=\"SHAP waterfall\"><figcaption>Waterfall: how the CATE of individual 1 is "
      "moved term by term from the baseline E[f(x)] = 1.02 to 0.338.</figcaption></figure>' +",
      "'</div>'"]))

# 4 plot_hte_benchmark ----
fig_block("apiplotbenchmark",
    ("实跑图形",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/benchmark/qini_curves.png\" "
      "alt=\"Qini 曲线对比\"><figcaption>三种 meta-learner 的 Qini 曲线，"
      "虚线为随机靶向参考线。</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/benchmark/toc_curves.png\" "
      "alt=\"TOC 曲线对比\"><figcaption>同一次基准测试的 TOC 曲线，"
      "水平线为总体 ATE。</figcaption></figure>' +",
      "'</div>'"]),
    ("Figures from an actual run",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/benchmark/qini_curves.png\" "
      "alt=\"Qini curve comparison\"><figcaption>Qini curves for three meta-learners; "
      "the dashed line is random targeting.</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/benchmark/toc_curves.png\" "
      "alt=\"TOC curve comparison\"><figcaption>TOC curves from the same benchmark run; "
      "the horizontal line is the overall ATE.</figcaption></figure>' +",
      "'</div>'"]))

# 5 plot_qini ----
fig_block("apiplotqini",
    ("实跑图形",
     ["'<figure class=\"fig\"><img src=\"assets/img/metrics/qini_curve.png\" "
      "alt=\"Qini 曲线\">' +",
      "'<figcaption>连续结局 RCT 基准数据（<code>rct_lin</code>）上 DR-learner 的 Qini "
      "曲线，虚线为随机靶向。曲线全程位于参考线上方，说明预测排序携带信息。</figcaption></figure>'"]),
    ("Figure from an actual run",
     ["'<figure class=\"fig\"><img src=\"assets/img/metrics/qini_curve.png\" "
      "alt=\"Qini curve\">' +",
      "'<figcaption>Qini curve of a DR-learner on the continuous RCT benchmark dataset "
      "(<code>rct_lin</code>); the dashed line is random targeting. The curve stays above "
      "the reference throughout, so the predicted ordering carries information."
      "</figcaption></figure>'"]))

# 6 mlr3HTE_dag ----
fig_block("apidag",
    ("实跑图形",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/dag/dag_rct_continuous.png\" "
      "alt=\"RCT 设计的 DAG\"><figcaption>RCT 设计：<code>A</code> 无父节点，"
      "不存在 <code>X → A</code> 这条打开后门的路径。</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/dag/dag_obs_continuous.png\" "
      "alt=\"观察性设计的 DAG\"><figcaption>观察性设计：<code>X → e → A</code> 与 "
      "<code>X → mu → Y</code> 同时存在，必须校正。</figcaption></figure>' +",
      "'</div>'"]),
    ("Figures from an actual run",
     ["'<div class=\"fig-grid\">' +",
      "'<figure class=\"fig\"><img src=\"assets/img/dag/dag_rct_continuous.png\" "
      "alt=\"DAG of the RCT design\"><figcaption>RCT design: <code>A</code> has no "
      "parent, so no <code>X → A</code> path opens a back door.</figcaption></figure>' +",
      "'<figure class=\"fig\"><img src=\"assets/img/dag/dag_obs_continuous.png\" "
      "alt=\"DAG of the observational design\"><figcaption>Observational design: both "
      "<code>X → e → A</code> and <code>X → mu → Y</code> are present and must be "
      "adjusted for.</figcaption></figure>' +",
      "'</div>'"]))

io.open(P, "w", encoding="utf-8", newline="\n").write(s)
print("六个绘图页均已嵌入实跑图形")
