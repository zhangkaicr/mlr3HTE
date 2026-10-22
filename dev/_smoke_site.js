// 文档站冒烟测试：起一个本地静态服务 + jsdom 真跑页面脚本，
// 检查代码块高亮、复制按钮、输出块角标是否都正确注入。
const http = require("http");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..", "docs");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
               ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
               ".json": "application/json" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    res.end(buf);
  });
});

const problems = [];
function check(cond, msg) { if (!cond) problems.push(msg); }

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const url = "http://127.0.0.1:" + port + "/index.html";

  JSDOM.fromURL(url, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  }).then(dom => new Promise(res => {
    dom.window.addEventListener("load", () => setTimeout(() => res(dom), 400));
  })).then(dom => {
    const w = dom.window;
    const d = w.document;

    check(typeof w.enhanceCodeBlocks === "function", "enhanceCodeBlocks 未挂到 window");
    check(typeof w.tokenizeR === "function", "tokenizeR 未挂到 window");

    w.location.hash = "#/apis";
    w.dispatchEvent(new w.Event("hashchange"));

    return new Promise(res => setTimeout(() => res({ w, d }), 500));
  }).then(({ w, d }) => {
    const content = d.getElementById("content");
    const blocks    = content.querySelectorAll(".code-block");
    const copyBtns  = content.querySelectorAll(".copy-btn");
    const outBlocks = content.querySelectorAll(".code-block.is-output");
    const toks      = content.querySelectorAll(".tok-fn, .tok-op, .tok-str, .tok-num");
    const rBlocks   = content.querySelectorAll("pre > code.language-r");

    check(blocks.length > 0, "没有生成任何 .code-block");
    check(copyBtns.length > 0, "代码块没有复制按钮");
    check(toks.length > 0, "没有生成任何高亮 token");
    check(outBlocks.length > 0, "没有识别出输出块");

    Array.prototype.forEach.call(copyBtns, (b, i) => {
      if (!b.closest(".code-block")) problems.push("复制按钮 " + i + " 不在 .code-block 内");
      if (!b.querySelector(".copy-label")) problems.push("复制按钮 " + i + " 缺文案");
    });
    Array.prototype.forEach.call(blocks, (b, i) => {
      if (!b.querySelector("pre > code")) problems.push("代码块 " + i + " 里没有 pre>code");
    });

    // 转义修复的回归断言：<dbl> 必须以文本出现，不能变成真标签
    const texts = Array.prototype.map.call(content.querySelectorAll("pre"), p => p.textContent);
    check(texts.some(t => t.indexOf("<dbl>") !== -1),
          "<dbl> 没有作为文本出现（可能是转义或高亮把它们吃掉了）");
    check(content.querySelectorAll("dbl").length === 0, "出现了 <dbl> 真标签");
    check(rBlocks.length > 0, "没有 language-r 代码块");

    // 高亮结果里不应残留未转义的裸尖括号标签
    const badHtml = Array.prototype.some.call(rBlocks, c =>
      /<(?!\/?span)/.test(c.innerHTML));
    check(!badHtml, "高亮后的 HTML 里出现了非法标签");

    console.log("code-block : " + blocks.length);
    console.log("copy-btn   : " + copyBtns.length);
    console.log("output     : " + outBlocks.length);
    console.log("highlight  : " + rBlocks.length);
    console.log("tokens     : " + toks.length);

    // 再切一篇教程页，确认跨页也生效
    w.location.hash = "#/tutorialrct";
    w.dispatchEvent(new w.Event("hashchange"));
    setTimeout(() => {
      const c2 = d.getElementById("content");
      console.log("tutorial   : blocks=" + c2.querySelectorAll(".code-block").length +
                  " copy=" + c2.querySelectorAll(".copy-btn").length);
      check(c2.querySelectorAll(".code-block").length > 0, "教程页没有代码块增强");

      if (problems.length) {
        console.log("PROBLEMS: " + problems.length);
        problems.slice(0, 20).forEach(p => console.log(" - " + p));
        server.close(); process.exit(1);
      }
      console.log("SMOKE OK");
      server.close(); process.exit(0);
    }, 450);
  }).catch(e => {
    console.error("SMOKE FAILED:", (e && e.message) || e);
    server.close(); process.exit(1);
  });
});
