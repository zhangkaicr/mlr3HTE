# -*- coding: utf-8 -*-
"""为 v0.34 新增的 15 个导出函数各生成一个独立文档页（中英双语）。

每页结构固定：
  lede       一句话说明用途
  fn         签名 + 参数表 + 实测示例 + 实测输出 + 使用要点

所有示例代码与输出都是 dev/_collect_explain.R 真跑出来的，没有手写数值。
生成结果为 JS 片段，追加到 content-api.js 末尾（后定义覆盖先定义）。
"""

import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets", "js", "_frag_api_v34.js")


def js(s):
    """把一段文本变成 JS 单引号字符串字面量的内容。"""
    return (s.replace("\\", "\\\\")
             .replace("\n", "\\n")
             .replace("'", "\\'"))


class Page:
    def __init__(self, pid, title_zh, title_en, lede_zh, lede_en):
        self.pid = pid
        self.tzh, self.ten = title_zh, title_en
        self.lzh, self.len = lede_zh, lede_en
        self.body_zh, self.body_en = [], []

    def add(self, zh, en):
        self.body_zh.append(zh)
        self.body_en.append(en)
        return self

    # 参数表
    def params(self, rows):
        """rows = [(name, zh, en), ...]"""
        for lang in ("zh", "en"):
            self._push(lang,
                       '<div class="table-wrap"><table><thead><tr><th>参数</th>'
                       '<th>说明</th></tr></thead><tbody>', prefix=False)
        for name, zh, en in rows:
            self.body_zh.append('<tr><td><code>%s</code></td><td>%s</td></tr>' % (name, zh))
            self.body_en.append('<tr><td><code>%s</code></td><td>%s</td></tr>' % (name, en))
        for lang in ("zh", "en"):
            self._push(lang, "</tbody></table></div>", prefix=False)
        return self

    def code(self, src, out=None):
        for lang in ("zh", "en"):
            self._push(lang,
                       '<pre><code class="language-r">%s</code></pre>'
                       % src.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
                       prefix=False)
        if out:
            for lang in ("zh", "en"):
                self._push(lang,
                           '<pre><code class="r-out">%s</code></pre>'
                           % out.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
                           prefix=False)
        return self

    def note(self, zh, en, kind="warn", title_zh="使用要点", title_en="Notes"):
        for lang, txt, title in (("zh", zh, title_zh), ("en", en, title_en)):
            self._push(lang,
                       '<div class="callout %s"><div class="callout-title">%s</div><p>%s</p></div>'
                       % (kind, title, txt), prefix=False)
        return self

    def _push(self, lang, html, prefix=True):
        (self.body_zh if lang == "zh" else self.body_en).append(html)

    def render(self):
        chunks = ["window.SITE_PAGES.%s = {" % self.pid]
        for lang, title, lede, body in (
                ("zh", self.tzh, self.lzh, self.body_zh),
                ("en", self.ten, self.len, self.body_en)):
            chunks.append("  %s: {" % lang)
            chunks.append('    title: "%s",' % title)
            chunks.append("    lede: '%s'," % js(lede))
            chunks.append("    sections: [")
            chunks.append("      {")
            chunks.append('        id: "fn",')
            chunks.append('        heading: "%s",' % title)
            chunks.append("        body:")
            parts = ["          '" + js(h) + "'" for h in body]
            chunks.append(" +\n".join(parts))
            chunks.append("      }")
            chunks.append("    ]")
            chunks.append("  }," if lang == "zh" else "  }")
        chunks.append("};")
        return "\n".join(chunks)


PAGES = []

# ---------------------------------------------------------------- 1 场景清单
p = Page("apiscenarios", "mlr3HTE_scenarios()", "mlr3HTE_scenarios()",
         "列出 10 个基准模拟设计的结构标签（研究设计 / 混杂形式 / HTE 形式 / 是否共用变量）。",
         "Lists the structural labels of the ten benchmark simulation designs "
         "(design, confounding form, HTE form, shared variable).")
p.add("<p>返回 data.frame，每行一个设计。四个维度相互独立，便于固定其余结构、"
      "只改变一个维度做对照。</p>",
      "<p>Returns a data.frame with one row per design. The four dimensions are "
      "independent, so one can be varied while the rest are held fixed.</p>")
