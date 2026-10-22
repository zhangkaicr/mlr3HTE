# -*- coding: utf-8 -*-
"""生成 v0.34 的文档站新增内容（全部中英双语）：

  1. SITE_NAV：教程新增两篇（基准模拟数据网格 / CATE 可解释性）；
     新增两个模块导航（模拟数据、可解释性），各带下拉子页。
  2. content-api.js：追加 apisim / apiexplain 两个模块索引页。
  3. content-tutorial.js：追加 tutorialbenchgrid / tutorialexplain 两篇教程。
  4. content-references.js：在"如何引用本包"之前插入 F、G 两节。

所有代码块与输出均取自 tutorial/code/16_*.R 与 15_*.R 的实跑结果，
不手写数值。
"""

import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "docs", "assets", "js")


def js(s):
    return (s.replace("\\", "\\\\")
             .replace("\n", "\\n")
             .replace("'", "\\'"))


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def code(src, out=None, out_label_zh="输出", out_label_en="Output"):
    html = '<pre><code class="language-r">%s</code></pre>' % esc(src)
    if out is not None:
        html += ('<pre><code class="r-out">%s</code></pre>' % esc(out))
    return {"zh": html, "en": html}


def para(zh, en):
    return {"zh": "<p>%s</p>" % zh, "en": "<p>%s</p>" % en}


def note(zh, en, kind="warn", tz="使用要点", te="Notes"):
    return {
        "zh": '<div class="callout %s"><div class="callout-title">%s</div><p>%s</p></div>' % (kind, tz, zh),
        "en": '<div class="callout %s"><div class="callout-title">%s</div><p>%s</p></div>' % (kind, te, en),
    }


def table(cols_zh, cols_en, rows):
    """rows: list of list-of-html-cells (shared markup) 或 (zh, en) 二元组"""
    def build(cols, cells):
        h = ['<div class="table-wrap"><table><thead><tr>']
        for c in cols:
            h.append("<th>%s</th>" % c)
        h.append("</tr></thead><tbody>")
        for r in cells:
            h.append("<tr>" + "".join("<td>%s</td>" % c for c in r) + "</tr>")
        h.append("</tbody></table></div>")
        return "".join(h)
    zr, er = [], []
    for r in rows:
        zr.append([c[0] if isinstance(c, tuple) else c for c in r])
        er.append([c[1] if isinstance(c, tuple) else c for c in r])
    return {"zh": build(cols_zh, zr), "en": build(cols_en, er)}


class Page:
    def __init__(self, pid, title_zh, title_en, lede_zh, lede_en):
        self.pid = pid
        self.title = {"zh": title_zh, "en": title_en}
        self.lede = {"zh": lede_zh, "en": lede_en}
        self.secs = []          # [(id, heading_zh, heading_en, [blocks])]

    def section(self, sid, hz, he, blocks):
        self.secs.append((sid, hz, he, blocks))
        return self

    def render(self):
        out = ["window.SITE_PAGES.%s = {" % self.pid]
        for i, lang in enumerate(("zh", "en")):
            out.append("  %s: {" % lang)
            out.append('    title: "%s",' % self.title[lang])
            out.append("    lede: '%s'," % js(self.lede[lang]))
            out.append("    sections: [")
            for j, (sid, hz, he, blocks) in enumerate(self.secs):
                out.append("      {")
                out.append('        id: "%s",' % sid)
                out.append('        heading: "%s",' % (hz if lang == "zh" else he))
                parts = ["          '" + js(b[lang]) + "'" for b in blocks]
                out.append("        body:\n" + " +\n".join(parts))
                out.append("      }" + ("," if j < len(self.secs) - 1 else ""))
            out.append("    ]")
            out.append("  }" + ("," if lang == "zh" else ""))
        out.append("};")
        return "\n".join(out)


def write_fragment(name, pages, target):
    frag = "\n/* ================= v0.34 新增内容 ================= */\n\n"
    frag += "\n\n".join(p.render() for p in pages)
    io.open(os.path.join(JS, name), "w", encoding="utf-8", newline="\n").write(frag + "\n")
    p = os.path.join(JS, target)
    s = io.open(p, encoding="utf-8").read()
    marker = "window.SITE_PAGES.%s" % pages[0].pid
    if marker in s:
        print("跳过（已存在）：%s -> %s" % (name, target))
        return
    if not s.endswith("\n"):
        s += "\n"
    io.open(p, "w", encoding="utf-8", newline="\n").write(s + "\n" + frag)
    print("已追加 %d 页 -> %s" % (len(pages), target))


# =========================================================== 1 教程：基准模拟数据
p = Page(
    "tutorialbenchgrid",
    "7 基准模拟数据网格",
    "7 Benchmark simulation grid",
    "10 个设计 × 3 类结局 = 30 份固定数据，真值齐备；四个结构维度相互独立，"
    "可固定其余、只改一个来做方法学对照。",
    "Ten designs by three outcomes give thirty fixed datasets with complete ground truth; "
    "the four structural dimensions are independent, so any one can be varied while the "
    "others are held fixed.")

p.section("why", "为什么要把数据固定下来", "Why the data must be fixed", [
    para("方法学比较只有在同一份数据上才可比。若每次分析各自重新模拟，两个 learner "
         "之间的差距里就混进了随机抽样噪声，同一段代码换一台机器可能给出相反的结论。"
         "因此本包把 <code>mlr3HTE_scenario()</code> 按 10 个设计 × 3 类结局预生成完毕，"
         "以 <code>n = 2000</code>、固定种子打包在 "
         "<code>data/mlr3hte_bench_data.rda</code> 中随包发布，"
         "用 <code>mlr3HTE_bench()</code> 取用。",
         "Method comparisons are only comparable on the same data. If each analysis "
         "simulates afresh, the gap between two learners is contaminated by sampling "
         "noise and the same code can rank them differently on another machine. This "
         "package therefore pre-generates <code>mlr3HTE_scenario()</code> over 10 designs "
         "x 3 outcomes at <code>n = 2000</code> with fixed seeds, ships the result in "
         "<code>data/mlr3hte_bench_data.rda</code>, and exposes it via "
         "<code>mlr3HTE_bench()</code>."),
    note("需要真值以外的结构（更大的样本量、不同的效应强度、新的混杂形式）时，"
         "用 <code>mlr3HTE_scenario()</code> 按同一生成器扩展，并在报告中写明参数；"
         "不要直接改打包数据。",
         "When a structure beyond the shipped grid is needed (larger n, different effect "
         "strength, a new confounding form), extend it with "
         "<code>mlr3HTE_scenario()</code> and report the arguments; do not modify the "
         "bundled data."),
])

