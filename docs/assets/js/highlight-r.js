/* =====================================================================
   highlight-r.js —— 轻量 R 语法高亮 + 代码块复制按钮
   不依赖任何 CDN 或构建工具：自己分词，自己着色。

   用法：由 app.js 在每次渲染页面后调用
     window.enhanceCodeBlocks(container)
   它会做三件事：
     1. 给 <pre><code class="language-r"> 加语法高亮（先取 textContent 再转义，
        所以内容里已有的 &lt; &gt; 实体不会被打乱）
     2. 给每个代码块套一层 .code-block，右上角注入「复制」按钮
     3. 给 <code class="r-out">（控制台输出）加一个「输出」角标，不注入复制按钮
   ===================================================================== */

(function () {
  "use strict";

  // 1 关键字与常量 -----------------------------------------------------------
  var KEYWORDS = [
    "if", "else", "repeat", "while", "function", "for", "in", "next", "break",
    "return", "switch"
  ];
  var CONSTS = ["TRUE", "FALSE", "NULL", "NA", "NA_integer_", "NA_real_",
                "NA_character_", "Inf", "NaN", "T", "F"];
  var KW_SET = Object.create(null);
  var CONST_SET = Object.create(null);
  KEYWORDS.forEach(function (k) { KW_SET[k] = 1; });
  CONSTS.forEach(function (k) { CONST_SET[k] = 1; });

  // 2 HTML 转义 --------------------------------------------------------------
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function span(cls, text) {
    return '<span class="tok-' + cls + '">' + esc(text) + "</span>";
  }

  // 3 分词器 -----------------------------------------------------------------
  // 只识别对可读性最有用的五类：注释、字符串、数字、关键字/常量、函数名、运算符。
  // 其余原样输出，保证高亮不会误伤内容。
  function tokenize(code) {
    var out = [];
    var i = 0, n = code.length;

    function isIdStart(c) { return /[A-Za-z._]/.test(c); }
    function isIdChar(c)  { return /[A-Za-z0-9._]/.test(c); }
    function isDigit(c)   { return /[0-9]/.test(c); }

    while (i < n) {
      var c = code[i];

      // 注释：整行到行尾
      if (c === "#") {
        var j = code.indexOf("\n", i);
        if (j === -1) j = n;
        out.push(span("com", code.slice(i, j)));
        i = j;
        continue;
      }

      // 字符串：双引号 / 单引号 / 反引号（R 的变量名转义）
      if (c === '"' || c === "'" || c === "`") {
        var q = c, k = i + 1, buf = c;
        while (k < n) {
          if (code[k] === "\\") { buf += code[k] + (code[k + 1] || ""); k += 2; continue; }
          buf += code[k];
          if (code[k] === q) { k++; break; }
          k++;
        }
        out.push(span("str", buf));
        i = k;
        continue;
      }

      // 数字（含 1e-3、0x1F、1L、.5）
      if (isDigit(c) || (c === "." && isDigit(code[i + 1] || ""))) {
        var m = /^[0-9]+(\.[0-9]*)?([eE][+-]?[0-9]+)?[Li]?|^\.[0-9]+([eE][+-]?[0-9]+)?[Li]?/.exec(code.slice(i));
        if (m) { out.push(span("num", m[0])); i += m[0].length; continue; }
      }

      // 标识符：关键字 / 常量 / 函数调用 / 普通名字
      if (isIdStart(c)) {
        var s = i;
        while (i < n && isIdChar(code[i])) i++;
        var word = code.slice(s, i);
        // 往后看第一个非空白字符，是 "(" 就当函数名
        var t = i;
        while (t < n && (code[t] === " " || code[t] === "\t")) t++;
        if (KW_SET[word])        out.push(span("kw", word));
        else if (CONST_SET[word]) out.push(span("const", word));
        else if (code[t] === "(") out.push(span("fn", word));
        else                      out.push(esc(word));
        continue;
      }

      // 特殊运算符：%>%  %in%  |>  <-  ->  <<-  ::  :::  ==  !=  <=  >=  &&  ||
      var three = code.substr(i, 3);
      var two = code.substr(i, 2);
      if (three === "<<-" || three === ":::" || three === "|>") {
        // |> 只有两字符，单独处理
      }
      if (three === "<<-" || three === ":::") {
        out.push(span("op", three)); i += 3; continue;
      }
      if (two === "<-" || two === "->" || two === "<=" || two === ">=" ||
          two === "==" || two === "!=" || two === "&&" || two === "||" ||
          two === "::" || two === "|>") {
        out.push(span("op", two)); i += 2; continue;
      }
      if (c === "%") {
        var e = code.indexOf("%", i + 1);
        if (e !== -1 && e - i < 12) {
          out.push(span("op", code.slice(i, e + 1))); i = e + 1; continue;
        }
      }
      if ("+-*/^<>=!&|~?:$@\\".indexOf(c) !== -1) {
        out.push(span("op", c)); i += 1; continue;
      }

      // 括号单独着色，帮助看清嵌套
      if ("(){}[]".indexOf(c) !== -1) {
        out.push('<span class="tok-br">' + esc(c) + "</span>");
        i += 1;
        continue;
      }

      if (c === "\n") {
        out.push("\n");
        i += 1;
        continue;
      }

      // 其余（空格、逗号等）原样输出
      var s2 = i;
      while (i < n) {
        var ch = code[i];
        if (ch === "#" || ch === '"' || ch === "'" || ch === "`" ||
            isIdStart(ch) || isDigit(ch) || "+-*/^<>=!&|~?:$@\\%(){}[]\n".indexOf(ch) !== -1) break;
        i++;
      }
      if (i === s2) { out.push(esc(code[i])); i++; }
      else out.push(esc(code.slice(s2, i)));
    }
    return out.join("");
  }

  // 4 复制 -------------------------------------------------------------------
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); resolve(); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  var ICON_COPY =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
    '<path fill="currentColor" d="M4 1.5A1.5 1.5 0 0 1 5.5 0h5A1.5 1.5 0 0 1 12 1.5V2h.5A1.5 1.5 0 0 1 14 3.5v10A1.5 1.5 0 0 1 12.5 15h-7A1.5 1.5 0 0 1 4 13.5v-1H3.5A1.5 1.5 0 0 1 2 11V3.5A1.5 1.5 0 0 1 3.5 2H4v-.5Zm1.5.5v.5h4V2h-4ZM5.5 4H3.5a.5.5 0 0 0-.5.5V11a.5.5 0 0 0 .5.5H4V3.5A.5.5 0 0 1 4.5 3h1v-1Zm1 0v9.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5Z"/></svg>';

  // 5 主入口 -----------------------------------------------------------------
  function enhanceCodeBlocks(root) {
    if (!root) return;
    var blocks = root.querySelectorAll("pre > code");

    Array.prototype.forEach.call(blocks, function (codeEl) {
      var pre = codeEl.parentNode;
      // 已经处理过就跳过（切语言会整页重渲染，但保险起见仍判断一次）
      if (pre.parentNode && pre.parentNode.classList &&
          pre.parentNode.classList.contains("code-block")) return;

      var isOutput = codeEl.classList.contains("r-out");
      var isR = codeEl.classList.contains("language-r") ||
                (!isOutput && !codeEl.className);

      var raw = codeEl.textContent;       // 实体已解码，拿到的是原始字符
      if (isR && !isOutput) {
        codeEl.innerHTML = tokenize(raw);
        codeEl.classList.add("language-r");
      }

      var wrap = document.createElement("div");
      wrap.className = "code-block" + (isOutput ? " is-output" : "");
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      if (isOutput) {
        var badge = document.createElement("span");
        badge.className = "code-badge";
        badge.textContent = "输出";
        wrap.appendChild(badge);
        return;
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "复制代码");
      btn.innerHTML = ICON_COPY + '<span class="copy-label">复制</span>';
      btn.addEventListener("click", function () {
        copyText(raw).then(function () {
          btn.classList.add("copied");
          btn.querySelector(".copy-label").textContent = "已复制";
          window.setTimeout(function () {
            btn.classList.remove("copied");
            btn.querySelector(".copy-label").textContent = "复制";
          }, 1600);
        }).catch(function () {
          btn.querySelector(".copy-label").textContent = "复制失败";
        });
      });
      wrap.appendChild(btn);
    });
  }

  window.tokenizeR = tokenize;        // 供调试或外部复用
  window.enhanceCodeBlocks = enhanceCodeBlocks;
})();
