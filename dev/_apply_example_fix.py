#!/usr/bin/env python3
"""把 5 个已修正的示例（代码块 + 输出块）写回 docs/assets/js/content-api.js。

背景：文档页里贴的「实测输出」带 `--- xxx ---` 分隔标题，但示例代码从不打印
这些标题 —— 读者复制代码跑不出文档里那份输出。已在 dev/_audit/case_XXX.R 里
给代码补上真正的 cat() 标题语句，并重跑得到新输出（.new.txt），这里只做
「旧文本 -> 新文本」的精确替换。

中英两版内容完全相同，所以每个替换应当命中 2 次（zh + en）。

用法：python dev/_apply_example_fix.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "docs" / "assets" / "js" / "content-api.js"
AUDIT = ROOT / "dev" / "_audit"

TAGS = ["015"]


def js_escape(text: str) -> str:
    """按 JS 单引号字符串的要求转义，与文件中既有写法保持一致。"""
    s = text.replace("\\", "\\\\")     # 真反斜杠 -> 两个
    s = s.replace("\n", "\\n")          # 真换行 -> 反斜杠 + n
    s = s.replace("\t", "\\t")
    s = s.replace("&", "&amp;")         # & 必须先于 < > 处理
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    s = s.replace("'", "\\'")
    return s


def read_text(p: Path, trim_right: bool = False) -> str:
    text = p.read_text(encoding="utf-8")
    # 统一换行、去掉文件末尾多余空行
    text = text.replace("\r\n", "\n").rstrip("\n")
    if trim_right:
        text = "\n".join(line.rstrip() for line in text.split("\n"))
    return text


def main() -> int:
    src = JS.read_text(encoding="utf-8")
    original = src
    report = []

    for tag in TAGS:
        old_code = read_text(AUDIT / f"case_{tag}.old.R")
        new_code = read_text(AUDIT / f"case_{tag}.R")
        old_out = read_text(AUDIT / f"case_{tag}.old.txt")
        new_out = read_text(AUDIT / f"case_{tag}.new.txt", trim_right=True)

        for label, old_raw, new_raw in (
            ("code", old_code, new_code),
            ("output", old_out, new_out),
        ):
            old_esc = js_escape(old_raw)
            new_esc = js_escape(new_raw)
            hits = src.count(old_esc)
            if hits == 0:
                report.append(f"  case_{tag} {label}: 未命中（跳过）")
                continue
            src = src.replace(old_esc, new_esc)
            report.append(f"  case_{tag} {label}: 替换 {hits} 处")

    if src == original:
        print("没有任何改动")
        return 1

    JS.write_text(src, encoding="utf-8")
    print("已写回 content-api.js")
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
