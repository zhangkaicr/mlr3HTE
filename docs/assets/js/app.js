/* =====================================================================
   app.js —— 文档站逻辑
     · 哈希路由：#/页面 或 #/页面/小节
     · 中英双语切换（localStorage 记忆）
     · 明暗主题切换（首次跟随系统，之后记忆用户选择）
     · 全局搜索：加载时把所有小节正文压平成索引，做词频打分 + 片段高亮
   ===================================================================== */

(function () {
  "use strict";

  // 1 状态 ---------------------------------------------------------------
  var LS_LANG  = "mlr3hte.lang";
  var LS_THEME = "mlr3hte.theme";

  var state = {
    lang:  localStorage.getItem(LS_LANG)  || "zh",
    theme: localStorage.getItem(LS_THEME) || null,
    page:  "home",
    hash:  ""
  };

  if (!state.theme) {
    // 首次访问跟随系统偏好
    state.theme = (window.matchMedia &&
                   window.matchMedia("(prefers-color-scheme: dark)").matches)
                  ? "dark" : "light";
  }

  // 2 文案表（界面自身的双语）--------------------------------------------
  var UI = {
    zh: {
      searchPh:     "搜索文档…",
      emptySearch:  "没找到匹配内容，换个词试试。",
      langBtn:      "English",
      themeBtn:     "🌙",
      themeBtnDark: "☀️",
      onThisPage:   "本页目录",
      allResults:   "共 {n} 条结果",
      updated:      "最后更新",
      editHint:     "本站随 mlr3HTE 包一同维护。",
      home:         "首页"
    },
    en: {
      searchPh:     "Search docs…",
      emptySearch:  "No matches. Try another keyword.",
      langBtn:      "中文",
      themeBtn:     "🌙",
      themeBtnDark: "☀️",
      onThisPage:   "On this page",
      allResults:   "{n} result(s)",
      updated:      "Last updated",
      editHint:     "This site is maintained with the mlr3HTE package.",
      home:         "Home"
    }
  };

  function t(key) {
    return UI[state.lang][key] || key;
  }

  // 3 DOM 引用 -----------------------------------------------------------
  var el = {
    html:      document.documentElement,
    sidebar:   document.getElementById("sidebar"),
    content:   document.getElementById("content"),
    footer:    document.getElementById("footer"),
    input:     document.getElementById("search-input"),
    results:   document.getElementById("search-results"),
    langBtn:   document.getElementById("lang-toggle"),
    themeBtn:  document.getElementById("theme-toggle"),
    menuBtn:   document.getElementById("menu-btn")
  };

  // 4 工具 ---------------------------------------------------------------
  function stripTags(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    // 代码块保留内容，其余去掉标签
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function pages() { return window.SITE_PAGES || {}; }
  function nav()   { return window.SITE_NAV   || []; }

  // 5 主题 ---------------------------------------------------------------
  function applyTheme() {
    el.html.setAttribute("data-theme", state.theme);
    el.themeBtn.textContent = state.theme === "dark" ? t("themeBtnDark") : t("themeBtn");
    el.themeBtn.title = state.theme === "dark" ? "切换为亮色" : "切换为暗色";
    localStorage.setItem(LS_THEME, state.theme);
  }

  el.themeBtn.addEventListener("click", function () {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });

  // 6 语言 ---------------------------------------------------------------
  function applyLang() {
    el.html.lang = state.lang === "zh" ? "zh-CN" : "en";
    el.langBtn.textContent = t("langBtn");
    el.input.placeholder = t("searchPh");
    localStorage.setItem(LS_LANG, state.lang);
  }

  el.langBtn.addEventListener("click", function () {
    state.lang = state.lang === "zh" ? "en" : "zh";
    applyLang();
    renderSidebar();
    renderPage();
    buildIndex();
    closeResults();
  });

  // 7 路由 ---------------------------------------------------------------
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return { page: "home", section: "" };
    var parts = h.split("/");
    return { page: parts[0] || "home", section: parts[1] || "" };
  }

  window.addEventListener("hashchange", function () {
    var r = parseHash();
    state.page = r.page;
    renderSidebar();
    renderPage(r.section);
  });

  // 8 侧边栏 -------------------------------------------------------------
  function renderSidebar() {
    var items = nav();
    var html = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var label = state.lang === "zh" ? it.zh : it.en;
      var active = (it.id === state.page) ? " active" : "";
      html += '<a class="side-link' + active + '" href="#/' + it.id + '">' +
              escapeHtml(label) + "</a>";
      // 当前页面的小节也列出来，方便跳转
      if (it.id === state.page) {
        var pg = pages()[it.id];
        var secs = pg && pg[state.lang] && pg[state.lang].sections;
        if (secs && secs.length > 1) {
          for (var j = 0; j < secs.length; j++) {
            html += '<a class="side-link side-sub" href="#/' + it.id + "/" + secs[j].id +
                    '">' + escapeHtml(secs[j].heading) + "</a>";
          }
        }
      }
    }
    el.sidebar.innerHTML = html;
  }

  // 9 正文 ---------------------------------------------------------------
  function renderPage(sectionId) {
    var pg = pages()[state.page];
    if (!pg) {
      el.content.innerHTML = "<h1>404</h1><p>页面不存在。</p>";
      return;
    }
    var data = pg[state.lang] || pg.zh;
    var html = "<h1>" + data.title + "</h1>";
    if (data.lede) html += '<p class="lede">' + data.lede + "</p>";

    var secs = data.sections || [];
    for (var i = 0; i < secs.length; i++) {
      html += '<h2 id="' + secs[i].id + '">' + secs[i].heading + "</h2>";
      html += secs[i].body;
    }
    el.content.innerHTML = html;

    // 有指定小节就滚过去
    if (sectionId) {
      var target = document.getElementById(sectionId);
      if (target) {
        window.setTimeout(function () {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  // 10 搜索索引 ----------------------------------------------------------
  var index = [];

  function buildIndex() {
    index = [];
    var ps = pages();
    for (var pid in ps) {
      if (!Object.prototype.hasOwnProperty.call(ps, pid)) continue;
      var data = ps[pid][state.lang] || ps[pid].zh;
      if (!data || !data.sections) continue;
      for (var i = 0; i < data.sections.length; i++) {
        var s = data.sections[i];
        index.push({
          pageId:   pid,
          sectionId: s.id,
          title:    s.heading,
          pageTitle: data.title,
          text:     stripTags(s.body),
          // 供「本页目录」显示
          heading:  s.heading
        });
      }
    }
  }

  function scoreItem(item, q) {
    var title = item.title.toLowerCase();
    var pageTitle = (item.pageTitle || "").toLowerCase();
    var text = item.text.toLowerCase();

    var st = 0;
    var ti = title.indexOf(q);
    if (ti >= 0) st += 60 - Math.min(ti, 20);
    var pi = pageTitle.indexOf(q);
    if (pi >= 0) st += 25 - Math.min(pi, 10);

    var ti2 = text.indexOf(q);
    if (ti2 < 0) return 0;

    // 词频（最多计 8 次，避免长文刷分）
    var cnt = 0, pos = 0;
    while ((pos = text.indexOf(q, pos)) >= 0) { cnt++; pos += q.length; if (cnt >= 8) break; }
    st += 10 + cnt * 4;
    // 出现位置靠前加分
    st += Math.max(0, 12 - Math.floor(ti2 / 120));
    return st;
  }

  function snippet(text, q) {
    var lower = text.toLowerCase();
    var pos = lower.indexOf(q);
    if (pos < 0) pos = 0;
    var start = Math.max(0, pos - 48);
    var frag = text.substr(start, 150);
    var safe = escapeHtml(frag);
    // 高亮（在转义后的文本里找，q 已小写且不含特殊字符时安全）
    try {
      var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      safe = safe.replace(re, "<mark>$1</mark>");
    } catch (e) { /* 忽略正则异常，直接不高亮 */ }
    return (start > 0 ? "…" : "") + safe + "…";
  }

  function runSearch(raw) {
    var q = (raw || "").trim().toLowerCase();
    if (q.length < 1) { closeResults(); return; }

    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var sc = scoreItem(index[i], q);
      if (sc > 0) hits.push({ item: index[i], score: sc });
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    hits = hits.slice(0, 24);

    if (!hits.length) {
      el.results.innerHTML = '<div class="sr-empty">' + t("emptySearch") + "</div>";
      el.results.classList.add("open");
      return;
    }

    var html = "";
    for (var k = 0; k < hits.length; k++) {
      var it = hits[k].item;
      html += '<a class="sr-item" href="#/' + it.pageId + "/" + it.sectionId + '">' +
                '<div><span class="sr-title">' + escapeHtml(it.title) + "</span>" +
                '<span class="sr-path">' + escapeHtml(it.pageTitle || "") + "</span></div>" +
                '<div class="sr-snip">' + snippet(it.text, q) + "</div>" +
              "</a>";
    }
    el.results.innerHTML = html;
    el.results.classList.add("open");
  }

  function closeResults() {
    el.results.classList.remove("open");
    el.results.innerHTML = "";
  }

  el.input.addEventListener("input", function () { runSearch(el.input.value); });
  el.input.addEventListener("focus", function () {
    if (el.input.value.trim()) runSearch(el.input.value);
  });
  el.input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { el.input.value = ""; closeResults(); el.input.blur(); }
    if (e.key === "Enter") {
      var first = el.results.querySelector(".sr-item");
      if (first) { location.hash = first.getAttribute("href").slice(1); closeResults(); }
    }
  });

  // "/" 聚焦搜索框
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== el.input) {
      e.preventDefault();
      el.input.focus();
    }
  });

  // 点空白处关闭结果
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".search-wrap")) closeResults();
  });

  // 11 移动端菜单 --------------------------------------------------------
  el.menuBtn.addEventListener("click", function () {
    el.sidebar.classList.toggle("open");
  });
  el.sidebar.addEventListener("click", function (e) {
    if (e.target.classList.contains("side-link")) el.sidebar.classList.remove("open");
  });

  // 12 页脚 --------------------------------------------------------------
  function renderFooter() {
    var md = window.SITE_META || {};
    var txt = state.lang === "zh"
      ? 'mlr3HTE · 基于 mlr3 的异质性治疗效应 Meta-Learner 包　|　' + t("editHint")
      : "mlr3HTE · mlr3-native meta-learners for heterogeneous treatment effects　|　" + t("editHint");
    if (md.version) txt += "　|　" + t("updated") + ": " + md.date + " (v" + md.version + ")";
    el.footer.textContent = txt;
  }

  // 13 启动 --------------------------------------------------------------
  function boot() {
    applyTheme();
    applyLang();
    var r = parseHash();
    state.page = r.page;
    renderSidebar();
    renderPage(r.section);
    buildIndex();
    renderFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