p.code("mlr3HTE_scenarios()",
"""                          id design confounding       hte shared
1                    rct_lin    rct        none    linear  FALSE
2                 rct_nonlin    rct        none nonlinear  FALSE
3        obs_lin_lin_sharedF    obs      linear    linear  FALSE
4        obs_lin_lin_sharedT    obs      linear    linear   TRUE
5     obs_lin_nonlin_sharedF    obs      linear nonlinear  FALSE
6     obs_lin_nonlin_sharedT    obs      linear nonlinear   TRUE
7     obs_nonlin_lin_sharedF    obs   nonlinear    linear  FALSE
8     obs_nonlin_lin_sharedT    obs   nonlinear    linear   TRUE
9  obs_nonlin_nonlin_sharedF    obs   nonlinear nonlinear  FALSE
10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE""")
p.note("<code>shared = TRUE</code> 表示存在既进入处理分配模型、又进入真实 CATE 的协变量，"
       "即混杂因子兼效应修饰因子。这类变量在观察性研究中是偏差的主要来源。",
       "<code>shared = TRUE</code> indicates a covariate that enters both the treatment "
       "assignment model and the true CATE, i.e. a confounder that is also an effect "
       "modifier. Such variables dominate the bias in observational studies.")
PAGES.append(p)

# ---------------------------------------------------------------- 2 单场景
p = Page("apiscenario", "mlr3HTE_scenario()", "mlr3HTE_scenario()",
         "按场景 id 生成一份带真值的模拟数据，同一参数组合完全可复现。",
         "Generates one simulated dataset with known ground truth for a given scenario id; "
         "identical arguments reproduce identical data.")
p.params([
    ("id", "场景 id，取值见 <code>mlr3HTE_scenarios()</code>", "Scenario id, see <code>mlr3HTE_scenarios()</code>"),
    ("outcome", "<code>\"continuous\"</code> / <code>\"binary\"</code> / <code>\"survival\"</code>",
     "<code>\"continuous\"</code> / <code>\"binary\"</code> / <code>\"survival\"</code>"),
    ("n", "样本量，默认 2000", "Sample size, default 2000"),
    ("seed", "随机种子；缺省时按 id 与结局派生，保证可复现", "Seed; derived from id and outcome when omitted"),
    ("t0", "生存结局的效应评估时点，默认 2", "Evaluation time for survival outcomes, default 2"),
])
p.code('s <- mlr3HTE_scenario("obs_nonlin_nonlin_sharedT", "survival", n = 300, seed = 2)\n'
       'c(ate = s$ate, ate_rmst = s$ate_rmst)',
"""      ate  ate_rmst
0.1623314 0.2063841""")
p.note("真值 <code>tau</code> 的尺度随结局变化：连续结局为均值差，二分类为风险差，"
       "生存为 t0 时点生存概率差；生存结局另给 RMST 尺度的 <code>tau_rmst</code>。"
       "ATE 一律等于 <code>mean(tau)</code>。",
       "The scale of <code>tau</code> depends on the outcome: a mean difference for "
       "continuous outcomes, a risk difference for binary outcomes, and a difference in "
       "survival probability at t0 for survival outcomes, which additionally return "
       "<code>tau_rmst</code>. The ATE always equals <code>mean(tau)</code>.")
PAGES.append(p)

# ---------------------------------------------------------------- 3 打包数据
p = Page("apibench", "mlr3HTE_bench()", "mlr3HTE_bench()",
         "取出随包发布的基准数据（10 个设计 × 3 类结局，n = 2000，固定种子）。",
         "Returns the benchmark data shipped with the package "
         "(10 designs x 3 outcomes, n = 2000, fixed seeds).")
p.code('b <- mlr3HTE_bench("rct_lin", "continuous")\n'
       'list(n = nrow(b$X), ate = b$ate, all_ps_half = all(b$ps_true == 0.5))',
"""$n
[1] 2000

$ate
[1] 1

$all_ps_half
[1] TRUE""")
p.note("方法学比较应统一使用这一份数据，避免各自重新模拟导致结论不可比。"
       "若请求的组合不存在，会即时按同一生成器重算，结果一致但更慢。",
       "Method comparisons should use this single dataset so that conclusions remain "
       "comparable. If a requested combination is absent, it is recomputed from the same "
       "generator: identical results, but slower.")
PAGES.append(p)

