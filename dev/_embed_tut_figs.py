# 给教程页补实跑图（中英图注不同，按出现次序：第 1 次命中 = 中文段，第 2 次 = 英文段）。
#   tutorialexplain   importance / pdp / shap
#   tutorialbenchgrid confounding
# 图片即教程脚本 15 / 16 自己 ggsave 出来的那份，与页面上展示的代码一一对应。
import io

P = "docs/assets/js/content-tutorial.js"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")


def page_bounds(pid):
    start = next(i for i, l in enumerate(lines) if l.startswith("window.SITE_PAGES.%s = {" % pid))
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == "};")
    return start, end


def append_fig(pid, sec_id, zh, en):
    """zh / en 各是一份 fig 行列表；第 1 次命中插 zh，第 2 次插 en。"""
    start, end = page_bounds(pid)
    hits = [i for i in range(start, end) if lines[i].strip() == 'id: "%s",' % sec_id]
    if len(hits) != 2:
        raise SystemExit("%s/%s 命中 %d 次（应为中英各 1 次）" % (pid, sec_id, len(hits)))
    # 从后往前插，避免行号漂移
    for idx, fig_lines in zip(reversed(hits), (en, zh)):
        j = idx + 1
        while lines[j] not in ("      },", "      }"):
            j += 1
        last = lines[j - 1].rstrip()
        if not last.endswith("'"):
            raise SystemExit("%s/%s body 末行不是字符串结尾" % (pid, sec_id))
        lines[j - 1] = last + " +"
        for k, fl in enumerate(fig_lines):
            lines.insert(j + k, "          " + fl)
    print("已插图: %s / %s（中英）" % (pid, sec_id))


IMP_ZH = ["'<figure class=\"fig\"><img src=\"assets/img/explain/tut_importance.png\" "
          "alt=\"置换重要性条形图\">' +",
          "'<figcaption>教程脚本 15 实跑：连续结局、n = 600、T-learner 配 "
          "<code>regr.ranger</code>，<code>B = 10</code>、<code>N = 600</code>、种子 1。"
          "</figcaption></figure>'"]
IMP_EN = ["'<figure class=\"fig\"><img src=\"assets/img/explain/tut_importance.png\" "
          "alt=\"Bar chart of permutation importance\">' +",
          "'<figcaption>Actual run of tutorial script 15: continuous outcome, n = 600, "
          "T-learner with <code>regr.ranger</code>, <code>B = 10</code>, "
          "<code>N = 600</code>, seed 1.</figcaption></figure>'"]

PDP_ZH = ["'<figure class=\"fig\"><img src=\"assets/img/explain/tut_pdp.png\" "
          "alt=\"lac 的偏依赖曲线\">' +",
          "'<figcaption>同上设置的 <code>lac</code> 偏依赖曲线（40 个网格点）。"
          "纵轴未中心化，读的是绝对的平均预测 CATE。</figcaption></figure>'"]
PDP_EN = ["'<figure class=\"fig\"><img src=\"assets/img/explain/tut_pdp.png\" "
          "alt=\"Partial dependence curve for lac\">' +",
          "'<figcaption>Partial dependence of <code>lac</code> (40 grid points) under the "
          "same setup. The vertical axis is not centred, so it reads as the absolute mean "
          "predicted CATE.</figcaption></figure>'"]

SHAP_ZH = ["'<div class=\"fig-grid\">' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_beeswarm.png\" "
           "alt=\"SHAP 蜂群图\"><figcaption>蜂群图：全局重要性与变量取值的联合分布。</figcaption></figure>' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_dependence.png\" "
           "alt=\"SHAP 依赖图\"><figcaption>依赖图：<code>lac</code> 取值与 SHAP 贡献的关系，"
           "单调段对应效应修饰的线性区间。</figcaption></figure>' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_waterfall.png\" "
           "alt=\"SHAP 瀑布图\"><figcaption>瀑布图：第 1 号个体的逐项归因。</figcaption></figure>' +",
           "'</div>'"]
SHAP_EN = ["'<div class=\"fig-grid\">' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_beeswarm.png\" "
           "alt=\"SHAP beeswarm\"><figcaption>Beeswarm: global importance against the joint "
           "distribution of covariate values.</figcaption></figure>' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_dependence.png\" "
           "alt=\"SHAP dependence\"><figcaption>Dependence: value of <code>lac</code> against "
           "its SHAP contribution; monotone stretches mark the linear region of the effect "
           "modification.</figcaption></figure>' +",
           "'<figure class=\"fig\"><img src=\"assets/img/explain/tut_shap_waterfall.png\" "
           "alt=\"SHAP waterfall\"><figcaption>Waterfall: term-by-term attribution for "
           "individual 1.</figcaption></figure>' +",
           "'</div>'"]

CONF_ZH = ["'<figure class=\"fig\"><img src=\"assets/img/bench/confounding_bias.png\" "
           "alt=\"混杂强度梯度条形图\">' +",
           "'<figcaption>教程脚本 16 实跑：六个设计的未调整差值减真值 ATE。随机化设计贴近 0；"
           "观察性设计随 <code>shared = TRUE</code>（该协变量同时是混杂因子与效应修饰因子）"
           "显著放大。</figcaption></figure>'"]
CONF_EN = ["'<figure class=\"fig\"><img src=\"assets/img/bench/confounding_bias.png\" "
           "alt=\"Bar chart of the confounding gradient\">' +",
           "'<figcaption>Actual run of tutorial script 16: unadjusted difference minus the "
           "true ATE for six designs. Randomised designs sit near zero; observational designs "
           "inflate markedly with <code>shared = TRUE</code>, where one covariate is both a "
           "confounder and an effect modifier.</figcaption></figure>'"]

append_fig("tutorialexplain", "importance", IMP_ZH, IMP_EN)
append_fig("tutorialexplain", "pdp", PDP_ZH, PDP_EN)
append_fig("tutorialexplain", "shap", SHAP_ZH, SHAP_EN)
append_fig("tutorialbenchgrid", "confounding", CONF_ZH, CONF_EN)

io.open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("教程页插图完成")