p.section("grid", "四个结构维度", "Four structural dimensions", [
    para("四个维度相互独立，取值如下。",
         "The four dimensions are independent. Their levels are as follows."),
    table(
        ["维度", "取值", "含义"],
        ["Dimension", "Levels", "Meaning"],
        [
            ["研究设计", "<code>rct</code> / <code>obs</code>",
             "随机化（无混杂）/ 观察性（存在混杂）"],
            ["混杂形式", "<code>none</code> / <code>linear</code> / <code>nonlinear</code>",
             "处理分配模型对协变量的函数形式"],
            ["效应异质性形式", "<code>linear</code> / <code>nonlinear</code>",
             "真实 CATE 对协变量的函数形式（后者含 <code>sin</code> 与二次项）"],
            ["共用变量", "<code>TRUE</code> / <code>FALSE</code>",
             "是否存在既进入处理分配模型、又进入真实 CATE 的协变量"],
        ]),
    code("mlr3HTE_scenarios()",
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
10 obs_nonlin_nonlin_sharedT    obs   nonlinear nonlinear   TRUE"""),
    note("<code>shared = TRUE</code> 是四种维度里最容易被忽略、却对结论影响最大的一个。"
         "它对应现实里最常见也最棘手的结构：<strong>同一个变量既是混杂因子、又是效应修饰因子</strong>"
         "——例如疾病严重度既影响医生是否用药，又决定患者能从药里获益多少。"
         "此时校正该变量与估计效应修饰用的是同一批信息，任何一步出错都会被放大。",
         "<code>shared = TRUE</code> is the dimension most easily overlooked and yet the "
         "most consequential. It encodes the structure that is both common and awkward in "
         "practice: <strong>the same variable is a confounder and an effect modifier</strong> "
         "— disease severity, for instance, drives the prescribing decision and also "
         "determines how much a patient benefits. Correcting for it and estimating "
         "modification then draw on the same information, so any error is amplified."),
])

p.section("access", "取用与索引", "Access and index", [
    code('idx <- mlr3HTE_bench_index()\n'
         'dim(idx)\n'
         'utils::head(idx, 6)',
"""[1] 30  5
                    key         id    outcome       ate    n
1    rct_lin.continuous    rct_lin continuous 1.0000000 2000
2        rct_lin.binary    rct_lin     binary 0.1288110 2000
3      rct_lin.survival    rct_lin   survival 0.1542625 2000
4 rct_nonlin.continuous rct_nonlin continuous 0.9939152 2000
5     rct_nonlin.binary rct_nonlin     binary 0.1367614 2000
6   rct_nonlin.survival rct_nonlin   survival 0.1573606 2000"""),
    code('b <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\n'
         'names(b)\n'
         'c(n = nrow(b$X), ate = b$ate,\n'
         '  cor_tau_lac = round(cor(b$tau, b$X$lac), 3),\n'
         '  ps_range = paste(round(range(b$ps_true), 3), collapse = " - "))',
""" [1] "X"        "A"        "Y"        "tau"      "ate"      "ps_true"
 [7] "t0"       "meta"     "tau_rmst" "ate_rmst"
                 n                ate        cor_tau_lac           ps_range
            "2000" "0.98512652714735"            "0.633"     "0.01 - 0.841" """),
    para("每份数据都带 <code>tau</code>（逐人真实 CATE）、<code>ate</code>、"
         "<code>ps_true</code>（真实倾向得分）与 <code>meta</code>（结构标签与生成参数）；"
         "生存结局额外提供 <code>tau_rmst</code> 与 <code>ate_rmst</code>。",
         "Every dataset carries <code>tau</code> (true individual CATE), "
         "<code>ate</code>, <code>ps_true</code> (true propensity score) and "
         "<code>meta</code> (structural labels and generation arguments); survival "
         "outcomes additionally provide <code>tau_rmst</code> and <code>ate_rmst</code>."),
])

p.section("confounding", "混杂强度的量化标尺", "Quantifying the strength of confounding", [
    para("判断某个方法是否真的校正了混杂，需要一把标尺。在没有未测混杂的前提下，"
         "<strong>未调整差值与真值 ATE 之差</strong>就是该份数据上混杂偏差的规模："
         "方法跑完之后，估计值与真值的距离应当显著小于它。",
         "Assessing whether a method truly removed confounding requires a yardstick. "
         "Absent unmeasured confounding, the <strong>difference between the unadjusted "
         "contrast and the true ATE</strong> is the size of the confounding bias in that "
         "dataset: after adjustment, the distance between the estimate and the truth "
         "should be substantially smaller."),
    code('naive <- function(b) mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])\n'
         'grid_ids <- c("rct_lin", "rct_nonlin",\n'
         '              "obs_lin_lin_sharedF", "obs_lin_lin_sharedT",\n'
         '              "obs_nonlin_lin_sharedF", "obs_nonlin_lin_sharedT")\n'
         'bias_tab <- do.call(rbind, lapply(grid_ids, function(id) {\n'
         '  bb <- mlr3HTE_bench(id, "continuous")\n'
         '  data.frame(id = id, ate_true = bb$ate, naive = naive(bb),\n'
         '             bias = naive(bb) - bb$ate)\n'
         '}))\n'
         'bias_tab',
"""                      id  ate_true     naive        bias
1                rct_lin 1.0000000 0.9873591 -0.01264090
2             rct_nonlin 0.9939152 1.0305439  0.03662868
3    obs_lin_lin_sharedF 1.0000000 1.0925908  0.09259077
4    obs_lin_lin_sharedT 1.0000000 1.6061261  0.60612614
5 obs_nonlin_lin_sharedF 1.0000000 1.2359830  0.23598304
6 obs_nonlin_lin_sharedT 1.0000000 1.4690571  0.46905707"""),
    para("三个层次很清楚：随机化设计的偏差在 ±0.04 以内（纯抽样波动）；"
         "观察性设计在 0.09–0.24 之间；而一旦存在共用变量，偏差放大到 0.47–0.61，"
         "是真值的一半以上。后续任何方法学比较都应按这一梯度分层报告，"
         "而不是把 30 份数据混成一个平均指标。",
         "Three tiers are evident: randomised designs stay within ±0.04 (pure sampling "
         "variation); observational designs fall between 0.09 and 0.24; and once a shared "
         "variable is present the bias rises to 0.47–0.61, more than half the true effect. "
         "Subsequent comparisons should report results stratified along this gradient "
         "rather than averaging all thirty datasets into a single number."),
    note("这里的“未调整差值”只是偏差标尺，不是估计量。真值 ATE 只有模拟数据才有，"
         "现实研究里这把尺子不存在——这正是为什么观察性分析必须事先把混杂结构写清楚，"
         "而不是指望事后用指标判断。",
         "The unadjusted contrast here is a bias yardstick, not an estimator. The true ATE "
         "exists only in simulation, so this yardstick has no counterpart in real studies "
         "— which is precisely why observational analyses must specify the confounding "
         "structure in advance instead of hoping a metric will reveal it afterwards."),
])

p.section("hte-form", "线性与非线性 HTE 的可估性", "Estimability under linear and nonlinear HTE", [
    para("固定“观察性 + 非线性混杂 + 共用变量”，只改 HTE 形式，"
         "比较 T-Learner 配线性模型与随机森林时的 CATE 相关性。",
         "Holding the design at \"observational + nonlinear confounding + shared variable\" "
         "and varying only the HTE form, the correlation between the estimated and true "
         "CATE is compared for a T-Learner with a linear model against one with a random "
         "forest."),
    code('# CATE 相关必须在留出集上算：t_learner() 返回的是训练集 CATE，\n'
         '# 柔性学习器会记住训练噪声，回代自己必然虚高。\n'
         'bb <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "continuous")\n'
         'tr <- sample(seq_len(nrow(bb$X)), size = floor(0.7 * nrow(bb$X)))\n'
         'te <- setdiff(seq_len(nrow(bb$X)), tr)\n'
         'f <- metalearner("T", bb$X[tr, ], bb$A[tr], bb$Y[tr],\n'
         '                 learner_base = lrn("regr.ranger", num.trees = 300))\n'
         'cor(f$predict(bb$X[te, ]), bb$tau[te])',
"""        hte     learner   cor
1    linear     regr.lm 0.994
2    linear regr.ranger 0.894
3 nonlinear     regr.lm 0.564
4 nonlinear regr.ranger 0.819"""),
    para("结果与理论一致：真实 CATE 为线性时，线性模型的留出相关为 0.994，"
         "高于随机森林的 0.894；真实 CATE 含 <code>sin</code> 与二次项时，"
         "线性模型降到 0.564，随机森林为 0.819。这说明"
         "<strong>基学习器的函数形式必须覆盖真实 CATE 的形式</strong>，"
         "否则再多的样本量也补不回来——这是偏差，不是方差。",
         "The pattern matches theory: with a linear true CATE the linear model attains a "
         "held-out correlation of 0.994 against 0.894 for the random forest; when the true "
         "CATE contains a <code>sin</code> term and a quadratic term, the linear model "
         "drops to 0.564 while the forest reaches 0.819. The implication is that the "
         "<strong>base learner's function class must cover the true CATE</strong>; more "
         "data will not repair the gap, because this is bias rather than variance."),
])

p.section("survival", "生存结局的两种效应标尺", "Two effect scales for survival outcomes", [
    code('s <- mlr3HTE_bench("obs_nonlin_nonlin_sharedT", "survival")\n'
         'c(ate_survdiff = s$ate, ate_rmst = s$ate_rmst, t0 = s$t0)',
"""ate_survdiff     ate_rmst           t0
   0.1590526    0.2011652    2.0000000"""),
    para("生存结局同时给出 <code>t0</code> 时点生存概率差与 RMST 差两套真值，"
         "二者量纲不同、数值也不同（上例 0.159 与 0.201），报告时必须写明用的是哪一种。"
         "RMST 差不依赖比例风险假设，在风险曲线交叉时更稳健。",
         "Survival outcomes provide ground truth on two scales — the difference in "
         "survival probability at <code>t0</code> and the RMST difference — with different "
         "units and different values (0.159 versus 0.201 above), so reports must state "
         "which one is used. The RMST difference does not rely on the proportional hazards "
         "assumption and is more robust when hazard curves cross."),
])

p.section("convention", "使用约定", "Conventions", [
    {"zh": '<ol class="ref-list">' +
           '<li>方法学比较统一使用 <code>mlr3HTE_bench()</code>，不要在论文或报告里各自重新模拟。</li>' +
           '<li>结果按研究设计、混杂形式、HTE 形式、共用变量四个维度分层报告，不做跨维度平均。</li>' +
           '<li>报告 CATE 精度时注明是在留出集还是训练集上算的；两者不可比。</li>' +
           '<li>生存结局必须写明效应标尺（<code>survdiff</code> 还是 <code>rmst</code>）与 '
           '<code>t0</code>。</li>' +
           '</ol>',
     "en": '<ol class="ref-list">' +
           '<li>Use <code>mlr3HTE_bench()</code> for all method comparisons; do not '
           're-simulate separately in a paper or report.</li>' +
           '<li>Report results stratified by design, confounding form, HTE form and shared '
           'variable; do not average across those dimensions.</li>' +
           '<li>When reporting CATE accuracy, state whether it was computed out-of-sample '
           'or in-sample; the two are not comparable.</li>' +
           '<li>For survival outcomes, always state the effect scale '
           '(<code>survdiff</code> or <code>rmst</code>) and <code>t0</code>.</li>' +
           '</ol>'},
])

TUT_PAGES = [p]

# =========================================================== 2 教程：CATE 可解释性
p = Page(
    "tutorialexplain",
    "8 CATE 模型可解释性",
    "8 Interpreting the CATE model",
    "把估计出的 CATE 曲面当成一个模型来解释：哪些变量驱动了效应异质性、效应随某变量如何变化、"
    "单个个体的效应由哪些变量推高或拉低。解释对象是双重稳健伪结局，不是原始结局。",
    "Treat the estimated CATE surface as a model to be explained: which variables drive "
    "effect heterogeneity, how the effect varies with a covariate, and which variables push "
    "an individual's effect up or down. The object of explanation is the doubly robust "
    "pseudo-outcome, not the raw outcome.")

p.section("target", "一、解释对象必须是伪结局", "1. The object of explanation", [
    para("可解释性工具衡量的是<strong>响应变量</strong>与模型预测之间的关系。"
         "若直接把原始结局 <code>Y</code> 当作响应变量，置换重要性与偏依赖衡量的是"
         "该变量对基线预后 <code>mu(X)</code> 的贡献——一个强预后因子即使完全不修饰疗效，"
         "也会排在重要性榜首。这与“谁更获益”是两件事。",
         "Interpretability tools measure the relationship between the "
         "<strong>response</strong> and the model's predictions. With the raw outcome "
         "<code>Y</code> as the response, permutation importance and partial dependence "
         "measure a variable's contribution to the baseline prognosis <code>mu(X)</code>: "
         "a strong prognostic factor tops the ranking even when it does not modify the "
         "effect at all. That is a different question from who benefits more."),
    para("双重稳健伪结局 <code>Y*</code> 满足 <code>E[Y*|X] = tau(X)</code>，"
         "其条件期望就是 CATE。因此把 <code>Y*</code> 作为响应变量，"
         "置换重要性与偏依赖衡量的才是效应异质性。本包的 "
         "<code>hte_explainer()</code> 在未显式传入 <code>pseudo</code> 时，"
         "会自动调用 <code>dr_pseudo_outcome()</code> 计算它。",
         "The doubly robust pseudo-outcome <code>Y*</code> satisfies "
         "<code>E[Y*|X] = tau(X)</code>, so its conditional expectation is the CATE. Using "
         "<code>Y*</code> as the response makes permutation importance and partial "
         "dependence quantify effect heterogeneity instead. "
         "<code>hte_explainer()</code> calls <code>dr_pseudo_outcome()</code> "
         "automatically when <code>pseudo</code> is not supplied."),
])

p.section("fit", "二、先确认估计质量", "2. Check estimation quality first", [
    para("解释一个拟合失败的 CATE 曲面没有任何意义。第一步永远是看估计值与真值的距离。",
         "Explaining a poorly fitted CATE surface is meaningless. The first step is always "
         "to check how close the estimates are to the truth."),
    code('d <- mlr3HTE_scenario("rct_nonlin", "continuous", n = 600, seed = 1)\n'
         'fit <- metalearner("T", d$X, d$A, d$Y,\n'
         '                   learner_base = lrn("regr.ranger", num.trees = 300))\n'
         'tau_hat <- fit$predict(d$X)\n'
         'c(ate_hat = mean(tau_hat), ate_true = d$ate,\n'
         '  cor = round(cor(tau_hat, d$tau), 3))',
""" ate_hat ate_true      cor
1.116643 1.002500 0.769000"""),
    note("留出集上的相关才是可信指标；训练集回代会系统性虚高。上面的 0.769 是"
         "训练集相关，只用于演示，正式比较请按教程 7 的做法做显式划分。",
         "Only out-of-sample correlation is trustworthy; in-sample values are "
         "systematically inflated. The 0.769 above is an in-sample figure used for "
         "demonstration only — formal comparisons should use an explicit split as in "
         "Tutorial 7."),
])

p.section("explainer", "三、包装为 DALEX 解释器", "3. Wrapping it as a DALEX explainer", [
    code('ex <- hte_explainer(fit, d$X, d$A, d$Y, seed = 1)\n'
         'length(ex$pseudo)\n'
         'round(cor(ex$pseudo, d$tau), 3)',
"""[1] 600
[1] 0.39"""),
    para("伪结局是逐人的无偏估计，方差很大：上例中它与真值 <code>tau</code> 的相关只有 0.39。"
         "这不影响它作为解释目标的资格——<code>E[Y*|X] = tau(X)</code> 是"
         "<strong>条件期望</strong>层面的性质，与单点噪声无关。"
         "若需要逐点精度，应当看 metalearner 的 CATE 估计而非伪结局。",
         "The pseudo-outcome is an unbiased but high-variance individual-level estimate: "
         "its correlation with the true <code>tau</code> is only 0.39 above. That does not "
         "disqualify it as an explanation target, because "
         "<code>E[Y*|X] = tau(X)</code> is a property of the "
         "<strong>conditional expectation</strong> rather than of individual noise. For "
         "point-wise accuracy, consult the metalearner's CATE estimate instead."),
])

p.section("surrogate", "四、代理模型", "4. Surrogate model", [
    para("若原始 CATE 曲面由多阶段、带权重、带交叉拟合的过程得到，结构复杂难以直接解读，"
         "可以用单一学习器把它重拟合一遍，得到一个可解释的代理模型。",
         "When the CATE surface comes from a multi-stage, weighted, cross-fitted procedure "
         "whose structure resists direct reading, a single learner can refit it into an "
         "interpretable surrogate."),
    code('sur <- hte_surrogate(d$X, tau_hat)\n'
         'sur$learner_id\n'
         'round(cor(sur$predict(d$X), tau_hat), 3)',
"""[1] "regr.ranger"
[1] 0.937"""),
    note("代理模型只用于解释与可视化，不应替代原 metalearner 做效应估计："
         "它把多阶段过程压缩成单一回归，精度必然下降（上例与原模型相关 0.937，"
         "不等于与原模型等价）。",
         "The surrogate serves explanation and visualisation only; it should not replace "
         "the original metalearner for effect estimation, because compressing a multi-stage "
         "procedure into a single regression necessarily loses precision (the correlation "
         "of 0.937 above does not imply equivalence)."),
])

p.section("importance", "五、置换重要性", "5. Permutation importance", [
    para("把某个协变量随机打乱后，模型相对伪结局的损失上升多少。上升越多，"
         "说明模型越依赖该变量来区分个体效应。",
         "How much the loss against the pseudo-outcome rises after a covariate is randomly "
         "permuted. A larger rise means the model relies more on that variable to "
         "discriminate individual effects."),
    code('imp <- hte_feature_importance(ex, B = 10, N = 600, seed = 1)\n'
         'imp',
"""  variable dropout_loss baseline    dropout dropout_pct
2      lac     2.232817 1.657445 0.57537262   34.714435
4    tumor     2.158512 1.657445 0.50106702   30.231294
1      age     1.974394 1.657445 0.31694939   19.122771
3      sex     1.746382 1.657445 0.08893715    5.365919"""),
    code('p_imp <- plot_hte_importance(imp)\n'
         'ggplot2::ggsave("15_importance.png", p_imp, width = 7, height = 4, dpi = 150)'),
    note("这是对<strong>模型</strong>的解释，不是因果效应分解。重要性高只说明模型用到了该变量，"
         "不说明该变量真的修饰了治疗效果；判断后者需要设计层面的证据，"
         "例如随机化下的分层分析或预先设定的交互项检验。",
         "This explains the <strong>model</strong>, not a causal decomposition. High "
         "importance means only that the model relied on the variable; it does not "
         "establish that the variable truly modifies the treatment effect, which requires "
         "design-level evidence such as a stratified analysis under randomisation or a "
         "pre-specified interaction test."),
])

p.section("pdp", "六、偏依赖与累积局部效应", "6. Partial dependence and accumulated local effects", [
    para("把某个协变量固定在网格上逐点变动、其余变量保持观测分布，看平均预测 CATE 如何变化。"
         "这是回答“效应随这个变量怎么变”的直接手段。",
         "Fix a covariate at successive grid points while holding the others at their "
         "observed distribution, and record how the average predicted CATE changes. This "
         "answers directly how the effect varies with that variable."),
    code('pd <- hte_pdp(ex, variables = "lac", grid_points = 40)\n'
         'utils::head(pd, 6)',
"""  variable           x      yhat    type
1      lac -1.35582624 0.7757646 partial
2      lac -0.08519213 0.3333775 partial
3      lac  0.35384536 0.3611582 partial
4      lac  0.67263365 0.2769214 partial
5      lac  0.84518778 0.3285855 partial
6      lac  0.99896256 0.1739816 partial"""),
    code('# 协变量相关时 PDP 会在观测支撑集之外外推，ALE 更稳健\n'
         'pd_ale <- hte_pdp(ex, variables = "lac", grid_points = 40,\n'
         '                  type = "accumulated")\n'
         'utils::head(pd_ale, 3)',
"""  variable           x      yhat        type
1      lac -1.35582624 0.9545599 accumulated
2      lac -0.08519213 0.4735859 accumulated
3      lac  0.35384536 0.4951885 accumulated"""),
    note("<code>hte_pdp()</code> 默认 <code>center = FALSE</code>，纵轴保留"
         "<strong>绝对的平均预测 CATE</strong>。CATE 语境下这一点很重要："
         "曲线围绕 0 波动会掩盖效应水平本身，而“平均获益 1.2”与"
         "“平均获益 0.2”是两个完全不同的临床结论。DALEX 的 "
         "<code>model_profile()</code> 默认 <code>center = TRUE</code>，本包显式覆盖。",
         "<code>hte_pdp()</code> defaults to <code>center = FALSE</code>, keeping the "
         "<strong>absolute</strong> average predicted CATE on the vertical axis. That "
         "matters here: a curve oscillating about zero conceals the effect level itself, "
         "and an average benefit of 1.2 is a very different clinical statement from one of "
         "0.2. DALEX's <code>model_profile()</code> defaults to <code>center = TRUE</code>; "
         "this package overrides it explicitly."),
])

p.section("shap", "七、Kernel SHAP", "7. Kernel SHAP", [
    para("SHAP 把每个个体的 CATE 分解为基线值加各协变量的贡献，同时给出"
         "<strong>全局重要性</strong>（贡献的跨度）与<strong>局部归因</strong>"
         "（这一个体身上各变量贡献多少）。这是偏依赖图无法提供的信息。",
         "SHAP decomposes each individual CATE into a baseline plus per-covariate "
         "contributions, giving both <strong>global importance</strong> (the spread of "
         "contributions) and <strong>local attribution</strong> (each variable's "
         "contribution for one individual). Partial dependence cannot provide this."),
    code('sv <- hte_shap(ex, n_background = 100, seed = 1)\n'
         'utils::head(hte_shap_data(sv), 4)\n'
         'attr(hte_shap_data(sv), "baseline")',
"""  id variable    value       shap
1  1      age 52.48255 -0.1364983
2  2      age 62.20372 -0.5994672
3  3      age 49.97246 -0.2239525
4  4      age 79.14337 -0.1643312
[1] 1.261608"""),
    para("可加性是检验实现是否正确的直接手段："
         "<code>phi_0 + sum(phi_j)</code> 必须等于模型对该个体的预测值，"
         "残差应在机器精度量级。",
         "Additivity is a direct check on the implementation: "
         "<code>phi_0 + sum(phi_j)</code> must equal the model's prediction for that "
         "individual, with a residual at machine precision."),
    code('S <- as.matrix(sv$S)\n'
         'max(abs(as.numeric(sv$baseline) + rowSums(S) - tau_hat))',
"""[1] 4.440892e-16"""),
    code('plot_hte_shap(sv, "beeswarm")\n'
         'plot_hte_shap(sv, "dependence", variable = "lac")\n'
         'plot_hte_shap(sv, "waterfall", variable = 1)'),
    note("协变量数 <em>p</em> 不大时 Kernel SHAP 走精确枚举（<code>2^p</code> 个联盟）；"
         "<em>p</em> 较大时 kernelshap 自动切换为采样近似，结果随 <code>seed</code> "
         "有轻微波动。报告时请固定 <code>seed</code>。",
         "With a small number of covariates <em>p</em>, Kernel SHAP enumerates all "
         "<code>2^p</code> coalitions exactly; for larger <em>p</em>, kernelshap switches "
         "to a sampling approximation and results fluctuate slightly with "
         "<code>seed</code>. Fix the seed when reporting."),
])

p.section("export", "八、图形与数据分离", "8. Separating plot from data", [
    para("本包所有 <code>plot_*</code> 函数都返回 <strong>ggplot 对象</strong>，"
         "可用 <code>+</code> 叠加图层、用 <code>ggsave()</code> 导出；"
         "绘图所用的原始数据同时可单独取出落盘。二者分离，便于按期刊要求重画。",
         "Every <code>plot_*</code> function returns a <strong>ggplot object</strong> that "
         "can be extended with <code>+</code> and exported with <code>ggsave()</code>; the "
         "underlying data is available separately for writing to disk. Keeping the two "
         "apart makes it straightforward to redraw figures to a journal's specification."),
    code('qd <- hte_shap_data(sv)\n'
         'utils::write.csv(qd, "15_shap_values.csv", row.names = FALSE)\n'
         '\n'
         'ggplot2::ggplot(qd, ggplot2::aes(x = value, y = shap)) +\n'
         '  ggplot2::geom_point(alpha = 0.5, colour = "#1B6CA8") +\n'
         '  ggplot2::geom_hline(yintercept = 0, linetype = 2, colour = "grey60") +\n'
         '  ggplot2::facet_wrap(~ variable, scales = "free_x") +\n'
         '  ggplot2::labs(x = "协变量取值", y = "SHAP 贡献",\n'
         '                title = "SHAP 依赖图（用导出数据自行绘制）") +\n'
         '  ggplot2::theme_minimal(base_size = 12)'),
    table(
        ["绘图函数", "对应的数据函数"],
        ["Plot function", "Corresponding data function"],
        [
            ["<code>plot_hte_importance()</code>", "<code>hte_feature_importance()</code>"],
            ["<code>plot_hte_pdp()</code>", "<code>hte_pdp()</code>"],
            ["<code>plot_hte_shap()</code>", "<code>hte_shap_data()</code>"],
            ["<code>plot_hte_benchmark()</code>", "<code>hte_benchmark_data()</code>"],
            ["<code>plot_qini()</code>", "<code>qini_curve()</code>"],
            ["<code>mlr3HTE_dag()</code>", "<code>mlr3HTE_dag_data()</code>"],
        ]),
])

p.section("survival", "九、生存结局同样可解释", "9. Survival outcomes too", [
    code('s <- mlr3HTE_scenario("rct_lin", "survival", n = 400, seed = 1)\n'
         'fit_s <- metalearner("T", s$X, s$A, s$Y, learner_base = "coxph", t0 = s$t0)\n'
         'ex_s <- hte_explainer(fit_s, s$X, s$A, s$Y, t0 = s$t0,\n'
         '                     effect = "survdiff", seed = 1)\n'
         'length(ex_s$pseudo)\n'
         'ex_s$t0\n'
         'hte_feature_importance(ex_s, B = 5, N = 400, seed = 1)',
"""[1] 400
[1] 2
  variable dropout_loss baseline      dropout dropout_pct
4    tumor     1.183836 1.170557 1.327878e-02 1.134398187
2      lac     1.181124 1.170557 1.056649e-02 0.902689305
3      sex     1.172480 1.170557 1.922358e-03 0.164225871
1      age     1.170578 1.170557 2.079801e-05 0.001776762"""),
    note("生存分支的伪结局已用删失 IPCW 校正，效应标尺由 <code>effect</code> 指定"
         "（<code>\"survdiff\"</code> 或 <code>\"rmst\"</code>）。"
         "切换标尺会改变伪结局的量纲，重要性排序也可能随之改变，报告时须写明。",
         "In the survival branch the pseudo-outcome is corrected for censoring by IPCW, "
         "and the effect scale is set by <code>effect</code> "
         "(<code>\"survdiff\"</code> or <code>\"rmst\"</code>). Changing the scale changes "
         "the units of the pseudo-outcome and may change the importance ranking, so the "
         "choice must be stated."),
])

p.section("boundary", "十、能力边界", "10. Limits", [
    {"zh": '<ol class="ref-list">' +
           '<li>可解释性工具解释的是<strong>模型</strong>，不是数据生成机制。'
           '模型错了，解释再漂亮也是错的。</li>' +
           '<li>变量重要性不构成因果结论。判断某变量是否真为效应修饰因子，'
           '需要设计层面的证据（随机化下的分层分析、预先设定的交互项检验），'
           '或在目标试验模拟框架下预先申明。</li>' +
           '<li>SHAP 的可加性是数学恒等式，不保证各分项可单独干预。</li>' +
           '<li>偏依赖在观测支撑集之外做外推；协变量相关时应改用 ALE。</li>' +
           '</ol>',
     "en": '<ol class="ref-list">' +
           '<li>Interpretability tools explain the <strong>model</strong>, not the '
           'data-generating mechanism. If the model is wrong, an elegant explanation is '
           'still wrong.</li>' +
           '<li>Variable importance is not a causal conclusion. Establishing that a '
           'variable truly modifies the effect requires design-level evidence (stratified '
           'analysis under randomisation, a pre-specified interaction test) or a '
           'pre-specified estimand in a target trial emulation.</li>' +
           '<li>SHAP additivity is a mathematical identity; it does not license '
           'intervening on individual components.</li>' +
           '<li>Partial dependence extrapolates beyond the observed support; use ALE when '
           'covariates are correlated.</li>' +
           '</ol>'},
])

TUT_PAGES.append(p)

# =========================================================== 3 模块索引页
def link(pid, zh, en):
    return ('<a href="#/%s">%s</a>' % (pid, zh),
            '<a href="#/%s">%s</a>' % (pid, en))


def index_page(pid, tz, te, lz, le, intro, rows):
    """rows = [(页面 id, 函数标签, 用途zh, 用途en), ...]"""
    pg = Page(pid, tz, te, lz, le)
    blocks = [para(intro[0], intro[1])]
    cells = []
    for page_id, fn_label, uz, ue in rows:
        lz_, le_ = link(page_id, fn_label + "()", fn_label + "()")
        cells.append([lz_, (uz, ue)])
    blocks.append(table(["函数", "用途"], ["Function", "Purpose"], cells))
    pg.section("index", tz, te, blocks)
    return pg


p = index_page(
    "apisim", "模拟数据与 DAG", "Simulation data & DAG",
    "按结构可控、真值已知的原则生成模拟数据：10 个设计 × 3 类结局打包随包发布，"
    "并提供因果结构图（DAG）的数据与绘图。",
    "Simulated data generated under controllable structures with known ground truth: ten "
    "designs by three outcomes ship with the package, together with the data and plot for "
    "the causal structure diagram (DAG).",
    ("这一组函数回答“用什么数据做比较”与“因果结构长什么样”。"
     "四个结构维度（研究设计 / 混杂形式 / HTE 形式 / 共用变量）相互独立，"
     "便于固定其余、只改一个来做对照。",
     "These functions answer which data to compare on and what the causal structure looks "
     "like. The four structural dimensions (design, confounding form, HTE form, shared "
     "variable) are independent, so one can be varied while the rest are held fixed."),
    [("apiscenarios",  "mlr3HTE_scenarios",
      "列出 10 个基准设计的结构标签",
      "Lists the structural labels of the ten benchmark designs"),
     ("apiscenario",    "mlr3HTE_scenario",
      "按场景 id 生成一份带真值的模拟数据",
      "Generates one simulated dataset with known ground truth"),
     ("apibench",       "mlr3HTE_bench",
      "取出随包发布的基准数据（10 设计 × 3 结局）",
      "Returns the bundled benchmark data (10 designs x 3 outcomes)"),
     ("apibenchindex",  "mlr3HTE_bench_index",
      "列出打包数据中实际存在的键与真值 ATE",
      "Lists the keys present in the bundled data and the true ATE"),
     ("apidagdata",     "mlr3HTE_dag_data() · mlr3HTE_dag()",
      "DAG 的节点表、边表与绘图，含每条边的曲率路由",
      "Node and edge tables plus the DAG plot, including curvature routing"),
     ("apibenchdata",   "hte_benchmark_data",
      "取出基准测试的曲线绘图数据与参考线",
      "Returns benchmark curve data with the reference lines")])

p.section("dag", "DAG 的唯一箭头约定", "One arrow per pair of nodes", [
    para("任意两个节点之间只保留一条有向边；若某条边会从第三个节点身上穿过，"
         "<code>mlr3HTE_dag_data()</code> 会自动加曲率绕行，"
         "曲率记在 <code>curve</code> 列（0 表示直线）。"
         "绘图时按曲率分组，一层一个 <code>geom_curve</code>——"
         "因为 <code>curvature</code> 是参数而非美学映射，不能直接写进 "
         "<code>aes()</code>。",
         "At most one directed edge is kept between any pair of nodes. If an edge would "
         "pass through a third node, <code>mlr3HTE_dag_data()</code> adds curvature "
         "automatically and records it in the <code>curve</code> column (0 means a straight "
         "line). The plot is drawn with one <code>geom_curve</code> layer per curvature "
         "value, because <code>curvature</code> is a parameter rather than an aesthetic "
         "and cannot go inside <code>aes()</code>."),
])

API_PAGES = [p]

p = index_page(
    "apiexplain", "CATE 可解释性", "CATE interpretability",
    "把估计出的 CATE 曲面当作模型来解释：置换重要性、偏依赖与累积局部效应、Kernel SHAP，"
    "以及配套的三个绘图函数。解释对象是双重稳健伪结局。",
    "Treats the estimated CATE surface as a model to be explained: permutation importance, "
    "partial dependence and accumulated local effects, Kernel SHAP, and the three "
    "companion plotting functions. The object of explanation is the doubly robust "
    "pseudo-outcome.",
    ("这一组函数回答“模型为什么给出这个 CATE”。它们衡量的是"
     "<strong>模型</strong>对变量的依赖，不构成因果效应分解。"
     "响应变量一律取双重稳健伪结局 <code>Y*</code>，因其满足 "
     "<code>E[Y*|X] = tau(X)</code>；若改用原始 <code>Y</code>，"
     "衡量的将是基线预后而非效应异质性。",
     "These functions answer why the model produced a given CATE. They measure the "
     "<strong>model's</strong> reliance on variables and do not constitute a causal "
     "decomposition. The response is always the doubly robust pseudo-outcome "
     "<code>Y*</code>, which satisfies <code>E[Y*|X] = tau(X)</code>; with the raw "
     "<code>Y</code> they would measure baseline prognosis rather than effect "
     "heterogeneity."),
    [("apiexplainer",     "hte_explainer",
      "把 CATE 模型包装为 DALEX 解释器（响应变量 = 伪结局）",
      "Wraps a CATE model as a DALEX explainer (response = pseudo-outcome)"),
     ("apisurrogate",     "hte_surrogate",
      "用单一 mlr3 学习器重拟合 CATE 曲面得到代理模型",
      "Refits the CATE surface with one mlr3 learner as a surrogate"),
     ("apiimportance",    "hte_feature_importance",
      "置换法变量重要性（相对伪结局的损失上升）",
      "Permutation importance (rise in loss against the pseudo-outcome)"),
     ("apipdp",           "hte_pdp",
      "偏依赖（PDP）与累积局部效应（ALE）",
      "Partial dependence (PDP) and accumulated local effects (ALE)"),
     ("apishap",          "hte_shap",
      "Kernel SHAP：把个体 CATE 分解为基线加各变量贡献",
      "Kernel SHAP: decomposes an individual CATE into a baseline plus contributions"),
     ("apishapdata",      "hte_shap_data",
      "把 shapviz 对象摊平为长表，便于导出与自绘",
      "Flattens a shapviz object into a long table for export and redrawing"),
     ("apiplotimportance", "plot_hte_importance",
      "重要性条形图（返回 ggplot）",
      "Importance bar chart (returns a ggplot)"),
     ("apiplotpdp",       "plot_hte_pdp",
      "偏依赖曲线分面图（返回 ggplot）",
      "Faceted partial dependence curves (returns a ggplot)"),
     ("apiplotshap",      "plot_hte_shap",
      "SHAP 四视图：重要性 / 蜂群 / 依赖 / 瀑布（返回 ggplot）",
      "Four SHAP views: importance / beeswarm / dependence / waterfall (ggplot)")])

p.section("workflow", "推荐顺序", "Recommended order", [
    {"zh": '<ol class="ref-list">' +
           '<li>先确认估计质量（留出集上的 CATE 相关或 RMSE），再谈解释。</li>' +
           '<li><code>hte_explainer()</code> 建立解释器，响应变量自动取伪结局。</li>' +
           '<li><code>hte_feature_importance()</code> 看全局排序。</li>' +
           '<li><code>hte_pdp()</code> 看效应随单个变量如何变化（相关时用 ALE）。</li>' +
           '<li><code>hte_shap()</code> 做个体归因，并用可加性残差校验实现。</li>' +
           '<li>图形用 <code>ggsave()</code> 导出，数据用对应 <code>hte_*()</code> 落盘。</li>' +
           '</ol>',
     "en": '<ol class="ref-list">' +
           '<li>Check estimation quality first (out-of-sample CATE correlation or RMSE); '
           'only then interpret.</li>' +
           '<li>Build the explainer with <code>hte_explainer()</code>; the response is the '
           'pseudo-outcome by default.</li>' +
           '<li>Rank globally with <code>hte_feature_importance()</code>.</li>' +
           '<li>Trace how the effect varies with one covariate using '
           '<code>hte_pdp()</code> (ALE when covariates are correlated).</li>' +
           '<li>Attribute individual effects with <code>hte_shap()</code> and verify the '
           'implementation via the additivity residual.</li>' +
           '<li>Export figures with <code>ggsave()</code> and write the data out with the '
           'corresponding <code>hte_*()</code> function.</li>' +
           '</ol>'},
])

API_PAGES.append(p)

# =========================================================== 4 参考文献：新增 F / G 两节
def ref_item(rid, cite, link, use):
    return ('<li id="%s">' % rid +
            '<div class="ref-cite">%s</div>' % cite +
            '<div class="ref-links"><a href="%s" target="_blank" rel="noopener">%s</a></div>' % (link, link) +
            '<div class="ref-use"><strong>用途：</strong>%s</div>' % use +
            '</li>')


REFS_F_ZH = [
    ref_item("ref-biecek2021",
             "Biecek P, Burzykowski T. <em>Explanatory Model Analysis: Explore, Explain, "
             "and Examine Predictive Models</em>. Chapman and Hall/CRC, 2021.",
             "https://ema.drwhy.ai/",
             "本包可解释性模块的整体框架（解释器、变量重要性、偏依赖、"
             "SHAP 的层次划分）均按此书的术语与顺序组织。"
             "引用位置：<a href=\"#/apiexplain\">可解释性模块</a>、"
             "<a href=\"#/tutorialexplain\">教程 · CATE 可解释性</a>。"),
    ref_item("ref-biecek2018",
             "Biecek P. DALEX: Explainers for Complex Predictive Models in R. "
             "<em>Journal of Machine Learning Research</em> 2018;19(84):1–5.",
             "https://jmlr.org/papers/v19/18-416.html",
             "<code>hte_explainer()</code> 底层调用 <code>DALEX::explain()</code>，"
             "<code>hte_feature_importance()</code> 用 "
             "<code>model_parts()</code>、<code>hte_pdp()</code> 用 "
             "<code>model_profile()</code>。"
             "引用位置：<a href=\"#/apiexplainer\">hte_explainer()</a>。"),
    ref_item("ref-molnar2022",
             "Molnar C. <em>Interpretable Machine Learning: A Guide for Making Black Box "
             "Models Explainable</em>. 2nd ed., 2022.",
             "https://christophm.github.io/interpretable-ml-book/",
             "偏依赖图与累积局部效应的原理、以及二者在变量相关时的优劣对比，"
             "按此书第 8 章的表述。"
             "引用位置：<a href=\"#/apipdp\">hte_pdp()</a>。"),
    ref_item("ref-lundberg2017",
             "Lundberg SM, Lee SI. A Unified Approach to Interpreting Model Predictions. "
             "<em>Advances in Neural Information Processing Systems</em> 2017;30:4765–4774.",
             "https://arxiv.org/abs/1705.07874",
             "SHAP 值的可加性分解 <code>phi_0 + sum(phi_j) = f(x)</code> 出自此文；"
             "本包用它作为 <code>hte_shap()</code> 实现正确性的校验式。"
             "引用位置：<a href=\"#/apishap\">hte_shap()</a>。"),
    ref_item("ref-covert2021",
             "Covert I, Lee SI. Improving KernelSHAP: Practical Shapley Value Estimation "
             "Using Linear Regression. <em>AISTATS</em> 2021;130:3457–3465.",
             "https://arxiv.org/abs/2012.01536",
             "<code>hte_shap()</code> 调用的 kernelshap 采用此文的线性回归近似，"
             "在协变量较多时由精确枚举切换为采样近似。"
             "引用位置：<a href=\"#/apishap\">hte_shap()</a>。"),
    ref_item("ref-apley2020",
             "Apley DW, Zhu J. Visualizing the Effects of Predictor Variables in Black Box "
             "Supervised Learning Models. <em>Journal of the Royal Statistical Society: "
             "Series B</em> 2020;82(4):1059–1086.",
             "https://doi.org/10.1111/rssb.12377",
             "累积局部效应（ALE）的出处。"
             "<code>hte_pdp(type = \"accumulated\")</code> 在协变量相关时按此方法替代 PDP。"
             "引用位置：<a href=\"#/apipdp\">hte_pdp()</a>。"),
]

REFS_F_EN = [
    ref_item("ref-biecek2021",
             "Biecek P, Burzykowski T. <em>Explanatory Model Analysis: Explore, Explain, "
             "and Examine Predictive Models</em>. Chapman and Hall/CRC, 2021.",
             "https://ema.drwhy.ai/",
             "The overall structure of the interpretability module (explainer, variable "
             "importance, partial dependence, SHAP) follows the terminology and order of "
             "this book. Cited in the <a href=\"#/apiexplain\">interpretability module</a> "
             "and <a href=\"#/tutorialexplain\">Tutorial · CATE interpretability</a>."),
    ref_item("ref-biecek2018",
             "Biecek P. DALEX: Explainers for Complex Predictive Models in R. "
             "<em>Journal of Machine Learning Research</em> 2018;19(84):1–5.",
             "https://jmlr.org/papers/v19/18-416.html",
             "<code>hte_explainer()</code> calls <code>DALEX::explain()</code>; "
             "<code>hte_feature_importance()</code> wraps <code>model_parts()</code> and "
             "<code>hte_pdp()</code> wraps <code>model_profile()</code>. "
             "Cited in <a href=\"#/apiexplainer\">hte_explainer()</a>."),
    ref_item("ref-molnar2022",
             "Molnar C. <em>Interpretable Machine Learning: A Guide for Making Black Box "
             "Models Explainable</em>. 2nd ed., 2022.",
             "https://christophm.github.io/interpretable-ml-book/",
             "The rationale for partial dependence and accumulated local effects, and the "
             "comparison between them under correlated covariates, follows Chapter 8 of "
             "this book. Cited in <a href=\"#/apipdp\">hte_pdp()</a>."),
    ref_item("ref-lundberg2017",
             "Lundberg SM, Lee SI. A Unified Approach to Interpreting Model Predictions. "
             "<em>Advances in Neural Information Processing Systems</em> "
             "2017;30:4765–4774.",
             "https://arxiv.org/abs/1705.07874",
             "Source of the additive SHAP decomposition "
             "<code>phi_0 + sum(phi_j) = f(x)</code>, used here as the correctness check "
             "for <code>hte_shap()</code>. "
             "Cited in <a href=\"#/apishap\">hte_shap()</a>."),
    ref_item("ref-covert2021",
             "Covert I, Lee SI. Improving KernelSHAP: Practical Shapley Value Estimation "
             "Using Linear Regression. <em>AISTATS</em> 2021;130:3457–3465.",
             "https://arxiv.org/abs/2012.01536",
             "kernelshap, called by <code>hte_shap()</code>, uses the linear-regression "
             "approximation of this paper and switches from exact enumeration to sampling "
             "when covariates are numerous. "
             "Cited in <a href=\"#/apishap\">hte_shap()</a>."),
    ref_item("ref-apley2020",
             "Apley DW, Zhu J. Visualizing the Effects of Predictor Variables in Black Box "
             "Supervised Learning Models. <em>Journal of the Royal Statistical Society: "
             "Series B</em> 2020;82(4):1059–1086.",
             "https://doi.org/10.1111/rssb.12377",
             "Source of accumulated local effects (ALE), which "
             "<code>hte_pdp(type = \"accumulated\")</code> substitutes for PDP when "
             "covariates are correlated. Cited in <a href=\"#/apipdp\">hte_pdp()</a>."),
]

REFS_G_ZH = [
    ref_item("ref-kennedy2020",
             "Kennedy EH. Towards Optimal Doubly Robust Estimation of Heterogeneous "
             "Causal Effects. <em>arXiv</em> 2020:2004.14497.",
             "https://arxiv.org/abs/2004.14497",
             "R-learner 与伪结局回归的最优性、以及<strong>交叉拟合</strong>为何必要"
             "（干扰参数须在训练折上拟合、在留出折上评估）均出自此文。"
             "本包 R/DR 的 <code>cross_fitting = TRUE</code> 与 "
             "<code>dr_pseudo_outcome()</code> 的默认交叉拟合均据此实现。"
             "引用位置：<a href=\"#/apimetalearner\">metalearner()</a>。"),
    ref_item("ref-uno2014",
             "Uno H, Claggett B, Tian L, et al. Moving Beyond the Hazard Ratio in "
             "Quantifying the Between-Group Difference in Survival Analysis. "
             "<em>Journal of Clinical Oncology</em> 2014;32(22):2380–2385.",
             "https://doi.org/10.1200/JCO.2013.52.5720",
             "RMST（限制平均生存时间）组间差的提出与临床解释。"
             "生存分支 <code>effect = \"rmst\"</code> 的效应标尺即按此定义，"
             "基准数据中的 <code>tau_rmst</code> / <code>ate_rmst</code> 为其真值。"
             "引用位置：<a href=\"#/tutorialbenchgrid\">教程 · 基准模拟数据网格</a>。"),
    ref_item("ref-morris2019",
             "Morris TP, White IR, Crowther MJ. Using Simulation Studies to Evaluate "
             "Statistical Methods. <em>Statistics in Medicine</em> 2019;38(11):2074–2102.",
             "https://doi.org/10.1002/sim.8086",
             "模拟研究的 ADEMP 框架（Aims, Data-generating mechanisms, Estimands, "
             "Methods, Performance measures）。本包基准数据网格的四个维度与"
             "“按结构分层报告、不做跨维度平均”的约定即按此框架设计。"
             "引用位置：<a href=\"#/tutorialbenchgrid\">教程 · 基准模拟数据网格</a>。"),
]

REFS_G_EN = [
    ref_item("ref-kennedy2020",
             "Kennedy EH. Towards Optimal Doubly Robust Estimation of Heterogeneous "
             "Causal Effects. <em>arXiv</em> 2020:2004.14497.",
             "https://arxiv.org/abs/2004.14497",
             "Source of the optimality results for the R-learner and pseudo-outcome "
             "regression, and of the argument for <strong>cross-fitting</strong> (nuisance "
             "parameters fitted on training folds, evaluated on held-out folds). The "
             "<code>cross_fitting = TRUE</code> option for R/DR and the default "
             "cross-fitting in <code>dr_pseudo_outcome()</code> follow from it. "
             "Cited in <a href=\"#/apimetalearner\">metalearner()</a>."),
    ref_item("ref-uno2014",
             "Uno H, Claggett B, Tian L, et al. Moving Beyond the Hazard Ratio in "
             "Quantifying the Between-Group Difference in Survival Analysis. "
             "<em>Journal of Clinical Oncology</em> 2014;32(22):2380–2385.",
             "https://doi.org/10.1200/JCO.2013.52.5720",
             "Introduces the RMST between-group difference and its clinical reading. The "
             "<code>effect = \"rmst\"</code> scale in the survival branch follows this "
             "definition, and <code>tau_rmst</code> / <code>ate_rmst</code> in the "
             "benchmark data are its ground truth. "
             "Cited in <a href=\"#/tutorialbenchgrid\">Tutorial · benchmark grid</a>."),
    ref_item("ref-morris2019",
             "Morris TP, White IR, Crowther MJ. Using Simulation Studies to Evaluate "
             "Statistical Methods. <em>Statistics in Medicine</em> 2019;38(11):2074–2102.",
             "https://doi.org/10.1002/sim.8086",
             "The ADEMP framework for simulation studies (Aims, Data-generating "
             "mechanisms, Estimands, Methods, Performance measures). The four dimensions "
             "of the benchmark grid and the convention of stratified rather than averaged "
             "reporting follow this framework. "
             "Cited in <a href=\"#/tutorialbenchgrid\">Tutorial · benchmark grid</a>."),
]


def ref_section(sid, heading, intro, items, start):
    body = ["<p>%s</p>" % intro,
            '<ol class="ref-list" start="%d">' % start]
    body.extend(items)
    body.append("</ol>")
    return ("      {\n"
            '        id: "%s",\n' % sid +
            '        heading: "%s",\n' % heading +
            "        body:\n" +
            " +\n".join("          '" + js(x) + "'" for x in body) +
            "\n      },\n")


def insert_references():
    path = os.path.join(JS, "content-references.js")
    s = io.open(path, encoding="utf-8").read()
    if 'id="ref-biecek2021"' in s:
        print("跳过：参考文献 F/G 已存在")
        return
    marker = '      {\n        id: "cite-this",'
    parts = s.split(marker)
    if len(parts) != 3:
        raise SystemExit("cite-this 分节数量异常：%d" % (len(parts) - 1))
    fz = ref_section("interpretability", "F. 模型可解释性",
                     "可解释性模块（<code>hte_explainer()</code> 及其配套函数）的"
                     "方法学出处，编号 [19]–[24]。", REFS_F_ZH, 19)
    gz = ref_section("simulation", "G. 模拟设计与估计方法学",
                     "基准模拟数据网格的四维设计原则、交叉拟合与 RMST 效应标尺的出处，"
                     "编号 [25]–[27]。", REFS_G_ZH, 25)
    fe = ref_section("interpretability", "F. Model interpretability",
                     "Methodological sources for the interpretability module "
                     "(<code>hte_explainer()</code> and companions), items [19]–[24].",
                     REFS_F_EN, 19)
    ge = ref_section("simulation", "G. Simulation design and estimation methodology",
                     "Sources for the four-dimensional benchmark grid, cross-fitting and "
                     "the RMST effect scale, items [25]–[27].", REFS_G_EN, 25)
    out = parts[0] + fz + gz + marker + parts[1] + fe + ge + marker + parts[2]
    io.open(path, "w", encoding="utf-8", newline="\n").write(out)
    print("已插入参考文献 F（6 条）与 G（3 条）")


# =========================================================== 5 导航
NAV_TUTORIAL_ADD = (
    '      { id: "tutorialbenchgrid", zh: "7 基准模拟数据网格", en: "7 Benchmark simulation grid" },\n'
    '      { id: "tutorialexplain",   zh: "8 CATE 可解释性",   en: "8 Interpreting the CATE model" },\n'
)

NAV_MODULES = (
    '  {\n'
    '    id: "apisim",\n'
    '    zh: "模拟数据",\n'
    '    en: "Simulation data",\n'
    '    children: [\n'
    '      { id: "apisim",            zh: "总览",                    en: "Overview"                             },\n'
    '      { id: "apiscenarios",      zh: "mlr3HTE_scenarios()",     en: "mlr3HTE_scenarios()"                  },\n'
    '      { id: "apiscenario",       zh: "mlr3HTE_scenario()",      en: "mlr3HTE_scenario()"                   },\n'
    '      { id: "apibench",          zh: "mlr3HTE_bench()",         en: "mlr3HTE_bench()"                      },\n'
    '      { id: "apibenchindex",     zh: "mlr3HTE_bench_index()",   en: "mlr3HTE_bench_index()"                },\n'
    '      { id: "apibenchdata",      zh: "hte_benchmark_data()",    en: "hte_benchmark_data()"                 },\n'
    '      { id: "apidagdata",        zh: "mlr3HTE_dag_data()",      en: "mlr3HTE_dag_data()"                   }\n'
    '    ]\n'
    '  },\n'
    '  {\n'
    '    id: "apiexplain",\n'
    '    zh: "可解释性",\n'
    '    en: "Interpretability",\n'
    '    children: [\n'
    '      { id: "apiexplain",        zh: "总览",                    en: "Overview"                             },\n'
    '      { id: "apiexplainer",      zh: "hte_explainer()",         en: "hte_explainer()"                      },\n'
    '      { id: "apisurrogate",      zh: "hte_surrogate()",         en: "hte_surrogate()"                      },\n'
    '      { id: "apiimportance",     zh: "hte_feature_importance()", en: "hte_feature_importance()"             },\n'
    '      { id: "apipdp",            zh: "hte_pdp()",               en: "hte_pdp()"                            },\n'
    '      { id: "apishap",           zh: "hte_shap()",              en: "hte_shap()"                           },\n'
    '      { id: "apishapdata",       zh: "hte_shap_data()",         en: "hte_shap_data()"                      },\n'
    '      { id: "apiplotimportance", zh: "plot_hte_importance()",   en: "plot_hte_importance()"                },\n'
    '      { id: "apiplotpdp",        zh: "plot_hte_pdp()",          en: "plot_hte_pdp()"                       },\n'
    '      { id: "apiplotshap",       zh: "plot_hte_shap()",         en: "plot_hte_shap()"                      }\n'
    '    ]\n'
    '  },\n'
)


def update_nav():
    path = os.path.join(JS, "content-home.js")
    s = io.open(path, encoding="utf-8").read()
    if 'id: "tutorialbenchgrid"' in s:
        print("跳过：导航已更新")
        return
    anchor = '      { id: "tutorialbenchmark", zh: "6 RCT 基准测试",        en: "6 RCT benchmark"                  },\n'
    if anchor not in s:
        raise SystemExit("未找到教程导航锚点")
    s = s.replace(anchor, anchor + NAV_TUTORIAL_ADD, 1)
    anchor2 = '  { id: "changelog", zh: "更新日志",      en: "Changelog"                 },\n'
    if anchor2 not in s:
        raise SystemExit("未找到 changelog 导航锚点")
    s = s.replace(anchor2, NAV_MODULES + anchor2, 1)
    io.open(path, "w", encoding="utf-8", newline="\n").write(s)
    print("已更新导航：教程 +2 篇，新增两个模块导航（共 17 个子页）")


# =========================================================== 6 主流程
def main():
    update_nav()
    write_fragment("_frag_tutorial_v34.js", TUT_PAGES, "content-tutorial.js")
    write_fragment("_frag_api_index_v34.js", API_PAGES, "content-api.js")
    insert_references()


if __name__ == "__main__":
    main()
