# -*- coding: utf-8 -*-
"""Rewrite the data-related function pages in content-api.js for the 3 facades."""
import pathlib, re

p = pathlib.Path("docs/assets/js/content-api.js")
t = p.read_text(encoding="utf-8")


def patch_page(name, pairs):
    global t
    start = t.index("window.SITE_PAGES.%s = {" % name)
    nxt = t.find("window.SITE_PAGES.", start + 10)
    end = nxt if nxt != -1 else len(t)
    seg = t[start:end]
    for a, b in pairs:
        if a not in seg:
            print("MISS in %-18s : %s" % (name, a[:80]))
            continue
        seg = seg.replace(a, b)
    t = t[:start] + seg + t[end:]


def patch_all(pairs, tag):
    global t
    for a, b in pairs:
        if a not in t: print("MISS global", tag, a[:80]); continue
        t = t.replace(a, b)


# ---- apidemo 总览：3 个门面 x 2 种设计，并清掉过时的「两层权重」说法 ----
patch_page("apidemo", [
 ('lede: "六个自带真实 tau 与 ate 的模拟数据集，覆盖「三类结局 × 随机化/观察性」。每个生成器一个独立页面。"',
  'lede: "模拟数据只由三个门面生成，按结局类型划分；配合 setting = \\"rct\\" / \\"obs\\" 得到六种组合，每种都自带真实 tau 与 ate。"'),
 ('lede: "Six simulated datasets carrying true tau and ate, covering three outcome types by randomized / observational. One page per generator."',
  'lede: "All simulated data come from three facades, one per outcome type. Combined with setting = \\"rct\\" / \\"obs\\" they give six combinations, each carrying true tau and ate."'),
 ('<em>观察性 + 生存：混杂与删失同时存在，两层权重相乘。</em>',
  '<em>观察性 + 生存：已测量混杂与删失同时存在，真值另含 RMST 尺度效应。</em>'),
 ('<em>随机化 + 生存；有删失但无混杂，只需 IPCW。</em>',
  '<em>随机化 + 生存；有删失但无混杂，适合单独检验删失处理。</em>'),
 ('<em>Observational + survival: confounding and censoring together, two weight layers multiplied.</em>',
  '<em>Observational + survival with measured confounding and censoring; RMST-scale truth is also returned.</em>'),
 ('<em>Randomized + survival: censoring but no confounding, IPCW only.</em>',
  '<em>Randomized + survival: censoring without confounding, useful for isolating the censoring adjustment.</em>'),
])

# ---- apiscenario：参数表换成门面的 scenario 路由 ----
patch_page("apiscenario", [
 ('title: "mlr3HTE_demo_continuous()"', 'title: "mlr3HTE_demo_surv(scenario = ...)"'),
 ('heading: "mlr3HTE_demo_continuous()"', 'heading: "mlr3HTE_demo_surv(scenario = ...)"'),
 ("'<tr><td><code>id</code></td><td>场景 id，取值见 <code>mlr3HTE_demo_continuous(catalog = TRUE)</code></td></tr>' +",
  "'<tr><td><code>scenario</code></td><td>场景 id，取值见 <code>mlr3HTE_demo_continuous(catalog = TRUE)</code></td></tr>' +"),
 ("'<tr><td><code>outcome</code></td><td><code>\"continuous\"</code> / <code>\"binary\"</code> / <code>\"survival\"</code></td></tr>' +",
  "'<tr><td><code>outcome</code></td><td>由所选门面决定：<code>mlr3HTE_demo_continuous()</code> / <code>_binary()</code> / <code>_surv()</code></td></tr>' +"),
 ("'<tr><td><code>n</code></td><td>样本量，默认 2000</td></tr>' +",
  "'<tr><td><code>n</code></td><td>样本量，门面默认 4000；按场景生成时建议显式给出</td></tr>' +"),
 ("'<tr><td><code>seed</code></td><td>随机种子；缺省时按 id 与结局派生，保证可复现</td></tr>' +",
  "'<tr><td><code>seed</code></td><td>随机种子；<code>NULL</code> 时按场景 id 与结局派生，保证可复现</td></tr>' +"),
 ("'<tr><td><code>id</code></td><td>Scenario id, see <code>mlr3HTE_demo_continuous(catalog = TRUE)</code></td></tr>' +",
  "'<tr><td><code>scenario</code></td><td>Scenario id, see <code>mlr3HTE_demo_continuous(catalog = TRUE)</code></td></tr>' +"),
 ("'<tr><td><code>outcome</code></td><td><code>\"continuous\"</code> / <code>\"binary\"</code> / <code>\"survival\"</code></td></tr>' +",
  "'<tr><td><code>outcome</code></td><td>Selected by the facade: <code>mlr3HTE_demo_continuous()</code> / <code>_binary()</code> / <code>_surv()</code></td></tr>' +"),
 ("'<tr><td><code>n</code></td><td>Sample size, default 2000</td></tr>' +",
  "'<tr><td><code>n</code></td><td>Sample size; the facade defaults to 4000, set it explicitly for scenario data</td></tr>' +"),
 ("'<tr><td><code>seed</code></td><td>Seed; derived from id and outcome when omitted</td></tr>' +",
  "'<tr><td><code>seed</code></td><td>Seed; <code>NULL</code> derives one from scenario id and outcome</td></tr>' +"),
])

