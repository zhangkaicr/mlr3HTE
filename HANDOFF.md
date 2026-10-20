# mlr3HTE 交接说明（2026-10-20，首版 + 配套教程 + GitHub 与文档站）

包位置：`D:\Project\mlr3_HTE\mlr3HTE\`，使用说明见包内 `README.md`，
教程见 `tutorial/00_教程.md` + `tutorial/code/` 下 8 个脚本。

| | 地址 |
|---|---|
| GitHub 仓库 | <https://github.com/zhangkaicr/mlr3HTE> |
| 双语教程站 | <https://zhangkaicr.github.io/mlr3HTE/> |

## 零、仓库与文档站

- 仓库 `zhangkaicr/mlr3HTE`（公开），分支 `main`，首推 commit `0547bc5`，共 40 个文件。
  **`ref/`（194M 课程资料）未上传**——它是 `mlr3HTE/` 的同级目录，且已在用户确认下排除。
- GitHub Pages：**已开启**，从 `main` 分支的 `/docs` 目录发布，站点 HTTP 200 已验证可访问。
- 文档站 `docs/`：纯静态、无构建步骤、无 npm 依赖。
  - `index.html` 外壳 + `assets/css/style.css`（CSS 变量切主题）+ `assets/js/app.js`
  - 内容分 5 个 JS 文件（home / guide / tutorial / api / changelog），
    每个页面同时有 `zh` 与 `en` 两份，**两版的小节 id 完全一致**（切换语言不会丢锚点）
  - 功能：哈希路由、中英切换、明暗主题（首次跟随系统，之后记 localStorage）、
    全局搜索（6.7 万字正文压平建索引，词频打分 + 片段高亮，`/` 聚焦）
  - 因内容写在 JS 里而非 `fetch` JSON，本地 `file://` 直接打开也能用

维护提示：改文档只需编辑 `docs/assets/js/content-*.js`，**中英两版要同步改**，
且新增小节时两版的 `id` 必须同名。

## 一、交付状态

首版功能已全部实现并验证通过：

| 能力 | 状态 |
|---|---|
| 连续结局 + RCT + S/T/X/R/DR 五种 | ✅ |
| 二分类结局（风险差尺度）+ 五种 | ✅ |
| 生存结局（t0 生存概率差）+ 五种 | ✅ |
| 观察性数据：内部 IPTW / 外部权重 | ✅ |
| 函数式 API `metalearner()` + `*_learner()` 便捷封装 | ✅ |
| R6 Learner `lrn("regr.metalearner")`，三类结局通用 | ✅ |
| `resample()` / `benchmark()` / `tune()` 集成 | ✅ |
| `ml_task()` Task 编码辅助函数 | ✅ |
| testthat 测试 117 个 | ✅ 全过（FAIL 0） |
| README + renv.lock | ✅ |
| 配套教程：三类结局 × 随机/观察性 6 格 | ✅ 主文档 + 8 个脚本，全部实跑通过 |
| 观察性的二分类 / 生存演示数据 | ✅ `mlr3HTE_demo_obs_binary()` / `mlr3HTE_demo_obs_surv()` |
| roxygen2 `man/`（15 个 .Rd）+ R6 类文档 | ✅ 由 roxygen2 8.1.1 生成，NAMESPACE 同步 |
| 生存 `effect = "rmst"`（限制平均生存时间差） | ✅ `metalearner(..., effect = "rmst", t0 = ...)` |
| R/DR 交叉拟合 `cross_fitting = TRUE` | ✅ K 折 out-of-fold 拟合伪结果，降过拟合偏倚 |
| CATE 不确定性量化 `cate_ci()` | ✅ bootstrap 给出 ATE 点估计 + CI，及可选逐样本 CATE CI |
| `.onLoad` 修复：强制 `loadNamespace("mlr3learners")` | ✅ 否则 `regr.ranger`/`classif.ranger` 未注册，默认 learner 报 "not found" |

验证结果（冒烟测试 1/2/3 均 exit 0）：

- 连续 RCT（n=4000，真值 ATE=1.048）：S/T/X 的 CATE 相关 0.85-0.96，X 的 RMSE 0.30
- 二分类 RCT（真值 ATE=0.130）：五种 ATE 0.074-0.107，X 相关 0.78
- 生存 RCT（真值 ATE=0.152，删失 29%）：T 相关 0.99 / RMSE 0.026，X 相关 0.87
- 观察性（真值 1.046，未调整差分会 1.790）：IPTW 后 S/T/X/DR 均回到 1.03-1.07

