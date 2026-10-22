/* =====================================================================
   content-changelog.js —— 更新日志（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.changelog = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "更新日志",
    lede: "mlr3HTE 的版本历史与重要变更。当前版本 v0.35。",
    sections: [

      {
        id: "v035",
        heading: "v0.35 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">模型可解释性并入教程下拉菜单</div>' +
          '<p>原先「可解释性」是顶部独立菜单；本批次把它拆成 10 个页面（函数总览 + 9 个函数独立页），' +
          '全部挂到「教程」下拉菜单下，与 rct / obs / surv / learners / metrics / benchmark / ' +
          'benchgrid / explain 并列。函数文档索引不再重复承载可解释性内容，只做函数级索引。</p></div>' +
          '<p><strong>函数文档索引补齐全部 40 个导出对象</strong>：' +
          '<code>SITE_PAGES.api</code> 总览表重写为全部 40 个导出对象（含 6 个返回 ggplot 的 ' +
          'Plot 函数，注明其数据来自对应数据函数）。</p>' +
          '<p><strong>六个绘图函数帮助文档与教程均内嵌实跑图</strong>：' +
          '<code>plot_hte_importance()</code> / <code>plot_hte_pdp()</code> / ' +
          '<code>plot_hte_shap()</code> / <code>plot_hte_benchmark()</code> / ' +
          '<code>plot_qini()</code> / <code>mlr3HTE_dag()</code> 各自帮助页新增 <code>fig</code> ' +
          '小节，内嵌先用真实数据跑出图再落盘的 PNG；教程对应位置（explain 篇 importance / ' +
          'pdp / shap 三节、benchgrid 篇 confounding 节）同样内嵌实跑图，而非单独成节。</p>' +
          '<div class="callout warn"><div class="callout-title">修掉 content-api.js 的重复页面定义 bug</div>' +
          '<p>该文件原先有 17 个页面被定义了两遍（首份为死定义，缺 title/lede、带「凂数」乱码），' +
          '由 <code>dev/_validate.js</code> 新增的重复定义检测命中。现已删除每个 id 的首份定义、' +
          '保留生效的第二份，48 个定义 0 重复，全站校验通过。</p></div>' +
          '<p><strong>验证 dr_pseudo_outcome() 支持二分类与生存结局</strong>：默认 ' +
          '<code>cross_fitting = TRUE</code>，对连续 / 二分类 / 生存（survdiff + rmst）三类结局' +
          '均给出双重稳健伪结局列表。实测连续 DR ATE 0.9984 vs 真值 1.0000；二分类 0.1531 vs ' +
          '0.1288；生存 survdiff 0.1576 vs 0.1543、rmst 0.2496 vs 0.1964。观察性弱混杂下 DR ' +
          '未必优于未调整，强混杂下显著纠偏。</p>'
      },

      {
        id: "v034",
        heading: "v0.34 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">CATE 模型可解释性模块（R/explain.R，9 个导出函数）</div>' +
          '<p>以 <strong>DALEX</strong> 为骨架、<strong>kernelshap + shapviz</strong> 计算 SHAP 值。' +
          '<code>hte_explainer()</code> 把 CATE 模型包装为 DALEX 解释器，' +
          '<strong>响应变量取双重稳健伪结局 Y*，而非原始 Y</strong>——后者衡量的是基线预后 ' +
          'mu(X)，与效应异质性无关。<code>hte_surrogate()</code> 用单一 mlr3 学习器重拟合 ' +
          'CATE 曲面（实测相关 0.913–0.937），仅供解释与可视化。' +
          '<code>hte_feature_importance()</code>（置换重要性）、<code>hte_pdp()</code>' +
          '（PDP 与 ALE）、<code>hte_shap()</code> / <code>hte_shap_data()</code>（Kernel SHAP）' +
          '与三个绘图函数构成完整链路。SHAP 可加性残差实测 4.44e-16（机器精度）。</p></div>' +
          '<div class="callout warn"><div class="callout-title">两处刻意偏离上游默认行为</div>' +
          '<ul>' +
          '<li><strong><code>hte_pdp()</code> 默认 <code>center = FALSE</code>。</strong>' +
          'DALEX 的 <code>model_profile()</code> 默认把曲线减去平均预测值；CATE 语境下纵轴' +
          '必须是绝对的平均预测 CATE，围绕 0 波动会掩盖效应水平本身。</li>' +
          '<li><strong><code>loss</code> 只接受函数对象或 <code>"rmse"</code> / ' +
          '<code>"mse"</code>。</strong>DALEX 2.5 未导出 MAE；传字符串时 DALEX 会在自身' +
          '框架内按名查找 <code>loss_*</code>，跨包调用必然失败。</li>' +
          '</ul></div>' +
          '<p><strong>所有绘图返回 ggplot 对象</strong>：<code>plot_hte_importance()</code>、' +
          '<code>plot_hte_pdp()</code>、<code>plot_hte_shap()</code>、' +
          '<code>plot_hte_benchmark()</code>、<code>plot_qini()</code>、' +
          '<code>mlr3HTE_dag()</code> 均可用 <code>+</code> 叠加图层、用 ' +
          '<code>ggsave()</code> 导出；绘图数据由 <code>hte_feature_importance()</code>、' +
          '<code>hte_pdp()</code>、<code>hte_shap_data()</code>、' +
          '<code>hte_benchmark_data()</code>（新）、<code>qini_curve()</code>、' +
          '<code>mlr3HTE_dag_data()</code>（新）单独取出。<code>plot_qini()</code> ' +
          '由 base graphics 改写为 ggplot2。</p>' +
          '<p><strong>教程代码支持 R 语法高亮与复制按钮</strong>：新增自写分词器 ' +
          '<code>docs/assets/js/highlight-r.js</code>（约 230 行，不引入 CDN 或构建步骤）。' +
          '220 个代码块区分为 <code>language-r</code>（138 个，带复制按钮）与 ' +
          '<code>r-out</code>（82 个输出块）。顺带修掉控制台原文里 ' +
          '<code>&lt;dbl&gt;</code> 被浏览器当标签吞掉的旧 bug（149 个块已转义）。</p>' +
          '<p><strong>DAG 每两个节点之间只保留一条箭头</strong>：<code>R/dag.R</code> 重写，' +
          '边去重后以二次 Bézier 曲线对矩形标签盒做碰撞检测，需绕行的边自动搜索曲率；' +
          '绘图时按曲率分组、一层一个 <code>geom_curve</code>——<code>curvature</code> ' +
          '是参数而非美学映射，写进 <code>aes()</code> 会被忽略。</p>' +
          '<p><strong>教程语气改为学术规范</strong>：24 处中文与 4 处英文表述由口语改为' +
          '客观陈述，替换以精确匹配脚本执行、可复核。</p>' +
          '<div class="callout ok"><div class="callout-title">基准模拟数据网格（data/mlr3hte_bench_data.rda）</div>' +
          '<p>10 个设计 × 3 类结局 = 30 份数据，n = 2000，种子固定，随包发布。四个结构维度' +
          '相互独立：研究设计（rct / obs）、混杂形式（none / linear / nonlinear）、' +
          '效应异质性形式（linear / nonlinear）、以及<strong>是否存在既是混杂因子又是' +
          '效应修饰因子的共用变量</strong>。每份数据带真值 tau / ate / ps_true，生存结局' +
          '额外提供 RMST 尺度的 tau_rmst / ate_rmst。</p>' +
          '<p>实测混杂强度梯度（未调整差值 − 真值 ATE）：随机化设计 ±0.04 以内；' +
          '观察性且 shared = FALSE 为 0.09–0.24；观察性且 shared = TRUE 为 0.47–0.61。</p>' +
          '<p>线性 / 非线性 HTE 的可估性对照（留出集 CATE 相关）：真实 CATE 线性时 ' +
          'regr.lm 0.994 &gt; regr.ranger 0.894；真实 CATE 非线性时 regr.lm 0.564 &lt; ' +
          'regr.ranger 0.819。基学习器的函数形式必须覆盖真实 CATE 的形式，否则是偏差' +
          '而非方差。</p>' +
          '<p><strong>破坏性变更</strong>：数据对象由 <code>mlr3hte_bench</code> 改名为 ' +
          '<code>mlr3hte_bench_data</code>——Windows 文件系统不区分大小写，数据 Rd 会被' +
          '同名函数的 Rd 覆盖。取用请一律走 <code>mlr3HTE_bench()</code>，不受影响。</p></div>' +
          '<p><strong>三个长期待办结清</strong>：</p>' +
          '<ul>' +
          '<li><strong>R CMD check / roxygen2</strong>：<code>man/</code> 重新生成（40 个 Rd），' +
          '补齐依赖声明与全局变量声明。结果 0 error / 0 note。</li>' +
          '<li><strong>R / DR 交叉拟合</strong>：<code>cross_fitting = TRUE</code> 启用，' +
          '干扰参数在 K 折训练折上拟合、在留出折上评估。R-Learner 偏差由 in-fold 的 ' +
          '−0.456 改善到 out-of-fold 的 +0.143。</li>' +
          '<li><strong>生存分支 RMST 效应</strong>：<code>effect = "rmst"</code> 可用，' +
          '逐人效应取 IPCW 校正的 RMST 差，实测偏差 −0.0144（对照 survdiff 的 −0.0214）。' +
          '以上两项均已加回归测试锁定。</li>' +
          '</ul>' +
          '<p><strong>文档站</strong>：教程新增第 7 篇（基准模拟数据网格）与第 8 篇' +
          '（CATE 模型可解释性），各配可独立执行的脚本；函数文档新增 15 个独立页面与 ' +
          '<code>apisim</code> / <code>apiexplain</code> 两个模块索引页；参考文献新增 ' +
          'F（模型可解释性，6 条）与 G（模拟设计与估计方法学，3 条）两节。全站 63 页通过校验。</p>' +
          '<p class="text-muted">已知限制：R CMD check 仍报 1 条 WARNING（R 代码含非 ASCII ' +
          '字符，即中文 roxygen 注释）。该检查不看 DESCRIPTION 的 Encoding 字段，彻底消除' +
          '需把中文注释改写为 \\uxxxx 转义，代价是源码不可读，此处选择保留可读性。</p>'
      },
      {
        id: "v033",
        heading: "v0.33 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">首页瘦身 + 教程首页加包简介</div>' +
          '<p><strong>首页删掉「这是什么」整段</strong>（含 logo 图与三行结局对照表）——' +
          '首页一进来就是六格矩阵，不再先读一段导论。</p>' +
          '<p><strong>教程首页开头新增「这个包做什么」</strong>，约 400 字讲清三件事：' +
          '五种 meta-learner 的公式与结局类型无关，只跟结局模型打交道；' +
          'RCT 与观察性数据分别该怎么处理；' +
          '七篇教程为什么分成「有真值对账」与「无真值排序评价」两组。</p></div>' +
          '<div class="callout warn"><div class="callout-title">顺手修掉两个渲染 bug</div>' +
          '<ul>' +
          '<li><strong>代码块里的 <code>&lt;dbl&gt;</code> 不再消失。</strong>示例输出是把 R 控制台原文' +
          '写进 <code>&lt;pre&gt;</code> 的，里面的 <code>&lt;dbl&gt;</code> / <code>&lt;int&gt;</code> / ' +
          '<code>&lt;chr&gt;</code> 被浏览器当成未知标签直接吞掉，读者看到的 tibble 会缺掉列类型行。' +
          '这次把 149 个 pre 块内部的尖括号统一转义成实体，真正的标记一个没动。</li>' +
          '<li><strong>补上 3 个函数页缺失的一句话简介</strong>（<code>metalearner()</code>、' +
          '<code>ml_task()</code>、R6 Learner），此前这三页标题下面直接跳到正文。</li>' +
          '</ul></div>' +
          '<p>另外新增 <code>dev/_validate.js</code>：一次性检查 44 个页面的' +
          '中英段落 id 是否对齐、HTML 标签是否闭合、站内 <code>#/</code> 链接是否有对应页面。' +
          '上面这两个 bug 就是它跑出来的。</p>'
      },

      {
        id: "v032",
        heading: "v0.32 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">函数文档全量拆分：每个函数一页</div>' +
          '<p><strong>25 个导出对象现在各有自己的页面</strong>（中英双语），' +
          '不再几个函数搭车共用一页。' +
          '5 个分组页改为索引页（列出组内函数并链接详情），' +
          '总索引页重写为 25 行全量表。</p>' +
          '<p><strong>每个页面都带实测示例</strong>：' +
          '先写采集脚本把 25 个函数的用法各跑一遍并落盘输出，' +
          '再把代码与输出原样写进页面。' +
          '所有数值都是跑出来的，没有手写——' +
          '包括那些“不好看”的数（例如 ' +
          '<code>identical(l, mlr3::lrn(...))</code> 返回 FALSE、' +
          '模型的 Qini 系数略高于真实 tau）。</p></div>'
      },

      {
        id: "v031",
        heading: "v0.31 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">新增 RCT 基准测试（不依赖真实 tau）</div>' +
          '<p>新出两个函数：<code>hte_benchmark()</code> 与 ' +
          '<code>plot_hte_benchmark()</code>。用归一化 Qini 系数、' +
          'TOC 增益、c-for-benefit 三个指标比较五族 meta-learner，' +
          '全部建立在随机化带来的可交换性上，' +
          '<strong>不需要倾向得分，因此现实 RCT 数据上同样可用</strong>。</p>' +
          '<p>交叉拟合是强制的（折按处理组分层）。' +
          '实测 in-fold 的 c-for-benefit 为 0.663，' +
          '<strong>超过了真实 tau 的 0.624</strong>——' +
          '那是把训练噪声也排进序里；' +
          '交叉拟合后回落到 0.617。</p>' +
          '<p>同时在教程里写清楚了前提：' +
          '<strong>真实 CATE 只有模拟数据才给得出</strong>，' +
          '“跑 mlr3 benchmark 看 CATE 相关”只适用于模拟研究。' +
          '可选的 <code>tau</code> 参数让模拟数据能把两套指标照着看。</p></div>'
      },

      {
        id: "v030",
        heading: "v0.30 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">对账口径统一：不能只报 ATE</div>' +
          '<p>新增 <a href="#/tutorialbasics/recon">「对账指标约定」</a> 一节：' +
          '模拟数据上要同时报 <strong>ATE 偏差、CATE 相关、RMSE、' +
          '估计 SD vs 真实 SD、分位数对照</strong>。' +
          '只报 ATE 无法回答「模型到底把谁更受益排出来了没有」。</p>' +
          '<p>脚本 02 / 04 / 06 的对账表补齐 RMSE 与估计 SD 列；' +
          '场景 2 与场景 6 是「ATE 对但 CATE 错」的现成反例——' +
          '外部真实 PS 权重 + DR 的 ATE 偏差仅 +0.007，' +
          '但 CATE 相兰只有 0.123、RMSE 0.563、估计 SD 超出真值 3.6 倍。' +
          '只看 ATE 会把它误判为好方法。</p>' +
          '<p>顶栏「场景教程与模型评价」同步简化为「教程」。</p></div>'
      },

      {
        id: "v029",
        heading: "v0.29 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">顶栏导航改为下拉菜单</div>' +
          '<p>「场景教程与模型评价」与「函数文档」两个项目现在是' +
          '<strong>下拉菜单</strong>（和 dplyr 官网一样）：点标题进总览，' +
          '点右侧三角展开子项；桌面端鼠标悬停也会展开。' +
          '子项分别列出 6 篇教程文章与 7 个函数文档分组。</p>' +
          '<p>当前页命中子项时抽屉默认展开，一眼就知道自己站在哪里；' +
          '子项高亮用精确匹配，不会让「目录」在子页上一起亮。' +
          '寝屏（≤900px）下拉改为抽屉内静态展开，不再悬浮。</p></div>'
      },

      {
        id: "v028",
        heading: "v0.28 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">教程拆成目录页 + 六篇独立文章</div>' +
          '<p>教程不再是一个长页：<code>#/tutorial</code> 只放<strong>目录</strong>（六篇列表 + 六格速查表），' +
          '五大框架各自独立成页——点导航进目录、再点条目进正文。每篇都能单独读、单独分享，' +
          '末尾带「下一篇」链路。</p>' +
          '<p>配套细节：旧锚点全部迁移（<code>#/tutorial/s1</code> → <code>#/tutorialrct/s1</code>）；' +
          '<code>style.css</code> 新增 <code>.article-list</code> 目录列表样式；' +
          '顶栏高亮支持子页（进 <code>tutorialrct</code> 时「教程」仍选中）；' +
          '节级 <code>notoc</code> 字段让页内导航不进右侧目录。</p></div>'
      },

      {
        id: "v027",
        heading: "v0.27 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">教程改为框架优先 + 静态资源缓存戳</div>' +
          '<p>教程页把「五大框架导航」提到<strong>页面最前面</strong>——上一版它被一段很长的 DGP 压在中段，' +
          '第一屏看起来和重构前一模一样。原「六格导航」降级为「六格矩阵（速查）」，跟在框架卡片后面查场景编号。' +
          '五个框架的分隔节由两句列表升级为「场景 / 脚本 / 关键结论」小表，每张表都填真实对账数值。</p>' +
          '<p>另修一个隐蔽问题：<code>index.html</code> 的 js/css 引用原本不带版本号，' +
          'GitHub Pages 的 CDN 与浏览器双层缓存会让「明明改了却没变化」变成常态。' +
          '现在资源引用统一带 <code>?v=</code> 缓存戳，<code>dev/bump_version.R</code> 自动改写，' +
          '<code>test-version.R</code> 新增断言钉住。</p></div>'
      },

      {
        id: "v026",
        heading: "v0.26 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">教程重构为五大框架（dplyr 风格导航）</div>' +
          '<p>文档站「教程」从「六格逐个讲」重构为五大框架：RCT 设计分析 / 观察性分析 / 生存结局分析 / ' +
          '换不同学习器 / 模型评价指标。新增「五大框架导航」卡片索引（复用既有 <code>.cards</code> / ' +
          '<code>.card</code> 网格），索引卡片与各框架小节互链；<code>tutorial/00_教程.md</code> ' +
          '顶部同步新增「五大框架速览」表。设计语言沿用 dplyr.tidyverse.org 的「索引卡片 + 分主题」风格。</p></div>'
      },

      {
        id: "v025",
        heading: "v0.25 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">函数参考拆分为「索引页 + 每函数独立页」</div>' +
          '<p>文档站的「函数参考」从单页长文档重构为索引页加每个函数分组的独立网页：' +
          '<code>content-api.js</code> 现在导出 <code>SITE_PAGES.api</code>（总览索引）以及 ' +
          '<code>apimetalearner</code> / <code>apishortcuts</code> / <code>apimltask</code> / ' +
          '<code>apilearner</code> / <code>apidemo</code> / <code>apimetrics</code> / ' +
          '<code>apihelpers</code> 七个独立详情页，每页沿用手写 <code>.fn</code> 模板，' +
          '导航与站内搜索均可直达。索引页总览表与各函数页互相链接，' +
          'README 与教程也改指新的链接形式（<code>#/apimetalearner</code> 等）。</p></div>'
      },

      {
        id: "v024",
        heading: "v0.24 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">GitHub README 中英双语 + 顶部一键切换</div>' +
          '<p>仓库首页改为中英双语：新增 <code>README_EN.md</code>（完整英文版），' +
          '<code>README.md</code>（中文）顶部都加了语言切换按钮，一键跳到另一语言。' +
          '两份 README 内容对齐（安装 / 函数式 API / R6 Learner / 方法学要点 / 文件结构 / ' +
          '依赖与运行环境 / 版本号规则），均指向双语文档站。</p></div>'
      },

      {
        id: "v023",
        heading: "v0.23 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">补生成 man/ 文档</div>' +
          '<p>重新运行 <code>roxygen2::roxygenise()</code>，让 <code>man/metalearner.Rd</code> 与 ' +
          '<code>man/LearnerRegrMetalearner.Rd</code> 同步到 0.22 新增的 roxygen 注释：' +
          '<code>learner_base</code> / <code>learner_tau</code> 现在支持按角色命名的 list' +
          '（T 两组、X 各阶段分别指定）。此前 0.22 只改了源码注释、漏跑 roxygenise，' +
          '导致 <code>man/</code> 落后一个批次。</p></div>'
      },

      {
        id: "v022",
        heading: "v0.22 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">学习器可按分组 / 阶段单独指定</div>' +
          '<p>除了「整包换一个基学习器」，现在还能为每个分组、每个阶段分别选算法：' +
          'T-Learner 用 <code>list(treated = ..., control = ...)</code> 让两组各用一套；' +
          'X-Learner 用 <code>list(m1 = ..., m0 = ...)</code> 指定两个结局模型，' +
          '用 <code>list(tau1 = ..., tau0 = ...)</code> 指定两个效应回归。' +
          '单 learner 仍是默认（全部共用），完全向后兼容；S / R / DR 与 ' +
          '<code>survlearners</code> 引擎传命名 list 会明确报错。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>教程脚本 13 补回 <code>kknn</code>（此前本机未装、临时换成 rpart），' +
          '六类基学习器 ranger / xgboost / glmnet / rpart / kknn / lm 全部回归，' +
          '并新增一节演示「每个分组 / 阶段单独换算法」。</li>' +
          '<li>新增 <code>tests/testthat/test-learners-flexible.R</code>（7 个 ' +
          '<code>test_that</code>）：覆盖 T 两组不同、X 各阶段不同、缺角色 / 未知角色 / ' +
          'S·R·DR 拒绝 list / 生存按组字符串 / R6 透传。</li>' +
          '</ul>' +
          '<h3>测试</h3>' +
          '<ul>' +
          '<li>全量测试 <strong>FAIL 0 | WARN 2 | SKIP 0 | PASS 314</strong>。</li>' +
          '</ul>'
      },

      {
        id: "v021",
        heading: "v0.21 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">版本号改为两位小数递增，每次推送 +0.01</div>' +
          '<p>版本号不再用三段式，改成两位小数的批次计数：<code>0.20</code> → <code>0.21</code> → ' +
          '<code>0.22</code> …，每推送一次更新加 0.01。历史批次按规则折算（<code>0.1.0</code> → ' +
          '<code>0.10</code>、<code>0.2.0</code> → <code>0.20</code>）。</p></div>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li>站内版本号此前一直停在 <strong>v0.1.0</strong>：<code>SITE_META</code> 没跟着 ' +
          '<code>DESCRIPTION</code> 更新，页脚和更新日志页头都在报旧版本。现在统一为 v0.21。</li>' +
          '<li>新增 <code>tests/testthat/test-version.R</code>：断言 <code>DESCRIPTION</code> 的 ' +
          '<code>Version:</code> 与站内 <code>SITE_META.version</code> 一致（<code>docs/</code> ' +
          '不存在时跳过，不影响 <code>R CMD check</code>）。</li>' +
          '</ul>' +
          '<h3>工程</h3>' +
          '<ul>' +
          '<li>新增 <code>dev/bump_version.R</code>：<code>Rscript dev/bump_version.R 0.22</code> ' +
          '一条命令写好 <code>DESCRIPTION</code> 与 <code>SITE_META</code>，并列出仍在引用旧版本号的文件。</li>' +
          '</ul>' +
          '<h3>订正</h3>' +
          '<ul>' +
          '<li>文档里的「288 个用例 / 55 个文件」与实测不符（<code>tests/testthat/</code> 下只有 8 个文件）。' +
          '改为可复核的口径：<strong>8 个测试文件 / 58 个 <code>test_that</code> 块 / 293 个期望，全部通过</strong>。</li>' +
          '</ul>'
      },

      {
        id: "v020",
        heading: "v0.20 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">评价指标现在覆盖三类结局</div>' +
          '<p>Qini / TOC / c-for-benefit / DR 伪结局过去只接受数值型结局，' +
          '传 <code>Surv</code> 会直接报错。现在五个函数全部支持<strong>连续、二分类、生存</strong>，' +
          '生存走里程碑指标 <code>I(T &gt; t0)</code> + 删失 IPCW，' +
          '效应标尺与 <code>metalearner()</code> 的生存 CATE 对齐。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>五个评价函数新增 <code>t0</code> / <code>X</code> / <code>effect</code> 参数。' +
          '<code>t0</code> 不传时取事件时间中位数；<code>effect</code> 可选 ' +
          '<code>"survdiff"</code>（默认，S(t0) 差）或 <code>"rmst"</code>。</li>' +
          '<li><code>dr_pseudo_outcome()</code> 也支持生存结局：默认基学习器 ' +
          '<code>"coxph"</code>，返回伪结局并带回 <code>t0</code> 与 <code>effect</code>。</li>' +
          '<li><code>.surv_ipcw()</code> 新增 <code>at</code> 参数与 <code>X = NULL</code> 的' +
          '边际 Kaplan–Meier 分支，删失权重同时供引擎与指标使用。</li>' +
          '<li>教程脚本 <code>12_三类结局评价指标.R</code>：三类结局 × 三层排序对账，' +
          '各重复 8 次报均值 ± 标准差。</li>' +
          '</ul>' +
          '<h3>实测：为什么生存必须做删失校正</h3>' +
          '<ul>' +
          '<li>真值 ATE 0.1514：完整病例 IPCW 得 0.1424（偏差 −0.009）；' +
          '不做校正（<code>w = 1</code>）只有 0.1127（偏差 −0.039，低估约四分之一）。</li>' +
          '<li><code>toc_curve()</code> 的分母从 <code>k</code> 改为 <code>cumsum(w)</code>，' +
          '避免零权重的删失个体稀释均值。</li>' +
          '<li>已知限制：<code>effect = "rmst"</code> 在删失重时低估（权重截断在 100 以内，' +
          '删失 58% 时实测 0.043 vs 真值 0.184）。删失重请用默认 <code>survdiff</code>。</li>' +
          '</ul>' +
          '<h3>教程新增的一课：拟合顺序决定指标能不能信</h3>' +
          '<p>先在全集拟合、再切一块当留出集，等于把 <code>Y</code> 泄漏进 CATE。' +
          '二分类下最致命（观测获益就是 <code>Y<sub>treated</sub> − Y<sub>control</sub></code>）：' +
          'c-for-benefit 从 0.558 虚高到 <strong>0.891</strong>，反超 oracle 的 0.605，' +
          '尽管它与真 <em>τ</em> 的相关反而更低（0.542 &lt; 0.655）。<strong>先切分、后拟合。</strong></p>' +
          '<h3>文档站</h3>' +
          '<ul>' +
          '<li>新增独立的 <a href="#/references">参考文献</a> 页（博士论文式：按主题分节、' +
          '全局连续编号、每条注明在本包中的用途与引用位置），' +
          '收录 meta-learner 五族、HTE 评价指标、生存删失、因果基础等全部出处。' +
          '中文 18 条、英文 18 条，中英两版同步。</li>' +
          '<li>新增教程脚本 <code>13_换基学习器_基准对比.R</code> 与教程页「换基学习器：mlr3 生态随便挑」小节' +
          '（中英）：演示用 mlr3 体系换基学习器只需改 <code>learner_base = lrn("regr.xxx")</code> 一行，' +
          '并复用 <code>benchmark()</code> 横向对比；README 顶部也加了一段「为什么基于 mlr3：基学习器想换就换」callout。</li>' +
          '<li>新增独立的 <a href="#/environment">运行环境与依赖版本</a> 页（中英），列出完整测试环境' +
          '（R 4.5.1 / Windows 11 / 288 用例 / ubuntu-latest CI）与全部依赖版本——直接依赖、建议依赖、' +
          '关键传递依赖及 <strong>完整 89 个递归依赖清单</strong>；README §6 与教程主文档同步补齐。</li>' +
          '</ul>'
      },

      {
        id: "v010",
        heading: "v0.10 · 2026-10-20",
        body:
          '<div class="callout ok"><div class="callout-title">首个完整版本</div>' +
          '<p>S / T / X / R / DR 五种 Meta-Learner，覆盖连续、二分类、生存三类结局，' +
          '同时支持随机化试验与观察性研究。119 个测试全部通过，配套中英双语教程站。</p></div>' +
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>生存结局改为<strong>完全不依赖 mlr3proba</strong>：基学习器用原生 <code>"coxph"</code> / ' +
          '<code>"ranger"</code>。传 <code>lrn("surv.*")</code> 会明确报错并给出提示。</li>' +
          '<li>新增观察性的二分类与生存演示数据：<code>mlr3HTE_demo_obs_binary()</code>、' +
          '<code>mlr3HTE_demo_obs_surv()</code>，凑齐六格矩阵。</li>' +
          '<li>新增 <code>ml_task()</code> 导出函数，统一三类结局的 Task 编码。</li>' +
          '<li>配套教程：<code>tutorial/00_教程.md</code> + 8 个可运行脚本。</li>' +
          '<li>本双语文档站（全局搜索 / 中英切换 / 明暗主题）。</li>' +
          '</ul>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li><strong><code>.surv_at_t0()</code> 的 <code>ifelse</code> 陷阱</strong>：' +
          '<code>idx</code> 是标量而 <code>ifelse</code> 返回形状跟随 <code>test</code>，' +
          '导致所有样本拿到同一个预测值。ranger 生存分支的 CATE 方差变成 0，' +
          'ATE 甚至给出 −0.119 的错误符号（真值 +0.152）。改为普通分支 + 整列取值。</li>' +
          '<li>classif 学习器的 <code>predict_type = "prob"</code> 必须在 <code>$train()</code> ' +
          '<strong>之前</strong>设置，否则 <code>$prob</code> 为 NULL；训练后再改会触发断言错误。</li>' +
          '<li><code>mlr3HTE_demo_surv()</code> 里 <code>A</code> 用在定义之前。</li>' +
          '</ul>' +
          '<h3>行为调整</h3>' +
          '<ul>' +
          '<li><code>learner_tau</code> 不再沿用 <code>learner_base</code>：二阶段是对伪结果回归，' +
          'ranger 默认 <code>min.node.size = 5</code> 会过拟合噪声（CATE 相关从 0.9 掉到 0.2）。' +
          '现在默认建 <code>regr.ranger(num.trees = 500, min.node.size = 50)</code>。</li>' +
          '</ul>'
      },

      {
        id: "v001",
        heading: "v0.01 · 2026-10-18（初始骨架）",
        body:
          '<h3>新增</h3>' +
          '<ul>' +
          '<li>引擎骨架：结局模型抽象 + 五种 Meta-Learner 公式。</li>' +
          '<li>连续结局 + RCT 全链路跑通；函数式 API 与 R6 Learner 两套接口。</li>' +
          '<li><code>resample()</code> / <code>benchmark()</code> 集成（曾出现段错误，已修）。</li>' +
          '</ul>' +
          '<h3>修复</h3>' +
          '<ul>' +
          '<li><code>resample()</code> 段错误的真凶是 <code>PredictionRegr$new(truth = NULL)</code>——' +
          'measure 会对 <code>prediction$truth</code> 做 <code>assert_regr</code>。改为取自预测任务本身。</li>' +
          '<li>R6 钩子必须用<strong>私有</strong> <code>.train</code> / <code>.predict</code>；' +
          '覆盖公开方法会替换掉 <code>.__Learner__train</code>，导致 <code>state$train_task</code> 不被设置。</li>' +
          '<li>data.table 列选择陷阱：<code>dt[, char_vec, drop = FALSE]</code> 会把字符向量当成行索引。</li>' +
          '</ul>'
      },

      {
        id: "planned",
        heading: "计划中",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>事项</th><th>说明</th></tr></thead>' +
          '<tbody>' +
          '<tr><td><code>R CMD check</code> 全量检查</td><td>本机无 Rtools 的编译型检查；可先跑纯 R 部分</td></tr>' +
          '<tr><td>roxygen2 生成 <code>man/</code></td><td>目前只有 NAMESPACE，没有 .Rd 帮助页</td></tr>' +
          '<tr><td>R / DR 的交叉拟合</td><td>伪结果应做 K 折 out-of-fold 拟合以降低过拟合偏倚</td></tr>' +
          '<tr><td>生存分支 RMST 选项</td><td>限制平均生存时间差，作为 t0 概率差之外的效应度量</td></tr>' +
          '<tr><td>CATE 不确定性量化</td><td>目前只给点估计，尚无置信区间</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "compat",
        heading: "环境与兼容性",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>项</th><th>要求 / 现状</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>R</td><td>4.5.1（开发机）</td></tr>' +
          '<tr><td>mlr3</td><td>1.8.0</td></tr>' +
          '<tr><td>paradox</td><td>1.0.1（注意：1.0 用 <code>p_fct</code>/<code>p_uty</code>，无 <code>ParamFct</code> 导出名）</td></tr>' +
          '<tr><td>mlr3proba</td><td><strong>不需要</strong>；已从依赖与代码路径中彻底移除</td></tr>' +
          '<tr><td>mlr3tuning</td><td>可选（<code>tune</code> 演示未包含）</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">mlr3 1.8 的限制</div>' +
          '<p>该版本的 Task / Learner 没有 case weights API，因此包内所有权重都通过' +
          '<strong>重要性重采样</strong>落地，会引入蒙特卡洛噪声。需要复现结果时请 ' +
          '<code>set.seed()</code>。</p></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "Changelog",
    lede: "Version history and notable changes for mlr3HTE. Current version: v0.35.",
    sections: [

      {
        id: "v035",
        heading: "v0.35 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Interpretability merged into the tutorial dropdown</div>' +
          '<p>The "Interpretability" top-level menu is gone; its content is now 10 pages (an ' +
          'overview plus 9 per-function pages) nested under the Tutorial dropdown, alongside ' +
          'rct / obs / surv / learners / metrics / benchmark / benchgrid / explain. The API ' +
          'index pages keep their function-level role only.</p></div>' +
          '<p><strong>The API index now lists all 40 exported objects</strong>: the ' +
          '<code>SITE_PAGES.api</code> overview table was rewritten to cover all 40 exports, ' +
          'including the 6 ggplot-returning Plot functions, with a note on where their ' +
          'underlying data comes from.</p>' +
          '<p><strong>All six plotting functions embed actually-run figures</strong> in both ' +
          'their help pages and the tutorial: <code>plot_hte_importance()</code>, ' +
          '<code>plot_hte_pdp()</code>, <code>plot_hte_shap()</code>, ' +
          '<code>plot_hte_benchmark()</code>, <code>plot_qini()</code> and ' +
          '<code>mlr3HTE_dag()</code> each gained a <code>fig</code> section with a PNG produced ' +
          'by running the code on real data; the tutorial places the same figures inline at the ' +
          'relevant sections rather than in a separate block.</p>' +
          '<div class="callout warn"><div class="callout-title">Fixed a latent duplicate page-definition bug in content-api.js</div>' +
          '<p>17 pages were defined twice (the first copy dead, missing title/lede and with a ' +
          'garbled typo). The new duplicate-definition check in <code>dev/_validate.js</code> ' +
          'caught it; the first definition of each id was removed, leaving 48 clean definitions ' +
          'and a passing site validation.</p></div>' +
          '<p><strong>Confirmed dr_pseudo_outcome() supports binary and survival outcomes</strong>: ' +
          'with default <code>cross_fitting = TRUE</code> it returns a doubly robust ' +
          'pseudo-outcome list for continuous / binary / survival (survdiff + rmst). Measured: ' +
          'continuous DR ATE 0.9984 vs true 1.0000; binary 0.1531 vs 0.1288; survival survdiff ' +
          '0.1576 vs 0.1543, rmst 0.2496 vs 0.1964. Under weak observational confounding DR is ' +
          'not always better than unadjusted, but it strongly corrects strong confounding.</p>'
      },

      {
        id: "v034",
        heading: "v0.34 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">CATE interpretability module (R/explain.R, 9 exported functions)</div>' +
          '<p>Built on <strong>DALEX</strong>, with SHAP values from <strong>kernelshap + ' +
          'shapviz</strong>. <code>hte_explainer()</code> wraps a CATE model as a DALEX ' +
          'explainer whose <strong>response is the doubly robust pseudo-outcome Y*, not the ' +
          'raw outcome</strong>—the latter measures baseline prognosis mu(X) and is unrelated ' +
          'to effect heterogeneity. <code>hte_surrogate()</code> refits the CATE surface with ' +
          'one mlr3 learner (measured correlation 0.913–0.937) for explanation only. ' +
          '<code>hte_feature_importance()</code> (permutation importance), ' +
          '<code>hte_pdp()</code> (PDP and ALE), <code>hte_shap()</code> / ' +
          '<code>hte_shap_data()</code> (Kernel SHAP) and three plotting functions complete ' +
          'the chain. The SHAP additivity residual measures 4.44e-16 (machine precision).</p></div>' +
          '<div class="callout warn"><div class="callout-title">Two deliberate departures from upstream defaults</div>' +
          '<ul>' +
          '<li><strong><code>hte_pdp()</code> defaults to <code>center = FALSE</code>.</strong> ' +
          'DALEX\'s <code>model_profile()</code> centres curves on the mean prediction by ' +
          'default; in a CATE context the vertical axis must be the <em>absolute</em> mean ' +
          'predicted CATE, since oscillating around zero hides the effect level itself.</li>' +
          '<li><strong><code>loss</code> accepts a function or <code>"rmse"</code> / ' +
          '<code>"mse"</code> only.</strong> DALEX 2.5 does not export MAE, and a character ' +
          'value is resolved by name inside the DALEX framework, which fails across packages.</li>' +
          '</ul></div>' +
          '<p><strong>Every plot returns a ggplot object</strong>: <code>plot_hte_importance()</code>, ' +
          '<code>plot_hte_pdp()</code>, <code>plot_hte_shap()</code>, ' +
          '<code>plot_hte_benchmark()</code>, <code>plot_qini()</code> and ' +
          '<code>mlr3HTE_dag()</code> all accept further layers with <code>+</code> and export ' +
          'through <code>ggsave()</code>. The underlying data is available separately from ' +
          '<code>hte_feature_importance()</code>, <code>hte_pdp()</code>, ' +
          '<code>hte_shap_data()</code>, <code>hte_benchmark_data()</code> (new), ' +
          '<code>qini_curve()</code> and <code>mlr3HTE_dag_data()</code> (new). ' +
          '<code>plot_qini()</code> was rewritten from base graphics to ggplot2.</p>' +
          '<p><strong>Tutorial code now has R syntax highlighting and a copy button</strong>, via ' +
          'a self-written tokenizer at <code>docs/assets/js/highlight-r.js</code> (about 230 ' +
          'lines, no CDN or build step). Of 220 code blocks, 138 are marked ' +
          '<code>language-r</code> with a copy button and 82 are <code>r-out</code> output ' +
          'blocks. This also fixes a long-standing bug in which <code>&lt;dbl&gt;</code> in ' +
          'console output was swallowed as an unknown tag (149 blocks escaped).</p>' +
          '<p><strong>Exactly one arrow between each pair of DAG nodes</strong>: ' +
          '<code>R/dag.R</code> was rewritten. Edges are deduplicated, then each edge is checked ' +
          'against rectangular label boxes using a quadratic Bézier curve and given a routing ' +
          'curvature when it would cross a third node. Curvature is a parameter rather than an ' +
          'aesthetic mapping, so plotting builds one <code>geom_curve</code> layer per ' +
          'curvature group.</p>' +
          '<p><strong>Tutorial register made formal</strong>: 24 Chinese and 4 English ' +
          'phrasings were rewritten from colloquial to objective prose by an auditable ' +
          'exact-match script.</p>' +
          '<div class="callout ok"><div class="callout-title">Benchmark simulation grid (data/mlr3hte_bench_data.rda)</div>' +
          '<p>Ten designs by three outcomes give 30 datasets with n = 2000, fixed seeds, shipped ' +
          'with the package. Four structural dimensions vary independently: study design ' +
          '(rct / obs), confounding form (none / linear / nonlinear), effect-heterogeneity ' +
          'form (linear / nonlinear), and <strong>whether a covariate is both a confounder and ' +
          'an effect modifier</strong>. Each dataset carries the true tau / ate / ps_true; ' +
          'survival outcomes additionally provide tau_rmst / ate_rmst on the RMST scale.</p>' +
          '<p>Measured confounding gradient (unadjusted difference minus the true ATE): ' +
          'within ±0.04 for randomised designs, 0.09–0.24 for observational designs with ' +
          'shared = FALSE, and 0.47–0.61 for observational designs with shared = TRUE.</p>' +
          '<p>Estimability of linear versus nonlinear HTE (out-of-fold CATE correlation): with ' +
          'truly linear CATE, regr.lm 0.994 &gt; regr.ranger 0.894; with truly nonlinear CATE, ' +
          'regr.lm 0.564 &lt; regr.ranger 0.819. A base learner whose functional form does not ' +
          'cover the true CATE introduces bias rather than variance.</p>' +
          '<p><strong>Breaking change</strong>: the data object was renamed from ' +
          '<code>mlr3hte_bench</code> to <code>mlr3hte_bench_data</code>, because Windows file ' +
          'systems are case-insensitive and the data Rd file was overwritten by the Rd file of ' +
          'the same-named function. Access via <code>mlr3HTE_bench()</code> is unaffected.</p></div>' +
          '<p><strong>Three long-standing items closed</strong>:</p>' +
          '<ul>' +
          '<li><strong>R CMD check / roxygen2</strong>: <code>man/</code> regenerated (40 Rd ' +
          'files) with complete dependency and global-variable declarations. Result: 0 error / ' +
          '0 note.</li>' +
          '<li><strong>Cross-fitting for R / DR</strong>: enabled with ' +
          '<code>cross_fitting = TRUE</code>; nuisance parameters are fitted on training folds ' +
          'and evaluated on held-out folds. R-Learner bias improves from −0.456 in-fold to ' +
          '+0.143 out-of-fold.</li>' +
          '<li><strong>RMST effect for the survival branch</strong>: ' +
          '<code>effect = "rmst"</code> is available, with individual effects given by the ' +
          'IPCW-corrected RMST difference; measured bias −0.0144 (against −0.0214 for ' +
          'survdiff). Both items are locked by regression tests.</li>' +
          '</ul>' +
          '<p><strong>Documentation site</strong>: tutorial articles 7 (benchmark simulation ' +
          'grid) and 8 (interpreting the CATE model) were added, each with an independently ' +
          'executable script; 15 per-function pages plus the <code>apisim</code> and ' +
          '<code>apiexplain</code> module indexes were added; the references gained section F ' +
          '(interpretability, 6 entries) and section G (simulation design and estimation ' +
          'methodology, 3 entries). All 63 pages pass validation.</p>' +
          '<p class="text-muted">Known limitation: R CMD check still reports one WARNING ' +
          '(non-ASCII characters in R code, i.e. Chinese roxygen comments). This check ignores ' +
          'the DESCRIPTION Encoding field; eliminating it would require escaping every Chinese ' +
          'comment as \\uxxxx at the cost of source readability, which was not accepted here.</p>'
      },
      {
        id: "v033",
        heading: "v0.33 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Leaner home page, package overview on the tutorial index</div>' +
          '<p><strong>The whole "What this is" section is gone from the home page</strong> ' +
          '(logo image plus the three-row outcome table). You now land directly on the ' +
          '6-cell matrix instead of reading an introduction first.</p>' +
          '<p><strong>A new "What this package does" section opens the tutorial index</strong>, ' +
          'about 400 words covering three things: the five meta-learner formulas are independent ' +
          'of the outcome type and only ever talk to the outcome model; how RCT data and ' +
          'observational data each need to be handled; and why the seven articles split into ' +
          'reconciliation against known truth versus ranking-based evaluation without truth.</p></div>' +
          '<div class="callout warn"><div class="callout-title">Two rendering bugs fixed along the way</div>' +
          '<ul>' +
          '<li><strong><code>&lt;dbl&gt;</code> no longer vanishes from code blocks.</strong> ' +
          'Example output is the raw R console text written into <code>&lt;pre&gt;</code>, so ' +
          '<code>&lt;dbl&gt;</code> / <code>&lt;int&gt;</code> / <code>&lt;chr&gt;</code> were ' +
          'parsed as unknown tags and silently dropped — tibbles lost their column-type rows. ' +
          'Angle brackets inside 149 pre blocks are now escaped as entities; real markup untouched.</li>' +
          '<li><strong>Three function pages got the one-line blurb they were missing</strong> ' +
          '(<code>metalearner()</code>, <code>ml_task()</code> and the R6 Learner); ' +
          'they previously jumped straight from the title into the body.</li>' +
          '</ul></div>' +
          '<p>Also new: <code>dev/_validate.js</code>, which checks all 44 pages at once for ' +
          'zh/en section-id alignment, unbalanced HTML tags and dead <code>#/</code> links. ' +
          'Both bugs above were found by running it.</p>'
      },

      {
        id: "v032",
        heading: "v0.32 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">API docs fully split: one page per function</div>' +
          '<p><strong>All 25 exported objects now have their own page</strong> (bilingual) instead of ' +
          'sharing pages. The five group pages became index pages that list their functions and link to ' +
          'the details, and the top index page was rewritten as a 25-row table.</p>' +
          '<p><strong>Every page carries a worked example that was actually run</strong>: a collection ' +
          'script ran each function once, wrote the output to disk, and the code plus output were then ' +
          'embedded verbatim. Every number comes from a real run, nothing was hand-written — including ' +
          'the unflattering ones (e.g. <code>identical(l, mlr3::lrn(...))</code> returning FALSE, or the ' +
          'model&rsquo;s Qini coefficient sitting slightly above the true tau).</p></div>'
      },

      {
        id: "v031",
        heading: "v0.31 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">New RCT benchmark (no true tau needed)</div>' +
          '<p>Two new functions: <code>hte_benchmark()</code> and <code>plot_hte_benchmark()</code>. ' +
          'They compare the five meta-learners with normalised Qini coefficient, TOC gain and ' +
          'c-for-benefit, all resting on the exchangeability randomization buys, ' +
          '<strong>so no propensity score is needed and real RCT data works the same way</strong>.</p>' +
          '<p>Cross-fitting is enforced (folds stratified by treatment arm). Measured: the in-fold ' +
          'c-for-benefit is 0.663, <strong>exceeding the true tau\'s 0.624</strong> &mdash; that is ' +
          'training noise being ranked; cross-fitting brings it back to 0.617.</p>' +
          '<p>The tutorial now states the premise plainly: <strong>true CATE only exists in ' +
          'simulated data</strong>, so "run an mlr3 benchmark and look at CATE correlation" applies ' +
          'to simulation studies only. An optional <code>tau</code> argument lets simulated data ' +
          'report both metric families side by side.</p></div>'
      },

      {
        id: "v030",
        heading: "v0.30 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Unified reconciliation template: never ATE alone</div>' +
          '<p>New <a href="#/tutorialbasics/recon">"Reconciliation metrics"</a> section: on simulated data, ' +
          'report <strong>ATE bias, CATE correlation, RMSE, estimated SD vs true SD, and quantile ' +
          'comparison</strong> together. ATE alone cannot answer "did the model actually rank who ' +
          'benefits more?".</p>' +
          '<p>Scripts 02 / 04 / 06 now include RMSE and estimated SD columns; scenarios 2 and 6 are ' +
          'ready-made counter-examples of "right ATE, wrong CATE" — external true-PS weights + DR has ' +
          'an ATE bias of only +0.007, yet CATE correlation of 0.123, RMSE 0.563, and an estimated SD ' +
          '3.6x the truth. Judging on ATE alone would call it a good method.</p>' +
          '<p>The top nav item is also shortened from "Tutorial & Model Evaluation" to "Tutorial".</p></div>'
      },

      {
        id: "v029",
        heading: "v0.29 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Top nav now uses dropdown menus</div>' +
          '<p>The "Tutorial &amp; Model Evaluation" and "API Reference" nav items are now ' +
          '<strong>dropdown menus</strong>, just like the dplyr website: click the title to open ' +
          'the overview, click the caret on the right to expand the list; on desktop, hovering ' +
          'also opens it. Children list the six tutorial articles and the seven API groups.</p>' +
          '<p>When the current page matches a child, the dropdown opens by default so you can ' +
          'see where you are; child highlighting uses exact matching, so "Contents" no longer ' +
          'lights up together with the article you are reading. On narrow screens (≤900px) ' +
          'the dropdown expands statically inside the drawer instead of floating.</p></div>'
      },

      {
        id: "v028",
        heading: "v0.28 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Tutorial split into an index plus six standalone articles</div>' +
          '<p>The tutorial is no longer one long page: <code>#/tutorial</code> now holds only the ' +
          '<strong>table of contents</strong> (six entries plus the 2 x 3 lookup table), and each framework ' +
          'has its own page. Click the nav item to reach the index, click an entry to read the article. ' +
          'Every article stands alone and can be shared on its own, with a "next" link at the bottom.</p>' +
          '<p>Supporting changes: all old anchors migrated ' +
          '(<code>#/tutorial/s1</code> to <code>#/tutorialrct/s1</code>); a new <code>.article-list</code> ' +
          'style in <code>style.css</code>; the top nav stays highlighted on sub-pages ' +
          '(<code>tutorialrct</code> keeps "Tutorial" active); and a per-section <code>notoc</code> flag ' +
          'keeps in-page navigation out of the right-hand TOC.</p></div>'
      },

      {
        id: "v027",
        heading: "v0.27 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Framework-first tutorial page + asset cache stamps</div>' +
          '<p>The tutorial page now puts the <strong>Five frameworks index at the very top</strong> — in the ' +
          'previous release it sat behind a long DGP section, so the first screen looked identical to the ' +
          'pre-refactor version. The old "six cells" block is demoted to a "2 × 3 matrix (quick lookup)" that ' +
          'follows the cards. Each framework divider is upgraded from a two-line list to a ' +
          '"scenario / script / key result" table with the real reconciliation numbers.</p>' +
          '<p>Also fixed a silent problem: the js/css references in <code>index.html</code> carried no version ' +
          'query, so GitHub Pages CDN plus browser caching made "I changed it but nothing changed" the norm. ' +
          'Assets now carry a <code>?v=</code> stamp, rewritten automatically by ' +
          '<code>dev/bump_version.R</code> and pinned by a new assertion in <code>test-version.R</code>.</p></div>'
      },

      {
        id: "v026",
        heading: "v0.26 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Tutorial restructured into five frameworks (dplyr-style nav)</div>' +
          '<p>The docs-site tutorial is reorganized from "six cells one by one" into five frameworks: ' +
          'RCT analysis / observational analysis / survival outcomes / swapping the learner / model evaluation. ' +
          'A new "Five frameworks" card index reuses the existing <code>.cards</code> / <code>.card</code> grid; ' +
          'the index cards cross-link to each framework section, and <code>tutorial/00_教程.md</code> gets a ' +
          'matching "five frameworks" overview table. The design language follows dplyr.tidyverse.org ' +
          '(index cards + per-topic sections).</p></div>'
      },

      {
        id: "v025",
        heading: "v0.25 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">API reference split into index page + one page per function group</div>' +
          '<p>The docs-site API reference is restructured from one long page into an index page plus ' +
          'a separate page per function group: <code>content-api.js</code> now exports ' +
          '<code>SITE_PAGES.api</code> (overview index) together with ' +
          '<code>apimetalearner</code> / <code>apishortcuts</code> / <code>apimltask</code> / ' +
          '<code>apilearner</code> / <code>apidemo</code> / <code>apimetrics</code> / ' +
          '<code>apihelpers</code> &mdash; seven independent detail pages, each using the hand-written ' +
          '<code>.fn</code> template so navigation and in-site search reach every function. ' +
          'The index overview table cross-links to each function page, and the README and tutorial ' +
          'now point at the new link form (<code>#/apimetalearner</code>, etc.).</p></div>'
      },

      {
        id: "v024",
        heading: "v0.24 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">GitHub README bilingual (CN/EN) + one-click top switch</div>' +
          '<p>The repo landing page is now bilingual: a new <code>README_EN.md</code> (full English) ' +
          'plus <code>README.md</code> (Chinese), each with a language-switch button at the top that ' +
          'jumps to the other language. Both READMEs are kept in sync (install / functional API / ' +
          'R6 Learner / methodology / files / dependencies / version rule) and link to the bilingual docs site.</p></div>'
      },

      {
        id: "v023",
        heading: "v0.23 · 2026-10-22",
        body:
          '<div class="callout ok"><div class="callout-title">Regenerate man/ docs</div>' +
          '<p>Re-ran <code>roxygen2::roxygenise()</code> so <code>man/metalearner.Rd</code> and ' +
          '<code>man/LearnerRegrMetalearner.Rd</code> catch up with the 0.22 roxygen comments: ' +
          '<code>learner_base</code> / <code>learner_tau</code> now accept a named list per role ' +
          '(separate learner for each T-Learner arm, each X-Learner stage). The 0.22 batch edited ' +
          'the source comments but skipped roxygenise, leaving <code>man/</code> one batch behind.</p></div>'
      },

      {
        id: "v022",
        heading: "v0.22 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">Learners can now be specified per group / per stage</div>' +
          '<p>Beyond swapping one base learner for the whole recipe, you can now pick a different ' +
          'algorithm for each group and each stage: T-Learner takes ' +
          '<code>list(treated = ..., control = ...)</code> for the two arms; X-Learner takes ' +
          '<code>list(m1 = ..., m0 = ...)</code> for the two outcome models and ' +
          '<code>list(tau1 = ..., tau0 = ...)</code> for the two effect regressions. ' +
          'A single learner is still the default (shared everywhere) and remains fully backward ' +
          'compatible; S / R / DR and <code>survlearners</code> reject a named list with a clear error.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Tutorial script 13 brings back <code>kknn</code> (it was unavailable locally and ' +
          'temporarily swapped for rpart): all six base learners ranger / xgboost / glmnet / rpart / ' +
          'kknn / lm are restored, with a new section demonstrating per-group / per-stage swapping.</li>' +
          '<li>New <code>tests/testthat/test-learners-flexible.R</code> (7 <code>test_that</code> blocks): ' +
          'T with distinct arms, X with distinct stages, missing / unknown role, S·R·DR rejecting the ' +
          'list, survival per-group strings, and R6 pass-through.</li>' +
          '</ul>' +
          '<h3>Tests</h3>' +
          '<ul>' +
          '<li>Full suite: <strong>FAIL 0 | WARN 2 | SKIP 0 | PASS 314</strong>.</li>' +
          '</ul>'
      },

      {
        id: "v021",
        heading: "v0.21 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">Version now increments by 0.01 on every push</div>' +
          '<p>The version is no longer three-part: it is a two-decimal batch counter, ' +
          '<code>0.20</code> → <code>0.21</code> → <code>0.22</code> …, with a +0.01 bump on every ' +
          'pushed update. Earlier batches were renumbered accordingly (<code>0.1.0</code> → ' +
          '<code>0.10</code>, <code>0.2.0</code> → <code>0.20</code>).</p></div>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li>The site version had been stuck at <strong>v0.1.0</strong>: <code>SITE_META</code> was ' +
          'never updated alongside <code>DESCRIPTION</code>, so the footer and the changelog header ' +
          'both advertised a stale version. Both now read v0.21.</li>' +
          '<li>New <code>tests/testthat/test-version.R</code>: asserts that ' +
          '<code>DESCRIPTION</code>\'s <code>Version:</code> matches <code>SITE_META.version</code> ' +
          '(skipped when <code>docs/</code> is absent, so <code>R CMD check</code> is unaffected).</li>' +
          '</ul>' +
          '<h3>Engineering</h3>' +
          '<ul>' +
          '<li>New <code>dev/bump_version.R</code>: <code>Rscript dev/bump_version.R 0.22</code> writes ' +
          'both <code>DESCRIPTION</code> and <code>SITE_META</code> and lists any file still referencing ' +
          'the old version.</li>' +
          '</ul>' +
          '<h3>Correction</h3>' +
          '<ul>' +
          '<li>The docs claimed 288 cases / 55 files, which did not match the repo ' +
          '(<code>tests/testthat/</code> holds only 8 files). Restated in a checkable form: ' +
          '<strong>8 test files / 58 <code>test_that</code> blocks / 293 expectations, all passing</strong>.</li>' +
          '</ul>'
      },

      {
        id: "v020",
        heading: "v0.20 · 2026-10-21",
        body:
          '<div class="callout ok"><div class="callout-title">Evaluation metrics now cover all three outcome types</div>' +
          '<p>Qini / TOC / c-for-benefit / the DR pseudo-outcome used to accept numeric outcomes ' +
          'only and raised an error on <code>Surv</code>. All five functions now handle ' +
          '<strong>continuous, binary and survival</strong> outcomes; survival is reduced to the ' +
          'milestone indicator <code>I(T &gt; t0)</code> with censoring IPCW, so the effect scale ' +
          'matches the survival CATE reported by <code>metalearner()</code>.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>New <code>t0</code> / <code>X</code> / <code>effect</code> arguments on all five ' +
          'functions. <code>t0</code> defaults to the median event time; <code>effect</code> takes ' +
          '<code>"survdiff"</code> (default, S(t0) difference) or <code>"rmst"</code>.</li>' +
          '<li><code>dr_pseudo_outcome()</code> now supports survival outcomes too: default base ' +
          'learner <code>"coxph"</code>, returns the pseudo-outcome plus <code>t0</code> and ' +
          '<code>effect</code>.</li>' +
          '<li><code>.surv_ipcw()</code> gained an <code>at</code> argument and a marginal ' +
          'Kaplan–Meier branch for <code>X = NULL</code>, so censoring weights serve both the ' +
          'engine and the metrics.</li>' +
          '<li>Tutorial script <code>12_三类结局评价指标.R</code>: three outcomes x three ' +
          'rankings, averaged over 8 replicates.</li>' +
          '</ul>' +
          '<h3>Measured: why censoring correction is mandatory for survival</h3>' +
          '<ul>' +
          '<li>True ATE 0.1514: complete-case IPCW gives 0.1424 (bias −0.009), while ' +
          'no correction (<code>w = 1</code>) gives only 0.1127 (bias −0.039, about a quarter ' +
          'too low).</li>' +
          '<li><code>toc_curve()</code> now divides by <code>cumsum(w)</code> instead of ' +
          '<code>k</code>, so censored subjects with zero weight no longer dilute the average.</li>' +
          '<li>Known limitation: <code>effect = "rmst"</code> under-estimates under heavy censoring ' +
          '(weights are capped at 100; measured 0.043 vs a true 0.184 at 58% censoring). ' +
          'Prefer the default <code>survdiff</code> when censoring is heavy.</li>' +
          '</ul>' +
          '<h3>New tutorial lesson: fit order decides whether a metric is trustworthy</h3>' +
          '<p>Fitting on the full sample and then carving out a holdout leaks <code>Y</code> into ' +
          'the CATE. Binary outcomes make it brutal (observed benefit is ' +
          '<code>Y<sub>treated</sub> − Y<sub>control</sub></code>): c-for-benefit jumps from 0.558 ' +
          'to <strong>0.891</strong>, beating the oracle\'s 0.605, even though its correlation ' +
          'with the true <em>τ</em> is <em>worse</em> (0.542 &lt; 0.655). ' +
          '<strong>Split first, fit second.</strong></p>' +
          '<h3>Docs site</h3>' +
          '<ul>' +
          '<li>New standalone <a href="#/references">References</a> page (thesis-style: ' +
          'sectioned, globally numbered, each entry annotated with its use in this package), ' +
          'covering meta-learner families, HTE metrics, survival censoring and causal foundations. ' +
          '18 entries per language, synced across zh and en.</li>' +
          '<li>New tutorial script <code>13_换基学习器_基准对比.R</code> and the tutorial section ' +
          '"Swap the base learner: pick any algorithm in the mlr3 ecosystem" (zh + en): ' +
          'swapping the base learner in the mlr3 system is a one-line <code>learner_base = lrn("regr.xxx")</code> change, ' +
          'and <code>benchmark()</code> reuses the workflow directly. The README top also gained a ' +
          '"why mlr3: swap the base learner freely" callout.</li>' +
          '<li>New standalone <a href="#/environment">Environment &amp; dependency versions</a> page (zh + en) ' +
          'listing the full testing environment (R 4.5.1 / Windows 11 / 288 cases / ubuntu-latest CI) and every ' +
          'dependency version — direct, suggested, key transitive, and the <strong>full 89-package recursive list</strong>; ' +
          'README §6 and the tutorial main doc were updated to match.</li>' +
          '</ul>'
      },

      {
        id: "v010",
        heading: "v0.10 · 2026-10-20",
        body:
          '<div class="callout ok"><div class="callout-title">First complete release</div>' +
          '<p>The S, T, X, R and DR meta-learners covering continuous, binary and survival ' +
          'outcomes, for both randomized trials and observational studies. 119 tests passing, ' +
          'shipped with a bilingual (CN/EN) tutorial site.</p></div>' +
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Survival branch is now <strong>completely free of mlr3proba</strong>: base learners ' +
          'are native <code>"coxph"</code> / <code>"ranger"</code>. Passing <code>lrn("surv.*")</code> ' +
          'raises an explicit, helpful error.</li>' +
          '<li>Observational demo data for binary and survival outcomes: ' +
          '<code>mlr3HTE_demo_obs_binary()</code> and <code>mlr3HTE_demo_obs_surv()</code>, ' +
          'completing the six-cell matrix.</li>' +
          '<li>New exported <code>ml_task()</code> for uniform Task encoding across outcome types.</li>' +
          '<li>Tutorial: <code>tutorial/00_教程.md</code> plus 8 runnable scripts.</li>' +
          '<li>This bilingual documentation site (global search / CN-EN switch / light-dark theme).</li>' +
          '</ul>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li><strong>The <code>ifelse</code> trap in <code>.surv_at_t0()</code></strong>: ' +
          '<code>idx</code> is a scalar and <code>ifelse</code> shapes its result after ' +
          '<code>test</code>, so every observation received the same predicted value. The ranger ' +
          'survival branch ended up with zero CATE variance and an ATE of the wrong sign ' +
          '(−0.119 vs a true +0.152). Replaced with a plain branch plus whole-column indexing.</li>' +
          '<li>A classif learner\'s <code>predict_type = "prob"</code> must be set <strong>before</strong> ' +
          '<code>$train()</code>, otherwise <code>$prob</code> is NULL; changing it afterwards ' +
          'triggers an assertion error.</li>' +
          '<li><code>mlr3HTE_demo_surv()</code> used <code>A</code> before it was defined.</li>' +
          '</ul>' +
          '<h3>Changed</h3>' +
          '<ul>' +
          '<li><code>learner_tau</code> no longer reuses <code>learner_base</code>: stage 2 regresses ' +
          'a pseudo-outcome, and ranger\'s default <code>min.node.size = 5</code> overfits the noise ' +
          '(CATE correlation dropped from 0.9 to 0.2). It now builds ' +
          '<code>regr.ranger(num.trees = 500, min.node.size = 50)</code> by default.</li>' +
          '</ul>'
      },

      {
        id: "v001",
        heading: "v0.01 · 2026-10-18 (initial scaffold)",
        body:
          '<h3>Added</h3>' +
          '<ul>' +
          '<li>Engine scaffold: outcome-model abstraction plus the five meta-learner formulas.</li>' +
          '<li>End-to-end path for continuous outcomes in RCTs; both the functional API and the ' +
          'R6 Learner.</li>' +
          '<li><code>resample()</code> / <code>benchmark()</code> integration (a segfault here was ' +
          'fixed).</li>' +
          '</ul>' +
          '<h3>Fixed</h3>' +
          '<ul>' +
          '<li>The <code>resample()</code> segfault was caused by ' +
          '<code>PredictionRegr$new(truth = NULL)</code> — measures run ' +
          '<code>assert_regr</code> on <code>prediction$truth</code>. Truth is now taken from the ' +
          'prediction task itself.</li>' +
          '<li>R6 hooks must be the <strong>private</strong> <code>.train</code> / ' +
          '<code>.predict</code>; overriding the public methods replaces ' +
          '<code>.__Learner__train</code> and leaves <code>state$train_task</code> unset.</li>' +
          '<li>data.table column-selection trap: <code>dt[, char_vec, drop = FALSE]</code> treats a ' +
          'character vector as row indices.</li>' +
          '</ul>'
      },

      {
        id: "planned",
        heading: "Planned",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Item</th><th>Note</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Full <code>R CMD check</code></td><td>No Rtools on the dev machine for compiled checks; the pure-R part can be run first</td></tr>' +
          '<tr><td>roxygen2 <code>man/</code> pages</td><td>Currently only NAMESPACE exists — no .Rd help files yet</td></tr>' +
          '<tr><td>Cross-fitting for R / DR</td><td>Pseudo-outcomes should be fit K-fold out-of-fold to reduce overfitting bias</td></tr>' +
          '<tr><td>RMST option for survival</td><td>Restricted mean survival time difference, as an alternative effect measure</td></tr>' +
          '<tr><td>Uncertainty quantification</td><td>Only point estimates so far — no confidence intervals</td></tr>' +
          '</tbody></table></div>'
      },

      {
        id: "compat",
        heading: "Environment & compatibility",
        body:
          '<div class="table-wrap"><table>' +
          '<thead><tr><th>Item</th><th>Requirement / current state</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>R</td><td>4.5.1 (dev machine)</td></tr>' +
          '<tr><td>mlr3</td><td>1.8.0</td></tr>' +
          '<tr><td>paradox</td><td>1.0.1 (note: 1.0 uses <code>p_fct</code>/<code>p_uty</code>; there is no exported <code>ParamFct</code>)</td></tr>' +
          '<tr><td>mlr3proba</td><td><strong>Not needed</strong> — removed from dependencies and code paths</td></tr>' +
          '<tr><td>mlr3tuning</td><td>Optional (tuning demo not included)</td></tr>' +
          '</tbody></table></div>' +
          '<div class="callout warn"><div class="callout-title">mlr3 1.8 limitation</div>' +
          '<p>This version has no case-weights API on Task / Learner, so all weights are applied ' +
          'via <strong>importance resampling</strong>, which injects Monte-Carlo noise. Call ' +
          '<code>set.seed()</code> when you need reproducible results.</p></div>'
      }
    ]
  }
};