# ---------------------------------------------------------------- 4 索引
p = Page("apibenchindex", "mlr3HTE_bench_index()", "mlr3HTE_bench_index()",
         "列出打包数据中实际存在的键、真值 ATE 与样本量，便于批量循环。",
         "Lists the keys present in the bundled data together with the true ATE and "
         "sample size, for batch iteration.")
p.code('idx <- mlr3HTE_bench_index()\n'
       'dim(idx)\n'
       'utils::head(idx, 4)',
"""dim: 30 5
                    key         id    outcome       ate    n
1    rct_lin.continuous    rct_lin continuous 1.0000000 2000
2        rct_lin.binary    rct_lin     binary 0.1288110 2000
3      rct_lin.survival    rct_lin   survival 0.1542625 2000
4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000""")
p.note("共 30 行（10 设计 × 3 结局）。键的格式为 <code>&lt;场景 id&gt;.&lt;结局&gt;</code>。",
       "Thirty rows in total (10 designs x 3 outcomes). Keys follow the pattern "
       "<code>&lt;scenario id&gt;.&lt;outcome&gt;</code>.")
PAGES.append(p)

# ---------------------------------------------------------------- 5 explainer
p = Page("apiexplainer", "hte_explainer()", "hte_explainer()",
         "把 CATE 模型包装为 DALEX 解释器；响应变量取双重稳健伪结局，而非原始 Y。",
         "Wraps a CATE model as a DALEX explainer whose response is the doubly robust "
         "pseudo-outcome rather than the raw outcome.")
p.params([
    ("fit", "<code>metalearner()</code> 的返回对象，或任何带 <code>$predict(newX)</code> 的对象",
     "A <code>metalearner()</code> fit, or any object with <code>$predict(newX)</code>"),
    ("X", "协变量 data.frame，解释所依据的样本", "Covariate data.frame used for explanation"),
    ("A / Y", "处理与结局；未提供 <code>pseudo</code> 时用于计算伪结局", "Treatment and outcome; used to compute the pseudo-outcome when <code>pseudo</code> is omitted"),
    ("pseudo", "已算好的逐人伪结局，可复用 <code>dr_pseudo_outcome()</code> 的结果", "Precomputed pseudo-outcome, e.g. from <code>dr_pseudo_outcome()</code>"),
    ("t0 / effect", "生存结局的评估时点与效应尺度", "Evaluation time and effect scale for survival outcomes"),
    ("label / verbose", "解释器显示名 / 是否打印 DALEX 进度", "Explainer label / whether to print DALEX progress"),
])
p.code('d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\n'
       'fit <- metalearner("T", d$X, d$A, d$Y,\n'
       '                   learner_base = lrn("regr.ranger", num.trees = 200))\n'
       'ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\n'
       'c(n = length(ex$pseudo), cor_pseudo_tau = round(cor(ex$pseudo, d$tau), 3))',
"""             n cor_pseudo_tau
       400.000          0.326""")
p.note("伪结局与真值 <code>tau</code> 的相关通常不高（上例 0.326）：它是逐人的"
       "无偏估计，方差很大，个别取值可能远离真值。这不影响它作为解释目标的"
       "资格——<code>E[Y*|X] = tau(X)</code> 是<strong>条件期望</strong>层面的性质，"
       "与单点噪声无关。若要逐点精度，应看 metalearner 的 CATE 估计，而非伪结局。",
       "The correlation between the pseudo-outcome and the true <code>tau</code> is "
       "usually modest (0.326 above): it is an unbiased but high-variance "
       "individual-level estimate. That does not disqualify it as an explanation "
       "target — <code>E[Y*|X] = tau(X)</code> is a property of the "
       "<strong>conditional expectation</strong>, not of individual noise. For "
       "point-wise accuracy, use the metalearner's CATE estimate instead.")
p.note("响应变量必须是伪结局。若直接用 <code>Y</code>，置换重要性与 PDP 衡量的将是"
       "「该变量对基线预后 <code>mu(X)</code> 的重要性」，与效应异质性无关。"
       "伪结局满足 <code>E[Y*|X] = tau(X)</code>，因此解释目标才是 CATE。",
       "The response must be the pseudo-outcome. With the raw <code>Y</code>, permutation "
       "importance and partial dependence measure how strongly a variable drives the "
       "baseline prognosis <code>mu(X)</code>, which is unrelated to effect heterogeneity. "
       "The pseudo-outcome satisfies <code>E[Y*|X] = tau(X)</code>, so the explanation "
       "target is the CATE itself.")
