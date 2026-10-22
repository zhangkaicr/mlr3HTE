"""把教程正文中的口语化表述改写为正式的学术表述。

只做「语域」改造：技术内容、数值、结论一律不动。
每条替换都要求原文精确命中，命中数为 0 会显式报出来，避免静默失效。
"""

import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "docs", "assets", "js")

PAIRS = [
    # ---- 教程首页 ----
    ("照着敲一遍就能跑。第一次用建议从第 0 篇读起；已经有明确研究设计，直接跳到对应框架。"
     "每篇都可以独立阅读，不必按顺序。",
     "每篇均给出一条可独立执行的完整流程。初次使用建议自第 0 篇顺序阅读；"
     "若已有明确的研究设计，可直接查阅对应框架。各篇自成一个单元，不要求按序阅读。"),

    ("只报 ATE 会漏掉「平均对、个体全错」的情形。",
     "仅报告 ATE 会遗漏「总体均值正确而个体效应全错」的情形。"),

    ("五种 meta-learner 只是配方，干活的是基学习器；换算法只改一行，还能按分组 / 阶段分开指定。",
     "五种 meta-learner 只规定估计流程，实际拟合由基学习器完成；更换算法仅需改动一个参数，"
     "并可按处理组或估计阶段分别指定。"),

    ("这是教学时最有用的部分——你可以直接看出哪个 learner 真的捕捉到了异质性。",
     "这是教学中最具诊断价值的部分：可直接判定哪个 learner 捕捉到了效应异质性。"),

    ("但如果你要自己接 <code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code> ",
     "若需自行接入 <code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code> "),

    ("三个指标在<strong>连续 / 二分类 / 生存</strong>上各跑一遍："
     "生存要 IPCW，并演示「先拟合后切分」的泄漏有多离谱",
     "三个指标分别在<strong>连续 / 二分类 / 生存</strong>结局上计算："
     "生存结局需 IPCW 校正，并演示「先拟合后切分」所导致的泄漏程度"),

    # ---- 第 0 篇 ----
    ("因为只有数据自己知道真值，你才能判断估计方法到底行不行。",
     "因为只有模拟数据提供已知真值，据此方可判定估计方法是否可靠。"),

    ("所以粗差分偏出 +0.69 纯粹是混杂造成的，不是效应真的变了。",
     "因此粗差分对真值的偏离（+0.69）完全由混杂造成，并非效应本身发生变化。"),

    ("有没有抓住异质性的方向与排序；接近 1 才说明真的在区分病人",
     "是否抓住了异质性的方向与排序；接近 1 表明模型确实对个体效应作出了区分"),

    ("才敢说在这份数据上真的可用。",
     "方可判定该 learner 在此数据上确实可用。"),

    # ---- 第 4 篇 ----
    ('lede: "五种 meta-learner 只是配方，真正干活的是基学习器；换算法只改一行，还能按分组 / 阶段分开指定。"',
     'lede: "五种 meta-learner 只规定估计流程，实际拟合由基学习器完成；更换算法仅改动一个参数，'
     '并可按处理组或估计阶段分别指定。"'),

    ('<p>选 mlr3 体系的核心收益：五种 meta-learner 只是「配方」，真正干活的是基学习器，',
     '<p>选用 mlr3 体系的核心收益在于：五种 meta-learner 只规定估计流程，实际拟合由基学习器完成，'),

    ("<strong>五种 metalearner 只是「配方」，真正干活的是基学习器；"
     "换算法只是换 <code>learner_base</code> 一行</strong>，",
     "<strong>五种 metalearner 只规定估计流程，实际拟合由基学习器完成；"
     "更换算法仅需替换 <code>learner_base</code> 一处</strong>，"),

    ("脚本 13 在连续 RCT 模拟数据（n = 4000，真值 ATE = 1.048）上把这五种基学习器各跑一遍，",
     "脚本 13 在连续 RCT 模拟数据（n = 4000，真值 ATE = 1.048）上分别拟合这五种基学习器，"),

    ("它直接决定你能否找到「谁更获益」。",
     "它直接决定能否识别出「谁更获益」。"),

    ("「一行换一个基学习器」是最粗的粒度。",
     "「一行替换一个基学习器」是最粗的控制粒度。"),

    ('<a href="#/tutorialmetrics/metrics">三类结局各跑一遍</a>',
     '<a href="#/tutorialmetrics/metrics">三类结局分别计算</a>'),

    ('<div class="callout-title">四个坑，先说清</div>',
     '<div class="callout-title">四项前提限制</div>'),

    ("所以「跑一遍 mlr3 benchmark、看 CATE 相关」这套做法只适用于模拟研究。",
     "因此「运行 mlr3 benchmark 并比较 CATE 相关系数」这一做法仅适用于模拟研究。"),

    # ---- 快速开始页 ----
    ("想省事、两组都大 → <strong>T</strong>；两组不均衡（观察性常见）→ <strong>X</strong>；",
     "两组样本量均充足、优先实现简洁 → <strong>T</strong>；"
     "两组样本量不均衡（观察性研究常见）→ <strong>X</strong>；"),

    ('<div class="callout-title">二阶段学习器要正则化（最容易踩的坑）</div>',
     '<div class="callout-title">二阶段学习器需要正则化</div>'),

    ("用你自己算好的权重（稳定化权重、重叠权重等），只套用不重算。",
     "使用预先计算好的权重（稳定化权重、重叠权重等），仅套用而不重新估计。"),
]

# ---- 英文侧的口语化表述 ----
EN_PAIRS = [
    ("How to read it in one line", "Interpretation"),
    ("Only when both are good can you say the learner is genuinely usable on this dataset.",
     "Only when both criteria are satisfied can the learner be regarded as usable on this dataset."),
    ("If only ranking matters (e.g. for treatment recommendation), swap Pearson for Spearman and keep everything else.",
     "If only the ordering is of interest (for instance in treatment recommendation), "
     "replace the Pearson correlation with Spearman and keep the remaining criteria unchanged."),
    ("high correlation + large RMSE = right ranking, wrong scale (common for R/DR, whose second ",
     "high correlation with a large RMSE indicates a correct ranking on an incorrect scale, "
     "which is common for R/DR because their second "),
]


def main():
    report = []
    for fname in ("content-tutorial.js", "content-guide.js", "content-home.js"):
        path = os.path.join(JS, fname)
        text = io.open(path, "r", encoding="utf-8").read()
        n_hit = 0
        for old, new in PAIRS + (EN_PAIRS if fname == "content-tutorial.js" else []):
            c = text.count(old)
            if c == 0:
                report.append(("MISS", fname, old[:40]))
                continue
            text = text.replace(old, new)
            n_hit += c
        io.open(path, "w", encoding="utf-8", newline="\n").write(text)
        report.append(("OK", fname, n_hit))

    for kind, fname, extra in report:
        if kind == "MISS":
            print("未命中 %-22s %s" % (fname, extra))
        else:
            print("已改写 %-22s %d 处" % (fname, extra))


if __name__ == "__main__":
    main()
