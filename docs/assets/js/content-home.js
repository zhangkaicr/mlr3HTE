/* =====================================================================
   content-home.js —— 导航定义 + 站点元信息 + 首页（中英双语）
   ===================================================================== */

window.SITE_META = { version: "0.21", date: "2026-10-21" };

window.SITE_NAV = [
  { id: "home",      zh: "首页",           en: "Home"                    },
  { id: "guide",     zh: "架构与快速开始", en: "Architecture & Quickstart" },
  { id: "tutorial",  zh: "场景教程与模型评价", en: "Tutorial & Model Evaluation" },
  { id: "api",       zh: "函数文档",       en: "API Reference"             },
  { id: "changelog", zh: "更新日志",       en: "Changelog"                 },
  { id: "references", zh: "参考文献",      en: "References"                },
  { id: "environment", zh: "运行环境",     en: "Environment"               }
];

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.home = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "mlr3HTE",
    lede: "基于 mlr3 的异质性治疗效应（HTE / CATE）估计包：S / T / X / R / DR 五种 Meta-Learner，" +
          "一套引擎通吃连续、二分类、生存三类结局，同时适用于随机化试验与观察性研究。",
    hero: "assets/img/social-preview.png",
    heroAlt: "mlr3HTE 封面：治疗推荐前的潜在结局重合、推荐后按治疗与对照发散",
    sections: [

      {
        id: "intro",
        heading: "这是什么",
        body:
          '<div class="logo-block">' +
          '<img src="assets/img/logo.png" alt="mlr3HTE 包图标" width="150">' +
          '<p class="logo-caption">两条潜在结局曲线向右发散，中间琥珀色间隙即治疗效应；' +
          '间隙越宽表示异质性越强。</p>' +
          '</div>' +
          '<p><code>mlr3HTE</code> 把课程里的 S- / T- / X- / R- / DR-Learner 做成了正规可安装的 ' +
          'mlr3 学习器。它的核心设计只有一句话：</p>' +
          '<div class="callout ok">' +
          '<div class="callout-title">统一架构</div>' +
          '<p>五种 Meta-Learner 的公式<strong>与结局类型无关</strong>。它们只跟一个东西打交道——' +
          '<strong>结局模型</strong>，一个能返回 <code>predict(newX)</code> 的对象。</p>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局类型</th><th>结局模型返回</th><th>CATE 的含义</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>连续</td><td><code>E[Y | X]</code></td><td>均值差 <code>E[Y(1)-Y(0)|X]</code></td></tr>' +
          '<tr><td>二分类</td><td><code>P(Y=1 | X)</code></td><td><strong>风险差</strong></td></tr>' +
          '<tr><td>生存</td><td><code>S(t0 | X)</code></td><td><strong>t0 时点生存概率差</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>于是同一个骨架，换掉结局模型就换了结局类型——这就是为什么 800 余行代码能覆盖 ' +
          '3 类结局 × 2 种数据 × 5 种 learner 共 <strong>30 种组合</strong>。</p>'
      },

      {
        id: "matrix",
        heading: "六格矩阵：三类结局 × 两种数据",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th></th><th>随机化试验（RCT）</th><th>观察性研究</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><strong>连续</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = lrn("regr.ranger")</code><br>效应 = 均值差</td>' +
          '<td><code>weighting="iptw"</code> 或 <code>"external"</code><br>效应 = 均值差</td></tr>' +
          '<tr><td><strong>二分类</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = lrn("classif.ranger")</code><br>效应 = 风险差</td>' +
          '<td>同上，加 PS 加权<br>效应 = 风险差</td></tr>' +
          '<tr><td><strong>生存</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = "coxph"</code><br>效应 = t0 生存概率差</td>' +
          '<td>同上，加 PS 加权 + 删失 IPCW</td></tr>' +
          '</tbody></table></div>' +
          '<p>RCT 与观察性的<strong>唯一区别</strong>就是 <code>weighting</code> 参数：</p>' +
          '<ul>' +
          '<li><code>"none"</code> — 不加权。RCT 下倾向得分退化为常数 <code>mean(A)</code>。</li>' +
          '<li><code>"iptw"</code> — 内部训一个 PS 模型（默认 <code>classif.log_reg</code>）算逆概率权重。</li>' +
          '<li><code>"external"</code> — 用你自己算好的权重（稳定化权重、重叠权重等），只套用不重算。</li>' +
          '</ul>' +
          '<div class="callout warn">' +
          '<div class="callout-title">这是设计层面的区别</div>' +
          '<p>观察性数据里如果存在<strong>未测量</strong>的混杂，任何加权或双重稳健都救不回来。' +
          '代码技巧无法补救设计缺陷——需要先论证可交换性。</p>' +
          '</div>'
      },

      {
        id: "install",
        heading: "安装",
        body:
          '<pre><code># 开发期加载（在包目录下）\n' +
          'pkgload::load_all("mlr3HTE")\n\n' +
          '# 或从 GitHub 安装\n' +
          'remotes::install_github("zhangkaicr/mlr3HTE")\n' +
          'library(mlr3HTE)</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>依赖</th><th>用途</th><th>是否必需</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>mlr3 / mlr3learners / paradox / R6 / data.table</td><td>mlr3 体系与基学习器</td><td>必需</td></tr>' +
          '<tr><td>survival</td><td>生存分支的 coxph 与删失 IPCW</td><td>必需</td></tr>' +
          '<tr><td>ranger</td><td>默认基学习器；生存分支可选 "ranger"</td><td>可选</td></tr>' +
          '<tr><td>testthat / dplyr / cli</td><td>测试与教程脚本</td><td>可选</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">不依赖 mlr3proba</div>' +
          '<p>生存分支用 <code>survival::coxph</code> 与 <code>ranger</code> 原生实现。' +
          '传 <code>lrn("surv.*")</code> 会被明确拒绝并提示改用 <code>"coxph"</code> / <code>"ranger"</code>。</p>' +
          '</div>'
      },

      {
        id: "quickstart",
        heading: "三分钟上手",
        body:
          '<pre><code>library(mlr3); library(mlr3learners); library(mlr3HTE)\n\n' +
          '# 连续结局 · RCT\n' +
          'd <- mlr3HTE_demo_data(n = 4000)\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n\n' +
          'fit$ate          # ATE 估计\n' +
          'fit$cate_train   # 训练集上每个人的 CATE\n' +
          'fit$predict(d$X) # 新数据上的 CATE</code></pre>' +
          '<p>换成二分类只需把基学习器换成 <code>classif.*</code>；换成生存只需把结局换成 ' +
          '<code>Surv</code> 对象、基学习器换成 <code>"coxph"</code>。其余写法完全不变。</p>' +
          '<div class="cards">' +
          '<a class="card" href="#/guide"><div class="card-title">架构与快速开始 →</div>' +
          '<div class="card-desc">统一架构、两套接口、效应度量约定</div></a>' +
          '<a class="card" href="#/tutorial"><div class="card-title">六种场景教程 →</div>' +
          '<div class="card-desc">连续 / 二分类 / 生存 × RCT / 观察性，每格带真值对账</div></a>' +
          '<a class="card" href="#/api"><div class="card-title">函数文档 →</div>' +
          '<div class="card-desc">14 个导出对象的完整参数说明与示例</div></a>' +
          '<a class="card" href="#/changelog"><div class="card-title">更新日志 →</div>' +
          '<div class="card-desc">版本历史与破坏性变更</div></a>' +
          '</div>'
      },

      {
        id: "status",
        heading: "当前状态",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>能力</th><th>状态</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>连续 / 二分类 / 生存三类结局 × 五种 learner</td><td>✅ 已实现并验证</td></tr>' +
          '<tr><td>观察性数据：内部 IPTW / 外部权重</td><td>✅ 已实现并验证</td></tr>' +
          '<tr><td>R6 Learner 接入 <code>resample</code> / <code>benchmark</code></td><td>✅ 已实现并验证</td></tr>' +
          '<tr><td>testthat 测试</td><td>✅ 119 个，全部通过</td></tr>' +
          '<tr><td>配套教程（6 格 × 可运行脚本）</td><td>✅ 主文档 + 8 个脚本</td></tr>' +
          '<tr><td><code>R CMD check</code> / roxygen2 生成 man/</td><td>⏳ 待办</td></tr>' +
          '<tr><td>R / DR 的交叉拟合（cross-fitting）</td><td>⏳ 待办</td></tr>' +
          '<tr><td>生存分支的 RMST 效应选项</td><td>⏳ 待办</td></tr>' +
          '<tr><td>HTE 评价指标（Qini 曲线/系数 · c-for-benefit · TOC）</td><td>✅ 连续 / 二分类</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "mlr3HTE",
    lede: "mlr3-native estimation of heterogeneous treatment effects (HTE / CATE) with the " +
          "S, T, X, R and DR meta-learners — one engine covering continuous, binary and " +
          "survival outcomes, for both randomized trials and observational studies.",
    hero: "assets/img/social-preview.png",
    heroAlt: "mlr3HTE cover: potential outcomes coincide before a treatment recommendation, then diverge by treatment vs control",
    sections: [

      {
        id: "intro",
        heading: "What this is",
        body:
          '<div class="logo-block">' +
          '<img src="assets/img/logo.png" alt="mlr3HTE package logo" width="150">' +
          '<p class="logo-caption">Two potential-outcome curves diverge to the right; the amber gap ' +
          'between them is the treatment effect, and a wider gap means stronger heterogeneity.</p>' +
          '</div>' +
          '<p><code>mlr3HTE</code> turns the classic S- / T- / X- / R- / DR-learners into proper, ' +
          'installable mlr3 learners. The design boils down to one sentence:</p>' +
          '<div class="callout ok">' +
          '<div class="callout-title">Unified architecture</div>' +
          '<p>The five meta-learner formulas are <strong>independent of the outcome type</strong>. ' +
          'They only talk to one thing — the <strong>outcome model</strong>, an object exposing ' +
          '<code>predict(newX)</code>.</p>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th>Outcome model returns</th><th>Meaning of CATE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Continuous</td><td><code>E[Y | X]</code></td><td>Mean difference <code>E[Y(1)-Y(0)|X]</code></td></tr>' +
          '<tr><td>Binary</td><td><code>P(Y=1 | X)</code></td><td><strong>Risk difference</strong></td></tr>' +
          '<tr><td>Survival</td><td><code>S(t0 | X)</code></td><td><strong>Difference in survival at t0</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>Swap the outcome model and you swap the outcome type — which is why ~800 lines of ' +
          'code cover <strong>30 combinations</strong>: 3 outcome types × 2 data settings × 5 learners.</p>'
      },

      {
        id: "matrix",
        heading: "The 6-cell matrix: 3 outcomes × 2 settings",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th></th><th>Randomized trial (RCT)</th><th>Observational study</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><strong>Continuous</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = lrn("regr.ranger")</code><br>Effect = mean difference</td>' +
          '<td><code>weighting="iptw"</code> or <code>"external"</code><br>Effect = mean difference</td></tr>' +
          '<tr><td><strong>Binary</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = lrn("classif.ranger")</code><br>Effect = risk difference</td>' +
          '<td>Same, plus PS weighting<br>Effect = risk difference</td></tr>' +
          '<tr><td><strong>Survival</strong></td>' +
          '<td><code>weighting="none"</code><br><code>learner_base = "coxph"</code><br>Effect = survival difference at t0</td>' +
          '<td>Same, plus PS weighting and censoring IPCW</td></tr>' +
          '</tbody></table></div>' +
          '<p>The <strong>only</strong> difference between RCT and observational data is the ' +
          '<code>weighting</code> argument:</p>' +
          '<ul>' +
          '<li><code>"none"</code> — no weighting; the propensity score degenerates to <code>mean(A)</code>.</li>' +
          '<li><code>"iptw"</code> — fit a PS model internally (default <code>classif.log_reg</code>) and use inverse-probability weights.</li>' +
          '<li><code>"external"</code> — supply your own weights (stabilized, overlap, …); they are applied as-is.</li>' +
          '</ul>' +
          '<div class="callout warn">' +
          '<div class="callout-title">This is a design-level difference</div>' +
          '<p>If <strong>unmeasured</strong> confounding is present, no weighting and no double ' +
          'robustness can save you. Code cannot fix a design flaw — exchangeability must be argued first.</p>' +
          '</div>'
      },

      {
        id: "install",
        heading: "Installation",
        body:
          '<pre><code># Load during development (from the package root)\n' +
          'pkgload::load_all("mlr3HTE")\n\n' +
          '# Or install from GitHub\n' +
          'remotes::install_github("zhangkaicr/mlr3HTE")\n' +
          'library(mlr3HTE)</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Dependency</th><th>Purpose</th><th>Required</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>mlr3 / mlr3learners / paradox / R6 / data.table</td><td>mlr3 stack and base learners</td><td>Yes</td></tr>' +
          '<tr><td>survival</td><td>coxph and censoring IPCW for the survival branch</td><td>Yes</td></tr>' +
          '<tr><td>ranger</td><td>default base learner; optional "ranger" for survival</td><td>Optional</td></tr>' +
          '<tr><td>testthat / dplyr / cli</td><td>tests and tutorial scripts</td><td>Optional</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout ok">' +
          '<div class="callout-title">No mlr3proba dependency</div>' +
          '<p>The survival branch is implemented natively with <code>survival::coxph</code> and ' +
          '<code>ranger</code>. Passing <code>lrn("surv.*")</code> raises an explicit error pointing ' +
          'you to <code>"coxph"</code> / <code>"ranger"</code>.</p>' +
          '</div>'
      },

      {
        id: "quickstart",
        heading: "Three-minute quickstart",
        body:
          '<pre><code>library(mlr3); library(mlr3learners); library(mlr3HTE)\n\n' +
          '# Continuous outcome, RCT\n' +
          'd <- mlr3HTE_demo_data(n = 4000)\n' +
          'fit <- metalearner("T", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))\n\n' +
          'fit$ate          # ATE estimate\n' +
          'fit$cate_train   # CATE for every unit in the training set\n' +
          'fit$predict(d$X) # CATE on new data</code></pre>' +
          '<p>Switching to a binary outcome only means swapping the base learner to <code>classif.*</code>; ' +
          'switching to survival only means passing a <code>Surv</code> outcome with ' +
          '<code>"coxph"</code>. Everything else stays identical.</p>' +
          '<div class="cards">' +
          '<a class="card" href="#/guide"><div class="card-title">Architecture &amp; Quickstart →</div>' +
          '<div class="card-desc">Unified engine, two interfaces, effect-measure conventions</div></a>' +
          '<a class="card" href="#/tutorial"><div class="card-title">Tutorial: 6 Scenarios →</div>' +
          '<div class="card-desc">Continuous / binary / survival × RCT / observational, each with ground-truth checks</div></a>' +
          '<a class="card" href="#/api"><div class="card-title">API Reference →</div>' +
          '<div class="card-desc">Full argument docs and examples for all 13 exported objects</div></a>' +
          '<a class="card" href="#/changelog"><div class="card-title">Changelog →</div>' +
          '<div class="card-desc">Version history and breaking changes</div></a>' +
          '</div>'
      },

      {
        id: "status",
        heading: "Current status",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Capability</th><th>Status</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Continuous / binary / survival × 5 learners</td><td>✅ Implemented &amp; verified</td></tr>' +
          '<tr><td>Observational data: internal IPTW / external weights</td><td>✅ Implemented &amp; verified</td></tr>' +
          '<tr><td>R6 Learner in <code>resample</code> / <code>benchmark</code></td><td>✅ Implemented &amp; verified</td></tr>' +
          '<tr><td>testthat suite</td><td>✅ 119 tests, all passing</td></tr>' +
          '<tr><td>Tutorial (6 cells × runnable scripts)</td><td>✅ Main doc + 8 scripts</td></tr>' +
          '<tr><td><code>R CMD check</code> / roxygen2 man pages</td><td>⏳ Pending</td></tr>' +
          '<tr><td>Cross-fitting for R / DR learners</td><td>⏳ Pending</td></tr>' +
          '<tr><td>RMST effect option for survival</td><td>⏳ Pending</td></tr>' +
          '<tr><td>HTE evaluation metrics (Qini curve/coef · c-for-benefit · TOC)</td><td>✅ Continuous / binary</td></tr>' +
          '</tbody></table></div>'
      }
    ]
  }
};
