# 删除 content-api.js 中「首块」的 17 个重复页面定义。
# 这些定义一直被后块覆盖（从未渲染），且本身缺 title/lede 或 div 未闭合；
# 保留后块（真正在用的版本）。只删这 17 个页面的完整块，不动夹在中间的其它页面。
import io, re

P = "docs/assets/js/content-api.js"
lines = io.open(P, encoding="utf-8").read().split("\n")

defs = {}
for i, l in enumerate(lines):
    m = re.match(r"^window\.SITE_PAGES\.([A-Za-z0-9_]+) = \{", l)
    if m:
        defs.setdefault(m.group(1), []).append(i)

dup_ids = sorted(k for k, v in defs.items() if len(v) > 1)
print("重复页面 %d 个: %s" % (len(dup_ids), " ".join(dup_ids)))

to_del = set()
for pid in dup_ids:
    first = defs[pid][0]          # 只删第一个定义
    # 向下找第一个独立成行的 "};"
    j = first + 1
    while lines[j] != "};":
        j += 1
    for i in range(first, j + 1):
        to_del.add(i)
    # 连带删掉紧随其后的空行，避免留下双空行
    if j + 1 < len(lines) and lines[j + 1].strip() == "":
        to_del.add(j + 1)

kept = [l for i, l in enumerate(lines) if i not in to_del]
print("删除 %d 行，剩余 %d 行" % (len(to_del), len(kept)))
io.open(P, "w", encoding="utf-8", newline="\n").write("\n".join(kept))