PAGES.append(p)

# ---------------------------------------------------------------- 6 surrogate
p = Page("apisurrogate", "hte_surrogate()", "hte_surrogate()",
         "用单一 mlr3 学习器重拟合 CATE 曲面，得到一个结构简单、可解释的代理模型。",
         "Refits the CATE surface with a single mlr3 learner to obtain a compact, "
         "interpretable surrogate model.")
p.code('d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 400, seed = 1)\n'
       'fit <- metalearner("T", d$X, d$A, d$Y, learner_base = lrn("regr.ranger", num.trees = 200))\n'
       'sur <- hte_surrogate(d$X, fit$predict(d$X))\n'
       'list(learner = sur$learner_id,\n'
       '     cor = round(cor(sur$predict(d$X), fit$predict(d$X)), 3))',
"""$learner
[1] "regr.ranger"

$cor
[1] 0.913""")
p.note("代理模型只用于解释与可视化，不应替代原 metalearner 做效应估计："
       "它把多阶段、带权重、带交叉拟合的过程压缩成单一回归，精度必然下降。",
       "The surrogate is intended for explanation and visualisation only and should not "
       "replace the original metalearner for effect estimation: it compresses a "
       "multi-stage, weighted, cross-fitted procedure into a single regression and "
       "necessarily loses precision.")
PAGES.append(p)

# ---------------------------------------------------------------- 7 importance
p = Page("apiimportance", "hte_feature_importance()", "hte_feature_importance()",
         "置换法变量重要性：打乱某个协变量后，模型相对伪结局的损失上升多少。",
         "Permutation importance: how much the loss against the pseudo-outcome increases "
         "when a covariate is permuted.")
p.add("<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>d</code> / "
      "<code>fit</code> / <code>ex</code> 三个对象。</p>",
      "<p>The example below reuses the <code>d</code> / <code>fit</code> / <code>ex</code> "
      "objects built on the <code>hte_explainer()</code> page.</p>")
p.params([
    ("explainer", "<code>hte_explainer()</code> 的结果", "An <code>hte_explainer()</code> result"),
    ("loss", "<code>\"rmse\"</code>（默认）/ <code>\"mse\"</code>，也可传函数", "<code>\"rmse\"</code> (default) / <code>\"mse\"</code>, or a function"),
    ("B", "置换次数，默认 10", "Number of permutations, default 10"),
    ("variables", "只评估部分变量", "Restrict to a subset of variables"),
    ("N", "用于计算损失的抽样行数", "Number of rows sampled for the loss"),
])
p.code('hte_feature_importance(ex, B = 5, N = 400, seed = 1)',
"""  variable dropout_loss baseline    dropout dropout_pct
2      lac     2.412783 1.876112 0.53667133   28.605513
4    tumor     2.272273 1.876112 0.39616112   21.116075
1      age     2.185380 1.876112 0.30926804   16.484523
3      sex     1.940157 1.876112 0.06404511    3.413716""")
p.note("这是对<strong>模型</strong>的解释，不是因果效应分解。重要性高只说明模型用到了该变量，"
       "不说明它真的修饰了治疗效果；判断后者需要设计层面的证据，例如随机化下的分层分析"
       "或预先设定的交互项检验。",
       "This explains the <strong>model</strong>, not a causal decomposition. High "
       "importance only means the model relied on the variable; it does not establish "
       "that the variable truly modifies the treatment effect. The latter requires "
       "design-level evidence, such as stratified analysis under randomisation or a "
       "pre-specified interaction test.")
PAGES.append(p)

# ---------------------------------------------------------------- 8 pdp
p = Page("apipdp", "hte_pdp()", "hte_pdp()",
         "偏依赖（PDP）与累积局部效应（ALE）：固定某个协变量，看平均预测 CATE 如何变化。",
         "Partial dependence (PDP) and accumulated local effects (ALE): how the average "
         "predicted CATE changes as one covariate is varied.")
p.add("<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>",
      "<p>The example below reuses the <code>ex</code> object built on the "
      "<code>hte_explainer()</code> page.</p>")
