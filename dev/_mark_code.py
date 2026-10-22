"""给文档站内容里的 <pre><code> 打上语言标记。

规则：
  含 R 语法特征（<- / library( / :: / function( / 标识符后紧跟括号）→ class="language-r"
  其余（R 控制台输出、tibble 打印）→ class="r-out"

标记之后由 highlight-r.js 在浏览器端处理：
  language-r 加语法高亮 + 复制按钮；r-out 加「输出」角标、不注入复制按钮。
"""

import glob, io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = sorted(glob.glob(os.path.join(ROOT, "docs", "assets", "js", "content-*.js")))

PRE = re.compile(r"<pre><code>(.*?)</code></pre>", re.S)
CODE_HINTS = ("&lt;-", "library(", "::", "function(", "ggplot(", "lapply(",
              "install.packages(", "|&gt;", "%&gt;%")
CALL = re.compile(r"(^|\\n)\s*[A-Za-z_.][A-Za-z0-9_.]*\(")


def classify(body):
    if any(h in body for h in CODE_HINTS):
        return "r"
    if CALL.search(body):
        return "r"
    return "out"


total_r = total_out = 0
samples_r, samples_out = [], []

for path in FILES:
    text = io.open(path, "r", encoding="utf-8").read()

    def repl(m):
        global total_r, total_out
        body = m.group(1)
        kind = classify(body)
        if kind == "r":
            total_r += 1
            if len(samples_r) < 6:
                samples_r.append(body[:80])
            return '<pre><code class="language-r">' + body + "</code></pre>"
        total_out += 1
        if len(samples_out) < 6:
            samples_out.append(body[:80])
        return '<pre><code class="r-out">' + body + "</code></pre>"

    new = PRE.sub(repl, text)
    if new != text:
        io.open(path, "w", encoding="utf-8", newline="\n").write(new)

print("code blocks : %d" % total_r)
print("output blocks: %d" % total_out)
print("\n--- 判定为代码的样本 ---")
for s in samples_r:
    print(repr(s))
print("\n--- 判定为输出的样本 ---")
for s in samples_out:
    print(repr(s))