# ---- apibench：标题写明 bundled 路由 ----
patch_page("apibench", [
 ('title: "mlr3HTE_demo_continuous()"', 'title: "mlr3HTE_demo_continuous(source = \'bundled\')"'),
 ('heading: "mlr3HTE_demo_continuous()"', 'heading: "mlr3HTE_demo_continuous(source = \'bundled\')"'),
])

# ---- apibenchmarkdata：返回结构 / fn-name / 示例代码 ----
patch_page("apibenchmarkdata", [
 ('<p>读取基准数据。优先 <code>.RData</code>（保留列类型、加载更快），缺失时回退 <code>.csv</code>。' +
  '<code>name = NULL</code> 返回全部（命名 list）；取单个名称返回单个 data.frame。</p>',
  '<p>读取基准数据。优先 <code>.RData</code>（保留列类型、加载更快），缺失时回退 <code>.csv</code>。' +
  '返回统一 list（<code>X / A / Y / tau / ate</code>）并附 <code>raw</code> 原始表；' +
  '<code>dataset = NULL</code> 时返回全部 5 份的命名 list。结局类型按各份数据自身的列推断。</p>'),
 ('<p>Loads a benchmark dataset, preferring <code>.RData</code> (preserves column types, faster) ' +
  'and falling back to <code>.csv</code>. <code>name = NULL</code> returns all datasets as a named ' +
  'list; a single name returns one data.frame.</p>',
  '<p>Loads a benchmark dataset, preferring <code>.RData</code> (preserves column types, faster) ' +
  'and falling back to <code>.csv</code>. Returns a unified list ' +
  '(<code>X / A / Y / tau / ate</code>) plus the untouched <code>raw</code> table; ' +
  '<code>dataset = NULL</code> returns all five datasets as a named list. Each outcome type is ' +
  'inferred from that dataset\'s own columns.</p>'),
 ('<div class="fn-name">mlr3HTE_demo_continuous()</div>',
  '<div class="fn-name">mlr3HTE_demo_continuous(export_to = dest)</div>'),
 ("'# 取单个数据集（列含 cate_true）\\n' +", "'# 取单个数据集（raw 含 cate_true）\\n' +"),
 ("'head(d)\\n\\n' +", "'head(d$raw)\\n\\n' +"),
 ("'# Take one dataset (contains cate_true)\\n' +", "'# Take one dataset (raw contains cate_true)\\n' +"),
 ("'# All datasets, named list\\n' +", "'# All five datasets, named list\\n' +"),
])

# ---- apisim 索引表：写明具体路由，修掉 mlr3HTE_dag()() ----
patch_all([
 ('<a href="#/apiscenario">mlr3HTE_demo_continuous()</a>',
  '<a href="#/apiscenario">mlr3HTE_demo_surv(scenario = "rct_lin")</a>'),
 ('<a href="#/apibench">mlr3HTE_demo_continuous()</a>',
  '<a href="#/apibench">mlr3HTE_demo_continuous(source = "bundled", dataset = "rct_lin")</a>'),
 ('mlr3HTE_demo_continuous(design = "rct") · mlr3HTE_dag()()',
  'mlr3HTE_demo_continuous(design = "rct") · mlr3HTE_dag()'),
], "apisim")

p.write_text(t, encoding="utf-8")
print("pages rewritten")