p.params([
    ("explainer", "<code>hte_explainer()</code> 的结果", "An <code>hte_explainer()</code> result"),
    ("variables", "要计算的变量名；缺省为全部协变量", "Variables to compute; all covariates by default"),
    ("grid_points", "网格点数，默认 101", "Number of grid points, default 101"),
    ("type", "<code>\"partial\"</code>（PDP）或 <code>\"accumulated\"</code>（ALE）",
     "<code>\"partial\"</code> (PDP) or <code>\"accumulated\"</code> (ALE)"),
    ("center", "是否减去平均预测值，默认 <code>FALSE</code>（保留绝对水平）",
     "Whether to subtract the mean prediction; <code>FALSE</code> by default, preserving the absolute level"),
])
p.code('utils::head(hte_pdp(ex, variables = "lac", grid_points = 20), 6)',
"""   variable          x        yhat    type
1       lac -1.1096583  0.25542452 partial
2       lac  0.3741624  0.17344583 partial
3       lac  0.8527465  0.15291082 partial
4       lac  1.1359194  0.12182969 partial
5       lac  1.3229172  0.03643026 partial
6       lac  1.5764892 -0.06165269 partial""")
p.note("变量间存在相关时，PDP 在观测支撑集之外做外推，可能给出不存在的组合；"
       "此时改用 <code>type = \"accumulated\"</code>（ALE）更稳健。",
       "When covariates are correlated, PDP extrapolates outside the observed support and "
       "may evaluate combinations that never occur. In that situation "
       "<code>type = \"accumulated\"</code> (ALE) is more robust.")
PAGES.append(p)

# ---------------------------------------------------------------- 9 shap
p = Page("apishap", "hte_shap()", "hte_shap()",
         "Kernel SHAP：把每个个体的 CATE 分解为基线值加各协变量的贡献，满足可加性。",
         "Kernel SHAP: decomposes each individual CATE into a baseline plus per-covariate "
         "contributions, satisfying additivity.")
p.add("<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>d</code> / "
      "<code>fit</code> / <code>ex</code> 三个对象。</p>",
      "<p>The example below reuses the <code>d</code> / <code>fit</code> / <code>ex</code> "
      "objects built on the <code>hte_explainer()</code> page.</p>")
p.params([
    ("object", "<code>hte_explainer()</code> 的结果，或带 <code>$predict</code> 的对象",
     "An <code>hte_explainer()</code> result, or an object with <code>$predict</code>"),
    ("X", "计算 SHAP 的样本；缺省用解释器里的 <code>X</code>", "Rows to explain; defaults to the explainer data"),
    ("bg_X", "背景数据，用于估计联盟的边际期望", "Background data for the coalition marginals"),
    ("n_background", "背景样本量，默认 100", "Background size, default 100"),
    ("seed / verbose", "抽背景集的种子 / 是否显示进度条", "Seed for background sampling / progress bar"),
])
p.code('sv <- hte_shap(ex, n_background = 50, seed = 1)\n'
       'S <- as.matrix(sv$S)\n'
       'max(abs(as.numeric(sv$baseline) + rowSums(S) - fit$predict(d$X)))',
"""baseline = 0.912867
max |baseline + rowSums(S) - predict| = 4.44e-16""")
p.note("协变量数 <em>p</em> 不大时 Kernel SHAP 走精确枚举（<code>2^p</code> 个联盟）；"
       "<em>p</em> 较大时 kernelshap 自动切换为采样近似，此时结果随 <code>seed</code> 有轻微波动。"
       "上式的可加性残差是检验实现是否正确的直接手段，应为机器精度量级。",
       "For a small number of covariates <em>p</em>, Kernel SHAP enumerates all "
       "<code>2^p</code> coalitions exactly; for larger <em>p</em>, kernelshap switches to "
       "a sampling approximation and results fluctuate slightly with <code>seed</code>. "
       "The additivity residual above is a direct check on the implementation and should "
       "be at machine precision.")
PAGES.append(p)

# ---------------------------------------------------------------- 10 shap data
p = Page("apishapdata", "hte_shap_data()", "hte_shap_data()",
         "把 shapviz 对象摊平为长表，便于导出 CSV 或自行用 ggplot2 重画。",
         "Flattens a shapviz object into a long table for CSV export or custom ggplot2 "
         "redrawing.")
p.add("<p>下例沿用 <code>hte_shap()</code> 页面建立的 <code>sv</code> 对象。</p>",
      "<p>The example below reuses the <code>sv</code> object built on the "
      "<code>hte_shap()</code> page.</p>")
