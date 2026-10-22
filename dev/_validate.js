// 文档站内容自检：标签闭合 + 站内 #/ 链接可解析 + 中英段落 id 对齐
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'docs', 'assets', 'js');
const sandbox = { window: {}, var_ : null };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['content-home.js', 'content-guide.js', 'content-tutorial.js', 'content-api.js',
 'content-changelog.js', 'content-references.js', 'content-environment.js'].forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
});

const pages = sandbox.window.SITE_PAGES || {};
const ids = Object.keys(pages);
let problems = [];

// 1. 中英段落 id 必须一一对应
for (const id of ids) {
  const p = pages[id];
  if (!p.zh || !p.en) { problems.push(`[${id}] 缺 zh 或 en`); continue; }
  const z = (p.zh.sections || []).map(s => s.id);
  const e = (p.en.sections || []).map(s => s.id);
  if (z.join(',') !== e.join(',')) {
    problems.push(`[${id}] 中英段落 id 不一致\n  zh: ${z.join(',')}\n  en: ${e.join(',')}`);
  }
  for (const lang of ['zh', 'en']) {
    const pg = p[lang];
    if (!pg.title || !pg.lede) problems.push(`[${id}.${lang}] 缺 title/lede`);
    const seen = new Set();
    for (const s of (pg.sections || [])) {
      if (!s.id || !s.heading || !s.body) problems.push(`[${id}.${lang}] 段落字段不全: ${s.id}`);
      if (seen.has(s.id)) problems.push(`[${id}.${lang}] 段落 id 重复: ${s.id}`);
      seen.add(s.id);
      // 标签闭合
      const tags = {};
      const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
      let m;
      while ((m = re.exec(s.body))) {
        const name = m[1].toLowerCase();
        if (['br', 'img', 'hr', 'input', 'meta', 'link'].includes(name)) continue;
        if (m[2] === '/') continue;
        if (m[0][1] === '/') tags[name] = (tags[name] || 0) - 1;
        else tags[name] = (tags[name] || 0) + 1;
      }
      for (const k of Object.keys(tags)) {
        if (tags[k] !== 0) problems.push(`[${id}.${lang}/${s.id}] <${k}> 未闭合 净差 ${tags[k]}`);
      }
      // 站内链接
      const lre = /href="#\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?"/g;
      let lm;
      while ((lm = lre.exec(s.body))) {
        if (!ids.includes(lm[1])) problems.push(`[${id}.${lang}/${s.id}] 死链 #/${lm[1]}`);
      }
    }
  }
}

console.log('pages: ' + ids.length);
if (problems.length) {
  console.log('PROBLEMS: ' + problems.length);
  problems.slice(0, 40).forEach(p => console.log(' - ' + p));
  process.exit(1);
} else {
  console.log('ALL OK');
}
