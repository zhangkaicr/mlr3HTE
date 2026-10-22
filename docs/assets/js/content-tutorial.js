/* =====================================================================
   content-tutorial.js —— 六种场景教程（中英双语）
   每一格：数据 → 代码 → 要点 → 与真值对账表
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

var TUT_MATRIX = {
  zh: '<div class="table-wrap"><table>' +
      '<thead><tr><th></th><th>随机化试验（RCT）</th><th>观察性研究</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>连续</strong></td><td><a href="#/tutorialrct/s1">场景 1</a></td><td><a href="#/tutorialobs/s2">场景 2</a></td></tr>' +
      '<tr><td><strong>二分类</strong></td><td><a href="#/tutorialrct/s3">场景 3</a></td><td><a href="#/tutorialobs/s4">场景 4</a></td></tr>' +
      '<tr><td><strong>生存</strong></td><td><a href="#/tutorialsurv/s5">场景 5</a></td><td><a href="#/tutorialsurv/s6">场景 6</a></td></tr>' +
      '</tbody></table></div>',
  en: '<div class="table-wrap"><table>' +
      '<thead><tr><th></th><th>Randomized trial (RCT)</th><th>Observational study</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>Continuous</strong></td><td><a href="#/tutorialrct/s1">Scenario 1</a></td><td><a href="#/tutorialobs/s2">Scenario 2</a></td></tr>' +
      '<tr><td><strong>Binary</strong></td><td><a href="#/tutorialrct/s3">Scenario 3</a></td><td><a href="#/tutorialobs/s4">Scenario 4</a></td></tr>' +
      '<tr><td><strong>Survival</strong></td><td><a href="#/tutorialsurv/s5">Scenario 5</a></td><td><a href="#/tutorialsurv/s6">Scenario 6</a></td></tr>' +
      '</tbody></table></div>'
};

window.SITE_PAGES.tutorial = {
  zh: {
    title: "教程与模型评价",
    lede: "七篇文章，每篇一张独立网页。前六篇按研究设计与结局类型组织，数据自带真值，对账口径统一为 ATE 偏差 + CATE 相关 + RMSE + 估计 SD；第七篇换成现实形态——没有真实 tau，只用 Qini / TOC / c-for-benefit 比 learner。",
    sections: [
      {
        id: "about",
        heading: "这个包做什么",
        body:
          '<p><code>mlr3HTE</code> 是一个基于 mlr3 的异质性治疗效应（HTE / CATE）估计包。' +
          '它把 S- / T- / X- / R- / DR-Learner 做成可安装的 mlr3 学习器，核心设计只有一句话：' +
          '五种 meta-learner 的公式<strong>与结局类型无关</strong>，它们只跟「结局模型」打交道——' +
          '一个能返回 <code>predict(newX)</code> 的对象。</p>' +
          '<p>连续结局返回 <code>E[Y|X]</code>，二分类返回 <code>P(Y=1|X)</code>，' +
          '生存返回 <code>S(t0|X)</code>；CATE 的含义随之变成<strong>均值差</strong>、' +
          '<strong>风险差</strong>与<strong>t0 时点生存概率差</strong>。换掉结局模型就换了结局类型，' +
          '800 余行引擎代码因此覆盖 3 类结局 × 2 种数据 × 5 种 learner 共 <strong>30 种组合</strong>。</p>' +
          '<p>数据来源分成两档。随机化试验里处理与协变量独立，粗差分就是无偏估计，' +
          '重点在于各 learner 能抓到多少异质性；观察性研究存在混杂后门路径，' +
          '必须先做 IPTW 或外部权重校正，否则再好的 learner 也只是在拟合偏倚。</p>' +
          '<p>下面七篇教程按上手方式组织，每篇一张独立网页。前六篇用自带真值的模拟数据逐人对账：' +
          '真实 tau 只有模拟数据才拿得到，所以对账口径统一为 <strong>ATE 偏差 + CATE 相关 + RMSE + 估计 SD</strong>——' +
          '只报 ATE 会漏掉「平均对、个体全错」的情形。第七篇换成现实研究的形态：没有真值，' +
          '改用 <a href="#/tutorialbenchmark">Qini 系数、TOC 增益与 c-for-benefit</a> 比较排序能力，' +
          '这三个指标只依赖随机化带来的可交换性，因此现实 RCT 数据上同样可用。</p>'
      },
      {
        id: "articles",
        heading: "全部教程",
        body:
          '<p>下面每一条都是一篇<strong>独立成页</strong>的教程：数据 → 代码 → 实测输出 → 与真值对账，照着敲一遍就能跑。第一次用建议从第 0 篇读起；已经有明确研究设计，直接跳到对应框架。每篇都可以独立阅读，不必按顺序。</p>' +
          '<ul class="article-list">' +
          '<li><a href="#/tutorialbasics"><span class="art-num">0</span><span class="art-body"><strong>数据生成机制与 DAG</strong><em>六种设计共用一套模拟数据，每个场景都带真值 tau / ate，所以能逐人对账。先看因果结构。</em></span></a></li>' +
          '<li><a href="#/tutorialrct"><span class="art-num">1</span><span class="art-body"><strong>RCT 设计下的分析</strong><em>随机化下 A 与 X 独立，粗差分即无偏；重点看五种 meta-learner 各能抓到多少异质性。</em></span></a></li>' +
          '<li><a href="#/tutorialobs"><span class="art-num">2</span><span class="art-body"><strong>观察性研究分析</strong><em>混杂后门 X → e → A 让粗差分开局就偏；IPTW 与外部真实 PS 权重把偏差压回 0.05 以内。</em></span></a></li>' +
          '<li><a href="#/tutorialsurv"><span class="art-num">3</span><span class="art-body"><strong>生存结局分析</strong><em>效应是时间点依赖的：报告必须写清 t0，删失用 IPCW，观察性再叠一层 IPTW。</em></span></a></li>' +
          '<li><a href="#/tutoriallearners"><span class="art-num">4</span><span class="art-body"><strong>换不同学习器</strong><em>五种 meta-learner 只是配方，干活的是基学习器；换算法只改一行，还能按分组 / 阶段分开指定。</em></span></a></li>' +
          '<li><a href="#/tutorialmetrics"><span class="art-num">5</span><span class="art-body"><strong>模型评价指标</strong><em>Qini / c-for-benefit / TOC 回答的是「排序能力」，不是「估得准不准」，两者要分开看。</em></span></a></li>' +
          '<li><a href="#/tutorialbenchmark"><span class="art-num">6</span><span class="art-body"><strong>RCT 基准测试</strong><em>没有真实 tau 的现实 RCT 数据，怎么比 learner？用 Qini / TOC / c-for-benefit，配合交叉拟合。</em></span></a></li>' +
          '</ul>' +
          '<p>下面是按「研究设计 × 结局类型」排的六格速查表，与配套脚本的编号一一对应。</p>'
      },
      {
        id: "overview",
        heading: "六格矩阵（速查）",
        body:
              '<p>六个场景按「研究设计 × 结局类型」编号，这也是<strong>配套脚本</strong>的编号依据。' +
              '点格子进对应场景，每格都是一份可以原样跑的分析。</p>' +
              TUT_MATRIX.zh +
              '<p>所有演示数据都返回真实的 <code>tau</code> 与 <code>ate</code>，' +
              '这是教学时最有用的部分——你可以直接看出哪个 learner 真的捕捉到了异质性。</p>' +
              '<pre><code>library(mlr3HTE)   # 装完只需这一行：lrn() 已从 mlr3 再导出</code></pre>' +
              '<div class="callout"><div class="callout-title">运行前准备</div>' +
              '<p>本页每一格的代码都只依赖 <code>library(mlr3HTE)</code>——' +
              '<code>lrn()</code> 由本包从 mlr3 再导出，不用额外 <code>library(mlr3)</code>。' +
              '但如果你要自己接 <code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code> ' +
              '这些 mlr3 工作流函数，请再补一行 <code>library(mlr3)</code>。</p></div>'
      },
      {
        id: "scripts",
        heading: "配套可运行脚本",
        body:
          '<p>在 <code>mlr3HTE/</code> 目录下：</p>' +
          '<pre><code>Rscript tutorial/code/01_连续结局_随机化RCT.R</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>脚本</th><th>内容</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>00_数据生成机制与DAG.R</code></td><td><strong>先跑这个</strong>：DGP 逐步展开、DAG、真值分层表</td></tr>' +
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>连续 + RCT，五种 learner 对账</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>连续 + 观察性，IPTW vs 未调整</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>二分类 + RCT，风险差尺度</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>二分类 + 观察性</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>生存 + RCT，t0 生存概率差</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>生存 + 观察性，IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>三种结局 × 五种 learner 对比表</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '<tr><td><code>09_生存结局_survlearners引擎.R</code></td><td>生存第二套引擎 <code>engine="survlearners"</code>，与原生引擎同题对比</td></tr>' +
          '<tr><td><code>10_HTE评价指标.R</code></td><td>Qini / c-for-benefit / TOC：模型<strong>判别力</strong>评价，附随机排序对照</td></tr>' +
          '<tr><td><code>11_评价指标真值对账.R</code></td><td>用已知真 <code>tau</code> 当标尺：把误差拆成<strong>排序损失</strong>与<strong>估计噪声</strong>，并给出 c-for-benefit 的闭式上界</td></tr>' +
          '<tr><td><code>12_三类结局评价指标.R</code></td><td>三个指标在<strong>连续 / 二分类 / 生存</strong>上各跑一遍：生存要 IPCW，并演示「先拟合后切分」的泄漏有多离谱</td></tr>' +
          '<tr><td><code>13_换基学习器_基准对比.R</code></td><td><strong>用 mlr3 体系的核心收益</strong>：把基学习器从随机森林一行换成 XGBoost / GLMnet / CART / 线性回归，并用 <code>benchmark()</code> 横向比</td></tr>' +
          '</tbody></table></div>'
      },
      {
        id: "environment",
        heading: "依赖与运行环境",
        body:
          '<p>复现本教程所有结果所需的<strong>依赖包版本</strong>与<strong>测试环境</strong>（R 版本、操作系统、' +
          '测试规模、CI 配置）已单独立页整理，含直接依赖、建议依赖、关键传递依赖与<strong>完整 89 个递归依赖清单</strong>：</p>' +
          '<p><a href="#/environment" class="btn">查看运行环境与依赖版本 →</a></p>' +
          '<p>简表（直接依赖，完整见上页）：' +
          '<code>mlr3 1.8.0</code> · <code>mlr3learners 0.16.0</code> · <code>paradox 1.0.1</code> · ' +
          '<code>R6 2.6.1</code> · <code>survival 3.8-3</code> · <code>ranger 0.18.0</code> · ' +
          '<code>dplyr 1.2.1</code> · <code>cli 3.6.6</code> · <code>ggplot2 4.0.3</code>。' +
          '测试：<code>testthat 3.3.2</code>，共 8 个测试文件 / 58 个 test_that 块 / 293 个期望，全部通过。</p>'
      }
    ]
  },
  en: {
    title: "Tutorials & model evaluation",
    lede: "Seven standalone articles. The first six are organized by study design and outcome type on simulated data with known ground truth, all reconciled on one template: ATE bias + CATE correlation + RMSE + estimated SD. The seventh switches to the real-world setting — no true tau, comparing learners with Qini / TOC / c-for-benefit only.",
    sections: [
      {
        id: "about",
        heading: "What this package does",
        body:
          '<p><code>mlr3HTE</code> is an mlr3-based package for estimating heterogeneous ' +
          'treatment effects (HTE / CATE). It turns the S-, T-, X-, R- and DR-learners into ' +
          'installable mlr3 learners. The design rests on a single idea: the formulas of the five ' +
          'meta-learners are <strong>independent of the outcome type</strong>. They only ever talk to ' +
          'an <strong>outcome model</strong> — an object that returns <code>predict(newX)</code>.</p>' +
          '<p>A continuous outcome returns <code>E[Y|X]</code>, a binary outcome returns ' +
          '<code>P(Y=1|X)</code>, and a survival outcome returns <code>S(t0|X)</code>. The CATE ' +
          'then means a <strong>difference in means</strong>, a <strong>risk difference</strong>, ' +
          'or a <strong>difference in survival probability at t0</strong>. Swap the outcome model ' +
          'and you swap the outcome type, which is why roughly 800 lines of engine code cover ' +
          '3 outcome types × 2 data regimes × 5 learners = <strong>30 combinations</strong>.</p>' +
          '<p>The data side has two regimes. In a randomized trial, treatment is independent of the ' +
          'covariates, so the crude difference is already unbiased and the question is how much ' +
          'heterogeneity each learner can recover. In an observational study a confounding ' +
          'back-door path is present, so IPTW or externally supplied weights must be applied first; ' +
          'otherwise even the best learner is only fitting the bias.</p>' +
          '<p>The seven articles below are organised by how you approach the package, one page each. ' +
          'The first six use simulated data with known truth, so the reconciliation protocol is fixed: ' +
          '<strong>ATE bias + CATE correlation + RMSE + SD of the estimates</strong> — reporting the ' +
          'ATE alone hides the case where the average is right but every individual effect is wrong. ' +
          'The seventh article switches to the shape of a real study: no true tau, so learners are ' +
          'compared by <a href="#/tutorialbenchmark">Qini coefficient, TOC gain and c-for-benefit</a>, ' +
          'three metrics that rely only on the exchangeability that randomization provides and ' +
          'therefore work on real RCT data as well.</p>'
      },
      {
        id: "articles",
        heading: "All tutorials",
        body:
          '<p>Each entry below is a <strong>standalone article</strong>: data → code → actual output → reconciliation against the truth. Type it out once and it runs. Start with article 0 if this is your first time; otherwise jump straight to the framework that matches your study design. Every article stands on its own.</p>' +
          '<ul class="article-list">' +
          '<li><a href="#/tutorialbasics"><span class="art-num">0</span><span class="art-body"><strong>Data-generating process & DAGs</strong><em>All six designs share one simulated dataset carrying the true tau / ate, which is what makes unit-by-unit reconciliation possible.</em></span></a></li>' +
          '<li><a href="#/tutorialrct"><span class="art-num">1</span><span class="art-body"><strong>Analysis under RCT design</strong><em>Under randomization A is independent of X, so the naive difference is already unbiased; the question is how much heterogeneity each meta-learner captures.</em></span></a></li>' +
          '<li><a href="#/tutorialobs"><span class="art-num">2</span><span class="art-body"><strong>Observational studies</strong><em>The back-door X → e → A biases the naive difference from the start; IPTW and external true-PS weights pull it back within 0.05.</em></span></a></li>' +
          '<li><a href="#/tutorialsurv"><span class="art-num">3</span><span class="art-body"><strong>Survival outcomes</strong><em>Effects are time-point dependent: always state t0, correct censoring with IPCW, and multiply an IPTW layer on top for observational data.</em></span></a></li>' +
          '<li><a href="#/tutoriallearners"><span class="art-num">4</span><span class="art-body"><strong>Swapping the base learner</strong><em>The five meta-learners are recipes; the real work is done by the base learner. Swap it in one line, per group or per stage if you like.</em></span></a></li>' +
          '<li><a href="#/tutorialmetrics"><span class="art-num">5</span><span class="art-body"><strong>Model evaluation metrics</strong><em>Qini / c-for-benefit / TOC answer "how well does it rank" — not "is the estimate unbiased". Keep the two questions apart.</em></span></a></li>' +
          '<li><a href="#/tutorialbenchmark"><span class="art-num">6</span><span class="art-body"><strong>RCT benchmark</strong><em>Real RCT data has no true tau — how do you compare learners? Qini / TOC / c-for-benefit with cross-fitting.</em></span></a></li>' +
          '</ul>' +
          '<p>Below is the 2 × 3 lookup table (design × outcome), numbered the same way as the companion scripts.</p>'
      },
      {
        id: "overview",
        heading: "The 2 × 3 matrix (quick lookup)",
        body:
              '<p>The six scenarios are numbered by "design × outcome type", which is also how the ' +
              '<strong>companion scripts</strong> are numbered. Click a cell for a ready-to-run analysis.</p>' +
              TUT_MATRIX.en +
              '<p>Every demo dataset returns the true <code>tau</code> and <code>ate</code> — ' +
              'the most useful part for teaching, since you can see directly which learner ' +
              'actually captured the heterogeneity.</p>' +
              '<pre><code>library(mlr3HTE)   # the only line you need: lrn() is re-exported from mlr3</code></pre>' +
              '<div class="callout"><div class="callout-title">Before you run</div>' +
              '<p>Every code block on this page relies on <code>library(mlr3HTE)</code> alone — ' +
              '<code>lrn()</code> is re-exported from mlr3, so no extra <code>library(mlr3)</code> ' +
              'is required. If you chain into mlr3 workflow functions such as ' +
              '<code>resample()</code> / <code>benchmark()</code> / <code>rsmp()</code>, add ' +
              '<code>library(mlr3)</code> as well.</p></div>'
      },
      {
        id: "scripts",
        heading: "Runnable companion scripts",
        body:
          '<p>From the <code>mlr3HTE/</code> directory:</p>' +
          '<pre><code>Rscript tutorial/code/01_continuous_RCT.R</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Script</th><th>Content</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>00_数据生成机制与DAG.R</code></td><td><strong>Run this first</strong>: the DGP step by step, DAGs, truth tables</td></tr>' +
          '<tr><td><code>01_连续结局_随机化RCT.R</code></td><td>Continuous + RCT, all five learners</td></tr>' +
          '<tr><td><code>02_连续结局_观察性研究.R</code></td><td>Continuous + observational, IPTW vs unadjusted</td></tr>' +
          '<tr><td><code>03_二分类结局_随机化RCT.R</code></td><td>Binary + RCT, risk-difference scale</td></tr>' +
          '<tr><td><code>04_二分类结局_观察性研究.R</code></td><td>Binary + observational</td></tr>' +
          '<tr><td><code>05_生存结局_随机化RCT.R</code></td><td>Survival + RCT, survival difference at t0</td></tr>' +
          '<tr><td><code>06_生存结局_观察性研究.R</code></td><td>Survival + observational, IPTW × IPCW</td></tr>' +
          '<tr><td><code>07_五种metalearner横向对比.R</code></td><td>3 outcomes × 5 learners comparison tables</td></tr>' +
          '<tr><td><code>08_mlr3工作流集成.R</code></td><td><code>ml_task</code> + <code>resample</code> + <code>benchmark</code></td></tr>' +
          '<tr><td><code>09_生存结局_survlearners引擎.R</code></td><td>The second survival engine <code>engine="survlearners"</code>, head-to-head with native</td></tr>' +
          '<tr><td><code>10_HTE评价指标.R</code></td><td>Qini / c-for-benefit / TOC: <strong>discrimination</strong> metrics with a random-ordering control</td></tr>' +
          '<tr><td><code>11_评价指标真值对账.R</code></td><td>Known <code>tau</code> as the yardstick: split the error into <strong>ranking loss</strong> and <strong>estimation noise</strong>, plus the closed-form c-for-benefit ceiling</td></tr>' +
          '<tr><td><code>12_三类结局评价指标.R</code></td><td>All three metrics on <strong>continuous / binary / survival</strong>: survival needs IPCW, plus a demonstration of how badly "fit first, split later" leaks</td></tr>' +
          '<tr><td><code>13_换基学习器_基准对比.R</code></td><td><strong>The core payoff of the mlr3 system</strong>: swap the base learner from random forest to XGBoost / GLMnet / CART / linear in one line, and compare them with <code>benchmark()</code></td></tr>' +
          '</tbody></table></div>'
      },
      {
        id: "environment",
        heading: "Dependencies & environment",
        body:
          '<p>The <strong>dependency versions</strong> and <strong>testing environment</strong> needed to ' +
          'reproduce every result in this tutorial (R version, OS, test scale, CI config) are collected on a ' +
          'dedicated page, with direct deps, suggested deps, key transitive deps and the <strong>full 89-package ' +
          'recursive list</strong>:</p>' +
          '<p><a href="#/environment" class="btn">Open environment & dependency versions →</a></p>' +
          '<p>Quick table (direct deps; full list on the page above): ' +
          '<code>mlr3 1.8.0</code> · <code>mlr3learners 0.16.0</code> · <code>paradox 1.0.1</code> · ' +
          '<code>R6 2.6.1</code> · <code>survival 3.8-3</code> · <code>ranger 0.18.0</code> · ' +
          '<code>dplyr 1.2.1</code> · <code>cli 3.6.6</code> · <code>ggplot2 4.0.3</code>. ' +
          'Testing: <code>testthat 3.3.2</code>, 8 test files / 58 test_that blocks / 293 expectations, all passing.</p>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialbasics = {
  zh: {
    title: "0 · 数据生成机制与 DAG",
    lede: "六种设计共用一套模拟数据，每个场景都带真值。先弄清这张因果结构图，后面的对账才看得懂。",
    sections: [
      {
        id: "dgp",
        heading: "数据生成机制与 DAG（先读这个）",
        body:
          '<p>六个场景共用同一套<strong>数据生成过程（DGP）</strong>，只在两处不同：' +
          '结局的分布形态（连续 / 二分类 / 生存），以及处理 <code>A</code> 怎么来' +
          '（随机化 / 由协变量决定）。理解 DGP 是读懂后面每一格的前提——' +
          '因为只有数据自己知道真值，你才能判断估计方法到底行不行。' +
          '下面所有公式逐行照抄包内 <code>R/api.R</code> 的生成逻辑。</p>' +

          '<h3>共同骨架：协变量</h3>' +
          '<div class="formula">' +
          'age ~ N(60, 12)    lac ~ N(2.5, 1.2)    tumor ~ N(5, 2)    sex ~ Bern(0.45)<br>' +
          'z1 = scale(lac)    z2 = scale(tumor)   ' +
          '# z1 乳酸（越高病情越重），z2 瘤负荷</div>' +

          '<h3>三种结局，三套方程</h3>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局</th><th>生成方程（源码原文）</th><th>效应尺度</th></tr></thead><tbody>' +
          '<tr><td>连续</td><td><code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code><br>' +
          '<code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code><br>' +
          '<code>Y = mu + A·tau + N(0,1)</code></td>' +
          '<td>均值差 <code>tau</code></td></tr>' +
          '<tr><td>二分类</td><td><code>p0 = plogis(−1.2 + 0.5·z1 + 0.4·z2 + 0.1·(age−60)/12 + 0.2·sex)</code><br>' +
          '<code>tau_logit = 0.6 + 0.5·z1 − 0.4·z2</code>（对数几率尺度）<br>' +
          '<code>p1 = plogis(qlogis(p0) + tau_logit)</code>；<code>Y ~ Bern(p_A)</code></td>' +
          '<td>风险差 <code>p1 − p0</code></td></tr>' +
          '<tr><td>生存</td><td><code>tau = 0.5 + 0.4·z1 − 0.3·z2</code>（对数风险尺度）<br>' +
          '<code>base_rate = exp(−1.0 + 0.3·z1 + 0.2·z2 + 0.1·(age−60)/12 + 0.15·sex)</code><br>' +
          '<code>rate = base_rate·exp(−A·tau)</code>；<code>T ~ Exp(rate)</code>；' +
          '删失 <code>C ~ Exp(0.12)</code>，<code>time = min(T,C)</code></td>' +
          '<td><code>S(t₀)</code> 差（默认 t₀=2），另报 RMST 差</td></tr>' +
          '</tbody></table></div>' +
          '<p>注意连续结局的 <code>tau</code> 里有一项<strong>交互</strong>：' +
          '只有当「乳酸高 <em>且</em> 瘤负荷低」时处理效应才额外 +0.6——' +
          '这就是异质性的来源，只会报一个平均数的方法是抓不到它的。</p>' +

          '<h3>两种处理分配机制，两张 DAG</h3>' +
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="RCT 的 DAG：A 随机化，与 X 无关">' +
          '<figcaption>RCT：<code>A</code> 由抛硬币决定，没有父节点</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="观察性研究的 DAG：X → e → A 存在混杂">' +
          '<figcaption>观察性：<code>X → e → A</code>，红色即开放的后门路径</figcaption></figure>' +
          '</div>' +
          '<p>随机化时 <code>A ~ Bern(0.5)</code>，<code>A ⊥ X</code>，' +
          '协变量只是效应修饰者，不混杂；观察性研究中处理概率 ' +
          '<code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>，' +
          '于是 <code>X</code> 同时是 <code>A</code> 和 <code>Y</code> 的共同原因——' +
          '后门路径 <code>A ← e ← X → 结局 → Y</code> 开放，粗差分有偏。</p>' +

          '<div class="callout ok"><div class="callout-title">真值都随数据返回</div>' +
          '<p>每个 <code>mlr3HTE_demo_*</code> 函数都返回 <code>tau</code>（逐人真实 CATE）、' +
          '<code>ate</code>（真实平均效应）、<code>ps_true</code>（观察性场景的真实倾向得分）。' +
          '跑 <code>00_数据生成机制与DAG.R</code> 可以逐条打印这些真值，并按协变量分四层展示。</p></div>' +

          '<h3>实际输出：六个数据集的真值一览</h3>' +
          '<p>下面是 <code>00_数据生成机制与DAG.R</code> 的真实运行结果（tidyverse tibble 原样输出）：</p>' +
          '<pre><code># A tibble: 6 × 8\n' +
          '  数据集          结局类型        真实ATE CATE均值 CATE标准差 CATE最小 CATE最大 ATE_RMST\n' +
          '  &lt;chr&gt;           &lt;chr&gt;           &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;\n' +
          '1 连续 × RCT      连续             1.05   1.05   1.04  -2.58   4.85   NA\n' +
          '2 二分类 × RCT    二分类(风险差)    0.131  0.131  0.133 -0.232  0.563  NA\n' +
          '3 生存 × RCT      生存(S(t0)差)    0.152  0.152  0.151 -0.460  0.590  0.192\n' +
          '4 连续 × 观察性   连续             1.05   1.05   1.04  -2.14   5.03   NA\n' +
          '5 二分类 × 观察性  二分类(风险差)   0.131  0.131  0.132 -0.243  0.616  NA\n' +
          '6 生存 × 观察性   生存(S(t0)差)    0.152  0.152  0.150 -0.371  0.664  0.192\n\n' +
          '# A tibble: 3 × 2      # 观察性数据的粗差分 vs 真值\n' +
          '  指标                                值\n' +
          '  &lt;chr&gt;                            &lt;dbl&gt;\n' +
          '1 未调整差 mean(Y|A=1)-mean(Y|A=0)  1.74\n' +
          '2 真实 ATE                         1.05\n' +
          '3 未调整偏倚                        0.689\n\n' +
          'ℹ 生存数据删失比例 = 0.299</code></pre>' +
          '<p>三个要点：<strong>①</strong> CATE 均值恒等于 ATE，但标准差高达 1.0+——' +
          '平均值掩盖了个体间的巨大差异；<strong>②</strong> 生存场景额外给出 ' +
          '<code>ATE_RMST = 0.192</code>（限制平均生存时间差），与 t₀=2 的概率差 0.152 ' +
          '是同一个效应的两种尺度；<strong>③</strong> 观察性数据的真实 ATE 与 RCT ' +
          '完全相同（1.05 / 0.131 / 0.152），差别只在<strong>分配机制</strong>——' +
          '所以粗差分偏出 +0.69 纯粹是混杂造成的，不是效应真的变了。</p>'
      },
      {
        id: "recon",
        heading: "对账指标约定：为什么不能只报 ATE",
        body:
          '<div class="callout warn"><div class="callout-title">ATE 是一个数，CATE 是一张图</div>' +
          '<p>ATE 只回答「人群平均效应估得准不准」。可 CATE 的全部意义在于' +
          '<strong>异质性</strong>——报告里只有 ATE，就没法回答「模型到底有没有把谁更获益排出来」。' +
          '在自带真值的模拟数据上，下面几组指标要<strong>一起报</strong>。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>指标</th><th>算法</th><th>回答什么</th></tr></thead><tbody>' +
          '<tr><td><strong>ATE 偏差</strong></td><td>估计 ATE − 真实 ATE</td>' +
          '<td>平均层面偏没偏；观察性数据上这是混杂的照妖镜</td></tr>' +
          '<tr><td><strong>CATE 相关</strong></td><td><code>cor(估计 CATE, 真实 tau)</code>（Pearson）</td>' +
          '<td>有没有抓住异质性的方向与排序；接近 1 才说明真的在区分病人</td></tr>' +
          '<tr><td><strong>RMSE</strong></td><td><code>sqrt(mean((估计 CATE - tau)^2))</code></td>' +
          '<td>逐人估计误差的绝对尺度，可跨结局类型横向比较</td></tr>' +
          '<tr><td><strong>估计 SD vs 真实 SD</strong></td>' +
          '<td><code>sd(估计 CATE)</code> 与 <code>sd(tau)</code> 对比</td>' +
          '<td>有没有被「压平」——S-learner 常把异质性抹掉，SD 明显小于真值就是信号</td></tr>' +
          '<tr><td><strong>分位数对照</strong></td><td>估计/真实的 0/25/50/75/100% 分位</td>' +
          '<td>分布形状是否一致，比单一相关系数更直观</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>一句话读法</strong>：ATE 偏差小 + 相关低 = 平均对、异质性没学到' +
          '（常见于基学习器太弱或正则化过头）；相关高 + RMSE 大 = 排序对、绝对尺度偏' +
          '（R/DR 的二阶段对伪结果回归没有尺度约束，容易出现）；两个都好，这个 learner ' +
          '才敢说在这份数据上真的可用。</p>' +
          '<p>后面六个场景的对账表全部按这套口径出数；如果只关心排序（例如做治疗推荐），' +
          '把 Pearson 换成 Spearman 即可，其余口径不变。</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　下一篇：<a href="#/tutorialrct">1 RCT 设计下的分析 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "0 · Data-generating process & DAGs",
    lede: "All six designs share one simulated dataset carrying the truth. Understand this causal structure first, and the reconciliation tables later will make sense.",
    sections: [
      {
        id: "dgp",
        heading: "Data-generating process & DAGs (read this first)",
        body:
          '<p>All six scenarios share one <strong>data-generating process (DGP)</strong>. ' +
          'Only two things change: the outcome distribution (continuous / binary / survival) ' +
          'and how treatment <code>A</code> arises (randomised / driven by covariates). ' +
          'Understanding the DGP is a prerequisite for every scenario below — only the data ' +
          'itself knows the truth, and that is how you judge whether an estimator works. ' +
          'Every formula below is copied line by line from <code>R/api.R</code>.</p>' +

          '<h3>Shared skeleton: covariates</h3>' +
          '<div class="formula">' +
          'age ~ N(60, 12)    lac ~ N(2.5, 1.2)    tumor ~ N(5, 2)    sex ~ Bern(0.45)<br>' +
          'z1 = scale(lac)    z2 = scale(tumor)   ' +
          '# z1 lactate (higher = sicker), z2 tumor burden</div>' +

          '<h3>Three outcomes, three sets of equations</h3>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th>Generating equations (verbatim from source)</th><th>Effect scale</th></tr></thead><tbody>' +
          '<tr><td>Continuous</td><td><code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code><br>' +
          '<code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code><br>' +
          '<code>Y = mu + A·tau + N(0,1)</code></td>' +
          '<td>mean difference <code>tau</code></td></tr>' +
          '<tr><td>Binary</td><td><code>p0 = plogis(−1.2 + 0.5·z1 + 0.4·z2 + 0.1·(age−60)/12 + 0.2·sex)</code><br>' +
          '<code>tau_logit = 0.6 + 0.5·z1 − 0.4·z2</code> (log-odds scale)<br>' +
          '<code>p1 = plogis(qlogis(p0) + tau_logit)</code>; <code>Y ~ Bern(p_A)</code></td>' +
          '<td>risk difference <code>p1 − p0</code></td></tr>' +
          '<tr><td>Survival</td><td><code>tau = 0.5 + 0.4·z1 − 0.3·z2</code> (log-hazard scale)<br>' +
          '<code>base_rate = exp(−1.0 + 0.3·z1 + 0.2·z2 + 0.1·(age−60)/12 + 0.15·sex)</code><br>' +
          '<code>rate = base_rate·exp(−A·tau)</code>; <code>T ~ Exp(rate)</code>; ' +
          'censoring <code>C ~ Exp(0.12)</code>, <code>time = min(T,C)</code></td>' +
          '<td>difference in <code>S(t₀)</code> (default t₀=2), plus an RMST difference</td></tr>' +
          '</tbody></table></div>' +
          '<p>Note the <strong>interaction</strong> inside the continuous ' +
          '<code>tau</code>: the treatment effect only gains an extra +0.6 when lactate is ' +
          'high <em>and</em> tumor burden is low — that is where heterogeneity comes from, ' +
          'and any method that reports a single average cannot capture it.</p>' +

          '<h3>Two assignment mechanisms, two DAGs</h3>' +
          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="RCT DAG: A randomised, independent of X">' +
          '<figcaption>RCT: <code>A</code> is a coin flip, no parents</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="Observational DAG: X → e → A confounding">' +
          '<figcaption>Observational: <code>X → e → A</code>; the red path is the open backdoor</figcaption></figure>' +
          '</div>' +
          '<p>Under randomisation <code>A ~ Bern(0.5)</code> and <code>A ⊥ X</code>, so ' +
          'covariates only modify the effect and never confound. In the observational design ' +
          'the treatment probability is <code>e = plogis(−0.5 + 0.8·z1 + 0.4·z2)</code>, ' +
          'making <code>X</code> a common cause of both <code>A</code> and <code>Y</code> — ' +
          'the backdoor path <code>A ← e ← X → outcome → Y</code> is open, so crude ' +
          'differences are biased.</p>' +

          '<div class="callout ok"><div class="callout-title">Truth ships with the data</div>' +
          '<p>Every <code>mlr3HTE_demo_*</code> function returns <code>tau</code> (unit-level ' +
          'true CATE), <code>ate</code> (true average effect) and, for observational scenarios, ' +
          '<code>ps_true</code> (the true propensity score). Run ' +
          '<code>00_数据生成机制与DAG.R</code> to print these truths and stratify them by ' +
          'covariates.</p></div>' +

          '<h3>Actual output: truths for all six datasets</h3>' +
          '<p>Below is the real console output of <code>00_数据生成机制与DAG.R</code> ' +
          '(tidyverse tibbles, verbatim):</p>' +
          '<pre><code># A tibble: 6 × 8\n' +
          '  dataset         outcome       true_ate cate_mean cate_sd cate_min cate_max ate_rmst\n' +
          '  &lt;chr&gt;           &lt;chr&gt;        &lt;dbl&gt;   &lt;dbl&gt;   &lt;dbl&gt;  &lt;dbl&gt;  &lt;dbl&gt;   &lt;dbl&gt;\n' +
          '1 cont × RCT      continuous   1.05    1.05    1.04  -2.58   4.85   NA\n' +
          '2 binary × RCT    risk diff    0.131   0.131   0.133 -0.232  0.563  NA\n' +
          '3 surv × RCT      S(t0) diff   0.152   0.152   0.151 -0.460  0.590  0.192\n' +
          '4 cont × obs      continuous   1.05    1.05    1.04  -2.14   5.03   NA\n' +
          '5 binary × obs    risk diff    0.131   0.131   0.132 -0.243  0.616  NA\n' +
          '6 surv × obs      S(t0) diff   0.152   0.152   0.150 -0.371  0.664  0.192\n\n' +
          '# A tibble: 3 × 2      # crude difference vs truth (observational)\n' +
          '  quantity                             value\n' +
          '  &lt;chr&gt;                                &lt;dbl&gt;\n' +
          '1 crude diff mean(Y|A=1)-mean(Y|A=0)  1.74\n' +
          '2 true ATE                            1.05\n' +
          '3 crude bias                          0.689\n\n' +
          'ℹ survival censoring proportion = 0.299</code></pre>' +
          '<p>Three takeaways: <strong>(1)</strong> the mean CATE always equals the ATE, but the ' +
          'standard deviation exceeds 1.0 — the average hides enormous unit-level variation; ' +
          '<strong>(2)</strong> survival scenarios additionally report ' +
          '<code>ATE_RMST = 0.192</code> (difference in restricted mean survival time), the same ' +
          'effect as the 0.152 probability difference at t₀=2 on a different scale; ' +
          '<strong>(3)</strong> the true ATEs for the observational datasets are identical to ' +
          'their RCT counterparts (1.05 / 0.131 / 0.152) — only the <strong>assignment ' +
          'mechanism</strong> differs, so the +0.69 crude bias is pure confounding, not a real ' +
          'change in the effect.</p>'
      },
      {
        id: "recon",
        heading: "Reconciliation metrics: why ATE alone is not enough",
        body:
          '<div class="callout warn"><div class="callout-title">ATE is one number; CATE is a picture</div>' +
          '<p>ATE only answers "is the population-average effect estimated correctly". The whole point ' +
          'of CATE, though, is <strong>heterogeneity</strong> — a report with only ATE cannot answer ' +
          '"did the model actually rank who benefits more?". On simulated data with known truth, ' +
          'report all the metric groups below, <strong>together</strong>.</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Metric</th><th>Formula</th><th>What it answers</th></tr></thead><tbody>' +
          '<tr><td><strong>ATE bias</strong></td><td>estimated ATE − true ATE</td>' +
          '<td>Is the average biased? On observational data this is the confounding detector</td></tr>' +
          '<tr><td><strong>CATE correlation</strong></td><td><code>cor(estimated CATE, true tau)</code> (Pearson)</td>' +
          '<td>Did it capture the direction and ranking of heterogeneity? Close to 1 means patients are genuinely separated</td></tr>' +
          '<tr><td><strong>RMSE</strong></td><td><code>sqrt(mean((estimated CATE - tau)^2))</code></td>' +
          '<td>Absolute per-person error; comparable across outcome types</td></tr>' +
          '<tr><td><strong>Estimated SD vs true SD</strong></td>' +
          '<td>compare <code>sd(estimated CATE)</code> with <code>sd(tau)</code></td>' +
          '<td>Was heterogeneity flattened? S-learners often shrink it; an SD clearly below truth is the tell</td></tr>' +
          '<tr><td><strong>Quantile comparison</strong></td><td>0/25/50/75/100% quantiles, estimated vs true</td>' +
          '<td>Whether the distribution shape matches — more intuitive than a single correlation</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>How to read it in one line</strong>: small ATE bias + low correlation = right on ' +
          'average but heterogeneity not learned (usually a weak base learner or over-regularisation); ' +
          'high correlation + large RMSE = right ranking, wrong scale (common for R/DR, whose second ' +
          'stage regresses pseudo-outcomes with no scale constraint). Only when both are good can you ' +
          'say the learner is genuinely usable on this dataset.</p>' +
          '<p>Every scenario below reports on this same template. If only ranking matters (e.g. for ' +
          'treatment recommendation), swap Pearson for Spearman and keep everything else.</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; Next: <a href="#/tutorialrct">1 Analysis under RCT design →</a>' +
          '</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialrct = {
  zh: {
    title: "1 · RCT 设计下的分析",
    lede: "随机化下 A 与 X 独立，粗差分即无偏；难的是五种 meta-learner 各能抓到多少异质性。",
    sections: [
      {
        id: "fw-rct",
        heading: "本篇速览",
        body:
          '<p>随机化试验里 <code>A ⊥ X</code>，协变量只修饰效应、不混杂，所以粗差分本身就是无偏的因果估计。' +
          '这里的重点不是「纠偏」，而是<strong>五种 meta-learner 各自能抓到多少异质性</strong>' +
          '（CATE 与真 <em>τ</em> 的相关）。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>场景</th><th>脚本</th><th>关键结论</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialrct/s1">场景 1 · 连续 × RCT</a></td>' +
          '<td><code>01_连续结局_随机化RCT.R</code></td>' +
          '<td>X-learner 最贴合真值：CATE 与真 <em>τ</em> 相关 <strong>0.963</strong></td></tr>' +
          '<tr><td><a href="#/tutorialrct/s3">场景 3 · 二分类 × RCT</a></td>' +
          '<td><code>03_二分类结局_随机化RCT.R</code></td>' +
          '<td>效应尺度换成风险差；X-learner 相关 <strong>0.794</strong></td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "s1",
        heading: "场景 1 · 连续结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="场景 1 的 DAG：随机化连续结局">' +
          '<figcaption>图 1 · 场景 1 因果图：<code>A</code> 随机分配，<code>X</code> 只修饰效应、不混杂</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000, seed = 1201)\n' +
          'lb &lt;- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'for (tp in c("S","T","X","R","DR")) {\n' +
          '  fit &lt;- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)\n' +
          '  cat(tp, fit$ate, cor(fit$cate_train, d$tau), "\\n")\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">数据生成过程</div>' +
          '<p>真实 CATE <code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code>；' +
          '真实基线 <code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code>。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.935</td><td>0.895</td><td>0.483</td></tr>' +
          '<tr><td>T</td><td>0.951</td><td>0.845</td><td>0.653</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.950</td><td><strong>0.963</strong></td><td><strong>0.296</strong></td></tr>' +
          '<tr><td>R</td><td>0.450</td><td>0.812</td><td>0.907</td></tr>' +
          '<tr><td>DR</td><td>0.954</td><td>0.924</td><td>0.430</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>1.048</strong>。X-learner 最好；R 的 ATE 明显偏低，' +
          '是伪结果噪声 + 二阶段正则化不足所致（见<a href="#/guide/pitfalls">调参要点</a>）。</p>'
      },
      {
        id: "s3",
        heading: "场景 3 · 二分类结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" ' +
          'alt="场景 3 的 DAG：随机化二分类结局">' +
          '<figcaption>图 3 · 场景 3 因果图：结构与场景 1 相同，结局换成 ' +
          '<code>Y ~ Bern(plogis(qlogis(p0) + tau_logit))</code></figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_binary(n = 4000, seed = 1202)\n' +
          'lb &lt;- lrn("classif.ranger", num.trees = 300, seed = 1)\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = lb)\n' +
          'fit$ate   # 平均风险差</code></pre>' +
          '<div class="callout ok"><div class="callout-title">效应尺度是风险差</div>' +
          '<p>基学习器必须是 <code>classif.*</code>，引擎自动判定 <code>outcome = "binary"</code>，' +
          '结局模型返回 <code>P(Y=1|X)</code>，所以 CATE 天然落在<strong>风险差</strong>尺度上' +
          '（不是对数比、不是比值比）。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.129</td><td>0.603</td><td>0.157</td></tr>' +
          '<tr><td>T</td><td>0.128</td><td>0.492</td><td>0.223</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>0.794</strong></td><td><strong>0.096</strong></td></tr>' +
          '<tr><td>R</td><td>0.078</td><td>0.477</td><td>0.167</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>0.601</td><td>0.172</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE（风险差）= <strong>0.131</strong>。</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　下一篇：<a href="#/tutorialobs">2 观察性研究分析 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "1 · Analysis under RCT design",
    lede: "Under randomization A is independent of X, so the naive difference is already unbiased; the hard part is how much heterogeneity each meta-learner captures.",
    sections: [
      {
        id: "fw-rct",
        heading: "At a glance",
        body:
          '<p>Under randomization <code>A ⊥ X</code>, so covariates only modify the effect, they do not confound; ' +
          'the naive difference is already an unbiased causal estimate. The point here is not "debiasing" but ' +
          '<strong>how much heterogeneity each meta-learner captures</strong> (correlation of CATE with the true <em>τ</em>).</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Scenario</th><th>Script</th><th>Key result</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialrct/s1">Scenario 1 · Continuous × RCT</a></td>' +
          '<td><code>01_连续结局_随机化RCT.R</code></td>' +
          '<td>X-learner closest to truth: CATE vs true <em>τ</em> correlation <strong>0.963</strong></td></tr>' +
          '<tr><td><a href="#/tutorialrct/s3">Scenario 3 · Binary × RCT</a></td>' +
          '<td><code>03_二分类结局_随机化RCT.R</code></td>' +
          '<td>Effect scale becomes risk difference; X-learner correlation <strong>0.794</strong></td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "s1",
        heading: "Scenario 1 · Continuous outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_continuous.png" ' +
          'alt="Scenario 1 DAG: randomised continuous outcome">' +
          '<figcaption>Figure 1 · Scenario 1 DAG: <code>A</code> is randomised; ' +
          '<code>X</code> modifies the effect but does not confound</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000, seed = 1201)\n' +
          'lb &lt;- lrn("regr.ranger", num.trees = 300, seed = 1)\n\n' +
          'for (tp in c("S","T","X","R","DR")) {\n' +
          '  fit &lt;- metalearner(tp, d$X, d$A, d$Y, learner_base = lb)\n' +
          '  cat(tp, fit$ate, cor(fit$cate_train, d$tau), "\\n")\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">Data-generating process</div>' +
          '<p>True CATE <code>tau = 1.0 + 0.8·z1 − 0.5·z2 + 0.6·(z1&gt;1 &amp; z2&lt;0)</code>; ' +
          'true baseline <code>mu = 6 + 0.4·z1 + 0.5·z2 − 0.02·(age−60) + 0.3·sex</code>.</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.935</td><td>0.895</td><td>0.483</td></tr>' +
          '<tr><td>T</td><td>0.951</td><td>0.845</td><td>0.653</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.950</td><td><strong>0.963</strong></td><td><strong>0.296</strong></td></tr>' +
          '<tr><td>R</td><td>0.450</td><td>0.812</td><td>0.907</td></tr>' +
          '<tr><td>DR</td><td>0.954</td><td>0.924</td><td>0.430</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>1.048</strong>. X wins; R\'s ATE is clearly low because of ' +
          'pseudo-outcome noise plus insufficient stage-2 regularisation ' +
          '(see <a href="#/guide/pitfalls">tuning notes</a>).</p>'
      },
      {
        id: "s3",
        heading: "Scenario 3 · Binary outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_binary.png" ' +
          'alt="Scenario 3 DAG: randomised binary outcome">' +
          '<figcaption>Figure 3 · Scenario 3 DAG: same structure as Scenario 1, with the ' +
          'outcome swapped for <code>Y ~ Bern(plogis(qlogis(p0) + tau_logit))</code></figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_binary(n = 4000, seed = 1202)\n' +
          'lb &lt;- lrn("classif.ranger", num.trees = 300, seed = 1)\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = lb)\n' +
          'fit$ate   # average risk difference</code></pre>' +
          '<div class="callout ok"><div class="callout-title">The effect scale is the risk difference</div>' +
          '<p>The base learner must be <code>classif.*</code>; the engine detects ' +
          '<code>outcome = "binary"</code>, the outcome model returns <code>P(Y=1|X)</code>, and the ' +
          'CATE therefore lives on the <strong>risk-difference</strong> scale (not log-odds, not ' +
          'odds ratio).</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.129</td><td>0.603</td><td>0.157</td></tr>' +
          '<tr><td>T</td><td>0.128</td><td>0.492</td><td>0.223</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>0.794</strong></td><td><strong>0.096</strong></td></tr>' +
          '<tr><td>R</td><td>0.078</td><td>0.477</td><td>0.167</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>0.601</td><td>0.172</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE (risk difference) = <strong>0.131</strong>.</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; Next: <a href="#/tutorialobs">2 Observational studies →</a>' +
          '</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialobs = {
  zh: {
    title: "2 · 观察性研究分析",
    lede: "混杂后门让粗差分开局就偏；IPTW 与外部真实 PS 权重把它压回 0.05 以内——前提是混杂全部已测量。",
    sections: [
      {
        id: "fw-obs",
        heading: "本篇速览",
        body:
          '<p>观察性研究里 <code>X → e → A</code> 形成混杂后门路径，粗差分开局就偏' +
          '（连续 +0.689、二分类 +0.125、生存 −0.072）。本框架演示 IPTW 与外部真实 PS 权重' +
          '如何把偏差压回去——前提是混杂全部已测量。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>场景</th><th>脚本</th><th>关键结论</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialobs/s2">场景 2 · 连续 × 观察性</a></td>' +
          '<td><code>02_连续结局_观察性研究.R</code></td>' +
          '<td>未调整 <strong>+0.689</strong> → 加权后 ATE 偏差 ≤ 0.04；X-learner 的 CATE 相关 <strong>0.951</strong>、RMSE 0.327（真实 ATE 1.049）</td></tr>' +
          '<tr><td><a href="#/tutorialobs/s4">场景 4 · 二分类 × 观察性</a></td>' +
          '<td><code>04_二分类结局_观察性研究.R</code></td>' +
          '<td>未调整风险差 <strong>+0.125</strong> → IPTW + X 偏差 −0.002；CATE 相关 <strong>0.742</strong>、RMSE 0.110（真实 0.131）</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">前提</div>' +
          '<p>本数据的混杂全部来自<strong>已测量</strong>协变量，所以校正能奏效。' +
          '真实研究里若有未测量混杂，任何权重都救不回来。</p></div>'

      },
      {
        id: "s2",
        heading: "场景 2 · 连续结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="场景 2 的 DAG：观察性连续结局，X 混杂">' +
          '<figcaption>图 2 · 场景 2 因果图：红色路径 <code>X → e → A</code> 使 ' +
          '<code>X</code> 成为共同原因，粗差分有偏</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 4000, seed = 1204)   # 含混杂\n\n' +
          'naive &lt;- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])     # 有偏\n' +
          'fit   &lt;- metalearner("X", d$X, d$A, d$Y, weighting = "iptw")\n\n' +
          '# 用真实 PS 走外部权重\n' +
          'w &lt;- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)\n' +
          'metalearner("DR", d$X, d$A, d$Y, weighting = "external", weights = w)</code></pre>' +
          '<div class="callout danger"><div class="callout-title">混杂结构</div>' +
          '<p>病情越重（<code>z1</code> 高）越容易接受处理，而病情本身又影响结局。' +
          '所以粗差分会同时混进病情的影响。实测两组基线：对照组 lac 均值 2.15，处理组 3.03。</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>偏差</th><th>与真相关</th>' +
          '<th>RMSE</th><th>估计 SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整差分</td><td>1.738</td><td><strong>+0.689</strong></td>' +
          '<td>—</td><td>—</td><td>—</td></tr>' +
          '<tr><td>IPTW + X</td><td>1.007</td><td>−0.043</td>' +
          '<td>0.950</td><td>0.333</td><td>0.930</td></tr>' +
          '<tr><td>IPTW（稳定化）+ X</td><td>1.011</td><td>−0.038</td>' +
          '<td>0.951</td><td>0.327</td><td>0.940</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>1.086</td><td>+0.037</td>' +
          '<td>0.849</td><td>0.581</td><td>1.070</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>1.049</strong>，真实 CATE 的 SD = <strong>1.04</strong>。' +
          '加权把 +0.69 的偏差压到 0.04 以内；注意最后一行的<strong>估计 SD 1.07 超过真值 1.04</strong>，' +
          '说明它的 ATE 虽接近，逐人尺度已经放大——这正是「ATE 对不代表 CATE 对」的实例。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>偏差</th><th>与真相关</th>' +
          '<th>RMSE</th><th>估计 SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.943</td><td>−0.106</td><td>0.864</td><td>0.542</td><td>0.989</td></tr>' +
          '<tr><td>T</td><td>1.000</td><td>−0.048</td><td>0.793</td><td>0.719</td><td>1.160</td></tr>' +
          '<tr><td><strong>X</strong></td><td>1.000</td><td>−0.046</td>' +
          '<td><strong>0.951</strong></td><td><strong>0.327</strong></td><td>0.943</td></tr>' +
          '<tr><td>R</td><td>0.468</td><td>−0.582</td><td>0.642</td><td>0.987</td><td>0.634</td></tr>' +
          '<tr><td>DR</td><td>0.931</td><td>−0.119</td><td>0.854</td><td>0.613</td><td>1.150</td></tr>' +
          '</tbody></table></div>' +
          '<p>权重校正的是<strong>混杂</strong>，不是某个 learner 的拟合能力：' +
          '五种 learner 的 ATE 都回到真值附近，但 CATE 相关从 0.642（R）到 0.951（X）差得很远。' +
          '真实 SD = 1.04；R 的估计 SD 只有 0.634，典型的「压平」。</p>' +
          '<div class="callout warn"><div class="callout-title">提醒</div>' +
          '<p>本数据的混杂全部来自<strong>已测量</strong>协变量，所以校正能奏效。' +
          '真实研究里若有未测量混杂，任何方法都救不回来。</p></div>'
      },
      {
        id: "s4",
        heading: "场景 4 · 二分类结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" ' +
          'alt="场景 4 的 DAG：观察性二分类结局">' +
          '<figcaption>图 4 · 场景 4 因果图：同样的混杂结构，未调整风险差 ' +
          '0.256 vs 真实 0.131</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)\n\n' +
          'naive &lt;- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1),\n' +
          '                   weighting = "iptw")</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>真实 ATE</th><th>偏差</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整风险差</td><td>0.256</td><td>0.131</td><td><strong>+0.125</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.146</td><td>0.131</td><td>+0.015</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>0.163</td><td>0.131</td><td>+0.033</td></tr>' +
          '</tbody></table></div>' +
          '<p>五种 learner 在 IPTW 下的表现：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>偏差</th><th>与真相关</th>' +
          '<th>RMSE</th><th>估计 SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.144</td><td>+0.013</td><td>0.552</td><td>0.188</td><td>0.225</td></tr>' +
          '<tr><td>T</td><td>0.117</td><td>−0.014</td><td>0.444</td><td>0.257</td><td>0.286</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>−0.002</strong></td>' +
          '<td><strong>0.742</strong></td><td><strong>0.110</strong></td><td>0.164</td></tr>' +
          '<tr><td>R</td><td>0.109</td><td>−0.022</td><td>0.423</td><td>0.206</td><td>0.223</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>+0.001</td><td>0.426</td><td>0.271</td><td>0.300</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 CATE 的 SD = <strong>0.132</strong>。二分类的 CATE 落在风险差尺度上，' +
          '所以 RMSE 的量纲和连续结局不可直接比，只能在同一张表内横向看：' +
          'X 的 RMSE 0.110 不到其他 learner 的一半，估计 SD 0.164 也最接近真值。</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　下一篇：<a href="#/tutorialsurv">3 生存结局分析 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "2 · Observational studies",
    lede: "The confounding back-door biases the naive difference from the start; IPTW and external true-PS weights pull it back within 0.05 — provided all confounding is measured.",
    sections: [
      {
        id: "fw-obs",
        heading: "At a glance",
        body:
          '<p>In observational data <code>X → e → A</code> opens a confounding back-door, so the naive ' +
          'difference starts biased (continuous +0.689, binary +0.125, survival −0.072). This framework shows ' +
          'how IPTW and external true-PS weighting pull the bias back — provided all confounding is measured.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Scenario</th><th>Script</th><th>Key result</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialobs/s2">Scenario 2 · Continuous × observational</a></td>' +
          '<td><code>02_连续结局_观察性研究.R</code></td>' +
          '<td>Naive <strong>+0.689</strong> → ATE bias ≤ 0.04 after weighting; the X-learner reaches CATE correlation <strong>0.951</strong> with RMSE 0.327 (true ATE 1.049)</td></tr>' +
          '<tr><td><a href="#/tutorialobs/s4">Scenario 4 · Binary × observational</a></td>' +
          '<td><code>04_二分类结局_观察性研究.R</code></td>' +
          '<td>Naive risk difference <strong>+0.125</strong> → IPTW + X bias −0.002; CATE correlation <strong>0.742</strong> with RMSE 0.110 (true 0.131)</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Caveat</div>' +
          '<p>All confounding here comes from <strong>measured</strong> covariates, which is why adjustment works. ' +
          'With unmeasured confounding in a real study, no weighting scheme rescues you.</p></div>'

      },
      {
        id: "s2",
        heading: "Scenario 2 · Continuous outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_continuous.png" ' +
          'alt="Scenario 2 DAG: observational continuous outcome with confounding">' +
          '<figcaption>Figure 2 · Scenario 2 DAG: the red path <code>X → e → A</code> makes ' +
          '<code>X</code> a common cause; crude differences are biased</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs(n = 4000, seed = 1204)   # confounded\n\n' +
          'naive &lt;- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])     # biased\n' +
          'fit   &lt;- metalearner("X", d$X, d$A, d$Y, weighting = "iptw")\n\n' +
          '# External weights from the true PS\n' +
          'w &lt;- ifelse(d$A == 1, d$ps_true, 1 - d$ps_true)\n' +
          'metalearner("DR", d$X, d$A, d$Y, weighting = "external", weights = w)</code></pre>' +
          '<div class="callout danger"><div class="callout-title">Confounding structure</div>' +
          '<p>Sicker patients (higher <code>z1</code>) are more likely to be treated, and severity ' +
          'also affects the outcome — so the crude difference picks up severity as well. ' +
          'Observed baseline: mean lac 2.15 in controls vs 3.03 in treated.</p></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>Bias</th><th>Corr. with truth</th>' +
          '<th>RMSE</th><th>Est. SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted difference</td><td>1.738</td><td><strong>+0.689</strong></td>' +
          '<td>—</td><td>—</td><td>—</td></tr>' +
          '<tr><td>IPTW + X</td><td>1.007</td><td>−0.043</td>' +
          '<td>0.950</td><td>0.333</td><td>0.930</td></tr>' +
          '<tr><td>Stabilised IPTW + X</td><td>1.011</td><td>−0.038</td>' +
          '<td>0.951</td><td>0.327</td><td>0.940</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>1.086</td><td>+0.037</td>' +
          '<td>0.849</td><td>0.581</td><td>1.070</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>1.049</strong>; true CATE SD = <strong>1.04</strong>. ' +
          'Weighting pulls the +0.69 bias back within 0.04. Note the last row: its ' +
          '<strong>estimated SD of 1.07 exceeds the truth of 1.04</strong> — the average is close, ' +
          'but the per-person scale has blown up. That is exactly "a right ATE does not mean a right CATE".</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>Bias</th><th>Corr. with truth</th>' +
          '<th>RMSE</th><th>Est. SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.943</td><td>−0.106</td><td>0.864</td><td>0.542</td><td>0.989</td></tr>' +
          '<tr><td>T</td><td>1.000</td><td>−0.048</td><td>0.793</td><td>0.719</td><td>1.160</td></tr>' +
          '<tr><td><strong>X</strong></td><td>1.000</td><td>−0.046</td>' +
          '<td><strong>0.951</strong></td><td><strong>0.327</strong></td><td>0.943</td></tr>' +
          '<tr><td>R</td><td>0.468</td><td>−0.582</td><td>0.642</td><td>0.987</td><td>0.634</td></tr>' +
          '<tr><td>DR</td><td>0.931</td><td>−0.119</td><td>0.854</td><td>0.613</td><td>1.150</td></tr>' +
          '</tbody></table></div>' +
          '<p>Weights correct <strong>confounding</strong>, not a learner\'s fitting ability: all five ' +
          'learners land near the true ATE, yet CATE correlation ranges from 0.642 (R) to 0.951 (X). ' +
          'True SD = 1.04; R\'s estimated SD of 0.634 is a textbook case of flattening.</p>' +
          '<p>True ATE = <strong>1.049</strong>. Weighting shrinks a +0.69 bias to under 0.04.</p>' +
          '<div class="callout warn"><div class="callout-title">Caveat</div>' +
          '<p>All confounding here comes from <strong>measured</strong> covariates, so correction ' +
          'works. With unmeasured confounding in a real study, no method can save you.</p></div>'
      },
      {
        id: "s4",
        heading: "Scenario 4 · Binary outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_binary.png" ' +
          'alt="Scenario 4 DAG: observational binary outcome">' +
          '<figcaption>Figure 4 · Scenario 4 DAG: the same confounding structure; ' +
          'unadjusted risk difference 0.256 vs true 0.131</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_binary(n = 4000, seed = 1205)\n\n' +
          'naive &lt;- mean(d$Y[d$A == 1]) - mean(d$Y[d$A == 0])\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y,\n' +
          '                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1),\n' +
          '                   weighting = "iptw")</code></pre>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>True ATE</th><th>Bias</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted risk difference</td><td>0.256</td><td>0.131</td><td><strong>+0.125</strong></td></tr>' +
          '<tr><td>IPTW + X</td><td>0.146</td><td>0.131</td><td>+0.015</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>0.163</td><td>0.131</td><td>+0.033</td></tr>' +
          '</tbody></table></div>' +
          '<p>All five learners under IPTW:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>Bias</th><th>Corr. with truth</th>' +
          '<th>RMSE</th><th>Est. SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.144</td><td>+0.013</td><td>0.552</td><td>0.188</td><td>0.225</td></tr>' +
          '<tr><td>T</td><td>0.117</td><td>−0.014</td><td>0.444</td><td>0.257</td><td>0.286</td></tr>' +
          '<tr><td><strong>X</strong></td><td>0.129</td><td><strong>−0.002</strong></td>' +
          '<td><strong>0.742</strong></td><td><strong>0.110</strong></td><td>0.164</td></tr>' +
          '<tr><td>R</td><td>0.109</td><td>−0.022</td><td>0.423</td><td>0.206</td><td>0.223</td></tr>' +
          '<tr><td>DR</td><td>0.132</td><td>+0.001</td><td>0.426</td><td>0.271</td><td>0.300</td></tr>' +
          '</tbody></table></div>' +
          '<p>True CATE SD = <strong>0.132</strong>. Because the binary CATE lives on the risk-difference ' +
          'scale, its RMSE is not comparable in magnitude with the continuous scenario — compare rows ' +
          'within the table only: X\'s RMSE of 0.110 is less than half of every other learner\'s, and ' +
          'its estimated SD of 0.164 is closest to the truth.</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; Next: <a href="#/tutorialsurv">3 Survival outcomes →</a>' +
          '</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialsurv = {
  zh: {
    title: "3 · 生存结局分析",
    lede: "效应是时间点依赖的：必须写清 t0，删失用 IPCW 校正，观察性还要再叠一层 IPTW。",
    sections: [
      {
        id: "fw-surv",
        heading: "本篇速览",
        body:
          '<p>生存结局的效应是<strong>时间点依赖</strong>的：报告必须写清 <code>t0</code>，' +
          'CATE = S(t0) 差（默认 t0 = 事件时间中位数）。删失要用 IPCW 校正，' +
          '观察性下还要再叠一层 IPTW（两层权重相乘）。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>场景</th><th>脚本</th><th>关键结论</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialsurv/s5">场景 5 · 生存 × RCT</a></td>' +
          '<td><code>05_生存结局_随机化RCT.R</code></td>' +
          '<td>T-learner + Cox：CATE 与真 <em>τ</em> 相关 <strong>0.993</strong></td></tr>' +
          '<tr><td><a href="#/tutorialsurv/s6">场景 6 · 生存 × 观察性</a></td>' +
          '<td><code>06_生存结局_观察性研究.R</code></td>' +
          '<td>IPTW × IPCW 两层权重；T-learner 的 CATE 相关 <strong>0.967</strong>、RMSE 0.042，而外部权重 + DR 的 ATE 只偏 +0.007 但相关仅 0.123——<strong>只看 ATE 会看错</strong></td></tr>' +
          '<tr><td><a href="#/tutorialsurv/sl-engine">第二套引擎 survlearners</a></td>' +
          '<td><code>09_生存结局_survlearners引擎.R</code></td>' +
          '<td>同一道题两种引擎，结果可对账</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "s5",
        heading: "场景 5 · 生存结局 × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" ' +
          'alt="场景 5 的 DAG：随机化生存结局">' +
          '<figcaption>图 5 · 场景 5 因果图：<code>Y</code> 是 (时间, 事件) 二元组，' +
          '另有指数删失（图中略）</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_surv(n = 4000, t0 = 2, seed = 1203)\n\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # 平均 S₁(2) − S₀(2)\n\n' +
          '# 也可以换非线性基学习器\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "ranger", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">效应是时间点依赖的</div>' +
          '<p>生存概率差在不同 <code>t0</code> 上取值不同，报告时必须写清 <code>t0</code>：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>t0</th><th>1</th><th>2</th><th>4</th></tr></thead>' +
          '<tbody><tr><td>ATE</td><td>0.104</td><td>0.129</td><td>0.124</td></tr></tbody></table></div>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.130</td><td><strong>−0.017</strong></td><td>0.153</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.129</td><td><strong>0.993</strong></td><td><strong>0.030</strong></td></tr>' +
          '<tr><td>X</td><td>0.123</td><td>0.840</td><td>0.088</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.261</td><td>0.305</td></tr>' +
          '<tr><td>DR</td><td>0.088</td><td>0.232</td><td>0.304</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 ATE = <strong>0.152</strong>，删失 29.9%。</p>' +
          '<div class="callout warn"><div class="callout-title">S 的相关接近 0 是预期的</div>' +
          '<p>Cox 是比例风险 + 线性预测，A 作为普通协变量无法表达 <code>A × X</code> 交互，' +
          'CATE 退化成常数。要捕捉异质性请用 T 或 X。</p></div>'
      },
      {
        id: "s6",
        heading: "场景 6 · 生存结局 × 观察性研究",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" ' +
          'alt="场景 6 的 DAG：观察性生存结局">' +
          '<figcaption>图 6 · 场景 6 因果图：混杂（红）之外还有删失，' +
          'IPTW × IPCW 两层权重相乘</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_surv(n = 4000, t0 = 2, seed = 1206)\n\n' +
          '# 未调整：分两组做 Kaplan-Meier，再取 t0 处差值\n' +
          'km    &lt;- survfit(Surv(d$Y[,1], d$Y[,2]) ~ d$A)\n' +
          's_at  &lt;- summary(km, times = 2)$surv\n' +
          'naive &lt;- s_at[2] - s_at[1]\n\n' +
          '# IPTW（混杂）× IPCW（删失）\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_base = "coxph",\n' +
          '                   weighting = "iptw", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">两层权重是相乘的</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>权重</th><th>最小值</th><th>中位数</th><th>最大值</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>IPTW（混杂）</td><td>1.02</td><td>1.66</td><td>16.73</td></tr>' +
          '<tr><td>IPCW（删失）</td><td>0.10</td><td>0.85</td><td>1.00</td></tr>' +
          '<tr><td>相乘后</td><td>0.14</td><td>1.37</td><td>12.28</td></tr>' +
          '</tbody></table></div></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>方法</th><th>估计</th><th>真实 ATE</th><th>偏差</th>' +
          '<th>与真相关</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>未调整 KM 差</td><td>0.079</td><td>0.152</td><td><strong>−0.072</strong></td>' +
          '<td>—</td><td>—</td></tr>' +
          '<tr><td>IPTW + X</td><td>0.125</td><td>0.152</td><td>−0.027</td>' +
          '<td>0.822</td><td>0.090</td></tr>' +
          '<tr><td>真实 PS 外部权重 + DR</td><td>0.159</td><td>0.152</td><td>+0.007</td>' +
          '<td>0.123</td><td>0.563</td></tr>' +
          '</tbody></table></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>偏差</th><th>与真相关</th>' +
          '<th>RMSE</th><th>估计 SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.138</td><td>−0.013</td><td>0.033</td><td>0.151</td><td>0.011</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.142</td><td>−0.010</td>' +
          '<td><strong>0.967</strong></td><td><strong>0.042</strong></td><td>0.131</td></tr>' +
          '<tr><td>X</td><td>0.125</td><td>−0.027</td><td>0.822</td><td>0.090</td><td>0.131</td></tr>' +
          '<tr><td>R</td><td>0.118</td><td>−0.033</td><td>0.165</td><td>0.331</td><td>0.319</td></tr>' +
          '<tr><td>DR</td><td>0.025</td><td>−0.127</td><td>0.123</td><td>0.563</td><td>0.546</td></tr>' +
          '</tbody></table></div>' +
          '<p>真实 CATE 的 SD = <strong>0.150</strong>。两种「平均看起来都不错」的方法，' +
          'CATE 表现天差地别：IPTW + X 相关 0.822、RMSE 0.090；' +
          '而外部权重 + DR 的 ATE 只偏 +0.007，相关却只有 0.123、RMSE 0.563，' +
          '估计 SD 0.546 是真值的 3.6 倍——<strong>只看 ATE 会把它误判为好方法</strong>。' +
          'S-learner 的估计 SD 仅 0.011，异质性被完全压平。</p>'
      },
      {
        id: "sl-engine",
        heading: "生存结局的第二套引擎：survlearners（脚本 09）",
        body:
          '<p>生存结局除了默认的<strong>原生引擎</strong>（<code>engine = "native"</code>，' +
          'Cox/ranger 实现，五族齐全），还可以显式切换到 <code>engine = "survlearners"</code>，' +
          '把估计整体委托给 <a href="https://som-shahlab.github.io/survlearners/">survlearners</a> ' +
          '（Shah Lab，GPL-3）。该包只发布在 GitHub，所以 mlr3HTE 把它放在 Suggests，' +
          '未安装时会给出明确提示：</p>' +
          '<pre><code>remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")\n\n' +
          'd &lt;- mlr3HTE_demo_surv(n = 2000, t0 = 2, seed = 1203)\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_base = "grf",\n' +
          '                   t0 = 2, engine = "survlearners")</code></pre>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>能力</th><th>native（默认）</th><th>survlearners</th></tr></thead><tbody>' +
          '<tr><td>metalearner</td><td>S/T/X/R/DR 五族</td><td>S/T/X/R（没有 DR，另有一个 M）</td></tr>' +
          '<tr><td>效应尺度</td><td>S(t0) 差 + RMST 差</td><td>只有 S(t0) 差</td></tr>' +
          '<tr><td>基学习器</td><td><code>"coxph"</code>/<code>"ranger"</code> + 任意 mlr3 learner</td>' +
          '<td><code>"coxph"</code>/<code>"grf"</code>/<code>"lasso"</code>（<code>"ranger"</code> 是 grf 的别名）</td></tr>' +
          '<tr><td>删失 / 交叉拟合</td><td>IPTW × IPCW；<code>cross_fitting=TRUE</code></td>' +
          '<td>包内 IPCW；R 族内部自带 K 折交叉拟合</td></tr>' +
          '</tbody></table></div>' +

          '<h3>实际输出：n=2000 全组合对账（真值 ATE = 0.151）</h3>' +
          '<pre><code># A tibble: 11 × 5\n' +
          '   tp    kind    ATE  相关   偏差\n' +
          ' 1 S     coxph 0.156 0.993  0.005\n' +
          ' 2 S     grf   0.129 0.910 -0.022\n' +
          ' 3 S     lasso 0.156 0.997  0.006\n' +
          ' 4 T     coxph 0.067 0.952 -0.084   # 避开这一格，见下\n' +
          ' 5 T     grf   0.147 0.922 -0.004\n' +
          ' 6 T     lasso 0.146 0.992 -0.004\n' +
          ' 7 X     grf   0.149 0.934 -0.001\n' +
          ' 8 X     lasso 0.150 0.978 -0.001\n' +
          ' 9 R     coxph 0.152 0.963  0.001\n' +
          '10 R     grf   0.152 0.923  0.001\n' +
          '11 R     lasso 0.155 0.961  0.004</code></pre>' +

          '<div class="callout warn"><div class="callout-title">避开 T-coxph 这一格</div>' +
          '<p>实测 T-coxph 的 ATE 只有 0.067（偏差 −0.084），同族 T-grf/T-lasso 却正常。' +
          '读源码 + 验证后的机制：<code>surv_tl_coxph</code> 把<strong>未中心化</strong>的基线累积危险 ' +
          '（<code>basehaz(centered = FALSE)</code>）与 <code>predict(type = "risk")</code> 相乘，' +
          '而后者的线性预测器<strong>以样本均值为参照</strong>，两个基准不一致会扭曲 S(t0)。' +
          '对照 <code>surv_sl_coxph</code> 手算未中心化链接，所以 S-coxph 是准的。' +
          '要 Cox 做 T-learner，请用原生引擎。</p></div>' +

          '<div class="callout"><div class="callout-title">复现性</div>' +
          '<p>grf 族在 mlr3HTE 引擎内固定 <code>seed = 1</code>，两次运行逐位相同；' +
          'lasso 族内部用 glmnet 交叉验证选 lambda、折序随机（survlearners 未暴露 foldid），' +
          '两次运行有 ~0.001 量级抖动——如实说明，不假装确定。</p></div>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　下一篇：<a href="#/tutoriallearners">4 换不同学习器 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "3 · Survival outcomes",
    lede: "Effects are time-point dependent: state t0, correct censoring with IPCW, and multiply an IPTW layer on top for observational data.",
    sections: [
      {
        id: "fw-surv",
        heading: "At a glance",
        body:
          '<p>The survival effect is <strong>time-point dependent</strong>: you must state <code>t0</code>, and ' +
          'CATE = S(t0) difference (default t0 = median event time). Censoring is corrected with IPCW; under ' +
          'observationality a second IPTW layer is multiplied on top.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Scenario</th><th>Script</th><th>Key result</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialsurv/s5">Scenario 5 · Survival × RCT</a></td>' +
          '<td><code>05_生存结局_随机化RCT.R</code></td>' +
          '<td>T-learner + Cox: CATE vs true <em>τ</em> correlation <strong>0.993</strong></td></tr>' +
          '<tr><td><a href="#/tutorialsurv/s6">Scenario 6 · Survival × observational</a></td>' +
          '<td><code>06_生存结局_观察性研究.R</code></td>' +
          '<td>IPTW × IPCW two-layer weights; the T-learner reaches CATE correlation <strong>0.967</strong> with RMSE 0.042, while external weights + DR has an ATE bias of only +0.007 but correlation 0.123 — <strong>ATE alone would mislead you</strong></td></tr>' +
          '<tr><td><a href="#/tutorialsurv/sl-engine">Second engine: survlearners</a></td>' +
          '<td><code>09_生存结局_survlearners引擎.R</code></td>' +
          '<td>Same question, two engines — results can be reconciled</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "s5",
        heading: "Scenario 5 · Survival outcome × RCT",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_rct_survival.png" ' +
          'alt="Scenario 5 DAG: randomised survival outcome">' +
          '<figcaption>Figure 5 · Scenario 5 DAG: <code>Y</code> is a (time, event) pair; ' +
          'exponential censoring applies on top (omitted from the figure)</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_surv(n = 4000, t0 = 2, seed = 1203)\n\n' +
          'fit &lt;- metalearner("T", d$X, d$A, d$Y, learner_base = "coxph", t0 = 2)\n' +
          'fit$ate   # mean S₁(2) − S₀(2)\n\n' +
          '# Or a non-linear base learner\n' +
          'metalearner("T", d$X, d$A, d$Y, learner_base = "ranger", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">The effect is time-point dependent</div>' +
          '<p>The survival difference takes different values at different <code>t0</code>; always ' +
          'report the horizon:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>t0</th><th>1</th><th>2</th><th>4</th></tr></thead>' +
          '<tbody><tr><td>ATE</td><td>0.104</td><td>0.129</td><td>0.124</td></tr></tbody></table></div>' +
          '</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>ATE</th><th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.130</td><td><strong>−0.017</strong></td><td>0.153</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.129</td><td><strong>0.993</strong></td><td><strong>0.030</strong></td></tr>' +
          '<tr><td>X</td><td>0.123</td><td>0.840</td><td>0.088</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.261</td><td>0.305</td></tr>' +
          '<tr><td>DR</td><td>0.088</td><td>0.232</td><td>0.304</td></tr>' +
          '</tbody></table></div>' +
          '<p>True ATE = <strong>0.152</strong>, 29.9% censoring.</p>' +
          '<div class="callout warn"><div class="callout-title">Near-zero correlation for S is expected</div>' +
          '<p>Cox is proportional hazards with a linear predictor, so A entered as an ordinary ' +
          'covariate cannot express the <code>A × X</code> interaction and the CATE degenerates to a ' +
          'constant. Use T or X to capture heterogeneity.</p></div>'
      },
      {
        id: "s6",
        heading: "Scenario 6 · Survival outcome × observational",
        body:
          '<figure class="fig"><img src="assets/img/dag/dag_obs_survival.png" ' +
          'alt="Scenario 6 DAG: observational survival outcome">' +
          '<figcaption>Figure 6 · Scenario 6 DAG: on top of confounding (red) there is ' +
          'censoring, so IPTW × IPCW layers are multiplied</figcaption></figure>' +
          '<pre><code>d &lt;- mlr3HTE_demo_obs_surv(n = 4000, t0 = 2, seed = 1206)\n\n' +
          '# Unadjusted: separate Kaplan-Meier per arm, take the difference at t0\n' +
          'km    &lt;- survfit(Surv(d$Y[,1], d$Y[,2]) ~ d$A)\n' +
          's_at  &lt;- summary(km, times = 2)$surv\n' +
          'naive &lt;- s_at[2] - s_at[1]\n\n' +
          '# IPTW (confounding) × IPCW (censoring)\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_base = "coxph",\n' +
          '                   weighting = "iptw", t0 = 2)</code></pre>' +
          '<div class="callout"><div class="callout-title">Two layers of weights are multiplied</div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Weights</th><th>Min</th><th>Median</th><th>Max</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>IPTW (confounding)</td><td>1.02</td><td>1.66</td><td>16.73</td></tr>' +
          '<tr><td>IPCW (censoring)</td><td>0.10</td><td>0.85</td><td>1.00</td></tr>' +
          '<tr><td>Multiplied</td><td>0.14</td><td>1.37</td><td>12.28</td></tr>' +
          '</tbody></table></div></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Method</th><th>Estimate</th><th>True ATE</th><th>Bias</th>' +
          '<th>Corr. with truth</th><th>RMSE</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Unadjusted KM difference</td><td>0.079</td><td>0.152</td><td><strong>−0.072</strong></td>' +
          '<td>—</td><td>—</td></tr>' +
          '<tr><td>IPTW + X</td><td>0.125</td><td>0.152</td><td>−0.027</td>' +
          '<td>0.822</td><td>0.090</td></tr>' +
          '<tr><td>True-PS external weights + DR</td><td>0.159</td><td>0.152</td><td>+0.007</td>' +
          '<td>0.123</td><td>0.563</td></tr>' +
          '</tbody></table></div>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Learner</th><th>IPTW ATE</th><th>Bias</th><th>Corr. with truth</th>' +
          '<th>RMSE</th><th>Est. SD</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>S</td><td>0.138</td><td>−0.013</td><td>0.033</td><td>0.151</td><td>0.011</td></tr>' +
          '<tr><td><strong>T</strong></td><td>0.142</td><td>−0.010</td>' +
          '<td><strong>0.967</strong></td><td><strong>0.042</strong></td><td>0.131</td></tr>' +
          '<tr><td>X</td><td>0.125</td><td>−0.027</td><td>0.822</td><td>0.090</td><td>0.131</td></tr>' +
          '<tr><td>R</td><td>0.118</td><td>−0.033</td><td>0.165</td><td>0.331</td><td>0.319</td></tr>' +
          '<tr><td>DR</td><td>0.025</td><td>−0.127</td><td>0.123</td><td>0.563</td><td>0.546</td></tr>' +
          '</tbody></table></div>' +
          '<p>True CATE SD = <strong>0.150</strong>. Two methods that both "look fine on average" differ ' +
          'wildly on CATE: IPTW + X has correlation 0.822 and RMSE 0.090, while external weights + DR ' +
          'has an ATE bias of only +0.007 yet correlation 0.123 and RMSE 0.563, with an estimated SD ' +
          'of 0.546 — 3.6x the truth. <strong>Judging on ATE alone would call it a good method.</strong> ' +
          'The S-learner\'s estimated SD of 0.011 shows heterogeneity fully flattened.</p>'
      },
      {
        id: "sl-engine",
        heading: "A second survival engine: survlearners (script 09)",
        body:
          '<p>Besides the default <strong>native engine</strong> (<code>engine = "native"</code>, ' +
          'Cox/ranger, all five learners), survival outcomes can explicitly switch to ' +
          '<code>engine = "survlearners"</code>, delegating estimation to ' +
          '<a href="https://som-shahlab.github.io/survlearners/">survlearners</a> ' +
          '(Shah Lab, GPL-3). It lives on GitHub only, so mlr3HTE keeps it in Suggests ' +
          'and prints an install hint when missing:</p>' +
          '<pre><code>remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")\n\n' +
          'd &lt;- mlr3HTE_demo_surv(n = 2000, t0 = 2, seed = 1203)\n' +
          'fit &lt;- metalearner("X", d$X, d$A, d$Y, learner_base = "grf",\n' +
          '                   t0 = 2, engine = "survlearners")</code></pre>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Capability</th><th>native (default)</th><th>survlearners</th></tr></thead><tbody>' +
          '<tr><td>Metalearners</td><td>S/T/X/R/DR</td><td>S/T/X/R (no DR; an extra M)</td></tr>' +
          '<tr><td>Effect scale</td><td>S(t0) difference + RMST difference</td><td>S(t0) difference only</td></tr>' +
          '<tr><td>Base learners</td><td><code>"coxph"</code>/<code>"ranger"</code> + any mlr3 learner</td>' +
          '<td><code>"coxph"</code>/<code>"grf"</code>/<code>"lasso"</code> (<code>"ranger"</code> aliases grf)</td></tr>' +
          '<tr><td>Censoring / cross-fitting</td><td>IPTW × IPCW; <code>cross_fitting=TRUE</code></td>' +
          '<td>built-in IPCW; R family cross-fits internally</td></tr>' +
          '</tbody></table></div>' +

          '<h3>Actual output: full grid at n=2000 (true ATE = 0.151)</h3>' +
          '<pre><code># A tibble: 11 × 5\n' +
          '   tp    kind    ATE  cor   bias\n' +
          ' 1 S     coxph 0.156 0.993  0.005\n' +
          ' 2 S     grf   0.129 0.910 -0.022\n' +
          ' 3 S     lasso 0.156 0.997  0.006\n' +
          ' 4 T     coxph 0.067 0.952 -0.084   # avoid this cell, see below\n' +
          ' 5 T     grf   0.147 0.922 -0.004\n' +
          ' 6 T     lasso 0.146 0.992 -0.004\n' +
          ' 7 X     grf   0.149 0.934 -0.001\n' +
          ' 8 X     lasso 0.150 0.978 -0.001\n' +
          ' 9 R     coxph 0.152 0.963  0.001\n' +
          '10 R     grf   0.152 0.923  0.001\n' +
          '11 R     lasso 0.155 0.961  0.004</code></pre>' +

          '<div class="callout warn"><div class="callout-title">Avoid the T-coxph cell</div>' +
          '<p>Measured ATE for T-coxph is only 0.067 (bias −0.084) while T-grf/T-lasso are fine. ' +
          'Mechanism (read from source and verified, not guessed): <code>surv_tl_coxph</code> multiplies ' +
          'the <strong>uncentred</strong> baseline cumulative hazard (<code>basehaz(centered = FALSE)</code>) ' +
          'with <code>predict(type = "risk")</code>, whose linear predictor is <strong>centred at the ' +
          'training-sample mean</strong>; the mismatched reference scales distort S(t0). By contrast ' +
          '<code>surv_sl_coxph</code> builds its links manually (uncentred), so S-coxph is accurate. ' +
          'For a Cox-based T-learner, use the native engine.</p></div>' +

          '<div class="callout"><div class="callout-title">Reproducibility</div>' +
          '<p>The grf family is seeded (<code>seed = 1</code>) inside the mlr3HTE engine, so repeated ' +
          'runs are bit-identical. The lasso family cross-validates lambda with glmnet using random ' +
          'folds (survlearners exposes no foldid), so repeated runs jitter by ~0.001 — stated plainly ' +
          'rather than pretended away.</p></div>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; Next: <a href="#/tutoriallearners">4 Swapping the base learner →</a>' +
          '</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.tutoriallearners = {
  zh: {
    title: "4 · 换不同学习器",
    lede: "五种 meta-learner 只是配方，真正干活的是基学习器；换算法只改一行，还能按分组 / 阶段分开指定。",
    sections: [
      {
        id: "fw-learners",
        heading: "本篇速览",
        body:
          '<p>选 mlr3 体系的核心收益：五种 meta-learner 只是「配方」，真正干活的是基学习器，' +
          '换算法只改 <code>learner_base</code> 一行。更细一层还能为每个分组 / 阶段单独指定算法。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>内容</th><th>脚本</th><th>关键结论</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutoriallearners/swap-learners">换基学习器：mlr3 生态随便挑</a></td>' +
          '<td><code>13_换基学习器_基准对比.R</code></td>' +
          '<td>ATE 对算法稳健（偏差都在 ±0.1 内），<strong>排序能力差异巨大</strong>：' +
          '线性模型 CATE 相关 0.987，随机森林只有 0.843</td></tr>' +
          '<tr><td><a href="#/tutoriallearners/swap-learners">按角色命名 list（v0.22+）</a></td>' +
          '<td><code>13_换基学习器_基准对比.R</code></td>' +
          '<td>T 两组 ranger / lm 混用 → CATE 相关 0.913；X 各阶段混用 → 0.988</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "swap-learners",
        heading: "换基学习器：mlr3 生态随便挑（脚本 13）",
        body:
          '<p>选 mlr3 体系而不是自己写一套训练循环，最大的好处就在这里：' +
          '<strong>五种 metalearner 只是「配方」，真正干活的是基学习器；换算法只是换 <code>learner_base</code> 一行</strong>，' +
          '其余代码、接口、工作流原样不动。</p>' +
          '<p>同一套 T-learner，把随机森林换成 XGBoost / GLMnet / CART / 线性回归，只改一处：</p>' +
          '<pre><code>fit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.ranger"))   # 随机森林\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.xgboost"))  # XGBoost\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.glmnet"))   # Lasso\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.lm"))       # 线性回归</code></pre>' +
          '<p>脚本 13 在连续 RCT 模拟数据（n = 4000，真值 ATE = 1.048）上把这五种基学习器各跑一遍，' +
          '对比 ATE 与「CATE 与真 <em>τ</em> 的相关」（排序能力）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>基学习器</th><th>ATE</th><th>ATE 偏差</th><th>CATE 相关</th></tr></thead><tbody>' +
          '<tr><td>ranger（随机森林）</td><td>0.9496</td><td>-0.098</td><td>0.843</td></tr>' +
          '<tr><td>xgboost</td><td>0.9601</td><td>-0.088</td><td>0.656</td></tr>' +
          '<tr><td>glmnet（Lasso）</td><td>0.9545</td><td>-0.093</td><td>0.986</td></tr>' +
          '<tr><td>rpart（CART）</td><td>0.9572</td><td>-0.091</td><td>0.907</td></tr>' +
          '<tr><td>lm（线性回归）</td><td>0.9546</td><td>-0.093</td><td>0.987</td></tr>' +
          '</tbody></table></div>' +
          '<p>看这张表能体会两点：① ATE 估计对基学习器选择相当稳健（偏差都在 ±0.1 内），' +
          '因为 T-learner 的无偏性不依赖基学习器；② 但<strong>排序能力（CATE 相关）随算法差异很大</strong>——' +
          '线性模型在这个有交互的 DGP 上反而排得最准，随机森林却最差。这正说明换算法不是装饰，' +
          '它直接决定你能否找到「谁更获益」。</p>' +
          '<h4>进阶：换完算法直接复用 mlr3 工作流</h4>' +
          '<p>因为 <code>lrn("regr.metalearner")</code> 是正规 R6 Learner，换好基学习器后，' +
          '<code>benchmark()</code> / <code>tune()</code> / <code>resample()</code> 完全照常。' +
          '脚本 13 用 <code>benchmark_grid()</code> 把「T + ranger」和「T + xgboost」放进同一次 5 折 CV 比 MSE，' +
          '不用为每种算法单独写循环：</p>' +
          '<pre><code>task  &lt;- ml_task(X, A, Y)\ndesign &lt;- benchmark_grid(\n  task,\n  list(\n    lrn("regr.metalearner", id = "T_ranger",  metalearner = "T",\n        learner_base = lrn("regr.ranger", num.trees = 300)),\n    lrn("regr.metalearner", id = "T_xgboost", metalearner = "T",\n        learner_base = lrn("regr.xgboost"))\n  ),\n  rsmp("cv", folds = 5)\n)\nbenchmark(design)$score()</code></pre>' +
          '<p>这就是「用 mlr3 体系」而不是「又造一套训练管道」的甜头：' +
          '从教学到调参、从单模型到交叉验证对比，整条链路免费继承。</p>' +
          '<h4>再进一步：每个分组 / 每个阶段单独换算法</h4>' +
          '<p>「一行换一个基学习器」是最粗的粒度。更细一层，mlr3HTE 允许你为每个<strong>分组</strong>、' +
          '每个<strong>阶段</strong>分别指定算法——这通常比全局统一一个算法更贴合各阶段的数值特性：</p>' +
          '<ul>' +
          '<li><strong>T-Learner</strong>：两组各用一套，<code>list(treated = ..., control = ...)</code>；' +
          '例如治疗组用随机森林、对照组用线性模型（对照组样本少、线性更稳）。</li>' +
          '<li><strong>X-Learner</strong>：两个结局模型 <code>list(m1 = ..., m0 = ...)</code> 可分别指定，' +
          '两个效应回归 <code>list(tau1 = ..., tau0 = ...)</code> 也可分别指定；' +
          '例如 <code>m1</code> 用 kNN、<code>m0</code> 用随机森林，两个 tau 回归都用线性模型。</li>' +
          '</ul>' +
          '<pre><code>metalearner("T", X, A, Y,\n  learner_base = list(treated = lrn("regr.ranger"),\n                      control  = lrn("regr.lm")))\n\nmetalearner("X", X, A, Y,\n  learner_base = list(m1 = lrn("regr.kknn"), m0 = lrn("regr.ranger")),\n  learner_tau  = list(tau1 = lrn("regr.lm"), tau0 = lrn("regr.lm")))</code></pre>' +
          '<p>脚本 13 的新增一节把这套「按角色命名 list」跑了一遍（n = 4000，真值 ATE = 1.048）：' +
          'T 两组 ranger / lm 的 CATE 相关 0.913，X 各阶段混用的 CATE 相关 0.988——' +
          '在合适的分工下，排序能力还能再上一个台阶。S / R / DR 与 <code>survlearners</code> 引擎只接受单个 learner，' +
          '传命名 list 会明确报错。</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　下一篇：<a href="#/tutorialmetrics">5 模型评价指标 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "4 · Swapping the base learner",
    lede: "The five meta-learners are recipes; the base learner does the work. Swap it in one line, and specify per group or per stage when needed.",
    sections: [
      {
        id: "fw-learners",
        heading: "At a glance",
        body:
          '<p>The core payoff of the mlr3 stack: the five meta-learners are just "recipes"; the real work is ' +
          'done by the base learner, so swapping algorithms changes only one line, <code>learner_base</code>. ' +
          'A finer level lets you specify a different algorithm per group / per stage.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Topic</th><th>Script</th><th>Key result</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutoriallearners/swap-learners">Swap the base learner</a></td>' +
          '<td><code>13_换基学习器_基准对比.R</code></td>' +
          '<td>ATE is robust to the algorithm (bias within ±0.1), but <strong>ranking ability varies wildly</strong>: ' +
          'linear model CATE correlation 0.987 vs random forest 0.843</td></tr>' +
          '<tr><td><a href="#/tutoriallearners/swap-learners">Per-role named lists (v0.22+)</a></td>' +
          '<td><code>13_换基学习器_基准对比.R</code></td>' +
          '<td>T with ranger / lm per arm → CATE correlation 0.913; X mixing stages → 0.988</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "swap-learners",
        heading: "Swap the base learner: pick any algorithm in the mlr3 ecosystem (script 13)",
        body:
          '<p>The biggest reason to build on mlr3 instead of rolling your own training loop is right here: ' +
          '<strong>the five metalearners are just "recipes"; the base learner does the actual work, and switching algorithms is a one-line change to <code>learner_base</code></strong>—' +
          'every other line of code, the interface, and the workflow stay exactly the same.</p>' +
          '<p>The same T-learner, switching the base learner from random forest to XGBoost / GLMnet / CART / linear regression, changes only one argument:</p>' +
          '<pre><code>fit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.ranger"))   # random forest\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.xgboost"))  # XGBoost\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.glmnet"))   # Lasso\nfit &lt;- metalearner("T", X, A, Y,\n              learner_base = lrn("regr.lm"))       # linear regression</code></pre>' +
          '<p>Script 13 runs all five base learners on the continuous RCT simulation (n = 4000, true ATE = 1.048) and compares ATE with ' +
          '"CATE correlation with the true <em>&tau;</em>" (ranking power):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Base learner</th><th>ATE</th><th>ATE bias</th><th>CATE corr.</th></tr></thead><tbody>' +
          '<tr><td>ranger (random forest)</td><td>0.9496</td><td>-0.098</td><td>0.843</td></tr>' +
          '<tr><td>xgboost</td><td>0.9601</td><td>-0.088</td><td>0.656</td></tr>' +
          '<tr><td>glmnet (Lasso)</td><td>0.9545</td><td>-0.093</td><td>0.986</td></tr>' +
          '<tr><td>rpart (CART)</td><td>0.9572</td><td>-0.091</td><td>0.907</td></tr>' +
          '<tr><td>lm (linear regression)</td><td>0.9546</td><td>-0.093</td><td>0.987</td></tr>' +
          '</tbody></table></div>' +
          '<p>Two takeaways from this table: ① ATE estimation is quite robust to the base-learner choice (bias within ±0.1), ' +
          'because the T-learner is unbiased regardless of the base learner; ② but <strong>ranking power (CATE correlation) varies a lot across algorithms</strong>—' +
          'the linear model actually ranks best on this interaction-rich DGP while the random forest ranks worst. ' +
          'That is exactly why swapping algorithms is not cosmetic: it decides whether you can find "who benefits more".</p>' +
          '<h4>Next step: reuse the mlr3 workflow after the swap</h4>' +
          '<p>Because <code>lrn("regr.metalearner")</code> is a proper R6 Learner, once you swap the base learner, ' +
          '<code>benchmark()</code> / <code>tune()</code> / <code>resample()</code> work unchanged. ' +
          'Script 13 drops "T + ranger" and "T + xgboost" into one <code>benchmark_grid()</code> 5-fold CV to compare MSE, ' +
          'no separate loop per algorithm:</p>' +
          '<pre><code>task  &lt;- ml_task(X, A, Y)\ndesign &lt;- benchmark_grid(\n  task,\n  list(\n    lrn("regr.metalearner", id = "T_ranger",  metalearner = "T",\n        learner_base = lrn("regr.ranger", num.trees = 300)),\n    lrn("regr.metalearner", id = "T_xgboost", metalearner = "T",\n        learner_base = lrn("regr.xgboost"))\n  ),\n  rsmp("cv", folds = 5)\n)\nbenchmark(design)$score()</code></pre>' +
          '<p>That is the payoff of "using the mlr3 system" rather than "building yet another training pipeline": ' +
          'from teaching to tuning, from single model to cross-validated comparison, the whole chain comes for free.</p>' +
          '<h4>One step further: pick a different algorithm per group / per stage</h4>' +
          '<p>"Swap one base learner in one line" is the coarsest grain. A finer grain lets you specify a different ' +
          'algorithm for each <strong>group</strong> and each <strong>stage</strong>—usually a better fit to the numeric ' +
          'character of each stage:</p>' +
          '<ul>' +
          '<li><strong>T-Learner</strong>: one learner per arm, <code>list(treated = ..., control = ...)</code>; ' +
          'e.g. random forest for the treated arm and a linear model for the control arm (smaller, more stable).</li>' +
          '<li><strong>X-Learner</strong>: the two outcome models <code>list(m1 = ..., m0 = ...)</code> can differ, and ' +
          'the two effect regressions <code>list(tau1 = ..., tau0 = ...)</code> can differ too; ' +
          'e.g. kNN for <code>m1</code>, random forest for <code>m0</code>, and linear models for both tau regressions.</li>' +
          '</ul>' +
          '<pre><code>metalearner("T", X, A, Y,\n  learner_base = list(treated = lrn("regr.ranger"),\n                      control  = lrn("regr.lm")))\n\nmetalearner("X", X, A, Y,\n  learner_base = list(m1 = lrn("regr.kknn"), m0 = lrn("regr.ranger")),\n  learner_tau  = list(tau1 = lrn("regr.lm"), tau0 = lrn("regr.lm")))</code></pre>' +
          '<p>The new section of Script 13 runs this role-named-list recipe (n = 4000, true ATE = 1.048): ' +
          'T with ranger / lm across arms reaches CATE correlation 0.913, and X with mixed stages reaches 0.988—' +
          'with the right division of labour, ranking power climbs another notch. S / R / DR and the ' +
          '<code>survlearners</code> engine accept only a single learner and error clearly on a named list.</p>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; Next: <a href="#/tutorialmetrics">5 Model evaluation metrics →</a>' +
          '</p></div>'
      }
    ]
  }
};

window.SITE_PAGES.tutorialmetrics = {
  zh: {
    title: "5 · 模型评价指标",
    lede: "Qini / c-for-benefit / TOC 回答的是「排序能力」，不是「估得准不准」——这两件事必须分开看。",
    sections: [
      {
        id: "fw-metrics",
        heading: "本篇速览",
        body:
          '<p>前面四个框架回答「ATE 估得准不准」；本框架独立回答<strong>「模型把谁更获益排前面的能力如何」</strong>' +
          '——判别力，不是无偏性。三个指标 Qini / c-for-benefit / TOC 全部定义在测试集上，' +
          '训练集上的判别力是自欺欺人。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>内容</th><th>脚本</th><th>关键结论（n = 4000 连续结局）</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">三个指标怎么算、怎么读</a></td>' +
          '<td><code>10_HTE评价指标.R</code></td>' +
          '<td>Qini 系数 <strong>0.312</strong>（随机排序 0.020）；c-for-benefit <strong>0.646</strong>（随机 0.508）</td></tr>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">用真 <em>τ</em> 当标尺对账</a></td>' +
          '<td><code>11_评价指标真值对账.R</code></td>' +
          '<td>把误差拆成<strong>排序损失</strong>与<strong>估计噪声</strong>；cor(CATE, τ) = 0.904</td></tr>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">三类结局各跑一遍</a></td>' +
          '<td><code>12_三类结局评价指标.R</code></td>' +
          '<td>生存结局必须走 IPCW；「先拟合后切分」的泄漏会把指标虚高</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "metrics",
        heading: "模型评价：Qini、c-for-benefit 与 TOC（脚本 10）",
        body:
          '<p>前面六格回答的是「ATE 估得准不准」。但 HTE 模型还有一个独立的问题：' +
          '<strong>它把「谁获益更多」排前面的能力如何</strong>？一个模型可以 ATE 完全无偏，' +
          '却对异质性一无所知（比如只会报一个常数）。三个指标专门评这件事，' +
          '全部定义在<strong>测试集</strong>上——训练集上的判别力是自欺欺人。</p>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>指标</th><th>函数</th><th>看什么</th><th>参照</th></tr></thead><tbody>' +
          '<tr><td>Qini 曲线 / 系数</td><td><code>qini_curve()</code><br><code>qini_coefficient()</code></td>' +
          '<td>按 CATE 降序靶向前 k% 的累积治疗增益（IPW 估计）</td>' +
          '<td>随机靶向线；系数≈0 即无异质性可利用</td></tr>' +
          '<tr><td>c-for-benefit</td><td><code>c_for_benefit()</code></td>' +
          '<td>配对后比较「预测获益」与「观测获益」的次序一致率</td>' +
          '<td>0.5 = 随机；越接近 1 越好</td></tr>' +
          '<tr><td>TOC 曲线</td><td><code>toc_curve()</code></td>' +
          '<td>靶向前 k% 子群的平均治疗效应如何随靶向比例变化</td>' +
          '<td>全样本总体 ATE（水平虚线）</td></tr>' +
          '</tbody></table></div>' +

          '<h3>代码长这样</h3>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000, seed = 1)\n' +
          'idx &lt;- sample.int(nrow(d$X), nrow(d$X) %/% 2)   # 切出测试集\n' +
          'fit &lt;- metalearner("T", d$X[-idx, ], d$A[-idx], d$Y[-idx],\n' +
          '                   learner_base = mlr3::lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'cate_te &lt;- fit$predict(d$X[idx, ])             # 测试集上的排序分数\n\n' +
          'q &lt;- qini_coefficient(cate_te, d$A[idx], d$Y[idx])\n' +
          'c &lt;- c_for_benefit(cate_te, d$A[idx], d$Y[idx])\n' +
          't &lt;- toc_curve(cate_te, d$A[idx], d$Y[idx])\n\n' +
          '# 对照组：把 CATE 打乱，就是"无信息排序"\n' +
          'cate_rand &lt;- sample(cate_te)\n' +
          'qini_coefficient(cate_rand, d$A[idx], d$Y[idx])$qini_coefficient</code></pre>' +

          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/qini-curve.png" ' +
          'alt="Qini 曲线：IPW 累积增益随靶向比例上升，明显高于随机靶向线">' +
          '<figcaption>Qini 曲线（虚线 = 随机靶向）</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/toc-curve.png" ' +
          'alt="TOC 曲线：前段明显高于总体 ATE，后段回落到总体线附近">' +
          '<figcaption>TOC 曲线（虚线 = 总体 ATE）</figcaption></figure>' +
          '</div>' +

          '<h3>实测输出：n=4000，连续结局</h3>' +
          '<pre><code>            metric informative     random\n' +
          '1 Qini coefficient   0.3120958 0.02028658\n' +
          '2    c-for-benefit   0.6456819 0.50779098\n\n' +
          'ℹ cor(cate_test, tau_test) = 0.904   # 排序有信息，源自 CATE 抓到了真 tau</code></pre>' +

          '<div class="callout"><div class="callout-title">三个指标怎么读</div>' +
          '<p><strong>Qini 曲线越早抬升、前段越陡</strong>，说明模型把获益者往前排的能力越强；' +
          'Qini 系数 0.312 对随机 0.020，差距接近 15 倍。' +
          '<strong>c-for-benefit 0.646</strong>：预测获益更高的配对，其观测获益也确实更高的比例约 65%，' +
          '随机是 0.508。<strong>TOC 曲线前段高于总体 ATE</strong>：只治疗前 25% 的人，' +
          '平均效应比全员治疗更高——这就是"精准投放"的空间。</p></div>' +

          '<h3>观察性数据：三个指标各自要补什么</h3>' +
          '<p>随机化下「观测获益 = 处理者结局 − 对照者结局」是无偏的；观察性数据里两组基线' +
          '预后不同，这个差被混杂污染。所以三个指标的修正路径不同：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>指标</th><th>要补什么</th><th>为什么</th></tr></thead><tbody>' +
          '<tr><td>Qini / TOC</td><td><code>propensity = e(X)</code></td>' +
          '<td>估计式本身就是 IPW，把 <code>e</code> 换成估计值即可去混杂</td></tr>' +
          '<tr><td>c-for-benefit</td><td><code>propensity</code> + <code>mu1</code> + <code>mu0</code></td>' +
          '<td>观测获益换成双重稳健伪结局，<strong>三件套缺一不可</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>三个干扰参数用 <code>dr_pseudo_outcome()</code> 一次拿到，默认做 5 折交叉拟合：</p>' +
          '<pre><code>d_obs &lt;- mlr3HTE_demo_obs(n = 4000, seed = 11)\n' +
          'dr    &lt;- dr_pseudo_outcome(d_obs$X, d_obs$A, d_obs$Y, seed = 1)  # e / mu1 / mu0\n' +
          'cate  &lt;- dr$mu1 - dr$mu0\n\n' +
          'qini_coefficient(cate, d_obs$A, d_obs$Y, propensity = dr$propensity)\n' +
          'toc_curve(cate, d_obs$A, d_obs$Y, propensity = dr$propensity)\n' +
          'c_for_benefit(cate, d_obs$A, d_obs$Y,\n' +
          '              propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)</code></pre>' +
          '<pre><code>            metric naive_no_ps with_ps_dr reference\n' +
          '1 Qini coefficient    1.053519  0.2666317        NA\n' +
          '2  TOC overall ATE    1.797248  1.0966008 1.0462000\n' +
          '3    c-for-benefit          NA  0.6296391 0.6493522\n\n' +
          'ℹ obs data: true ATE = 1.046, DR ATE ≈ 1.00\n' +
          'ℹ c-for-benefit: model 0.630 / oracle tau 0.649 / random ≈ 0.508</code></pre>' +
          '<p>不传 <code>propensity</code> 时，TOC 的 overall ATE 被混杂抬到 1.797（真值 1.046），' +
          'Qini 系数从 0.267 虚高到 1.054——<strong>把混杂当成了异质性</strong>。' +
          'c-for-benefit 的 model 0.630 ≤ oracle 0.649，次序正确。</p>' +

          '<div class="callout warn"><div class="callout-title">四个坑，先说清</div>' +
          '<p><strong>① 观察性数据必须传倾向得分。</strong>三个函数的 ' +
          '<code>propensity</code> 参数默认 <code>NULL</code>，此时按 ' +
          '<code>mean(A)</code> 处理——只对随机化试验成立。观察性数据请传入估计的 ' +
          '<code>e(X)</code>，否则 IPW 评分本身有偏，指标跟着有偏。</p>' +
          '<p><strong>② c-for-benefit 只给 propensity 会直接报错。</strong>那样等价于拿 ' +
          'Horvitz–Thompson 评分 <code>AY/e − (1−A)Y/(1−e)</code> 当观测获益，' +
          '单次样本标准差约 15（ATE 才 1 左右），噪声会把 C 统计量压到随机线以下——' +
          '实测即使用真 <code>tau</code> 排序也只有 0.39。所以必须把结局模型 ' +
          '<code>mu1</code>/<code>mu0</code> 一起给进来，走双重稳健。</p>' +
          '<p><strong>②b 结局模型要交叉拟合。</strong>用全样本拟合再回代（in-fold），' +
          '伪结局里的 <code>mu1 − mu0</code> 与被评价的 CATE 同源，配对又按该 CATE 找最近邻，' +
          '会把观测获益人为对齐到预测获益。实测倒挂：' +
          'in-fold 模型 0.754 &gt; 真 tau 0.717；交叉拟合后恢复 0.662 ≤ 0.669。</p>' +
          '<p><strong>③ 生存结局也能评，但标尺必须和 CATE 对齐。</strong>' +
          '三个函数都接受 <code>Surv</code> 对象，默认把结局压成里程碑指标 ' +
          '<code>I(T &gt; t0)</code>，效应标尺 = <em>S</em>(t0) 差——和 ' +
          '<code>metalearner()</code> 的生存 CATE 定义一致，否则排序比较没有意义。' +
          '删失用完整病例 IPCW 校正（<code>effect = "rmst"</code> 可换 RMST 尺度）。详见下一节。</p>' +
          '<p><strong>④ c-for-benefit 是近似实现。</strong>本包用贪心配对 + 配对间秩相关，' +
          '不是 van Klaveren 原文的完整匹配流程；需要严格复现时请对照 ' +
          '<code>CforBenefit</code> 包。这一点写在了 <code>R/metrics.R</code> 的注释里，不藏着。</p>' +
          '<p><strong>⑤ 留出集必须在拟合<em>之前</em>切出来。</strong>' +
          '先在全集拟合、再划一块当测试集，等于把 <code>Y</code> 泄漏进 CATE。' +
          '二分类下最明显：观测获益就是 <code>Y<sub>treated</sub> − Y<sub>control</sub></code>，' +
          'CATE 记住了 <code>Y<sub>treated</sub></code>，一致率凭空抬到 0.89，' +
          '甚至反超 oracle 的 0.60——尽管它与真 <em>τ</em> 的相关反而更低。见下一节实测。</p></div>' +

          '<h3>真值标尺：模拟数据里这些指标到底该是多少</h3>' +
          '<p>模拟数据的好处是 <em>τ</em> 已知，所以 Qini 与 TOC 的<strong>真值可以直接算出来</strong>，' +
          '不需要 IPW 估计：<br><code>Q_true(f_k) = (1/n) · Σ<sub>i in top-k</sub> τ<sub>i</sub></code>。' +
          '有了这把尺子，同一个指标的「真值」与「估计值」就能并排放，' +
          '把误差拆成两块：<strong>排序损失</strong>（模型没把获益者排对）和' +
          '<strong>估计噪声</strong>（IPW 本身的抽样误差）。脚本 <code>11_评价指标真值对账.R</code>。</p>' +

          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/qini-truth.png" ' +
          'alt="Qini 曲线：真值 oracle 线、真值模型线、IPW 估计线三者对比">' +
          '<figcaption>绿 = 真值天花板，蓝 = 真值·模型排序，橙虚线 = IPW 估计</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/toc-truth.png" ' +
          'alt="TOC 曲线：IPW 估计在真值线上下抖动，最左端越界">' +
          '<figcaption>TOC：IPW 估计围绕真值抖动，最左端越界</figcaption></figure>' +
          '</div>' +

          '<pre><code># n_test = 2000，连续结局 RCT，真 ATE = 1.042\n' +
          '| 层 | 真值 | IPW 估计 | 估计 − 真值 |\n' +
          '| 随机排序   | 0.0076 | 0.1140 | 0.1065 |\n' +
          '| 模型排序   | 0.2618 | 0.3121 | 0.0503 |\n' +
          '| oracle 排序 | 0.2887 | 0.3477 | 0.0591 |\n\n' +
          'oracle 真值（排序天花板）：0.2887\n' +
          '排序损失（模型没排对）：0.0269 → 占天花板 9.3%\n' +
          '估计噪声（IPW 抽样误差）：0.0591 → 占天花板 20.5%\n' +
          '排序效率 = 模型真值 / oracle 真值 = 0.907</code></pre>' +

          '<div class="callout"><div class="callout-title">最有用的一条：噪声标尺</div>' +
          '<p>随机排序的真值 Qini 系数<strong>恒等于 0</strong>——Q<sub>true</sub>(f) = f·ATE 是直线，' +
          '它的面积正好等于随机靶向线下的面积。所以随机排序的 IPW 估计值偏离 0 多少，' +
          '就是单次估计的噪声量级。本数据上它是 <strong>0.1065</strong>，' +
          '而 oracle 与模型的真值差距只有 <strong>0.0269</strong>。</p>' +
          '<p><strong>结论：单次 IPW 估计分辨不出这两个排序的优劣。</strong>' +
          '模型已经拿到天花板的 90.7%，但这点差距被埋进噪声里了。' +
          '想比较两个模型，必须做重复抽样取均值，不能拿一次的数直接比大小。</p></div>' +

          '<h3>c-for-benefit 没有真值，只有上界</h3>' +
          '<p>这一点常被误解。Qini / TOC 是 <em>τ</em> 的函数（排序分数确定后，真值就确定），' +
          '而 c-for-benefit 的「观测获益」里混着<strong>不可消除的个体结局噪声</strong>' +
          '——配对两人的基线差加结局噪声差。即使排序完美，C 统计量也到不了 1。</p>' +
          '<p>它的天花板有闭式解。观测获益 <code>= τ + η</code>，比较两对时信号 <code>D = τ<sub>i</sub> − τ<sub>j</sub></code>、' +
          '噪声 <code>η</code> 都是零均值正态且独立，于是 <code>(D, D+η)</code> 是二元正态，' +
          '相关系数 <code>ρ = sd(τ) / sd(观测获益)</code>，' +
          '同号概率 = <code>1/2 + arcsin(ρ)/π</code>：</p>' +
          '<pre><code>信噪比 rho = sd(tau) / sd(观测获益) = 0.973 / 1.905 = 0.511\n' +
          '理论天花板 = 0.5 + asin(0.511) / pi = 0.6706\n' +
          'oracle 实测  0.6638     ← 与理论值差 0.007，吻合\n' +
          '模型实测    0.6457     ← 拿到天花板区间的 (0.646−0.5)/(0.671−0.5) ≈ 85%\n' +
          '随机排序    0.5062</code></pre>' +
          '<p>所以 c-for-benefit 报 0.65 时不要觉得「不够接近 1」——' +
          '<strong>这个数据的信息上限就是 0.671</strong>。想抬高天花板只能提高信噪比：' +
          '降低结局噪声（重复测量、用更精确的结局）、或选异质性更大的亚群。</p>' +

          '<h3>三类结局：同一套指标，标尺不同（脚本 12）</h3>' +
          '<p>三个指标对<strong>连续、二分类、生存</strong>都能用，调用方式完全一样，' +
          '差别只在内部怎么把结局压成可比较的评分。生存最关键：必须先固定一个时点 ' +
          '<code>t0</code>，把结局压成里程碑指标 <code>I(T &gt; t0)</code>，' +
          '并用完整病例 IPCW 权重 <code>1/Ĝ(min(T, t0))</code> 补偿删失。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>结局</th><th>压成的 <code>y</code></th><th>权重 <code>w</code></th><th>效应标尺</th></tr></thead><tbody>' +
          '<tr><td>连续</td><td><code>Y</code></td><td>1</td><td>均值差</td></tr>' +
          '<tr><td>二分类</td><td><code>0/1</code></td><td>1</td><td>风险差</td></tr>' +
          '<tr><td>生存（默认 <code>survdiff</code>）</td><td><code>I(T &gt; t0)</code></td>' +
          '<td><code>I(可观测) / Ĝ(min(T,t0))</code></td><td><em>S</em>(t0) 差</td></tr>' +
          '<tr><td>生存（<code>effect = "rmst"</code>）</td><td><code>δ·min(T,t0) / Ĝ(T)</code></td>' +
          '<td>1</td><td>t0 内 RMST 差</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code># 生存结局：t0 不传时默认取事件时间的中位数\n' +
          'qini_coefficient(cate, d$A, d$Y, t0 = 2)                  # S(t0) 差\n' +
          'qini_coefficient(cate, d$A, d$Y, t0 = 2, effect = "rmst") # RMST 差\n' +
          'c_for_benefit(cate, d$A, d$Y, t0 = 2)\n' +
          'dr_pseudo_outcome(d$X, d$A, d$Y, t0 = 2)                  # 生存也能出 DR 伪结局</code></pre>' +

          '<h4>实测对账：三层排序 × 三类结局（各重复 8 次，留出集评价）</h4>' +
          '<pre><code>| 结局   | ATE真值 | Qini oracle       | Qini model        | Qini random       | c4b oracle        | c4b model         | c4b random        |\n' +
          '| 连续   | 1.0433  | 0.3373 ± 0.1348  | 0.3253 ± 0.1613  | -0.0239 ± 0.1398 | 0.6630 ± 0.0199  | 0.6440 ± 0.0228  | 0.4995 ± 0.0282  |\n' +
          '| 二分类 | 0.1312  | 0.0361 ± 0.0120  | 0.0248 ± 0.0096  | -0.0016 ± 0.0172 | 0.6118 ± 0.0276  | 0.5727 ± 0.0213  | 0.5029 ± 0.0287  |\n' +
          '| 生存   | 0.1514  | 0.0386 ± 0.0122  | 0.0385 ± 0.0116  |  0.0010 ± 0.0118 | 0.5777 ± 0.0256  | 0.5746 ± 0.0242  | 0.4944 ± 0.0247  |</code></pre>' +
          '<p>三层排序的次序在三类结局上都对：<strong>oracle ≥ model &gt; random</strong>，' +
          '且随机排序的 Qini ≈ 0、c-for-benefit ≈ 0.5。' +
          '生存那一格 model 与 oracle 几乎持平，是因为 T-learner + Cox 在 ' +
          '<em>S</em>(t0) 尺度上已经很接近天花板，不是指标失灵。</p>' +

          '<h4>生存的删失校正不是可选项（n = 20000）</h4>' +
          '<pre><code>| 算法                     | Q(1)   | 偏差    |\n' +
          '| 完整病例 IPCW（本包默认） | 0.1424 | -0.0090 |\n' +
          '| 不做删失校正（w = 1）     | 0.1127 | -0.0387 |\n' +
          '| 真值                     | 0.1514 | +0.0000 |</code></pre>' +
          '<p>不做 IPCW 会把 Q(1) 从 0.142 压到 0.113，低估约四分之一——' +
          '因为被删失的人被当成「没获益」计入了分母。<code>rmst</code> 尺度在删失很重时' +
          '还会系统性低估（实测 −0.067），原因是权重被截断在 100 以内；' +
          '删失重的样本请优先用默认的 <code>survdiff</code>。</p>' +

          '<h4>泄漏对照：拟合顺序决定指标能不能信</h4>' +
          '<pre><code>| 拟合方式                   | c-for-benefit | 与真 tau 的相关 |\n' +
          '| 全集拟合后切留出集（泄漏）  | 0.8910        | 0.542           |\n' +
          '| 只在训练集拟合（正确）      | 0.5583        | 0.655           |\n' +
          '| 真 tau（oracle）           | 0.6045        | 1.000           |</code></pre>' +
          '<p>泄漏版的 CATE 与真 <em>τ</em> 的相关反而<strong>更低</strong>（0.542 &lt; 0.655），' +
          'c-for-benefit 却高得多——这正是「记住了 <code>Y</code>」的特征：' +
          '指标变好而排序变差。评价 HTE 模型时，<strong>先切分、后拟合</strong>是硬规矩。</p>' +

          '<h3>观察性数据：偏差与噪声是两回事</h3>' +
          '<p>同一把真值尺子放到观察性数据上，能看出 <code>propensity</code> 修的是哪一块：</p>' +
          '<pre><code>模型真值      0.2523\n' +
          'oracle 真值   0.2850\n' +
          '传 propensity  0.2666   ← 残差 0.014，是噪声\n' +
          '不传 propensity 1.0535   ← 偏差 0.801，是混杂\n' +
          '噪声标尺       0.0383   ← 偏差是它的 21 倍</code></pre>' +
          '<p>传了 <code>propensity</code> 之后残差 0.014 已经落在噪声量级内（标尺 0.038）；' +
          '不传则偏出去 0.801，是噪声的 21 倍——<strong>这不是抖动，是系统错</strong>。' +
          '这也解释了为什么在这个数据上「不传 propensity」的读数没有讨论价值：' +
          '它根本不是对真值的估计。</p>' +

          '<div class="callout warn"><div class="callout-title">TOC 曲线最左端不可信</div>' +
          '<p>看上面那张 TOC 图：IPW 估计线在最左侧冲到 20+（y 轴截到 6 才看得清）。' +
          '原因是 <code>TOC(f_k) = (1/k)·Σ s<sub>i</sub></code>，当 <em>k</em> 很小时单个样本的' +
          '<code>Y<sub>i</sub>/e<sub>i</sub></code> 就能主导整个均值，而 <em>e</em><sub>i</sub> 可能只有 0.01。' +
          '<strong>只看 <em>f</em> ≥ 0.1 的部分</strong>；要对极端分位做推断，请用 ' +
          '<code>n_bins</code> 分箱或直接换 DR/AIPW 评分。</p></div>' +

          '<div class="callout ok"><div class="callout-title">判别力 ≠ 无偏性</div>' +
          '<p>这三个指标衡量的是<strong>排序质量</strong>，不是<strong>效应估计的无偏性</strong>。' +
          '一个模型可以把 CATE 整体放大 10 倍，Qini / c-for-benefit 完全不变，但 ATE 会错 10 倍。' +
          '所以两者要分开报：ATE 的无偏性靠 IPTW / DR 与真值对账（前六格），' +
          '判别力靠这三个指标（本格）。</p></div>' +

          '<h3>文献出处</h3>' +
          '<ul>' +
          '<li>Qini 曲线与系数：Sverdrup E, Wu H, Athey S, Wager S. ' +
          '<em>Qini Curves for Multi-Armed Treatment Rules.</em> ' +
          'Journal of Computational and Graphical Statistics, 2025. arXiv:2306.11979. ' +
          '（uplift 曲线的早期形式见 Radcliffe 2007）</li>' +
          '<li>c-for-benefit：van Klaveren D, Steyerberg EW, Serruys PW, Kent DM. ' +
          '<em>The proposed "concordance-statistic for benefit" provided a useful metric ' +
          'when modeling heterogeneous treatment effects.</em> ' +
          'J Clin Epidemiol 2018;94:59-68.</li>' +
          '<li>TOC 曲线：Yadlowsky S, Fleming S, Shah N, Brunskill E, Wager S. ' +
          '<em>Evaluating Treatment Prioritization Rules via Rank-Weighted Average ' +
          'Treatment Effects.</em> JASA 120(549), 2025. arXiv:2111.07966.</li>' +
          '</ul>'
      },
      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　<a href="#/api">去看函数文档 →</a>' +
          '</p></div>'
      }
    ]
  },
  en: {
    title: "5 · Model evaluation metrics",
    lede: "Qini / c-for-benefit / TOC answer \"how well does it rank\", not \"is the estimate unbiased\" — keep the two questions apart.",
    sections: [
      {
        id: "fw-metrics",
        heading: "At a glance",
        body:
          '<p>The first four frameworks answer "is the ATE unbiased?"; this one independently answers ' +
          '<strong>"how well does the model rank who benefits more?"</strong> — discrimination, not unbiasedness. ' +
          'Three metrics, Qini / c-for-benefit / TOC, are all defined on a test set; in-sample discrimination is self-deception.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Topic</th><th>Script</th><th>Key result (n = 4000, continuous)</th></tr></thead><tbody>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">How the three metrics work</a></td>' +
          '<td><code>10_HTE评价指标.R</code></td>' +
          '<td>Qini coefficient <strong>0.312</strong> (random ordering 0.020); c-for-benefit <strong>0.646</strong> (random 0.508)</td></tr>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">Reconcile against the true <em>τ</em></a></td>' +
          '<td><code>11_评价指标真值对账.R</code></td>' +
          '<td>Splits error into <strong>ranking loss</strong> and <strong>estimation noise</strong>; cor(CATE, τ) = 0.904</td></tr>' +
          '<tr><td><a href="#/tutorialmetrics/metrics">All three outcome types</a></td>' +
          '<td><code>12_三类结局评价指标.R</code></td>' +
          '<td>Survival needs IPCW; "fit first, split later" leakage inflates every metric</td></tr>' +
          '</tbody></table></div>'

      },
      {
        id: "metrics",
        heading: "Model evaluation: Qini, c-for-benefit and TOC (script 10)",
        body:
          '<p>The six cells above answer "is the ATE estimated accurately?". An HTE model ' +
          'raises a separate question: <strong>how well does it rank who benefits more</strong>? ' +
          'A model can be perfectly unbiased for the ATE while knowing nothing about ' +
          'heterogeneity (a constant predictor does exactly that). Three metrics target that ' +
          'question specifically, and all of them must be computed on a <strong>held-out ' +
          'test set</strong> — discrimination on the training set is self-deception.</p>' +

          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Metric</th><th>Function</th><th>What it looks at</th><th>Reference</th></tr></thead><tbody>' +
          '<tr><td>Qini curve / coefficient</td><td><code>qini_curve()</code><br><code>qini_coefficient()</code></td>' +
          '<td>IPW cumulative treatment gain when targeting the top k% by CATE</td>' +
          '<td>Random-targeting line; coefficient ≈ 0 means no usable heterogeneity</td></tr>' +
          '<tr><td>c-for-benefit</td><td><code>c_for_benefit()</code></td>' +
          '<td>Concordance between predicted and observed benefit across matched pairs</td>' +
          '<td>0.5 = random; closer to 1 is better</td></tr>' +
          '<tr><td>TOC curve</td><td><code>toc_curve()</code></td>' +
          '<td>Average treatment effect inside the top k% as targeting grows</td>' +
          '<td>Overall ATE (horizontal dashed line)</td></tr>' +
          '</tbody></table></div>' +

          '<h3>What the code looks like</h3>' +
          '<pre><code>d &lt;- mlr3HTE_demo_data(n = 4000, seed = 1)\n' +
          'idx &lt;- sample.int(nrow(d$X), nrow(d$X) %/% 2)   # hold out a test set\n' +
          'fit &lt;- metalearner("T", d$X[-idx, ], d$A[-idx], d$Y[-idx],\n' +
          '                   learner_base = mlr3::lrn("regr.ranger", num.trees = 300, seed = 1))\n' +
          'cate_te &lt;- fit$predict(d$X[idx, ])             # ranking score on the test set\n\n' +
          'q &lt;- qini_coefficient(cate_te, d$A[idx], d$Y[idx])\n' +
          'c &lt;- c_for_benefit(cate_te, d$A[idx], d$Y[idx])\n' +
          't &lt;- toc_curve(cate_te, d$A[idx], d$Y[idx])\n\n' +
          '# control: shuffle the CATE — that is an uninformative ordering\n' +
          'cate_rand &lt;- sample(cate_te)\n' +
          'qini_coefficient(cate_rand, d$A[idx], d$Y[idx])$qini_coefficient</code></pre>' +

          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/qini-curve.png" ' +
          'alt="Qini curve: IPW cumulative gain rises well above the random-targeting line">' +
          '<figcaption>Qini curve (dashed = random targeting)</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/toc-curve.png" ' +
          'alt="TOC curve: clearly above the overall ATE early, flattening back to it later">' +
          '<figcaption>TOC curve (dashed = overall ATE)</figcaption></figure>' +
          '</div>' +

          '<h3>Actual output: n=4000, continuous outcome</h3>' +
          '<pre><code>            metric informative     random\n' +
          '1 Qini coefficient   0.3120958 0.02028658\n' +
          '2    c-for-benefit   0.6456819 0.50779098\n\n' +
          'ℹ cor(cate_test, tau_test) = 0.904   # the ordering carries signal: CATE tracked the true tau</code></pre>' +

          '<div class="callout"><div class="callout-title">How to read the three metrics</div>' +
          '<p><strong>The earlier and steeper the Qini curve lifts</strong>, the better the model ' +
          'pushes beneficiaries to the front; a coefficient of 0.312 against 0.020 for random is ' +
          'roughly a 15-fold gap. <strong>c-for-benefit 0.646</strong>: among pairs, the one with ' +
          'higher predicted benefit also shows higher observed benefit about 65% of the time, ' +
          'versus 0.508 for random. <strong>The TOC curve sits above the overall ATE early</strong>: ' +
          'treating only the top 25% yields a larger average effect than treating everyone — ' +
          'that headroom is what precision targeting buys you.</p></div>' +

          '<h3>Observational data: what each metric needs</h3>' +
          '<p>Under randomization, "observed benefit = treated outcome − control outcome" is ' +
          'unbiased. With observational data the two arms differ in baseline prognosis, so that ' +
          'difference is confounded — and the fix differs per metric:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Metric</th><th>What to pass</th><th>Why</th></tr></thead><tbody>' +
          '<tr><td>Qini / TOC</td><td><code>propensity = e(X)</code></td>' +
          '<td>The estimator is already IPW; swapping in an estimated <code>e</code> ' +
          'de-confound it</td></tr>' +
          '<tr><td>c-for-benefit</td><td><code>propensity</code> + <code>mu1</code> + <code>mu0</code></td>' +
          '<td>Observed benefit becomes a doubly-robust pseudo-outcome — ' +
          '<strong>all three are required</strong></td></tr>' +
          '</tbody></table></div>' +
          '<p>Get all three nuisance parameters in one call with <code>dr_pseudo_outcome()</code>, ' +
          'which cross-fits by default (5 folds):</p>' +
          '<pre><code>d_obs &lt;- mlr3HTE_demo_obs(n = 4000, seed = 11)\n' +
          'dr    &lt;- dr_pseudo_outcome(d_obs$X, d_obs$A, d_obs$Y, seed = 1)  # e / mu1 / mu0\n' +
          'cate  &lt;- dr$mu1 - dr$mu0\n\n' +
          'qini_coefficient(cate, d_obs$A, d_obs$Y, propensity = dr$propensity)\n' +
          'toc_curve(cate, d_obs$A, d_obs$Y, propensity = dr$propensity)\n' +
          'c_for_benefit(cate, d_obs$A, d_obs$Y,\n' +
          '              propensity = dr$propensity, mu1 = dr$mu1, mu0 = dr$mu0)</code></pre>' +
          '<pre><code>            metric naive_no_ps with_ps_dr reference\n' +
          '1 Qini coefficient    1.053519  0.2666317        NA\n' +
          '2  TOC overall ATE    1.797248  1.0966008 1.0462000\n' +
          '3    c-for-benefit          NA  0.6296391 0.6493522\n\n' +
          'ℹ obs data: true ATE = 1.046, DR ATE ≈ 1.00\n' +
          'ℹ c-for-benefit: model 0.630 / oracle tau 0.649 / random ≈ 0.508</code></pre>' +
          '<p>Without <code>propensity</code>, the TOC overall ATE is inflated to 1.797 ' +
          '(truth 1.046) and the Qini coefficient jumps from 0.267 to 1.054 — ' +
          '<strong>confounding mistaken for heterogeneity</strong>. For c-for-benefit the model ' +
          'score 0.630 stays below the oracle 0.649, which is the correct ordering.</p>' +

          '<div class="callout warn"><div class="callout-title">Four caveats, stated up front</div>' +
          '<p><strong>① Observational data must pass a propensity score.</strong> The ' +
          '<code>propensity</code> argument defaults to <code>NULL</code>, which falls back to ' +
          '<code>mean(A)</code> — valid only for randomized trials. For observational data, pass ' +
          'your estimated <code>e(X)</code>; otherwise the IPW score itself is biased and so are ' +
          'the metrics.</p>' +
          '<p><strong>② c-for-benefit errors if you only pass a propensity score.</strong> ' +
          'That silently falls back on the Horvitz–Thompson score ' +
          '<code>AY/e − (1−A)Y/(1−e)</code>, whose per-sample SD is about 15 while the ATE is ' +
          'around 1; the noise drives the C-statistic below the random line — measured at 0.39 ' +
          'even when ranking by the true <code>tau</code>. Supply the outcome model ' +
          '<code>mu1</code>/<code>mu0</code> as well and use the doubly-robust form.</p>' +
          '<p><strong>②b Cross-fit the outcome model.</strong> Fitting on the full sample and ' +
          'predicting back in-sample puts <code>mu1 − mu0</code> and the CATE being evaluated in ' +
          'the same model, and pairs are then formed by nearest neighbour on that same CATE — ' +
          'which mechanically aligns observed with predicted benefit. Measured inversion: ' +
          'in-fold model 0.754 &gt; true tau 0.717; after cross-fitting, 0.662 ≤ 0.669.</p>' +
          '<p><strong>③ Survival outcomes are supported, but the scale must match the CATE.</strong> ' +
          'All three functions accept a <code>Surv</code> object. By default the outcome is ' +
          'reduced to the milestone indicator <code>I(T &gt; t0)</code>, so the effect scale is ' +
          'the <em>S</em>(t0) difference — the same quantity <code>metalearner()</code> reports ' +
          'as its survival CATE. Without that alignment, ranking comparisons are meaningless. ' +
          'Censoring is handled by complete-case IPCW; <code>effect = "rmst"</code> switches to ' +
          'the RMST scale. See the next section.</p>' +
          '<p><strong>④ c-for-benefit is an approximation.</strong> This package uses greedy ' +
          'matching plus rank concordance across pairs, not the full matching procedure of the ' +
          'van Klaveren paper; use the <code>CforBenefit</code> package when strict replication ' +
          'is required. This is written in the comments of <code>R/metrics.R</code>, not hidden.</p>' +
          '<p><strong>⑤ Split before you fit.</strong> Fitting on the full sample and then ' +
          'carving out a test set leaks <code>Y</code> into the CATE. Binary outcomes make it ' +
          'brutal: observed benefit is <code>Y<sub>treated</sub> − Y<sub>control</sub></code>, ' +
          'so a CATE that memorized <code>Y<sub>treated</sub></code> jumps to 0.89 and beats the ' +
          'oracle\'s 0.60 — even though its correlation with the true <em>τ</em> is <em>worse</em>. ' +
          'Measured below.</p></div>' +

          '<h3>Three outcome types: same metrics, different scales (script 12)</h3>' +
          '<p>All three metrics work for <strong>continuous, binary and survival</strong> ' +
          'outcomes with an identical call; only the internal reduction differs. For survival ' +
          'the key step is fixing a horizon <code>t0</code> and reducing the outcome to the ' +
          'milestone indicator <code>I(T &gt; t0)</code>, with complete-case IPCW weights ' +
          '<code>1/Ĝ(min(T, t0))</code> compensating for censoring.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Outcome</th><th>Reduced <code>y</code></th><th>Weight <code>w</code></th><th>Effect scale</th></tr></thead><tbody>' +
          '<tr><td>Continuous</td><td><code>Y</code></td><td>1</td><td>Mean difference</td></tr>' +
          '<tr><td>Binary</td><td><code>0/1</code></td><td>1</td><td>Risk difference</td></tr>' +
          '<tr><td>Survival (<code>survdiff</code>, default)</td><td><code>I(T &gt; t0)</code></td>' +
          '<td><code>I(observable) / Ĝ(min(T,t0))</code></td><td><em>S</em>(t0) difference</td></tr>' +
          '<tr><td>Survival (<code>effect = "rmst"</code>)</td><td><code>δ·min(T,t0) / Ĝ(T)</code></td>' +
          '<td>1</td><td>RMST difference up to t0</td></tr>' +
          '</tbody></table></div>' +
          '<pre><code># t0 defaults to the median event time when omitted\n' +
          'qini_coefficient(cate, d$A, d$Y, t0 = 2)                  # S(t0) difference\n' +
          'qini_coefficient(cate, d$A, d$Y, t0 = 2, effect = "rmst") # RMST difference\n' +
          'c_for_benefit(cate, d$A, d$Y, t0 = 2)\n' +
          'dr_pseudo_outcome(d$X, d$A, d$Y, t0 = 2)                  # DR pseudo-outcome for survival too</code></pre>' +

          '<h4>Measured: three rankings x three outcomes (8 replicates, held-out evaluation)</h4>' +
          '<pre><code>| outcome    | true ATE | Qini oracle       | Qini model        | Qini random       | c4b oracle        | c4b model         | c4b random        |\n' +
          '| continuous | 1.0433   | 0.3373 +- 0.1348  | 0.3253 +- 0.1613  | -0.0239 +- 0.1398 | 0.6630 +- 0.0199  | 0.6440 +- 0.0228  | 0.4995 +- 0.0282  |\n' +
          '| binary     | 0.1312   | 0.0361 +- 0.0120  | 0.0248 +- 0.0096  | -0.0016 +- 0.0172 | 0.6118 +- 0.0276  | 0.5727 +- 0.0213  | 0.5029 +- 0.0287  |\n' +
          '| survival   | 0.1514   | 0.0386 +- 0.0122  | 0.0385 +- 0.0116  |  0.0010 +- 0.0118 | 0.5777 +- 0.0256  | 0.5746 +- 0.0242  | 0.4944 +- 0.0247  |</code></pre>' +
          '<p>The ordering holds for every outcome type: ' +
          '<strong>oracle ≥ model &gt; random</strong>, with random landing at Qini ≈ 0 and ' +
          'c-for-benefit ≈ 0.5. The survival row sits nearly at parity because a T-learner with ' +
          'Cox is already close to the ceiling on the <em>S</em>(t0) scale — not because the ' +
          'metric fails.</p>' +

          '<h4>Censoring correction is not optional (n = 20000)</h4>' +
          '<pre><code>| method                        | Q(1)   | bias    |\n' +
          '| complete-case IPCW (default)  | 0.1424 | -0.0090 |\n' +
          '| no censoring correction (w=1) | 0.1127 | -0.0387 |\n' +
          '| truth                         | 0.1514 | +0.0000 |</code></pre>' +
          '<p>Skipping IPCW drags Q(1) from 0.142 down to 0.113 — about a quarter too low — ' +
          'because censored subjects are counted as non-responders in the denominator. The ' +
          '<code>rmst</code> scale additionally under-estimates under heavy censoring ' +
          '(measured −0.067) because weights are capped at 100; prefer the default ' +
          '<code>survdiff</code> when censoring is heavy.</p>' +

          '<h4>Leakage control: fit order decides whether the metric is trustworthy</h4>' +
          '<pre><code>| fit protocol                        | c-for-benefit | cor with true tau |\n' +
          '| fit on all data, then split (leaky) | 0.8910        | 0.542             |\n' +
          '| fit on training set only (correct)  | 0.5583        | 0.655             |\n' +
          '| true tau (oracle)                   | 0.6045        | 1.000             |</code></pre>' +
          '<p>The leaky CATE correlates <em>worse</em> with the true <em>τ</em> (0.542 &lt; 0.655) ' +
          'yet scores far higher on c-for-benefit — the signature of memorizing <code>Y</code>: ' +
          'the metric improves while the ranking degrades. <strong>Split first, fit second.</strong></p>' +

          '<h3>Truth scale: what these metrics <em>should</em> be</h3>' +
          '<p>With simulated data <em>τ</em> is known, so the true Qini and TOC are ' +
          '<strong>directly computable</strong> without any IPW estimation: ' +
          '<code>Q_true(f_k) = (1/n) · Σ<sub>i in top-k</sub> τ<sub>i</sub></code>. ' +
          'That yardstick lets us put truth and estimate side by side and split the error into ' +
          '<strong>ranking loss</strong> (the model misplaced beneficiaries) and ' +
          '<strong>estimation noise</strong> (IPW sampling error). ' +
          'Script: <code>11_评价指标真值对账.R</code>.</p>' +

          '<div class="fig-grid">' +
          '<figure class="fig"><img src="assets/img/qini-truth.png" ' +
          'alt="Qini curves comparing the truth under oracle ranking, truth under model ranking, and the IPW estimate">' +
          '<figcaption>Green = truth ceiling, blue = truth under model ranking, ' +
          'orange dashed = IPW estimate</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/toc-truth.png" ' +
          'alt="TOC curves: the IPW estimate oscillates around the truth and blows up at the far left">' +
          '<figcaption>TOC: IPW estimate hovers around the truth, overshoots at the far left</figcaption></figure>' +
          '</div>' +

          '<pre><code># n_test = 2000, continuous outcome RCT, true ATE = 1.042\n' +
          '| layer       | truth  | IPW est | est - truth |\n' +
          '| random      | 0.0076 | 0.1140  | 0.1065      |\n' +
          '| model       | 0.2618 | 0.3121  | 0.0503      |\n' +
          '| oracle      | 0.2887 | 0.3477  | 0.0591      |\n\n' +
          'oracle truth (ranking ceiling):      0.2887\n' +
          'ranking loss (model misordered):     0.0269 -&gt; 9.3% of ceiling\n' +
          'estimation noise (IPW sampling):     0.0591 -&gt; 20.5% of ceiling\n' +
          'ranking efficiency = model / oracle = 0.907</code></pre>' +

          '<div class="callout"><div class="callout-title">The most useful number: a noise ruler</div>' +
          '<p>The true Qini coefficient of a random ranking is <strong>exactly 0</strong> — ' +
          'Q<sub>true</sub>(f) = f·ATE is a straight line whose area equals the area under the ' +
          'random-targeting line. So however far the IPW estimate of a random ranking sits from 0 ' +
          'is a direct read of single-sample noise. Here that gap is <strong>0.1065</strong>, ' +
          'while the true gap between oracle and model ranking is only <strong>0.0269</strong>.</p>' +
          '<p><strong>Conclusion: a single IPW estimate cannot tell these two rankings apart.</strong> ' +
          'The model already captures 90.7% of the ceiling, but the remaining distance is buried in ' +
          'noise. To compare two models you must average over repeated samples — never compare ' +
          'one-shot numbers.</p></div>' +

          '<h3>c-for-benefit has no truth, only an upper bound</h3>' +
          '<p>This is routinely misunderstood. Qini / TOC are functions of <em>τ</em> (fix the ' +
          'ranking score and the truth is determined), whereas c-for-benefit\'s "observed benefit" ' +
          'carries <strong>irreducible outcome noise</strong> — the baseline gap between the two ' +
          'paired patients plus the difference in their outcome noise. Even a perfect ranking ' +
          'cannot push the C-statistic to 1.</p>' +
          '<p>The ceiling has a closed form. Observed benefit <code>= τ + η</code>; comparing two ' +
          'pairs, the signal <code>D = τ<sub>i</sub> − τ<sub>j</sub></code> and the noise <code>η</code> are both ' +
          'zero-mean Gaussian and independent, so <code>(D, D+η)</code> is bivariate normal with ' +
          'correlation <code>ρ = sd(τ) / sd(observed benefit)</code>, ' +
          'and the probability of agreeing signs is ' +
          '<code>1/2 + arcsin(ρ)/π</code>:</p>' +
          '<pre><code>signal-to-noise rho = sd(tau) / sd(observed) = 0.973 / 1.905 = 0.511\n' +
          'theoretical ceiling  = 0.5 + asin(0.511) / pi            = 0.6706\n' +
          'oracle measured       0.6638   &lt;- 0.007 from theory, a match\n' +
          'model measured        0.6457   &lt;- (0.646-0.5)/(0.671-0.5) = 85% of headroom\n' +
          'random ranking        0.5062</code></pre>' +
          '<p>So when c-for-benefit reports 0.65, do not conclude it is "not close enough to 1" — ' +
          '<strong>the information ceiling of this dataset is 0.671</strong>. The only ways to ' +
          'raise it are to raise the signal-to-noise ratio: measure the outcome more precisely, ' +
          'or evaluate within a subgroup with larger heterogeneity.</p>' +

          '<h3>Observational data: bias and noise are different failures</h3>' +
          '<p>Point the same yardstick at observational data and it becomes clear which part ' +
          '<code>propensity</code> fixes:</p>' +
          '<pre><code>model truth       0.2523\n' +
          'oracle truth      0.2850\n' +
          'with propensity   0.2666   &lt;- residual 0.014, noise\n' +
          'without           1.0535   &lt;- bias 0.801, confounding\n' +
          'noise ruler       0.0383   &lt;- the bias is 21x the ruler</code></pre>' +
          '<p>With <code>propensity</code> the residual 0.014 sits inside the noise level (ruler ' +
          '0.038); without it the estimate is off by 0.801, twenty-one times the noise — ' +
          '<strong>that is not jitter, it is systematic error</strong>. Which is also why the ' +
          '"without propensity" number deserves no discussion here: it is not an estimate of the ' +
          'truth at all.</p>' +

          '<div class="callout warn"><div class="callout-title">The far-left end of TOC is unreliable</div>' +
          '<p>Look at the TOC figure above: the IPW estimate shoots past 20 at the very left ' +
          '(the y-axis is clipped at 6 so anything is visible at all). ' +
          '<code>TOC(f_k) = (1/k)·Σ s<sub>i</sub></code>, so when <em>k</em> is tiny a single ' +
          'observation\'s <code>Y<sub>i</sub>/e<sub>i</sub></code> dominates the mean — ' +
          'and <em>e</em><sub>i</sub> can be 0.01. ' +
          '<strong>Read only <em>f</em> ≥ 0.1</strong>; for inference at extreme quantiles use ' +
          '<code>n_bins</code> or switch to a DR/AIPW score.</p></div>' +

          '<div class="callout ok"><div class="callout-title">Discrimination is not unbiasedness</div>' +
          '<p>These three metrics measure <strong>ranking quality</strong>, not ' +
          '<strong>unbiased effect estimation</strong>. Inflate every CATE by 10× and the Qini / ' +
          'c-for-benefit values do not move at all, while the ATE is off by 10×. Report the two ' +
          'separately: unbiasedness of the ATE comes from IPTW / DR and truth reconciliation ' +
          '(the six cells above), discrimination comes from these three metrics (this cell).</p></div>' +

          '<h3>References</h3>' +
          '<ul>' +
          '<li>Qini curves and coefficient: Sverdrup E, Wu H, Athey S, Wager S. ' +
          '<em>Qini Curves for Multi-Armed Treatment Rules.</em> ' +
          'Journal of Computational and Graphical Statistics, 2025. arXiv:2306.11979. ' +
          '(The early uplift form is Radcliffe 2007.)</li>' +
          '<li>c-for-benefit: van Klaveren D, Steyerberg EW, Serruys PW, Kent DM. ' +
          '<em>The proposed "concordance-statistic for benefit" provided a useful metric ' +
          'when modeling heterogeneous treatment effects.</em> ' +
          'J Clin Epidemiol 2018;94:59-68.</li>' +
          '<li>TOC curve: Yadlowsky S, Fleming S, Shah N, Brunskill E, Wager S. ' +
          '<em>Evaluating Treatment Prioritization Rules via Rank-Weighted Average ' +
          'Treatment Effects.</em> JASA 120(549), 2025. arXiv:2111.07966.</li>' +
          '</ul>'
      },
      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          ' &middot; <a href="#/api">Browse the API reference →</a>' +
          '</p></div>'
      }
    ]
  }
};


window.SITE_PAGES.tutorialbenchmark = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "6 · RCT 基准测试（不依赖真实 tau）",
    lede: "前面五篇都在「有真值」的前提下对账。这一篇换成现实研究的形态：没有 tau，只用 Qini / TOC / c-for-benefit 比较 learner。",
    sections: [

      {
        id: "premise",
        heading: "前提：什么时候能报什么",
        body:
          '<div class="callout warn"><div class="callout-title">真实 CATE 只有模拟数据才有</div>' +
          '<p>教程 01&ndash;07 的对账（CATE 相关 / RMSE）建立在<strong>知道每个人真实效应</strong>之上，' +
          '这只有自带真值的模拟数据给得出。<strong>现实 RCT 数据永远拿不到 tau。</strong>' +
          '所以「跑一遍 mlr3 benchmark、看 CATE 相关」这套做法只适用于模拟研究。</p></div>' +
          '<p>那现实 RCT 数据怎么比模型？换一个问题问：<strong>模型把"谁更获益"排到前面的能力如何</strong>。' +
          '这不需要 tau，只需要随机化保证的可交换性：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>指标</th><th>随机基线</th><th>回答什么</th></tr></thead><tbody>' +
          '<tr><td><strong>Qini 系数</strong></td><td>&asymp; 0</td>' +
          '<td>按模型排序靶向，比随机分配多出多少额外增益</td></tr>' +
          '<tr><td><strong>TOC 增益</strong></td><td>0</td>' +
          '<td>TOC 曲线与全样本 ATE 水平线夹的面积；量纲 = 结局单位</td></tr>' +
          '<tr><td><strong>c-for-benefit</strong></td><td>0.5</td>' +
          '<td>增益匹配后的 C 统计量，0.5 = 排序等于随机</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout"><div class="callout-title">随机基线不是精确的 0</div>' +
          '<p>归一化 Qini 除了随机线下的面积，而那个面积本身小，单次随机排序能在 &plusmn;0.25 摆。' +
          '本包演示数据（n = 1500）实测 10 次随机排序，归一化 Qini 落在 &minus;0.253 到 0.227。' +
          '<strong>比模型要看相对次序，别拿绝对阈值当基线。</strong></p></div>'
      },

      {
        id: "crossfit",
        heading: "为什么必须交叉拟合",
        body:
          '<p>在自己训练过的数据上算这些指标，模型会把训练噪声也排进序里。' +
          '<code>hte_benchmark()</code> 的做法是：每个 learner 在 K 折训练折上拟合、' +
          '在留出折上预测，最后用全部留出预测（out-of-fold）拼一条 CATE。</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>X-learner 的做法</th><th>qini_normalized</th>' +
          '<th>c_for_benefit</th></tr></thead><tbody>' +
          '<tr><td>in-fold（回代训练数据）</td><td>0.528</td><td><strong>0.663</strong></td></tr>' +
          '<tr><td>out-of-fold（5 折交叉拟合）</td><td>0.404</td><td>0.617</td></tr>' +
          '<tr><td>真实 tau（参考上界）</td><td>0.522</td><td>0.624</td></tr>' +
          '</tbody></table></div>' +
          '<p>in-fold 的 c-for-benefit <strong>0.663 超过了真实 tau 的 0.624</strong>&mdash;' +
          '那不是模型好，是把噪声也排序了。交叉拟合后回落到 0.617，落在真值下方，才是该有的样子。</p>'
      },

      {
        id: "code",
        heading: "跑起来",
        body:
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\n' +
          'bm$table\n\n' +
          '# 现实 RCT 数据：没有 tau，输出里就不会有 tau_cor / tau_rmse 两列\n' +
          'bm &lt;- hte_benchmark(X, A, Y, seed = 42)\n\n' +
          '# 曲线对比\n' +
          'plot_hte_benchmark(bm, "qini")\n' +
          'plot_hte_benchmark(bm, "toc")</code></pre>' +
          '<p>参数上值得注意的几点：</p>' +
          '<ul>' +
          '<li><code>learner_base</code> 所有 learner 共用一个，比出来的差异才归因于 meta-learner' +
          '而不是基学习器；默认按结局类型自动选（连续 ranger / 二分类 classif.ranger / 生存 coxph）。</li>' +
          '<li><code>n_folds</code> 的折<strong>按处理组分层</strong>，保证每折两个臂都有样本&mdash;' +
          '不分层时某一折可能全是同一个臂，该折的效应估计直接失效。</li>' +
          '<li><code>tau</code> 是可选的。给了就多两列 <code>tau_cor</code> / <code>tau_rmse</code>，' +
          '于是 Qini 三件套和「有真值」的两套指标能对着看。</li>' +
          '<li>观察性数据把 <code>propensity</code> / <code>mu1</code> / <code>mu0</code> ' +
          '（<a href="#/apimetrics">dr_pseudo_outcome()</a> 的输出）一起传进来即可，指标算法不变。</li>' +
          '</ul>'
      },

      {
        id: "results",
        heading: "三类结局的实测结果",
        body:
          '<p>n = 1500，5 折交叉拟合，seed = 42。</p>' +
          '<p><strong>连续 &times; RCT</strong>（真实 ATE 1.049）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>1.040</td><td>0.417</td><td>0.516</td><td>0.613</td><td>0.908</td></tr>' +
          '<tr><td>T</td><td>1.100</td><td>0.378</td><td>0.492</td><td>0.608</td><td>0.894</td></tr>' +
          '<tr><td>X</td><td>1.090</td><td>0.404</td><td>0.647</td><td>0.617</td><td>0.946</td></tr>' +
          '<tr><td>R</td><td>0.498</td><td>0.460</td><td>0.946</td><td>0.599</td><td>0.857</td></tr>' +
          '<tr><td>DR</td><td>1.090</td><td>0.413</td><td>0.568</td><td>0.617</td><td>0.932</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">ATE 和 Qini 要一起报</div>' +
          '<p>R 的 ATE 只有 0.498（真值 1.049），可 qini_normalized 和 toc_gain 都是五个里最高的。' +
          '原因：R-learner 二阶段对伪结果回归，<strong>没有尺度约束</strong>，' +
          'CATE 可以整体缩小一半而排序不变。Qini / TOC 只看排序，对尺度错误视而不见。' +
          '<strong>两者分别回答"平均对不对"和"排序好不好"，合起来才是完整评价。</strong></p></div>' +
          '<p><strong>二分类 &times; RCT</strong>（真实 ATE 0.131）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.127</td><td>0.184</td><td>0.062</td><td>0.556</td><td>0.728</td></tr>' +
          '<tr><td>T</td><td>0.139</td><td>0.193</td><td>0.078</td><td>0.554</td><td>0.643</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.349</td><td>0.095</td><td>0.594</td><td>0.839</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.211</td><td>0.041</td><td>0.559</td><td>0.589</td></tr>' +
          '<tr><td>DR</td><td>0.143</td><td>0.296</td><td>0.086</td><td>0.577</td><td>0.713</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>生存 &times; RCT</strong>（t0 = 2，真实 ATE 0.152）：</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.159</td><td>&minus;0.095</td><td>0.005</td><td>0.498</td><td>&minus;0.052</td></tr>' +
          '<tr><td>T</td><td>0.151</td><td>0.707</td><td>0.208</td><td>0.554</td><td>0.950</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.462</td><td>0.125</td><td>0.544</td><td>0.884</td></tr>' +
          '<tr><td>R</td><td>0.126</td><td>0.098</td><td>0.038</td><td>0.497</td><td>0.419</td></tr>' +
          '<tr><td>DR</td><td>0.120</td><td>&minus;0.045</td><td>0.025</td><td>0.496</td><td>0.380</td></tr>' +
          '</tbody></table></div>' +
          '<p>生存场景里 S-learner 的 tau_cor 是 &minus;0.052、qini_normalized &minus;0.095&mdash;' +
          '完全没学到异质性（Cox 单模型把处理当普通特征，异质性被压平），' +
          '而 T-learner 两项都是最高。<strong>「ATE 差不多」和「排序能力差很多」可以同时成立。</strong></p>' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" ' +
          'alt="五种 meta-learner 的 Qini 曲线对比">' +
          '<figcaption>Qini 曲线对比（连续 &times; RCT）。灰色虚线 = 随机靶向基线；前 5% 未画。</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" ' +
          'alt="五种 meta-learner 的 TOC 曲线对比">' +
          '<figcaption>TOC 曲线对比。灰色虚线 = 全样本 ATE；T / X 的曲线始终在上方，' +
          '说明前排人群收益更高。</figcaption></figure>'
      },

      {
        id: "next",
        notoc: true,
        heading: "继续读",
        body:
          '<div class="callout"><div class="callout-title">继续读</div><p>' +
          '<a href="#/tutorial">← 返回全部教程</a>' +
          '　·　<a href="#/api">去看函数文档 →</a>' +
          '</p></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "6 · RCT benchmark (no true tau needed)",
    lede: "The previous five articles all reconcile against known truth. This one switches to the real-world setting: no tau, comparing learners with Qini / TOC / c-for-benefit only.",
    sections: [

      {
        id: "premise",
        heading: "Premise: what you can report when",
        body:
          '<div class="callout warn"><div class="callout-title">True CATE only exists in simulated data</div>' +
          '<p>The reconciliation in tutorials 01&ndash;07 (CATE correlation / RMSE) rests on ' +
          '<strong>knowing every patient&rsquo;s true effect</strong>, which only simulated data ' +
          'provides. <strong>Real RCT data never has tau.</strong> So "run an mlr3 benchmark and ' +
          'look at CATE correlation" only applies to simulation studies.</p></div>' +
          '<p>How do you compare models on real RCT data then? Ask a different question: ' +
          '<strong>how well does the model rank who benefits more</strong>. That needs no tau, only ' +
          'the exchangeability randomization buys:</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Metric</th><th>Random baseline</th><th>What it answers</th></tr></thead><tbody>' +
          '<tr><td><strong>Qini coefficient</strong></td><td>&asymp; 0</td>' +
          '<td>Extra gain from targeting by model ranking vs random assignment</td></tr>' +
          '<tr><td><strong>TOC gain</strong></td><td>0</td>' +
          '<td>Area between the TOC curve and the overall-ATE line; units = outcome</td></tr>' +
          '<tr><td><strong>c-for-benefit</strong></td><td>0.5</td>' +
          '<td>C statistic after gain matching; 0.5 = ranking is as good as random</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout"><div class="callout-title">The random baseline is not exactly 0</div>' +
          '<p>Normalised Qini divides by the area under the random line, which is itself small, so a ' +
          'single random ranking can swing &plusmn;0.25. On this package&rsquo;s demo data (n = 1500), ' +
          'ten random rankings gave normalised Qini between &minus;0.253 and 0.227. ' +
          '<strong>Compare models by relative order, not against an absolute threshold.</strong></p></div>'
      },

      {
        id: "crossfit",
        heading: "Why cross-fitting is mandatory",
        body:
          '<p>Scoring these metrics on data the model was trained on lets it rank its own training ' +
          'noise. <code>hte_benchmark()</code> instead fits each learner on K&minus;1 folds and ' +
          'predicts on the held-out fold, then pools all held-out predictions (out-of-fold) into one ' +
          'CATE vector.</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>X-learner variant</th><th>qini_normalized</th>' +
          '<th>c_for_benefit</th></tr></thead><tbody>' +
          '<tr><td>in-fold (scored on training data)</td><td>0.528</td><td><strong>0.663</strong></td></tr>' +
          '<tr><td>out-of-fold (5-fold cross-fitting)</td><td>0.404</td><td>0.617</td></tr>' +
          '<tr><td>true tau (reference ceiling)</td><td>0.522</td><td>0.624</td></tr>' +
          '</tbody></table></div>' +
          '<p>The in-fold c-for-benefit of <strong>0.663 exceeds the true tau&rsquo;s 0.624</strong> ' +
          '&mdash; that is not a better model, that is ranking noise. Cross-fitting brings it back to ' +
          '0.617, below the truth, which is what it should be.</p>'
      },

      {
        id: "code",
        heading: "Running it",
        body:
          '<pre><code>bm &lt;- hte_benchmark(d$X, d$A, d$Y, tau = d$tau, seed = 42)\n' +
          'bm$table\n\n' +
          '# Real RCT data: no tau, so tau_cor / tau_rmse never appear\n' +
          'bm &lt;- hte_benchmark(X, A, Y, seed = 42)\n\n' +
          '# Curve comparison\n' +
          'plot_hte_benchmark(bm, "qini")\n' +
          'plot_hte_benchmark(bm, "toc")</code></pre>' +
          '<p>Worth noting in the arguments:</p>' +
          '<ul>' +
          '<li><code>learner_base</code> is shared by all learners, so differences are attributable to ' +
          'the meta-learner rather than the base learner; it is auto-chosen by outcome type ' +
          '(ranger / classif.ranger / coxph).</li>' +
          '<li><code>n_folds</code> splits <strong>stratified by treatment arm</strong>, so every fold ' +
          'has both arms &mdash; without stratification a fold could end up single-armed and its effect ' +
          'estimate collapses.</li>' +
          '<li><code>tau</code> is optional. Supplying it adds <code>tau_cor</code> / <code>tau_rmse</code>, ' +
          'so the Qini triple and the truth-based metrics can be read side by side.</li>' +
          '<li>For observational data, pass <code>propensity</code> / <code>mu1</code> / <code>mu0</code> ' +
          '(the output of <a href="#/apimetrics">dr_pseudo_outcome()</a>); the metric definitions are unchanged.</li>' +
          '</ul>'
      },

      {
        id: "results",
        heading: "Measured results across outcome types",
        body:
          '<p>n = 1500, 5-fold cross-fitting, seed = 42.</p>' +
          '<p><strong>Continuous &times; RCT</strong> (true ATE 1.049):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>1.040</td><td>0.417</td><td>0.516</td><td>0.613</td><td>0.908</td></tr>' +
          '<tr><td>T</td><td>1.100</td><td>0.378</td><td>0.492</td><td>0.608</td><td>0.894</td></tr>' +
          '<tr><td>X</td><td>1.090</td><td>0.404</td><td>0.647</td><td>0.617</td><td>0.946</td></tr>' +
          '<tr><td>R</td><td>0.498</td><td>0.460</td><td>0.946</td><td>0.599</td><td>0.857</td></tr>' +
          '<tr><td>DR</td><td>1.090</td><td>0.413</td><td>0.568</td><td>0.617</td><td>0.932</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">Report ATE and Qini together</div>' +
          '<p>R&rsquo;s ATE is 0.498 against a truth of 1.049, yet its qini_normalized and toc_gain are ' +
          'the highest of the five. Reason: the R-learner&rsquo;s second stage regresses ' +
          'pseudo-outcomes with <strong>no scale constraint</strong>, so its CATE can shrink by half ' +
          'while the ranking stays intact. Qini / TOC only look at ranking and are blind to scale ' +
          'errors. <strong>The two answer "is the average right" and "is the ranking good"; together ' +
          'they form a complete assessment.</strong></p></div>' +
          '<p><strong>Binary &times; RCT</strong> (true ATE 0.131):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.127</td><td>0.184</td><td>0.062</td><td>0.556</td><td>0.728</td></tr>' +
          '<tr><td>T</td><td>0.139</td><td>0.193</td><td>0.078</td><td>0.554</td><td>0.643</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.349</td><td>0.095</td><td>0.594</td><td>0.839</td></tr>' +
          '<tr><td>R</td><td>0.087</td><td>0.211</td><td>0.041</td><td>0.559</td><td>0.589</td></tr>' +
          '<tr><td>DR</td><td>0.143</td><td>0.296</td><td>0.086</td><td>0.577</td><td>0.713</td></tr>' +
          '</tbody></table></div>' +
          '<p><strong>Survival &times; RCT</strong> (t0 = 2, true ATE 0.152):</p>' +
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>learner</th><th>ate</th><th>qini_normalized</th>' +
          '<th>toc_gain</th><th>c_for_benefit</th><th>tau_cor</th></tr></thead><tbody>' +
          '<tr><td>S</td><td>0.159</td><td>&minus;0.095</td><td>0.005</td><td>0.498</td><td>&minus;0.052</td></tr>' +
          '<tr><td>T</td><td>0.151</td><td>0.707</td><td>0.208</td><td>0.554</td><td>0.950</td></tr>' +
          '<tr><td>X</td><td>0.142</td><td>0.462</td><td>0.125</td><td>0.544</td><td>0.884</td></tr>' +
          '<tr><td>R</td><td>0.126</td><td>0.098</td><td>0.038</td><td>0.497</td><td>0.419</td></tr>' +
          '<tr><td>DR</td><td>0.120</td><td>&minus;0.045</td><td>0.025</td><td>0.496</td><td>0.380</td></tr>' +
          '</tbody></table></div>' +
          '<p>In the survival scenario the S-learner has tau_cor &minus;0.052 and qini_normalized ' +
          '&minus;0.095 &mdash; it learned no heterogeneity at all (a single Cox model treats treatment ' +
          'as an ordinary feature, flattening the effect), while the T-learner tops both. ' +
          '<strong>"Similar ATE" and "very different ranking power" can hold at the same time.</strong></p>' +
          '<figure class="fig"><img src="assets/img/benchmark/qini_curves.png" ' +
          'alt="Qini curves for the five meta-learners">' +
          '<figcaption>Qini curves (continuous &times; RCT). Grey dashed = random targeting baseline; ' +
          'the first 5% is not drawn.</figcaption></figure>' +
          '<figure class="fig"><img src="assets/img/benchmark/toc_curves.png" ' +
          'alt="TOC curves for the five meta-learners">' +
          '<figcaption>TOC curves. Grey dashed = overall ATE; T and X stay above it throughout, ' +
          'meaning the top-ranked group benefits more.</figcaption></figure>'
      },

      {
        id: "next",
        notoc: true,
        heading: "Keep reading",
        body:
          '<div class="callout"><div class="callout-title">Keep reading</div><p>' +
          '<a href="#/tutorial">← All tutorials</a>' +
          '　·　<a href="#/api">Go to the API reference →</a>' +
          '</p></div>'
      }
    ]
  }
};
