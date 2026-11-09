# -*- coding: utf-8 -*-
"""v0.50 / Plan A: refresh tutorial 17 figures, tables and conclusions from real outputs.

Reads tutorial/figures/17_confounding_strength.csv (250 fits, ps_bounds tightened)
and tutorial/figures/17_confounding_strength_ps_diag.csv (paired diagnostic, 3 seeds), then rewrites
both conf-sweep pages, the two cross-references, and tutorial/00_教程.md.
"""
import csv
import pathlib
import re
import shutil

ROOT = pathlib.Path(".")
MAIN_CSV = ROOT / "tutorial" / "figures" / "17_confounding_strength.csv"
DIAG_CSV = ROOT / "tutorial" / "figures" / "17_confounding_strength_ps_diag.csv"
SITE_JS = ROOT / "docs" / "assets" / "js" / "content-tutorial.js"
INDEX_MD = ROOT / "tutorial" / "00_教程.md"
FIG_SRC = ROOT / "tutorial" / "figures" / "17_confounding_strength.png"
FIG_DST = ROOT / "docs" / "assets" / "img" / "bench" / "confounding_strength.png"

STRENGTHS = [0, 0.5, 1, 1.5, 2]
FAMILIES = ["S", "T", "X", "R", "DR"]

with MAIN_CSV.open(encoding="utf-8") as f:
    main = list(csv.DictReader(f))
with DIAG_CSV.open(encoding="utf-8") as f:
    diag = list(csv.DictReader(f))

pivot = {(float(r["strength"]), r["learner"]): r for r in main}
d2 = {r["learner"]: r for r in diag if float(r["strength"]) == 2}


def signed(v, nd=3):
    return f"{float(v):+.{nd}f}".replace("-", "\u2212")


def plain(v, nd=3):
    return f"{float(v):.{nd}f}"


def label(s, lang):
    if s == 0:
        return "0（RCT）" if lang == "zh" else "0 (RCT)"
    return f"{s:.1f}"


def js_bias_rows(lang):
    out = []
    for s in STRENGTHS:
        vals = [signed(pivot[(s, "未调整差值")]["bias"])] + \
               [signed(pivot[(s, L)]["bias"]) for L in FAMILIES]
        out.append("'<tr><td>%s</td>%s</tr>'" %
                   (label(s, lang), "".join("<td>%s</td>" % v for v in vals)))
    return out


def js_cor_rows(lang):
    out = []
    for s in STRENGTHS:
        vals = [plain(pivot[(s, L)]["cor_test"]) for L in FAMILIES]
        out.append("'<tr><td>%s</td>%s</tr>'" %
                   (label(s, lang), "".join("<td>%s</td>" % v for v in vals)))
    return out


DIAG_SPECS = [
    ("R", "cor_test"), ("R", "bias"), ("R", "rmse"),
    ("DR", "cor_test"), ("DR", "rmse"), ("X", "cor_test"),
]


def js_diag_rows(lang):
    metric_zh = {"cor_test": "CATE 相关", "bias": "ATE 偏差", "rmse": "CATE RMSE"}
    metric_en = {"cor_test": "CATE cor", "bias": "ATE bias", "rmse": "CATE RMSE"}
    names = metric_zh if lang == "zh" else metric_en
    out = []
    for fam, key in DIAG_SPECS:
        lo = plain(d2[fam][key + "_default"])
        hi = plain(d2[fam][key + "_tight"])
        out.append("'<tr><td>%s</td><td>%s</td><td>%s</td><td><strong>%s</strong></td></tr>'" %
                   (fam, names[key], lo, hi))
    return out


def js_body(lines):
    return "\n".join("          " + ln + (" +" if i < len(lines) - 1 else "")
                     for i, ln in enumerate(lines))


def bias_table_md():
    lines = ["| 强度 | 未调整 | S | T | X | R | DR |", "|---|---|---|---|---|---|---|"]
    for s in STRENGTHS:
        vals = [signed(pivot[(s, "未调整差值")]["bias"])] + \
               [signed(pivot[(s, L)]["bias"]) for L in FAMILIES]
        lines.append("| %s | %s |" % (label(s, "zh"), " | ".join(vals)))
    return "\n".join(lines)