## 二、架构

单一引擎 `R/engine.R`，核心抽象是**结局模型**：`.fit_outcome()` 统一返回
`predict(newX)`，连续 = `E[Y|X]`、二分类 = `P(Y=1|X)`、生存 = `S(t0|X)`。
五种 metalearner 的公式因此与结局类型无关，写一次通吃三类结局。

```
R/
  aaa.R            .onLoad 注册 + .metalearner_registry 模型登记处
  survival_base.R  原生生存基学习器（coxph/ranger）+ 删失 IPCW
  engine.R         引擎：结局模型抽象 + 五种 metalearner + 调度器
  api.R            函数式 API + ml_task() + 4 个演示数据集
  learner.R        R6 Learner lrn("regr.metalearner")
smoke_test.R / 2 / 3    三条冒烟测试
tests/testthat/         test-engine.R / test-learner.R / test-ml_task.R
```

## 三、踩过的坑（新增部分）

9. **classif 学习器的 `predict_type` 必须在 `$train()` 之前设成 `"prob"`。**
   默认是 `"response"`，`$prob` 为 NULL；训练后再改会触发
   `check_prediction_data` 的 `Must be of type 'matrix', not 'factor'` 断言。
   `.fit_classif()` 与 `.fit_ps()` 两处都中过招。
10. **`learner_tau` 不能沿用 `learner_base`。** X/R/DR 的第二阶段是对**伪结果**
    回归，噪声结构与结局模型完全不同。ranger 回归默认 `min.node.size = 5`，
    树太深会把伪结果里的噪声也拟合进去——实测 R/DR 的 CATE 相关从 0.9 掉到 0.2。
    现在 `learner_tau = NULL` 时单独建 `min.node.size = 50` 的 ranger，
    相关恢复到 0.9+。生存 R/DR 若换 `lrn("regr.lm")` 更好（真值近线性、噪声大时线性模型更稳）。
11. **renv 激活会搞坏加载。** 本机只有单一系统库，`renv::activate()` 后没有
    `renv/library/`，`.Rprofile` 一激活就找不到 `pkgload` 等包。
    现已 `renv::deactivate()`，保留 `renv.lock` 作版本快照（README 已注明）。
12. **生存 R/DR 的 CATE 不受 `[-1,1]` 约束**（二阶段回归无尺度限制），
    个别点会越界；S/T 的 CATE 是两个生存概率之差，严格有界。测试断言已按此区分。
13. **`.surv_at_t0()` 里不能用 `ifelse(idx >= 1, surv_mat[, idx], 1)`。**
    `idx` 是标量，`ifelse` 的返回形状跟随 `test`，标量 test 只返回第一个元素
    → 所有样本拿到同一个预测值，ranger 生存分支的 CATE 方差变成 0、
    ATE 甚至能给出 −0.119 的错误符号（真值 +0.152）。
    改成普通分支 + 整列取值 `surv_mat[, idx]` 后恢复。已加回归测试。
14. **mlr3 的 learner `id` 只允许字母数字与 `._-`，不能用中文**，
    `lrn("regr.metalearner", id = "mm_生存")` 会报错。
15. **`bm$score()` 是 data.table**，脚本里若没显式 `library(data.table)`，
    `[.data.table` 的 `.()` 语法不生效（只打印表头、没有数据行）。
    教程脚本统一用 `as.data.frame(bm$score())[...]`。
16. **Git Bash 下 `Rscript /tmp/xxx.R` 路径映射有问题**（空输出 + exit 1），
    临时脚本要放在包目录内再跑。
17. **`.onLoad` 必须显式 `loadNamespace("mlr3learners")`。** mlr3HTE 只在 `Imports`
    里惰性加载 mlr3learners、自身从不直接调用 `mlr3learners::*`，于是它的 `.onLoad`
    不会自动跑，`regr.ranger` / `classif.ranger` 等 learner 就没注册进 `mlr_learners`
    词典 —— 用默认 learner 会报 `not found in DictionaryLearner`。在 `R/aaa.R` 的
    `.onLoad` 里补一句 `loadNamespace("mlr3learners")` 即可。
