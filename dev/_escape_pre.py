"""把文档站内容里 <pre> ... </pre> 内部未转义的 < > 转成 &lt; &gt;。

问题：R 控制台输出里的 <dbl> / <int> / <chr> / <tibble> 被当成未知 HTML 标签，
浏览器直接吞掉，读者看到的输出会缺列类型行。只改 pre 块内部，不动真正的标记。
"""

import glob, io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = sorted(glob.glob(os.path.join(ROOT, "docs", "assets", "js", "content-*.js")))

PRE_OPEN = re.compile(r"<pre[^>]*>")
GUARD = "\x00CODE\x00"

total = 0
for path in FILES:
    text = io.open(path, "r", encoding="utf-8").read()
    out = []
    pos = 0
    n = 0
    for m in PRE_OPEN.finditer(text):
        start = m.start()
        close = text.find("</pre>", m.end())
        if close == -1:
            continue
        out.append(text[pos:start])
        inner = text[m.end():close]
        # 保护 <code> / </code> 这类真标记
        inner2 = inner.replace("<code>", GUARD + "O").replace("</code>", GUARD + "C")
        if "<" in inner2 or ">" in inner2:
            n += 1
        inner2 = inner2.replace("<", "&lt;").replace(">", "&gt;")
        inner2 = inner2.replace(GUARD + "O", "<code>").replace(GUARD + "C", "</code>")
        out.append(m.group(0) + inner2 + "</pre>")
        pos = close + len("</pre>")
    out.append(text[pos:])
    new = "".join(out)
    if new != text:
        io.open(path, "w", encoding="utf-8", newline="\n").write(new)
        print("%-28s %d 个 pre 块已转义" % (os.path.basename(path), n))
        total += n
print("total pre blocks fixed:", total)