p.code('utils::head(hte_shap_data(sv), 4)',
"""  id variable    value        shap
1  1      age 52.48255  0.16783351
2  2      age 62.20372  0.09710957
3  3      age 49.97246  0.21584552
4  4      age 79.14337 -0.09103024""")
p.note("基线值 <code>phi_0</code> 放在返回值的 <code>baseline</code> 属性里，"
       "每行只记录单个变量对单个样本的贡献。",
       "The baseline <code>phi_0</code> is stored in the <code>baseline</code> attribute; "
       "each row records one variable's contribution to one observation.")
PAGES.append(p)

# ---------------------------------------------------------------- 11-13 绘图
p = Page("apiplotimportance", "plot_hte_importance()", "plot_hte_importance()",
         "画置换重要性的条形图，返回 ggplot 对象。",
         "Draws a bar chart of permutation importance and returns a ggplot object.")
p.add("<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>",
      "<p>The example below reuses the <code>ex</code> object built on the "
      "<code>hte_explainer()</code> page.</p>")
p.code('imp <- hte_feature_importance(ex, B = 3, N = 300, seed = 1)\n'
       'p <- plot_hte_importance(imp)\n'
       'c(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))',
"""$classes
[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"

$is_ggplot
[1] TRUE""")
p.note("返回的是 ggplot 对象，可直接用 <code>+</code> 叠加主题与标度，或用 "
       "<code>ggsave()</code> 导出；绘图数据就是 <code>hte_feature_importance()</code> "
       "的返回值，可单独落盘。",
       "The returned ggplot object can be extended with <code>+</code> or exported with "
       "<code>ggsave()</code>. The underlying data is exactly the value returned by "
       "<code>hte_feature_importance()</code> and can be written to disk separately.")
PAGES.append(p)

p = Page("apiplotpdp", "plot_hte_pdp()", "plot_hte_pdp()",
         "画偏依赖曲线，按变量分面，返回 ggplot 对象。",
         "Draws partial dependence curves faceted by variable and returns a ggplot object.")
p.add("<p>下例沿用 <code>hte_explainer()</code> 页面建立的 <code>ex</code> 对象。</p>",
      "<p>The example below reuses the <code>ex</code> object built on the "
      "<code>hte_explainer()</code> page.</p>")
p.code('pd <- hte_pdp(ex, variables = "lac", grid_points = 20)\n'
       'p <- plot_hte_pdp(pd)\n'
       'c(classes = paste(class(p), collapse = "/"), is_ggplot = inherits(p, "ggplot"))',
"""$classes
[1] "ggplot2::ggplot/ggplot/ggplot2::gg/S7_object/gg"

$is_ggplot
[1] TRUE""")
p.note("<code>free_y</code> 默认 <code>TRUE</code>：不同变量的 CATE 量级可能相差数倍，"
       "共用纵轴会把次要变量压成一条平线。若要跨变量比较绝对幅度，设为 <code>FALSE</code>。",
       "<code>free_y</code> defaults to <code>TRUE</code> because the CATE magnitudes of "
       "different covariates can differ several-fold and a shared axis would flatten the "
       "minor ones. Set it to <code>FALSE</code> to compare absolute magnitudes across "
       "variables.")
PAGES.append(p)

p = Page("apiplotshap", "plot_hte_shap()", "plot_hte_shap()",
         "SHAP 的四种视图：重要性条形图、蜂群图、依赖图、单样本瀑布图，均返回 ggplot。",
         "Four SHAP views — importance bars, beeswarm, dependence and a single-observation "
         "waterfall — all returning ggplot objects.")
p.add("<p>下例沿用 <code>hte_shap()</code> 页面建立的 <code>sv</code> 对象。</p>",
      "<p>The example below reuses the <code>sv</code> object built on the "
      "<code>hte_shap()</code> page.</p>")