def cor_table_md():
    lines = ["| 强度 | S | T | X | R | DR |", "|---|---|---|---|---|---|"]
    for s in STRENGTHS:
        vals = [plain(pivot[(s, L)]["cor_test"]) for L in FAMILIES]
        lines.append("| %s | %s |" % (label(s, "zh"), " | ".join(vals)))
    return "\n".join(lines)


def diag_table_md():
    names = {"cor_test": "CATE 相关", "bias": "ATE 偏差", "rmse": "CATE RMSE"}
    lines = ["| 族 | 指标 | 默认 [0.01, 0.99] | 收紧 [0.05, 0.95] |",
             "|---|---|---|---|"]
    for fam, key in DIAG_SPECS:
        lines.append("| %s | %s | %s | **%s** |" %
                     (fam, names[key], plain(d2[fam][key + "_default"]),
                      plain(d2[fam][key + "_tight"])))
    return "\n".join(lines)


# ---- 中文 conf-sweep 页 ----
zh_lines = [
    "'<p>v0.40 移除了 <code>weighting</code> / <code>weights</code> / <code>stabilize</code>。'",
    "'脚本 <code>17_混杂强度扫描.R</code> 回答「那还怎么校正混杂」：把 '",
    "'<code>mlr3HTE_demo_continuous(setting = \"obs\")</code> 的 <code>strength</code> 从 0 扫到 2，'",
    "'每档重复 10 次、n = 2000、70/30 划分，R/DR 开交叉拟合。'",
    "'<strong>v0.50 起 R/DR 另外传 <code>ps_bounds = c(0.05, 0.95)</code></strong>：'",
    "'强度 2 时约 7.5% 个体真实 PS 低于 0.05，默认截断压不住 Robinson 伪结果的方差爆炸。</p>'",
    "'<figure class=\"fig\"><img src=\"assets/img/bench/confounding_strength.png\" '",
    "'alt=\"混杂强度扫描：五族在 5 档强度下的 CATE 相关与 ATE 偏差\">'",
    "'<figcaption>图 17 · 左：估计 CATE 与真实 CATE 的留出集相关；右：ATE 偏差随混杂强度的变化</figcaption></figure>'",
    "'<p><strong>第一栏是未调整差分</strong>——没有任何校正，'",
    "'从 RCT 的 +0.008 一路涨到 +1.048，基本是线性的。后面五栏是把混杂变量全部放进 X 之后的结果。</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>强度</th><th>未调整</th><th>S</th><th>T</th><th>X</th>'",
    "'<th>R</th><th>DR</th></tr></thead>'",
    "'<tbody>'",
]
zh_lines += js_bias_rows("zh")
zh_lines += [
    "'</tbody></table></div>'",
    "'<p>把混杂全放进 X 后，<strong>S / T / X / DR 四族的 |ATE 偏差| 始终不超过 0.137</strong>，'",
    "'而不校正已经到 1.048——这是「条件化能去混杂」的直接证据。'",
    "'<strong>R 是例外</strong>：偏差从 +0.014 涨到 +0.425，强度越高越明显。</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>强度</th><th>S</th><th>T</th><th>X</th><th>R</th>'",
    "'<th>DR</th></tr></thead>'",
    "'<tbody>'",
]
zh_lines += js_cor_rows("zh")
zh_lines += [
    "'</tbody></table></div>'",
    "'<p>CATE 相关讲的是另一个故事。S / T / X 几乎是一条平线（X 始终在 0.94 附近）；'",
    "'<strong>R 从 0.890 掉到 0.463</strong>，DR 只从 0.912 轻微降到 0.856。'",
    "'S/T/X 只做条件化，估计量里没有 <code>1/(A-e)</code> 这类会爆的项；'",
    "'R 的 Robinson 伪结果 <code>(Y-mu)/(A-e)</code> 与 DR 伪结果都含倒数项，'",
    "'强度 2 时 PS 取值 [0.001, 0.994]，尾部个体把方差放大。</p>'",
    "'<h3>ps_bounds 诊断：收紧救回多少，还剩多少</h3>'",
    "'<p>配对诊断 <code>dev/_diag17_ps_bounds.R</code> 在<strong>同一份数据、同一个划分</strong>上只改截断'",
    "'（3 个种子，口径与上表 10 次重复不同，只看相对变化）。强度 2 的结果：</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>族</th><th>指标</th><th>默认 [0.01, 0.99]</th><th>收紧 [0.05, 0.95]</th></tr></thead>'",
    "'<tbody>'",
]
zh_lines += js_diag_rows("zh")
zh_lines += [
    "'</tbody></table></div>'",
    "'<p>收紧把 R 的 CATE 相关从 0.197 拉回 0.496、RMSE 从 5.970 压到 1.682，X 几乎不动；'",
    "'但<strong>救不回 v0.43 移除的 tau 回归权重</strong>，收紧后 R 仍明显退化（上表相关 0.463）。'",
    "'这不是 bug，是估计量的性质。</p>'",
    "'<div class=\"callout warn\"><div class=\"callout-title\">诚实的结论</div>'",
    "'<p>倾向得分越极端，含逆概率项的估计量方差越大；条件化类的 S/T/X 不受这条规律约束。'",
    "'实践建议：要稳健的逐人排序，S/T/X 足够；要 ATE 且混杂不极端，DR 也很稳；'",
    "'<strong>一旦 PS 出现接近 0 或 1 的尾部，先看权重诊断，并优先 S/T/X/DR 而不是 R</strong>。'",
    "'本页数值基于 v0.50；更早版本的图与表是历史证据，不可直接对比。</p></div>'",
    "'<p>数据与图形由 <code>tutorial/code/17_混杂强度扫描.R</code> 生成，'",
    "'原始结果在 <code>tutorial/figures/17_confounding_strength.csv</code>（含未调整差值行），'",
    "'配对诊断脚本 <code>dev/_diag17_ps_bounds.R</code>，结果在 '",
    "'<code>tutorial/figures/17_confounding_strength_ps_diag.csv</code>，可自行复算。</p>'",
]
# ---- 英文 conf-sweep 页 ----
en_lines = [
    "'<p>v0.40 removed <code>weighting</code> / <code>weights</code> / <code>stabilize</code>. '",
    "'Script <code>17_混杂强度扫描.R</code> answers how confounding is corrected without them: '",
    "'it sweeps the <code>strength</code> argument of '",
    "'<code>mlr3HTE_demo_continuous(setting = \"obs\")</code> from 0 to 2, with 10 repeats per '",
    "'level, n = 2000, a 70/30 split, and cross-fitting for R/DR. '",
    "'<strong>Since v0.50 R/DR also pass <code>ps_bounds = c(0.05, 0.95)</code></strong>: at strength 2 '",
    "'about 7.5% of units have a true PS below 0.05, and the default clipping cannot contain '",
    "'the variance of the Robinson pseudo-outcome.</p>'",
    "'<figure class=\"fig\"><img src=\"assets/img/bench/confounding_strength.png\" '",
    "'alt=\"Confounding-strength sweep: CATE correlation and ATE bias for five families across five strengths\">'",
    "'<figcaption>Figure 17 · Left: held-out correlation between estimated and true CATE. Right: ATE bias against confounding strength</figcaption></figure>'",
    "'<p><strong>The first column is the unadjusted difference</strong> — no correction of any kind, '",
    "'so it is the cost of doing nothing: it climbs from +0.008 under RCT to +1.048, essentially linearly. '",
    "'The five columns after it place every confounder in X.</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>Strength</th><th>Unadjusted</th><th>S</th><th>T</th><th>X</th>'",
    "'<th>R</th><th>DR</th></tr></thead>'",
    "'<tbody>'",
]
en_lines += js_bias_rows("en")
en_lines += [
    "'</tbody></table></div>'",
    "'<p>With all confounders in X, <strong>S / T / X / DR never exceed an |ATE bias| of 0.137</strong>, '",
    "'while the uncorrected bias has already reached 1.048 — direct evidence that conditioning deconfounds. '",
    "'<strong>R is the exception</strong>: its bias grows from +0.014 to +0.425 as strength increases.</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>Strength</th><th>S</th><th>T</th><th>X</th><th>R</th>'",
    "'<th>DR</th></tr></thead>'",
    "'<tbody>'",
]
en_lines += js_cor_rows("en")
en_lines += [
    "'</tbody></table></div>'",
    "'<p>CATE correlation tells a different story. S / T / X are almost a flat line '",
    "'(X never leaves the neighbourhood of 0.94); <strong>R falls from 0.890 to 0.463</strong>, '",
    "'while DR only slips from 0.912 to 0.856. S/T/X only condition and contain no term like '",
    "'<code>1/(A-e)</code> that can blow up, whereas the Robinson pseudo-outcome '",
    "'<code>(Y-mu)/(A-e)</code> and the DR pseudo-outcome both carry a reciprocal; '",
    "'at strength 2 the PS ranges over [0.001, 0.994] and tail units inflate the variance.</p>'",
    "'<h3>ps_bounds diagnostic: how much clipping recovers, and what remains</h3>'",
    "'<p>The paired diagnostic <code>dev/_diag17_ps_bounds.R</code> changes only the clipping on '",
    "'<strong>the same data and the same split</strong> (3 seeds, a different protocol from the '",
    "'10 repeats above; read the relative change, not the absolute level). Results at strength 2:</p>'",
    "'<div class=\"table-wrap\"><table>'",
    "'<thead><tr><th>Family</th><th>Metric</th><th>Default [0.01, 0.99]</th><th>Tight [0.05, 0.95]</th></tr></thead>'",
    "'<tbody>'",
]
en_lines += js_diag_rows("en")
en_lines += [
    "'</tbody></table></div>'",
    "'<p>Tighter clipping lifts the R correlation from 0.197 back to 0.496 and cuts RMSE from '",
    "'5.970 to 1.682, while X barely moves; but it <strong>cannot restore the tau-regression '",
    "'weights removed in v0.43</strong>, so R still degrades visibly (correlation 0.463 above). '",
    "'This is a property of the estimator, not a bug.</p>'",
    "'<div class=\"callout warn\"><div class=\"callout-title\">The honest conclusion</div>'",
    "'<p>The more extreme the propensity score, the larger the variance of estimators containing '",
    "'inverse-probability terms; conditioning-based S/T/X are not bound by that rule. '",
    "'For robust per-person ranking, S/T/X suffice; for an ATE under mild confounding, DR is steady; '",
    "'<strong>once the PS develops tails near 0 or 1, inspect the weight diagnostics and prefer '",
    "'S/T/X/DR over R</strong>. All numbers on this page are from v0.50; earlier figures and tables '",
    "'are historical evidence and are not directly comparable.</p></div>'",
    "'<p>Data and figure come from <code>tutorial/code/17_混杂强度扫描.R</code>; the raw results '",
    "'live in <code>tutorial/figures/17_confounding_strength.csv</code> (including the unadjusted '",
    "'row). The paired diagnostic script is <code>dev/_diag17_ps_bounds.R</code> and its output is '",
    "'<code>tutorial/figures/17_confounding_strength_ps_diag.csv</code>.</p>'",
]

