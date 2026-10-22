// 目的：把文档站里的「示例代码 + 实测输出」成对抽出来，落盘成可重跑的
//       .R 与 .expected.txt，供 _audit_run.R 逐一重跑对账。
//       起因：v0.35 发现 apidag 页的输出是手抄的另一段脚本的结果，
//       代码根本打不出贴的那份输出。这类「文档说实测、其实过期」的问题
//       必须自动查，不能靠翻页。
// 用法：node dev/_extract_examples.js
// 输出：dev/_audit/
//         case_XXX.R            该案例的示例代码
//         case_XXX.setup.R      同页、同语言、排在该案例之前的代码块（定义 d、fit 等）
//         case_XXX.expected.txt 文档里贴的实测输出
//         manifest.json
//
// 两处坑（都踩过）：
//   1. 代码块的 class 是 language-r，输出块是 r-out，别混。
//   2. 一个代码块可能由多个 JS 字符串字面量拼成（'...\n' + '...\n'），
//      捕获到的原文里会夹着 `' +` 与行首的 `'`，必须先去接缝再反转义。
//   3. 用非贪婪 .*? 配 </code> 会越过真正的结束标记，一直吞到下一个
//      带输出标记的块。改用「排除 </code>」的 tempered 写法。

const fs = require("fs");
const path = require("path");

const FILES = [
  "docs/assets/js/content-api.js",
  "docs/assets/js/content-tutorial.js",
];

const OUT_DIR = "dev/_audit";

// 捕获一段 <code> 内部原文：允许任意字符，但遇到 </code> 必须停。
const CODE_INNER = "((?:(?!<\\/code>)[\\s\\S])*)";

// 每个页面的 zh / en 两半各自独立计数，靠这个切出来
function slices(src) {
  const out = [];
  const pageRe = /window\.SITE_PAGES\.([A-Za-z0-9_]+)\s*=\s*\{/g;
  const pages = [...src.matchAll(pageRe)];
  for (let i = 0; i < pages.length; i++) {
    const id = pages[i][1];
    const start = pages[i].index;
    const end = i + 1 < pages.length ? pages[i + 1].index : src.length;
    const body = src.slice(start, end);
    const zhAt = body.search(/\bzh\s*:\s*\{/);
    const enAt = body.search(/\ben\s*:\s*\{/);
    if (zhAt >= 0 && enAt > zhAt) {
      out.push({ page: id, lang: "zh", text: body.slice(zhAt, enAt) });
      out.push({ page: id, lang: "en", text: body.slice(enAt) });
    } else {
      out.push({ page: id, lang: "zh", text: body });
    }
  }
  return out;
}

// 去掉字符串字面量的拼接接缝：'  + 换行  缩进  '
function dropSeams(raw) {
  return raw.replace(/'[ \t]*\+[ \t]*\r?\n[ \t]*'/g, "");
}

function unescapeJs(s) {
  s = s.replace(/\\\\/g, "\u0000");   // 保护字面量反斜杠
  s = s.replace(/\\n/g, "\n");
  s = s.replace(/\\t/g, "\t");
  s = s.replace(/\\"/g, '"');
  s = s.replace(/\\'/g, "'");
  s = s.replace(/\u0000/g, "\\");
  s = s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
  return s;
}

// 把一段代码原文清洗成可执行的 R 代码
function toR(raw) {
  let s = dropSeams(raw);
  s = unescapeJs(s);
  return s.trim();
}

const cases = [];

for (const f of FILES) {
  const src = fs.readFileSync(f, "utf8");

  for (const sl of slices(src)) {
    const text = sl.text;

    // 该语言半页里的所有 R 代码块，按出现顺序
    const codeRe = new RegExp(
      '<pre><code class="language-r">' + CODE_INNER + "</code></pre>",
      "g"
    );
    const codes = [];
    let m;
    while ((m = codeRe.exec(text)) !== null) {
      codes.push({ raw: m[1], end: m.index + m[0].length });
    }

    // 该语言半页里的所有实测输出块
    const outRe = new RegExp("<pre><code class=\"r-out\">" + CODE_INNER + "</code>", "g");
    const outs = [];
    while ((m = outRe.exec(text)) !== null) {
      outs.push({ raw: m[1], start: m.index });
    }

    // 配对：代码块之后紧跟着 <p>实测输出：/Output:</p> 再接输出块
    const markerRe = /<p>(?:实测输出：|Output:)<\/p>['"\s+]*<pre><code class="r-out">/g;
    const marks = [...text.matchAll(markerRe)].map((x) => x.index);

    for (let i = 0; i < codes.length; i++) {
      // 该代码块与下一块之间是否存在输出标记
      const nextStart = i + 1 < codes.length ? codes[i + 1].end : text.length;
      const mark = marks.find((p) => p >= codes[i].end && p < nextStart);
      if (mark === undefined) continue;

      // 输出块必须是标记之后最近的那个
      const out = outs.find((o) => o.start >= mark);
      if (!out) continue;

      const setup = codes.slice(0, i).map((c) => toR(c.raw)).filter(Boolean).join("\n\n");
      cases.push({
        file: f,
        page_id: sl.page,
        lang: sl.lang,
        code: toR(codes[i].raw),
        setup,
        expected: unescapeJs(dropSeams(out.raw)),
      });
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
// 不清理旧文件：批量删除会触发安全护栏；对账只读 manifest 里列的 case。

const manifest = cases.map((c, i) => {
  const tag = String(i + 1).padStart(3, "0");
  fs.writeFileSync(path.join(OUT_DIR, `case_${tag}.R`), c.code + "\n", "utf8");
  fs.writeFileSync(path.join(OUT_DIR, `case_${tag}.setup.R`), c.setup, "utf8");
  fs.writeFileSync(
    path.join(OUT_DIR, `case_${tag}.expected.txt`),
    c.expected,
    "utf8"
  );
  return {
    n: i + 1,
    tag,
    file: c.file,
    page_id: c.page_id,
    lang: c.lang,
    has_setup: c.setup.length > 0,
    n_lines: c.expected.split("\n").length,
    first_line: c.code.split("\n")[0].slice(0, 70),
  };
});

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

const withSetup = manifest.filter((m) => m.has_setup).length;
console.log(`extracted ${manifest.length} pairs (${withSetup} with setup) -> ${OUT_DIR}`);
for (const m of manifest) {
  console.log(
    `${m.tag} ${m.page_id}/${m.lang}${m.has_setup ? " [+setup]" : "        "}  ${m.first_line}`
  );
}