p.params([
    ("sv", "<code>hte_shap()</code> 返回的 shapviz 对象", "A shapviz object from <code>hte_shap()</code>"),
    ("kind", "<code>\"importance\"</code> / <code>\"beeswarm\"</code> / <code>\"dependence\"</code> / <code>\"waterfall\"</code>",
     "<code>\"importance\"</code> / <code>\"beeswarm\"</code> / <code>\"dependence\"</code> / <code>\"waterfall\"</code>"),
    ("variable", "<code>dependence</code> 传变量名，<code>waterfall</code> 传样本行号",
     "Variable name for <code>dependence</code>, row index for <code>waterfall</code>"),
    ("max_vars", "最多显示多少个变量，默认 8", "Maximum number of variables shown, default 8"),
])
p.code('c(imp = inherits(plot_hte_shap(sv, "importance"), "ggplot"),\n'
       '  dep = inherits(plot_hte_shap(sv, "dependence", variable = "lac"), "ggplot"),\n'
       '  wf  = inherits(plot_hte_shap(sv, "waterfall", variable = 1), "ggplot"))',
""" imp  dep   wf
TRUE TRUE TRUE""")
p.note("蜂群图同时给出三件事：变量的重要性（横轴跨度）、效应方向（正负）、"
       "以及取值高低与效应方向的关系（颜色梯度）。这是 PDP 无法提供的信息。",
       "The beeswarm plot conveys three things at once: importance (horizontal spread), "
       "direction of effect (sign), and how the covariate value relates to that direction "
       "(colour gradient). Partial dependence cannot provide this.")
PAGES.append(p)

# ---------------------------------------------------------------- 14 dag data
p = Page("apidagdata", "mlr3HTE_dag_data()", "mlr3HTE_dag_data()",
         "DAG 图的节点表与边表，含每条边的路由结果（曲率）。",
         "The node and edge tables behind the DAG plot, including the routing result "
         "(curvature) of every edge.")
p.code('dd <- mlr3HTE_dag_data("rct", "continuous")\n'
       'dd$edges[, c("from", "to", "type", "curve")]',
"""  from  to type curve
1    X tau base     0
2    X  mu base     0
3    A   Y base     0
4  tau   Y base     0
5   mu   Y base     0""")
p.note("任意两个节点之间只保留一条有向边。若某条边会从第三个节点身上穿过，"
       "自动加曲率绕行，<code>curve</code> 列即该边采用的曲率（0 表示直线）。"
       "绘图时按曲率分组，一层一个 <code>geom_curve</code>。",
       "At most one directed edge is kept between any pair of nodes. If an edge would "
       "pass through a third node, a curvature is added automatically and recorded in the "
       "<code>curve</code> column (0 means a straight line). The plot is then drawn with "
       "one <code>geom_curve</code> layer per curvature value.")
PAGES.append(p)

# ---------------------------------------------------------------- 15 bench data
p = Page("apibenchdata", "hte_benchmark_data()", "hte_benchmark_data()",
         "取出 hte_benchmark() 的曲线绘图数据，附各 learner 的参考线。",
         "Returns the curve data used by hte_benchmark() plots, with the reference line "
         "for each learner attached.")
p.code('# bm 见 hte_benchmark() 页面\n'
       'qd <- hte_benchmark_data(bm, "qini")\n'
       'print(head(qd[qd$learner == "T", c("learner", "fraction", "qini")], 3),\n'
       '      row.names = FALSE)\n'
       'print(attr(qd, "reference"), row.names = FALSE)',
""" learner fraction      qini
       T   0.0500 0.1272805
       T   0.0525 0.1669598
       T   0.0550 0.2083948
 learner intercept   slope
       S         0 0.68891
       T         0 0.68891""")
p.note("Qini 面板的参考线是从原点到该 learner <code>Q(1)</code> 的随机靶向线；"
       "TOC 面板的参考线是全样本 ATE 的水平线（<code>slope = 0</code>）。"
       "<code>min_fraction</code> 控制左端截断，避免单个观测把纵轴拉爆。",
       "In the Qini panel the reference is the random-targeting line from the origin to "
       "that learner's <code>Q(1)</code>; in the TOC panel it is the horizontal line at the "
       "overall ATE (<code>slope = 0</code>). <code>min_fraction</code> truncates the left "
       "tail so that a single observation cannot dominate the vertical axis.")
PAGES.append(p)


def main():
    out = ["\n/* ================= v0.34 新增函数文档（每函数一页） ================= */\n"]
    for pg in PAGES:
        out.append(pg.render())
        out.append("")
    io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(out))
    print("生成 %d 个页面 -> %s" % (len(PAGES), os.path.basename(OUT)))


if __name__ == "__main__":
    main()