# ---- 替换两处 body ----
t = SITE_JS.read_text(encoding="utf-8")
marks = list(re.finditer(r'        id: "conf-sweep",\n', t))
assert len(marks) == 2, "expected exactly two conf-sweep pages, got %d" % len(marks)
spans = []
for m in marks:
    a = t.index("        body:\n", m.end()) + len("        body:\n")
    b = t.index("\n      },", a)
    spans.append((a, b))
for (a, b), lines in reversed(list(zip(spans, [zh_lines, en_lines]))):
    t = t[:a] + js_body(lines) + t[b:]

# ---- 索引行 / 交叉引用 ----
replacements = [
    ('<tr><td><code>17_混杂强度扫描.R</code></td><td><strong>v0.40 的证据页</strong>：5 档混杂强度 × 五族 × 10 次重复，报告 CATE 相关与 ATE 偏差</td></tr>',
     '<tr><td><code>17_混杂强度扫描.R</code></td><td><strong>v0.50 的证据页</strong>：5 档混杂强度 × 五族 × 10 次重复，R/DR 传 <code>ps_bounds = c(0.05, 0.95)</code>，报告 CATE 相关与 ATE 偏差</td></tr>'),
    ('<tr><td><code>17_混杂强度扫描.R</code></td><td><strong>The v0.40 evidence page</strong>: 5 confounding strengths × 5 families × 10 repeats, reporting CATE correlation and ATE bias</td></tr>',
     '<tr><td><code>17_混杂强度扫描.R</code></td><td><strong>The v0.50 evidence page</strong>: 5 confounding strengths × 5 families × 10 repeats, with <code>ps_bounds = c(0.05, 0.95)</code> for R/DR, reporting CATE correlation and ATE bias</td></tr>'),
    ("'5 档强度下未调整偏差从 +0.01 涨到 +1.05，五族始终在 0.14 以内。</p>'",
     "'5 档强度下未调整偏差从 +0.01 涨到 +1.05；S/T/X/DR 四族始终在 0.14 以内，R 在强度 2 达到 +0.425（已收紧 PS 截断）。</p>'"),
    ("'across 5 strengths the unadjusted bias grows from +0.01 to +1.05 while all five families stay within 0.14.</p>'",
     "'across 5 strengths the unadjusted bias grows from +0.01 to +1.05; S/T/X/DR stay within 0.14 while R reaches +0.425 at strength 2 even after tighter PS clipping.</p>'"),
]
for old, new in replacements:
    if old in t:
        t = t.replace(old, new, 1)
    elif new not in t:
        raise AssertionError("missing site text: %s" % old[:70])
