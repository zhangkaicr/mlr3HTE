/* =====================================================================
   content-references.js —— 参考文献（中英双语）
   ===================================================================== */

window.SITE_PAGES = window.SITE_PAGES || {};

window.SITE_PAGES.references = {

  /* ---------------- 中文 ---------------- */
  zh: {
    title: "参考文献",
    lede: "本站全部方法学出处，按主题分节、全局连续编号。每条注明在本包中的用途与引用位置。",
    sections: [

      {
        id: "metalearners",
        heading: "A. Meta-Learner 与 CATE 估计",
        body:
          '<p>本包 <code>metalearner()</code> 的五族算法（S / T / X / R / DR）全部出自这一节。' +
          '编号 [1]–[5]。</p>' +
          '<ol class="ref-list" start="1">' +
          '<li id="ref-kunzel2019">' +
            '<div class="ref-cite">Künzel SR, Sekhon JS, Bickel PJ, Yu B. Metalearners for estimating heterogeneous treatment effects using machine learning. <em>Proceedings of the National Academy of Sciences</em> 2019;116(10):4156–4165.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1073/pnas.1804597116" target="_blank" rel="noopener">doi:10.1073/pnas.1804597116</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>type = "S"</code> / <code>"T"</code> / <code>"X"</code>。' +
            'S/T/X 的统一框架与 X-learner 都出自此文；X-learner 在两组样本量悬殊时的优势也是这里的结论。' +
            '引用位置：<a href="#/guide">架构与快速开始</a>、<a href="#/tutorial">场景教程</a>。</div>' +
          '</li>' +
          '<li id="ref-nie2021">' +
            '<div class="ref-cite">Nie X, Wager S. Quasi-oracle estimation of heterogeneous treatment effects. <em>Biometrika</em> 2021;108(2):299–319.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1093/biomet/asaa076" target="_blank" rel="noopener">doi:10.1093/biomet/asaa076</a> · <a href="https://arxiv.org/abs/1712.04912" target="_blank" rel="noopener">arXiv:1712.04912</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>type = "R"</code>。' +
            'Robinson 残差化后以 <code>(A − e)²</code> 加权的二阶段回归，即 R-learner。' +
            '引用位置：<a href="#/guide">架构与快速开始</a>。</div>' +
          '</li>' +
          '<li id="ref-kennedy2023">' +
            '<div class="ref-cite">Kennedy EH. Towards optimal doubly robust estimation of heterogeneous causal effects. <em>Electronic Journal of Statistics</em> 2023;17(2):3008–3049.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1214/23-EJS2157" target="_blank" rel="noopener">doi:10.1214/23-EJS2157</a> · <a href="https://arxiv.org/abs/2004.14497" target="_blank" rel="noopener">arXiv:2004.14497</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>type = "DR"</code>。' +
            '两阶段双重稳健 CATE 估计量与伪结果构造。' +
            '<strong>注意：</strong>源码注释里写的"Kennedy 2020"指 arXiv 预印本年份，正式发表于 2023。' +
            '引用位置：<a href="#/guide">架构与快速开始</a>。</div>' +
          '</li>' +
          '<li id="ref-robinson1988">' +
            '<div class="ref-cite">Robinson PM. Root-N-consistent semiparametric regression. <em>Econometrica</em> 1988;56(4):931–954.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.2307/1912705" target="_blank" rel="noopener">doi:10.2307/1912705</a></div>' +
            '<div class="ref-use"><strong>用途：</strong>R-learner 的变换本身——' +
            '<code>(Y − m(X)) / (A − e(X))</code>。教程里简称"Robinson 残差化"，即出自此文。' +
            '引用位置：<a href="#/guide">架构与快速开始</a>。</div>' +
          '</li>' +
          '<li id="ref-chernozhukov2018">' +
            '<div class="ref-cite">Chernozhukov V, Chetverikov D, Demirer M, Duflo E, Hansen C, Newey W, Robins J. Double/debiased machine learning for treatment and structural parameters. <em>The Econometrics Journal</em> 2018;21(1):C1–C68.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/ectj.12097" target="_blank" rel="noopener">doi:10.1111/ectj.12097</a> · <a href="https://arxiv.org/abs/1608.00060" target="_blank" rel="noopener">arXiv:1608.00060</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>cross_fitting</code> 参数的理论依据。' +
            'Neyman 正交得分 + 交叉拟合，这正是"伪结果必须交叉拟合"那条实测结论的出处' +
            '（in-fold 会让伪结果与被评价 CATE 同源，指标虚高）。' +
            '引用位置：<a href="#/tutorial">场景教程 · 模型评价</a>。</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "doubly-robust",
        heading: "B. 双重稳健估计与观察性数据",
        body:
          '<p>观察性分支的权重构造与伪结局出自这一节。编号 [6]–[7]。</p>' +
          '<ol class="ref-list" start="6">' +
          '<li id="ref-robins1994">' +
            '<div class="ref-cite">Robins JM, Rotnitzky A, Zhao LP. Estimation of regression coefficients when some regressors are not always observed. <em>Journal of the American Statistical Association</em> 1994;89(427):846–866.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1080/01621459.1994.10476818" target="_blank" rel="noopener">doi:10.1080/01621459.1994.10476818</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>dr_pseudo_outcome()</code> 与 DR-learner 里' +
            '的增广 IPW（AIPW）估计量 <code>Y* = (μ̂₁ − μ̂₀) + A(Y − μ̂₁)/e − (1−A)(Y − μ̂₀)/(1−e)</code>，' +
            '"双重稳健"一词的奠基文献。' +
            '引用位置：<a href="#/api">函数文档</a>。</div>' +
          '</li>' +
          '<li id="ref-robins2000">' +
            '<div class="ref-cite">Robins JM, Hernán MA, Brumback B. Marginal structural models and causal inference in epidemiology. <em>Epidemiology</em> 2000;11(5):550–560.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1097/00001648-200009000-00011" target="_blank" rel="noopener">doi:10.1097/00001648-200009000-00011</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>weighting = "iptw"</code> 与稳定化权重' +
            '（<code>stabilize</code>）的出处。观察性分支把 IPTW 与 metalearner 相接，' +
            '权重构造即按此文。' +
            '引用位置：<a href="#/tutorial">场景教程 · 观察性研究</a>。</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "metrics",
        heading: "C. HTE 模型评价指标",
        body:
          '<p><code>qini_curve()</code> / <code>qini_coefficient()</code> / <code>c_for_benefit()</code> / ' +
          '<code>toc_curve()</code> 四个函数的出处。编号 [8]–[12]。</p>' +
          '<ol class="ref-list" start="8">' +
          '<li id="ref-sverdrup2025">' +
            '<div class="ref-cite">Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment Rules. <em>Journal of Computational and Graphical Statistics</em> 2025.</div>' +
            '<div class="ref-links"><a href="https://arxiv.org/abs/2306.11979" target="_blank" rel="noopener">arXiv:2306.11979</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>qini_curve()</code> 与 ' +
            '<code>qini_coefficient()</code> 的定义与估计核 ' +
            '<code>Q(f) = (1/n)·Σ [A·Y/e − (1−A)·Y/(1−e)]</code>。' +
            '引用位置：<a href="#/tutorial">场景教程 · 模型评价</a>、<a href="#/api">函数文档</a>。</div>' +
          '</li>' +
          '<li id="ref-radcliffe2007">' +
            '<div class="ref-cite">Radcliffe NJ. Using control groups to target on predicted lift: Building and assessing uplift models. <em>Direct Marketing Analytics Journal</em> 2007.</div>' +
            '<div class="ref-links"><span class="ref-note">无 DOI，期刊为从业者刊物</span></div>' +
            '<div class="ref-use"><strong>用途：</strong>uplift 曲线（Qini 的前身）的早期形式。' +
            '本包 Qini 采用 [8] 的现代定义，此条仅作溯源。' +
            '引用位置：<a href="#/api">函数文档</a>。</div>' +
          '</li>' +
          '<li id="ref-vanklaveren2018">' +
            '<div class="ref-cite">van Klaveren D, Steyerberg EW, Serruys PW, Kent DM. The proposed \'concordance-statistic for benefit\' provided a useful metric when modeling heterogeneous treatment effects. <em>Journal of Clinical Epidemiology</em> 2018;94:59–68.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1016/j.jclinepi.2017.10.021" target="_blank" rel="noopener">doi:10.1016/j.jclinepi.2017.10.021</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>c_for_benefit()</code>。' +
            '<strong>本包是近似实现</strong>：贪心最近邻配对 + 配对间秩一致率，' +
            '不是原文的完整匹配流程；严格复现请用 <code>CforBenefit</code> 包。' +
            '这一点写在 <code>R/metrics.R</code> 的注释里，不藏着。' +
            '引用位置：<a href="#/tutorial">场景教程 · 模型评价</a>。</div>' +
          '</li>' +
          '<li id="ref-maas2023">' +
            '<div class="ref-cite">Maas CCHM, Kent DM, Hughes MC, Dekker R, Lingsma HF, van Klaveren D. Performance metrics for models designed to predict treatment effect. <em>BMC Medical Research Methodology</em> 2023;23(1):165.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1186/s12874-023-01974-w" target="_blank" rel="noopener">doi:10.1186/s12874-023-01974-w</a></div>' +
            '<div class="ref-use"><strong>用途：</strong>c-for-benefit 之外的校准与整体性能指标族' +
            '（E<sub>avg</sub>/E<sub>50</sub>/E<sub>90</sub>-for-benefit、Brier-for-benefit、' +
            'cross-entropy-for-benefit），配套 R 包 <code>HTEPredictionMetrics</code>。' +
            '<strong>注意：</strong>源码注释里写的 2022 是预印本年份，正式发表于 2023。' +
            '本包尚未实现这些指标，列为后续方向。' +
            '引用位置：<a href="#/api">函数文档</a>。</div>' +
          '</li>' +
          '<li id="ref-yadlowsky2025">' +
            '<div class="ref-cite">Yadlowsky S, Fleming S, Shah N, Brunskill E, Wager S. Evaluating Treatment Prioritization Rules via Rank-Weighted Average Treatment Effects. <em>Journal of the American Statistical Association</em> 2025;120(549).</div>' +
            '<div class="ref-links"><a href="https://arxiv.org/abs/2111.07966" target="_blank" rel="noopener">arXiv:2111.07966</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>toc_curve()</code>。' +
            '靶向前 k% 子群的平均治疗效应随靶向比例变化；全样本 ATE 即曲线的水平参照线。' +
            '引用位置：<a href="#/tutorial">场景教程 · 模型评价</a>、<a href="#/api">函数文档</a>。</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "survival",
        heading: "D. 生存分析与删失",
        body:
          '<p>生存分支的基学习器、删失 IPCW 权重与效应标尺出自这一节。编号 [13]–[15]。</p>' +
          '<ol class="ref-list" start="13">' +
          '<li id="ref-cox1972">' +
            '<div class="ref-cite">Cox DR. Regression models and life-tables. <em>Journal of the Royal Statistical Society: Series B</em> 1972;34(2):187–220.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/j.2517-6161.1972.tb00899.x" target="_blank" rel="noopener">doi:10.1111/j.2517-6161.1972.tb00899.x</a></div>' +
            '<div class="ref-use"><strong>用途：</strong>生存分支的默认基学习器 ' +
            '<code>learner_base = "coxph"</code>。' +
            '引用位置：<a href="#/tutorial">场景教程 · 生存结局</a>。</div>' +
          '</li>' +
          '<li id="ref-robins2000ipcw">' +
            '<div class="ref-cite">Robins JM, Finkelstein DM. Correcting for noncompliance and dependent censoring in an AIDS clinical trial with inverse probability of censoring weighted (IPCW) log-rank tests. <em>Biometrics</em> 2000;56(3):779–788.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/j.0006-341X.2000.00779.x" target="_blank" rel="noopener">doi:10.1111/j.0006-341X.2000.00779.x</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>.surv_ipcw()</code> 的删失校正，' +
            '以及评价指标在生存结局上用的完整病例权重 ' +
            '<code>w = I(可观测) / Ĝ(min(T, t0))</code>。实测：不做校正会把 Q(1) 低估约四分之一。' +
            '引用位置：<a href="#/tutorial">场景教程 · 三类结局评价指标</a>。</div>' +
          '</li>' +
          '<li id="ref-therneau2000">' +
            '<div class="ref-cite">Therneau TM, Grambsch PM. <em>Modeling Survival Data: Extending the Cox Model</em>. New York: Springer, 2000.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1007/978-1-4757-3294-8" target="_blank" rel="noopener">doi:10.1007/978-1-4757-3294-8</a></div>' +
            '<div class="ref-use"><strong>用途：</strong><code>survival</code> 包的实现参考；' +
            '本包生存分支用 <code>survival::coxph</code> / <code>survfit</code>。' +
            '引用位置：<a href="#/tutorial">场景教程 · 生存结局</a>。</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "software",
        heading: "E. 软件与实现依赖",
        body:
          '<p>本包直接依赖的 R 生态与可选引擎。编号 [16]–[18]。</p>' +
          '<ol class="ref-list" start="16">' +
          '<li id="ref-mlr3">' +
            '<div class="ref-cite">Lang M, Binder M, Richter J, Schratz P, Pfisterer F, Coors S, Au Q, Casalicchio G, Kotthoff L, Bischl B. mlr3: A modern object-oriented machine learning framework in R. <em>Journal of Open Source Software</em> 2019;4(44):1903.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.21105/joss.01903" target="_blank" rel="noopener">doi:10.21105/joss.01903</a></div>' +
            '<div class="ref-use"><strong>用途：</strong>R6 Learner 接口、<code>Task</code> / ' +
            '<code>resample()</code> / <code>benchmark()</code> 集成。' +
            '引用位置：<a href="#/tutorial">场景教程 · mlr3 工作流</a>。</div>' +
          '</li>' +
          '<li id="ref-ranger">' +
            '<div class="ref-cite">Wright MN, Ziegler A. ranger: A Fast Implementation of Random Forests for High Dimensional Data in C++ and R. <em>Journal of Open Source Software</em> 2017;2(18):805.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.21105/joss.00805" target="_blank" rel="noopener">doi:10.21105/joss.00805</a></div>' +
            '<div class="ref-use"><strong>用途：</strong>默认基学习器与二阶段学习器' +
            '（<code>regr.ranger</code> / <code>classif.ranger</code>）。' +
            '引用位置：<a href="#/guide">架构与快速开始</a>。</div>' +
          '</li>' +
          '<li id="ref-survlearners">' +
            '<div class="ref-cite">Cui Y, Demirel BB, Karaveli A, Li J, Shah NH, Tarkoma S, et al. survlearners: A CRAN-compliant R package for heterogeneous treatment effect estimation in survival analysis. <em>Journal of Open Source Software</em> 2024.</div>' +
            '<div class="ref-links"><a href="https://github.com/som-shahlab/survlearners" target="_blank" rel="noopener">GitHub: som-shahlab/survlearners</a> · GPL-3</div>' +
            '<div class="ref-use"><strong>用途：</strong>可选的第二套生存引擎 ' +
            '<code>engine = "survlearners"</code>。只发布在 GitHub，因此放在 ' +
            '<code>Suggests</code> 而非 <code>Imports</code>；未安装时给出明确提示。' +
            '引用位置：<a href="#/tutorial">场景教程 · 生存引擎二选一</a>。</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "interpretability",
        heading: "F. 模型可解释性",
        body:
          '<p>可解释性模块（<code>hte_explainer()</code> 及其配套函数）的方法学出处，编号 [19]–[24]。</p>' +
          '<ol class="ref-list" start="19">' +
          '<li id="ref-biecek2021"><div class="ref-cite">Biecek P, Burzykowski T. <em>Explanatory Model Analysis: Explore, Explain, and Examine Predictive Models</em>. Chapman and Hall/CRC, 2021.</div><div class="ref-links"><a href="https://ema.drwhy.ai/" target="_blank" rel="noopener">https://ema.drwhy.ai/</a></div><div class="ref-use"><strong>用途：</strong>本包可解释性模块的整体框架（解释器、变量重要性、偏依赖、SHAP 的层次划分）均按此书的术语与顺序组织。引用位置：<a href="#/apiexplain">可解释性模块</a>、<a href="#/tutorialexplain">教程 · CATE 可解释性</a>。</div></li>' +
          '<li id="ref-biecek2018"><div class="ref-cite">Biecek P. DALEX: Explainers for Complex Predictive Models in R. <em>Journal of Machine Learning Research</em> 2018;19(84):1–5.</div><div class="ref-links"><a href="https://jmlr.org/papers/v19/18-416.html" target="_blank" rel="noopener">https://jmlr.org/papers/v19/18-416.html</a></div><div class="ref-use"><strong>用途：</strong><code>hte_explainer()</code> 底层调用 <code>DALEX::explain()</code>，<code>hte_feature_importance()</code> 用 <code>model_parts()</code>、<code>hte_pdp()</code> 用 <code>model_profile()</code>。引用位置：<a href="#/apiexplainer">hte_explainer()</a>。</div></li>' +
          '<li id="ref-molnar2022"><div class="ref-cite">Molnar C. <em>Interpretable Machine Learning: A Guide for Making Black Box Models Explainable</em>. 2nd ed., 2022.</div><div class="ref-links"><a href="https://christophm.github.io/interpretable-ml-book/" target="_blank" rel="noopener">https://christophm.github.io/interpretable-ml-book/</a></div><div class="ref-use"><strong>用途：</strong>偏依赖图与累积局部效应的原理、以及二者在变量相关时的优劣对比，按此书第 8 章的表述。引用位置：<a href="#/apipdp">hte_pdp()</a>。</div></li>' +
          '<li id="ref-lundberg2017"><div class="ref-cite">Lundberg SM, Lee SI. A Unified Approach to Interpreting Model Predictions. <em>Advances in Neural Information Processing Systems</em> 2017;30:4765–4774.</div><div class="ref-links"><a href="https://arxiv.org/abs/1705.07874" target="_blank" rel="noopener">https://arxiv.org/abs/1705.07874</a></div><div class="ref-use"><strong>用途：</strong>SHAP 值的可加性分解 <code>phi_0 + sum(phi_j) = f(x)</code> 出自此文；本包用它作为 <code>hte_shap()</code> 实现正确性的校验式。引用位置：<a href="#/apishap">hte_shap()</a>。</div></li>' +
          '<li id="ref-covert2021"><div class="ref-cite">Covert I, Lee SI. Improving KernelSHAP: Practical Shapley Value Estimation Using Linear Regression. <em>AISTATS</em> 2021;130:3457–3465.</div><div class="ref-links"><a href="https://arxiv.org/abs/2012.01536" target="_blank" rel="noopener">https://arxiv.org/abs/2012.01536</a></div><div class="ref-use"><strong>用途：</strong><code>hte_shap()</code> 调用的 kernelshap 采用此文的线性回归近似，在协变量较多时由精确枚举切换为采样近似。引用位置：<a href="#/apishap">hte_shap()</a>。</div></li>' +
          '<li id="ref-apley2020"><div class="ref-cite">Apley DW, Zhu J. Visualizing the Effects of Predictor Variables in Black Box Supervised Learning Models. <em>Journal of the Royal Statistical Society: Series B</em> 2020;82(4):1059–1086.</div><div class="ref-links"><a href="https://doi.org/10.1111/rssb.12377" target="_blank" rel="noopener">https://doi.org/10.1111/rssb.12377</a></div><div class="ref-use"><strong>用途：</strong>累积局部效应（ALE）的出处。<code>hte_pdp(type = "accumulated")</code> 在协变量相关时按此方法替代 PDP。引用位置：<a href="#/apipdp">hte_pdp()</a>。</div></li>' +
          '</ol>'
      },
      {
        id: "simulation",
        heading: "G. 模拟设计与估计方法学",
        body:
          '<p>基准模拟数据网格的四维设计原则、交叉拟合与 RMST 效应标尺的出处，编号 [25]–[27]。</p>' +
          '<ol class="ref-list" start="25">' +
          '<li id="ref-kennedy2020"><div class="ref-cite">Kennedy EH. Towards Optimal Doubly Robust Estimation of Heterogeneous Causal Effects. <em>arXiv</em> 2020:2004.14497.</div><div class="ref-links"><a href="https://arxiv.org/abs/2004.14497" target="_blank" rel="noopener">https://arxiv.org/abs/2004.14497</a></div><div class="ref-use"><strong>用途：</strong>R-learner 与伪结局回归的最优性、以及<strong>交叉拟合</strong>为何必要（干扰参数须在训练折上拟合、在留出折上评估）均出自此文。本包 R/DR 的 <code>cross_fitting = TRUE</code> 与 <code>dr_pseudo_outcome()</code> 的默认交叉拟合均据此实现。引用位置：<a href="#/apimetalearner">metalearner()</a>。</div></li>' +
          '<li id="ref-uno2014"><div class="ref-cite">Uno H, Claggett B, Tian L, et al. Moving Beyond the Hazard Ratio in Quantifying the Between-Group Difference in Survival Analysis. <em>Journal of Clinical Oncology</em> 2014;32(22):2380–2385.</div><div class="ref-links"><a href="https://doi.org/10.1200/JCO.2013.52.5720" target="_blank" rel="noopener">https://doi.org/10.1200/JCO.2013.52.5720</a></div><div class="ref-use"><strong>用途：</strong>RMST（限制平均生存时间）组间差的提出与临床解释。生存分支 <code>effect = "rmst"</code> 的效应标尺即按此定义，基准数据中的 <code>tau_rmst</code> / <code>ate_rmst</code> 为其真值。引用位置：<a href="#/tutorialbenchgrid">教程 · 基准模拟数据网格</a>。</div></li>' +
          '<li id="ref-morris2019"><div class="ref-cite">Morris TP, White IR, Crowther MJ. Using Simulation Studies to Evaluate Statistical Methods. <em>Statistics in Medicine</em> 2019;38(11):2074–2102.</div><div class="ref-links"><a href="https://doi.org/10.1002/sim.8086" target="_blank" rel="noopener">https://doi.org/10.1002/sim.8086</a></div><div class="ref-use"><strong>用途：</strong>模拟研究的 ADEMP 框架（Aims, Data-generating mechanisms, Estimands, Methods, Performance measures）。本包基准数据网格的四个维度与“按结构分层报告、不做跨维度平均”的约定即按此框架设计。引用位置：<a href="#/tutorialbenchgrid">教程 · 基准模拟数据网格</a>。</div></li>' +
          '</ol>'
      },
      {
        id: "cite-this",
        heading: "如何引用本包",
        body:
          '<p>版本 v0.2.0（2026-10-21）。若 mlr3HTE 用于你的研究，请按下面格式引用：</p>' +
          '<pre><code class="r-out">Zhang K. mlr3HTE: Meta-Learners for Heterogeneous Treatment Effects in mlr3.\n' +
          'R package version 0.2.0, 2026.\n' +
          'URL: https://github.com/zhangkaicr/mlr3HTE</code></pre>' +
          '<p>BibTeX：</p>' +
          '<pre><code class="r-out">@Manual{mlr3HTE,\n' +
          '  title  = {mlr3HTE: Meta-Learners for Heterogeneous Treatment\n' +
          '            Effects in mlr3},\n' +
          '  author = {Zhang, Kai},\n' +
          '  year   = {2026},\n' +
          '  note   = {R package version 0.2.0},\n' +
          '  url    = {https://github.com/zhangkaicr/mlr3HTE}\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">著录格式说明</div>' +
          '<p>本页按<strong>生物医学期刊统一投稿要求</strong>（温哥华式）著录：作者. 题名. 期刊名 年;卷(期):起止页. ' +
          '作者超过六位时列出前六位后加 <em>et al.</em>（本页为完整起见仍全部列出）。' +
          '仅有预印本的条目给出 arXiv 编号并标注年份；' +
          '<strong>凡预印本年份与正式发表年份不一致的，已在"用途"一栏注明</strong>' +
          '（Kennedy 2020 → 2023；Maas 2022 → 2023），源码注释里保留的是预印本年份。</p></div>'
      }
    ]
  },

  /* ---------------- English ---------------- */
  en: {
    title: "References",
    lede: "Every methodological source used on this site, grouped by theme and numbered continuously. Each entry states what it is used for in this package and where it is cited.",
    sections: [

      {
        id: "metalearners",
        heading: "A. Meta-Learners and CATE estimation",
        body:
          '<p>The five algorithms behind <code>metalearner()</code> (S / T / X / R / DR) all come from ' +
          'this section. Entries [1]–[5].</p>' +
          '<ol class="ref-list" start="1">' +
          '<li id="ref-kunzel2019">' +
            '<div class="ref-cite">Künzel SR, Sekhon JS, Bickel PJ, Yu B. Metalearners for estimating heterogeneous treatment effects using machine learning. <em>Proceedings of the National Academy of Sciences</em> 2019;116(10):4156–4165.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1073/pnas.1804597116" target="_blank" rel="noopener">doi:10.1073/pnas.1804597116</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>type = "S"</code> / <code>"T"</code> / ' +
            '<code>"X"</code>. The unifying metalearner framework and the X-learner itself, including its ' +
            'advantage when one treatment group is much larger than the other. ' +
            'Cited in: <a href="#/guide">Architecture &amp; Quickstart</a>, <a href="#/tutorial">Tutorial</a>.</div>' +
          '</li>' +
          '<li id="ref-nie2021">' +
            '<div class="ref-cite">Nie X, Wager S. Quasi-oracle estimation of heterogeneous treatment effects. <em>Biometrika</em> 2021;108(2):299–319.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1093/biomet/asaa076" target="_blank" rel="noopener">doi:10.1093/biomet/asaa076</a> · <a href="https://arxiv.org/abs/1712.04912" target="_blank" rel="noopener">arXiv:1712.04912</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>type = "R"</code>. The R-learner: ' +
            'Robinson residualisation followed by a second-stage regression weighted by ' +
            '<code>(A − e)²</code>. ' +
            'Cited in: <a href="#/guide">Architecture &amp; Quickstart</a>.</div>' +
          '</li>' +
          '<li id="ref-kennedy2023">' +
            '<div class="ref-cite">Kennedy EH. Towards optimal doubly robust estimation of heterogeneous causal effects. <em>Electronic Journal of Statistics</em> 2023;17(2):3008–3049.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1214/23-EJS2157" target="_blank" rel="noopener">doi:10.1214/23-EJS2157</a> · <a href="https://arxiv.org/abs/2004.14497" target="_blank" rel="noopener">arXiv:2004.14497</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>type = "DR"</code>. The two-stage ' +
            'doubly-robust CATE estimator and its pseudo-outcome. ' +
            '<strong>Note:</strong> the "Kennedy 2020" written in the source comments is the arXiv ' +
            'preprint year; the article was published in 2023. ' +
            'Cited in: <a href="#/guide">Architecture &amp; Quickstart</a>.</div>' +
          '</li>' +
          '<li id="ref-robinson1988">' +
            '<div class="ref-cite">Robinson PM. Root-N-consistent semiparametric regression. <em>Econometrica</em> 1988;56(4):931–954.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.2307/1912705" target="_blank" rel="noopener">doi:10.2307/1912705</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the transformation behind the R-learner, ' +
            '<code>(Y − m(X)) / (A − e(X))</code>, called "Robinson residualisation" in the tutorial. ' +
            'Cited in: <a href="#/guide">Architecture &amp; Quickstart</a>.</div>' +
          '</li>' +
          '<li id="ref-chernozhukov2018">' +
            '<div class="ref-cite">Chernozhukov V, Chetverikov D, Demirer M, Duflo E, Hansen C, Newey W, Robins J. Double/debiased machine learning for treatment and structural parameters. <em>The Econometrics Journal</em> 2018;21(1):C1–C68.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/ectj.12097" target="_blank" rel="noopener">doi:10.1111/ectj.12097</a> · <a href="https://arxiv.org/abs/1608.00060" target="_blank" rel="noopener">arXiv:1608.00060</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the rationale behind the ' +
            '<code>cross_fitting</code> argument. Neyman-orthogonal scores plus cross-fitting — ' +
            'exactly why the tutorial insists the pseudo-outcome must be cross-fitted (in-fold ' +
            'fitting makes the pseudo-outcome share a source with the CATE being evaluated, ' +
            'inflating the metric). ' +
            'Cited in: <a href="#/tutorial">Tutorial · Model evaluation</a>.</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "doubly-robust",
        heading: "B. Doubly-robust estimation and observational data",
        body:
          '<p>Weight construction and the pseudo-outcome for the observational branch. ' +
          'Entries [6]–[7].</p>' +
          '<ol class="ref-list" start="6">' +
          '<li id="ref-robins1994">' +
            '<div class="ref-cite">Robins JM, Rotnitzky A, Zhao LP. Estimation of regression coefficients when some regressors are not always observed. <em>Journal of the American Statistical Association</em> 1994;89(427):846–866.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1080/01621459.1994.10476818" target="_blank" rel="noopener">doi:10.1080/01621459.1994.10476818</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the augmented IPW (AIPW) estimator in ' +
            '<code>dr_pseudo_outcome()</code> and the DR-learner, ' +
            '<code>Y* = (μ̂₁ − μ̂₀) + A(Y − μ̂₁)/e − (1−A)(Y − μ̂₀)/(1−e)</code>. ' +
            'The founding paper of "doubly robust". ' +
            'Cited in: <a href="#/api">API Reference</a>.</div>' +
          '</li>' +
          '<li id="ref-robins2000">' +
            '<div class="ref-cite">Robins JM, Hernán MA, Brumback B. Marginal structural models and causal inference in epidemiology. <em>Epidemiology</em> 2000;11(5):550–560.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1097/00001648-200009000-00011" target="_blank" rel="noopener">doi:10.1097/00001648-200009000-00011</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>weighting = "iptw"</code> and ' +
            'stabilised weights (<code>stabilize</code>). The observational branch wires IPTW into ' +
            'the meta-learners following this paper. ' +
            'Cited in: <a href="#/tutorial">Tutorial · observational studies</a>.</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "metrics",
        heading: "C. HTE evaluation metrics",
        body:
          '<p>Sources for <code>qini_curve()</code> / <code>qini_coefficient()</code> / ' +
          '<code>c_for_benefit()</code> / <code>toc_curve()</code>. Entries [8]–[12].</p>' +
          '<ol class="ref-list" start="8">' +
          '<li id="ref-sverdrup2025">' +
            '<div class="ref-cite">Sverdrup E, Wu H, Athey S, Wager S. Qini Curves for Multi-Armed Treatment Rules. <em>Journal of Computational and Graphical Statistics</em> 2025.</div>' +
            '<div class="ref-links"><a href="https://arxiv.org/abs/2306.11979" target="_blank" rel="noopener">arXiv:2306.11979</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>qini_curve()</code> and ' +
            '<code>qini_coefficient()</code>, including the estimation kernel ' +
            '<code>Q(f) = (1/n)·Σ [A·Y/e − (1−A)·Y/(1−e)]</code>. ' +
            'Cited in: <a href="#/tutorial">Tutorial · model evaluation</a>, ' +
            '<a href="#/api">API Reference</a>.</div>' +
          '</li>' +
          '<li id="ref-radcliffe2007">' +
            '<div class="ref-cite">Radcliffe NJ. Using control groups to target on predicted lift: Building and assessing uplift models. <em>Direct Marketing Analytics Journal</em> 2007.</div>' +
            '<div class="ref-links"><span class="ref-note">No DOI; a practitioner journal</span></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the early form of the uplift curve, ' +
            'the precursor of Qini. This package follows the modern definition in [8]; this entry ' +
            'is here for provenance only. ' +
            'Cited in: <a href="#/api">API Reference</a>.</div>' +
          '</li>' +
          '<li id="ref-vanklaveren2018">' +
            '<div class="ref-cite">van Klaveren D, Steyerberg EW, Serruys PW, Kent DM. The proposed \'concordance-statistic for benefit\' provided a useful metric when modeling heterogeneous treatment effects. <em>Journal of Clinical Epidemiology</em> 2018;94:59–68.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1016/j.jclinepi.2017.10.021" target="_blank" rel="noopener">doi:10.1016/j.jclinepi.2017.10.021</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>c_for_benefit()</code>. ' +
            '<strong>This package implements an approximation</strong>: greedy nearest-neighbour ' +
            'matching plus rank concordance across pairs, not the full matching procedure of the ' +
            'paper. Use the <code>CforBenefit</code> package for strict replication. This is stated ' +
            'in the comments of <code>R/metrics.R</code>, not hidden. ' +
            'Cited in: <a href="#/tutorial">Tutorial · model evaluation</a>.</div>' +
          '</li>' +
          '<li id="ref-maas2023">' +
            '<div class="ref-cite">Maas CCHM, Kent DM, Hughes MC, Dekker R, Lingsma HF, van Klaveren D. Performance metrics for models designed to predict treatment effect. <em>BMC Medical Research Methodology</em> 2023;23(1):165.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1186/s12874-023-01974-w" target="_blank" rel="noopener">doi:10.1186/s12874-023-01974-w</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the family of calibration and overall ' +
            'performance metrics beyond c-for-benefit (E<sub>avg</sub>/E<sub>50</sub>/E<sub>90</sub>' +
            '-for-benefit, Brier-for-benefit, cross-entropy-for-benefit), shipped in the R package ' +
            '<code>HTEPredictionMetrics</code>. <strong>Note:</strong> the 2022 written in the source ' +
            'comments is the preprint year; the article was published in 2023. These metrics are ' +
            'not yet implemented here — listed as future work. ' +
            'Cited in: <a href="#/api">API Reference</a>.</div>' +
          '</li>' +
          '<li id="ref-yadlowsky2025">' +
            '<div class="ref-cite">Yadlowsky S, Fleming S, Shah N, Brunskill E, Wager S. Evaluating Treatment Prioritization Rules via Rank-Weighted Average Treatment Effects. <em>Journal of the American Statistical Association</em> 2025;120(549).</div>' +
            '<div class="ref-links"><a href="https://arxiv.org/abs/2111.07966" target="_blank" rel="noopener">arXiv:2111.07966</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> <code>toc_curve()</code>. The average ' +
            'treatment effect inside the top k% as targeting grows; the full-sample ATE is the ' +
            'horizontal reference line. ' +
            'Cited in: <a href="#/tutorial">Tutorial · model evaluation</a>, ' +
            '<a href="#/api">API Reference</a>.</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "survival",
        heading: "D. Survival analysis and censoring",
        body:
          '<p>Base learners, censoring IPCW weights and the effect scale for the survival branch. ' +
          'Entries [13]–[15].</p>' +
          '<ol class="ref-list" start="13">' +
          '<li id="ref-cox1972">' +
            '<div class="ref-cite">Cox DR. Regression models and life-tables. <em>Journal of the Royal Statistical Society: Series B</em> 1972;34(2):187–220.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/j.2517-6161.1972.tb00899.x" target="_blank" rel="noopener">doi:10.1111/j.2517-6161.1972.tb00899.x</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the default survival base learner, ' +
            '<code>learner_base = "coxph"</code>. ' +
            'Cited in: <a href="#/tutorial">Tutorial · survival outcome</a>.</div>' +
          '</li>' +
          '<li id="ref-robins2000ipcw">' +
            '<div class="ref-cite">Robins JM, Finkelstein DM. Correcting for noncompliance and dependent censoring in an AIDS clinical trial with inverse probability of censoring weighted (IPCW) log-rank tests. <em>Biometrics</em> 2000;56(3):779–788.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1111/j.0006-341X.2000.00779.x" target="_blank" rel="noopener">doi:10.1111/j.0006-341X.2000.00779.x</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> censoring correction in ' +
            '<code>.surv_ipcw()</code> and the complete-case weight used by the metrics on survival ' +
            'outcomes, <code>w = I(observable) / Ĝ(min(T, t0))</code>. Measured: skipping the ' +
            'correction under-estimates Q(1) by roughly a quarter. ' +
            'Cited in: <a href="#/tutorial">Tutorial · metrics across three outcomes</a>.</div>' +
          '</li>' +
          '<li id="ref-therneau2000">' +
            '<div class="ref-cite">Therneau TM, Grambsch PM. <em>Modeling Survival Data: Extending the Cox Model</em>. New York: Springer, 2000.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.1007/978-1-4757-3294-8" target="_blank" rel="noopener">doi:10.1007/978-1-4757-3294-8</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the reference for the ' +
            '<code>survival</code> package; the survival branch calls ' +
            '<code>survival::coxph</code> / <code>survfit</code>. ' +
            'Cited in: <a href="#/tutorial">Tutorial · survival outcome</a>.</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "software",
        heading: "E. Software and implementation dependencies",
        body:
          '<p>The R ecosystem this package builds on, plus the optional survival engine. ' +
          'Entries [16]–[18].</p>' +
          '<ol class="ref-list" start="16">' +
          '<li id="ref-mlr3">' +
            '<div class="ref-cite">Lang M, Binder M, Richter J, Schratz P, Pfisterer F, Coors S, Au Q, Casalicchio G, Kotthoff L, Bischl B. mlr3: A modern object-oriented machine learning framework in R. <em>Journal of Open Source Software</em> 2019;4(44):1903.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.21105/joss.01903" target="_blank" rel="noopener">doi:10.21105/joss.01903</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the R6 Learner interface, ' +
            '<code>Task</code>, <code>resample()</code> and <code>benchmark()</code> integration. ' +
            'Cited in: <a href="#/tutorial">Tutorial · mlr3 workflow</a>.</div>' +
          '</li>' +
          '<li id="ref-ranger">' +
            '<div class="ref-cite">Wright MN, Ziegler A. ranger: A Fast Implementation of Random Forests for High Dimensional Data in C++ and R. <em>Journal of Open Source Software</em> 2017;2(18):805.</div>' +
            '<div class="ref-links"><a href="https://doi.org/10.21105/joss.00805" target="_blank" rel="noopener">doi:10.21105/joss.00805</a></div>' +
            '<div class="ref-use"><strong>Used for:</strong> the default base and second-stage ' +
            'learners (<code>regr.ranger</code> / <code>classif.ranger</code>). ' +
            'Cited in: <a href="#/guide">Architecture &amp; Quickstart</a>.</div>' +
          '</li>' +
          '<li id="ref-survlearners">' +
            '<div class="ref-cite">Cui Y, Demirel BB, Karaveli A, Li J, Shah NH, Tarkoma S, et al. survlearners: A CRAN-compliant R package for heterogeneous treatment effect estimation in survival analysis. <em>Journal of Open Source Software</em> 2024.</div>' +
            '<div class="ref-links"><a href="https://github.com/som-shahlab/survlearners" target="_blank" rel="noopener">GitHub: som-shahlab/survlearners</a> · GPL-3</div>' +
            '<div class="ref-use"><strong>Used for:</strong> the optional second survival engine, ' +
            '<code>engine = "survlearners"</code>. Published only on GitHub, so it sits in ' +
            '<code>Suggests</code> rather than <code>Imports</code>, with a clear message when not ' +
            'installed. ' +
            'Cited in: <a href="#/tutorial">Tutorial · choosing a survival engine</a>.</div>' +
          '</li>' +
          '</ol>'
      },

      {
        id: "interpretability",
        heading: "F. Model interpretability",
        body:
          '<p>Methodological sources for the interpretability module (<code>hte_explainer()</code> and companions), items [19]–[24].</p>' +
          '<ol class="ref-list" start="19">' +
          '<li id="ref-biecek2021"><div class="ref-cite">Biecek P, Burzykowski T. <em>Explanatory Model Analysis: Explore, Explain, and Examine Predictive Models</em>. Chapman and Hall/CRC, 2021.</div><div class="ref-links"><a href="https://ema.drwhy.ai/" target="_blank" rel="noopener">https://ema.drwhy.ai/</a></div><div class="ref-use"><strong>用途：</strong>The overall structure of the interpretability module (explainer, variable importance, partial dependence, SHAP) follows the terminology and order of this book. Cited in the <a href="#/apiexplain">interpretability module</a> and <a href="#/tutorialexplain">Tutorial · CATE interpretability</a>.</div></li>' +
          '<li id="ref-biecek2018"><div class="ref-cite">Biecek P. DALEX: Explainers for Complex Predictive Models in R. <em>Journal of Machine Learning Research</em> 2018;19(84):1–5.</div><div class="ref-links"><a href="https://jmlr.org/papers/v19/18-416.html" target="_blank" rel="noopener">https://jmlr.org/papers/v19/18-416.html</a></div><div class="ref-use"><strong>用途：</strong><code>hte_explainer()</code> calls <code>DALEX::explain()</code>; <code>hte_feature_importance()</code> wraps <code>model_parts()</code> and <code>hte_pdp()</code> wraps <code>model_profile()</code>. Cited in <a href="#/apiexplainer">hte_explainer()</a>.</div></li>' +
          '<li id="ref-molnar2022"><div class="ref-cite">Molnar C. <em>Interpretable Machine Learning: A Guide for Making Black Box Models Explainable</em>. 2nd ed., 2022.</div><div class="ref-links"><a href="https://christophm.github.io/interpretable-ml-book/" target="_blank" rel="noopener">https://christophm.github.io/interpretable-ml-book/</a></div><div class="ref-use"><strong>用途：</strong>The rationale for partial dependence and accumulated local effects, and the comparison between them under correlated covariates, follows Chapter 8 of this book. Cited in <a href="#/apipdp">hte_pdp()</a>.</div></li>' +
          '<li id="ref-lundberg2017"><div class="ref-cite">Lundberg SM, Lee SI. A Unified Approach to Interpreting Model Predictions. <em>Advances in Neural Information Processing Systems</em> 2017;30:4765–4774.</div><div class="ref-links"><a href="https://arxiv.org/abs/1705.07874" target="_blank" rel="noopener">https://arxiv.org/abs/1705.07874</a></div><div class="ref-use"><strong>用途：</strong>Source of the additive SHAP decomposition <code>phi_0 + sum(phi_j) = f(x)</code>, used here as the correctness check for <code>hte_shap()</code>. Cited in <a href="#/apishap">hte_shap()</a>.</div></li>' +
          '<li id="ref-covert2021"><div class="ref-cite">Covert I, Lee SI. Improving KernelSHAP: Practical Shapley Value Estimation Using Linear Regression. <em>AISTATS</em> 2021;130:3457–3465.</div><div class="ref-links"><a href="https://arxiv.org/abs/2012.01536" target="_blank" rel="noopener">https://arxiv.org/abs/2012.01536</a></div><div class="ref-use"><strong>用途：</strong>kernelshap, called by <code>hte_shap()</code>, uses the linear-regression approximation of this paper and switches from exact enumeration to sampling when covariates are numerous. Cited in <a href="#/apishap">hte_shap()</a>.</div></li>' +
          '<li id="ref-apley2020"><div class="ref-cite">Apley DW, Zhu J. Visualizing the Effects of Predictor Variables in Black Box Supervised Learning Models. <em>Journal of the Royal Statistical Society: Series B</em> 2020;82(4):1059–1086.</div><div class="ref-links"><a href="https://doi.org/10.1111/rssb.12377" target="_blank" rel="noopener">https://doi.org/10.1111/rssb.12377</a></div><div class="ref-use"><strong>用途：</strong>Source of accumulated local effects (ALE), which <code>hte_pdp(type = "accumulated")</code> substitutes for PDP when covariates are correlated. Cited in <a href="#/apipdp">hte_pdp()</a>.</div></li>' +
          '</ol>'
      },
      {
        id: "simulation",
        heading: "G. Simulation design and estimation methodology",
        body:
          '<p>Sources for the four-dimensional benchmark grid, cross-fitting and the RMST effect scale, items [25]–[27].</p>' +
          '<ol class="ref-list" start="25">' +
          '<li id="ref-kennedy2020"><div class="ref-cite">Kennedy EH. Towards Optimal Doubly Robust Estimation of Heterogeneous Causal Effects. <em>arXiv</em> 2020:2004.14497.</div><div class="ref-links"><a href="https://arxiv.org/abs/2004.14497" target="_blank" rel="noopener">https://arxiv.org/abs/2004.14497</a></div><div class="ref-use"><strong>用途：</strong>Source of the optimality results for the R-learner and pseudo-outcome regression, and of the argument for <strong>cross-fitting</strong> (nuisance parameters fitted on training folds, evaluated on held-out folds). The <code>cross_fitting = TRUE</code> option for R/DR and the default cross-fitting in <code>dr_pseudo_outcome()</code> follow from it. Cited in <a href="#/apimetalearner">metalearner()</a>.</div></li>' +
          '<li id="ref-uno2014"><div class="ref-cite">Uno H, Claggett B, Tian L, et al. Moving Beyond the Hazard Ratio in Quantifying the Between-Group Difference in Survival Analysis. <em>Journal of Clinical Oncology</em> 2014;32(22):2380–2385.</div><div class="ref-links"><a href="https://doi.org/10.1200/JCO.2013.52.5720" target="_blank" rel="noopener">https://doi.org/10.1200/JCO.2013.52.5720</a></div><div class="ref-use"><strong>用途：</strong>Introduces the RMST between-group difference and its clinical reading. The <code>effect = "rmst"</code> scale in the survival branch follows this definition, and <code>tau_rmst</code> / <code>ate_rmst</code> in the benchmark data are its ground truth. Cited in <a href="#/tutorialbenchgrid">Tutorial · benchmark grid</a>.</div></li>' +
          '<li id="ref-morris2019"><div class="ref-cite">Morris TP, White IR, Crowther MJ. Using Simulation Studies to Evaluate Statistical Methods. <em>Statistics in Medicine</em> 2019;38(11):2074–2102.</div><div class="ref-links"><a href="https://doi.org/10.1002/sim.8086" target="_blank" rel="noopener">https://doi.org/10.1002/sim.8086</a></div><div class="ref-use"><strong>用途：</strong>The ADEMP framework for simulation studies (Aims, Data-generating mechanisms, Estimands, Methods, Performance measures). The four dimensions of the benchmark grid and the convention of stratified rather than averaged reporting follow this framework. Cited in <a href="#/tutorialbenchgrid">Tutorial · benchmark grid</a>.</div></li>' +
          '</ol>'
      },
      {
        id: "cite-this",
        heading: "Citing this package",
        body:
          '<p>Version v0.2.0 (2026-10-21). If mlr3HTE contributes to your research, please cite it ' +
          'as follows:</p>' +
          '<pre><code class="r-out">Zhang K. mlr3HTE: Meta-Learners for Heterogeneous Treatment Effects in mlr3.\n' +
          'R package version 0.2.0, 2026.\n' +
          'URL: https://github.com/zhangkaicr/mlr3HTE</code></pre>' +
          '<p>BibTeX:</p>' +
          '<pre><code class="r-out">@Manual{mlr3HTE,\n' +
          '  title  = {mlr3HTE: Meta-Learners for Heterogeneous Treatment\n' +
          '            Effects in mlr3},\n' +
          '  author = {Zhang, Kai},\n' +
          '  year   = {2026},\n' +
          '  note   = {R package version 0.2.0},\n' +
          '  url    = {https://github.com/zhangkaicr/mlr3HTE}\n' +
          '}</code></pre>' +
          '<div class="callout"><div class="callout-title">A note on citation style</div>' +
          '<p>Entries follow the <strong>Vancouver style</strong> used by biomedical journals: ' +
          'Authors. Title. Journal. Year;Volume(Issue):Pages. Where a preprint year differs from ' +
          'the year of publication, the "used for" line says so explicitly ' +
          '(Kennedy 2020 → 2023; Maas 2022 → 2023); the source comments still carry the ' +
          'preprint year.</p></div>'
      }
    ]
  }
};