18. **中文报错信息在非 UTF-8 locale 下会被 R 转成 `<U+XXXX>` 转义**，导致 `testthat`
    的 `expect_error(expr, "中文")` 里 `grepl` 字节匹配失败（本沙箱 `LC_CTYPE=C.UTF-8`
    设置失败、回退到 C 单字节 locale 时必现；UTF-8 机器 / CI 无此问题）。
    4 条输入校验测试已改用报错信息里**本来就有的 ASCII 标记**（`"classif"` /
    `"weights"` / `"survival"` / `"treatment_col"`）做匹配，保证任意 locale 都稳过。

## 三之二、mlr3proba：已彻底移除（2026-10-20）

**用户决定：生存分支不再依赖 mlr3proba。** 已完成的清理：

| 位置 | 改动 |
|---|---|
| `R/survival_base.R` | 删除 `.fit_surv_mlr3()`（该函数盲写、从未实测）；文件头改为「完全不依赖 mlr3proba」 |
| `R/engine.R` `.lb_kind()` | 删除 `LearnerSurv` 分支；传 `lrn("surv.*")` 现在会**明确报错**并提示改用 `"coxph"`/`"ranger"` |
| `R/engine.R` `.check_outcome_kind()` | 生存只接受 `"surv_native"` |
| `R/engine.R` `.fit_outcome()` | 删掉 `.fit_surv_mlr3` 调用，生存只走 `.fit_surv` |
| `DESCRIPTION` | Description 明确写 "no 'mlr3proba' dependency" |
| `README` / `tutorial/00_教程.md` / `code/05` | 文案全部改为「原生实现，不依赖 mlr3proba」 |
| `tests/testthat/test-engine.R` | 新增一条：生存结局只接受 `coxph`/`ranger`，其他基学习器报错 |

验证：119 个测试全过；`smoke_test2/3` + 教程 `05/06/07` 全部 exit 0。

**连带清理已完成**（同日）：

- 删除 `D:\Project\mlr3_HTE\_src\`（当初下载的 mlr3proba/distr6/set6/param6/ooplah/dictionar6 源码）
- 从系统库移除当初装上的三个包：`ooplah` 0.2.0、`dictionar6` 0.1.3、`set6` 0.2.6
  （后台那次 `R CMD INSTALL` 最后其实把 set6 装上了，所以是三个不是两个）

清理后回归验证：119 个测试全过；`smoke_test.R/2/3` 全 OK；
教程 `01..08` 八个脚本全 exit 0。mlr3HTE 自身依赖（mlr3 1.8.0、mlr3learners 0.16.0、
paradox 1.0.1、R6、data.table、survival、ranger、testthat）全部健在。

## 四、可继续做的 / 已收尾（2026-10-20 续）

1. **`R CMD check` 全量检查**——本沙箱环境限制：
   - 已通过的结构检查：`R CMD build` 干净；`can be installed` / `package namespace` /
     `dependencies` / `DESCRIPTION meta-information`（需 `LC_ALL=C`，见坑 18）/ `encoding: UTF-8`
     全部 OK。
   - 卡住的部分：examples / tests 执行需要隔离的临时库，本沙箱对 NTFS reparse-point（junction）
     的创建不稳定，且 CRAN 索引下载被网络拦截，导致 check 子进程挂起。
   - **在用户的 UTF-8 机器或 CI（ubuntu）上可完整跑通**：测试已做成 locale-robust（见坑 18），
     纯 R 部分 `devtools::check(vignettes = FALSE, manual = FALSE)` 应无 ERROR/WARNING。
2. ~~roxygen2 生成 `man/`~~ ✅ 已完成（15 个 .Rd + R6 类文档，NAMESPACE 同步）。
3. ~~`mlr3HTE_demo_binary/surv` 的观察性版本~~ ✅ 已完成（`demo_obs_binary` / `demo_obs_surv`）。
4. ~~生存 `effect = "rmst"`~~ ✅ 已完成。
5. ~~R/DR 交叉拟合~~ ✅ 已完成（`cross_fitting = TRUE`）。

> 注：`cate_ci()`（CATE 不确定性量化，bootstrap ATE/分位 CI）此前已实现并导出，
> 本次补了 roxygen 文档与 `\donttest` 示例，一并随 `man/` 入库。

## 五、环境

- R 4.5.1；mlr3 1.8.0；paradox 1.0.1；mlr3learners / R6 / data.table / survival 在
- **不依赖 mlr3proba**（2026-10-20 起彻底移除）：生存基学习器为原生 `"coxph"` / `"ranger"`
- Git Bash 跑 Rscript 必须 `env -u LC_ALL -u LANG -u LC_CTYPE`