SITE_JS.write_text(t, encoding="utf-8")

# ---- tutorial/00_教程.md 第 15 节 ----
md = INDEX_MD.read_text(encoding="utf-8")
md = md.replace(
    "| `code/17_混杂强度扫描.R` | **v0.40 的证据页**：5 档混杂强度 × 五族 × 10 次重复，报告 ATE 偏差与 CATE 相关 | 15 |",
    "| `code/17_混杂强度扫描.R` | **v0.50 的证据页**：5 档混杂强度 × 五族 × 10 次重复，R/DR 传 `ps_bounds = c(0.05, 0.95)`，报告 ATE 偏差与 CATE 相关 | 15 |",
    1,
)
section = """### 15. 混杂强度扫描：去掉加权选项后，用什么证明还能去混杂（脚本 17）

v0.40 移除了 `weighting` / `weights` / `stabilize`。要回答「那还怎么校正混杂」，
脚本 17 把 `mlr3HTE_demo_continuous(setting = "obs")` 的 `strength` 从 0 扫到 2，
每档重复 10 次、n = 2000、70/30 划分，R/DR 开交叉拟合。
**v0.50 起 R/DR 另外传 `ps_bounds = c(0.05, 0.95)`**：强度 2 时约 7.5% 个体
真实 PS < 0.05，默认截断压不住 Robinson 伪结果的方差爆炸。

**ATE 偏差**（真实 ATE = 1.05）：

__BIAS_TABLE__

**留出集 CATE 相关**：

__COR_TABLE__

**ps_bounds 配对诊断**（`dev/_diag17_ps_bounds.R`，同一数据与划分只改截断，
3 个种子，与上表 10 次重复口径不同，只看相对变化）：

__DIAG_TABLE__

两点诚实的结论：

- **条件化确实能去混杂**：混杂全进 X 时 S / T / X / DR 四族 |偏差| 始终 ≤ 0.137，
  而不校正已经到 1.048，且不需要任何用户可切换的加权开关。
  **R 是例外**：偏差随强度涨到 +0.425。
- **收紧 PS 截断缓解但没有修复 R**：配对诊断里 R 的 CATE 相关 0.197 → 0.496、
  RMSE 5.970 → 1.682，X 几乎不动；但收紧救不回 v0.43 移除的 tau 回归权重，
  主表里 R 的 CATE 相关仍从 0.890 掉到 0.463。倾向得分出现接近 0 或 1 的尾部时，
  优先 S/T/X/DR 而不是 R。这不是 bug，是估计量的性质。

图与原始数据在 `tutorial/figures/17_confounding_strength.png` 与 `.csv`
（csv 含未调整差值行）；诊断脚本 `dev/_diag17_ps_bounds.R`，
结果在 `tutorial/figures/17_confounding_strength_ps_diag.csv`，可自行复算。
"""
section = (section.replace("__BIAS_TABLE__", bias_table_md())
                  .replace("__COR_TABLE__", cor_table_md())
                  .replace("__DIAG_TABLE__", diag_table_md()))

pat = re.compile(r"(### 15\. 混杂强度扫描[^\n]*\n)(.*?)(?=\n---\n\n## 12\.)", re.S)
assert pat.search(md), "tutorial/00_教程.md section 15 not found"
md = pat.sub(lambda m: m.group(1) + section.rstrip() + "\n", md, count=1)
INDEX_MD.write_text(md, encoding="utf-8")

# ---- 同步站点图 ----
shutil.copy2(FIG_SRC, FIG_DST)

print("conf-sweep pages: 2 rewritten")
print("cross-references: 4 updated")
print("tutorial/00_教程.md: section 15 rewritten")
print("figure synced ->", FIG_DST.as_posix())
