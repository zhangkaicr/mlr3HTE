<p align="center"><a href="README.md">🇨🇳 简体中文</a> · <a href="README_EN.md">🌐 English</a></p>

<p align="center">
  <img src="docs/assets/img/social-preview.png" alt="mlr3HTE cover: potential outcomes converge then diverge by treatment vs control" width="720">
</p>

# mlr3HTE <a href="https://zhangkaicr.github.io/mlr3HTE/"><img src="docs/assets/img/logo.png" alt="mlr3HTE package logo" align="right" height="138" /></a>

<p>
  <a href="https://github.com/zhangkaicr/mlr3HTE/actions/workflows/R-CMD-check.yaml"><img src="https://github.com/zhangkaicr/mlr3HTE/actions/workflows/R-CMD-check.yaml/badge.svg" alt="R-CMD-check" height="20" /></a>
  <a href="https://zhangkaicr.github.io/mlr3HTE/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-blue.svg" alt="Bilingual docs site" height="20" /></a>
  <img src="https://img.shields.io/badge/lifecycle-experimental-orange.svg" alt="Lifecycle: experimental" height="20" />
  <img src="https://img.shields.io/badge/outcomes-continuous%20%2F%20binary%20%2F%20survival-brightgreen.svg" alt="Outcome types: continuous / binary / survival" height="20" />
</p>

> **Repository**: <https://github.com/zhangkaicr/mlr3HTE>
> **Bilingual tutorial site (with search / language toggle / light-dark theme)**: <https://zhangkaicr.github.io/mlr3HTE/>

`mlr3HTE` is an mlr3-based package for estimating heterogeneous treatment effects (HTE / CATE).
It turns the S- / T- / X- / R- / DR-learners from Course Module 3 into properly installable mlr3 learners.

**Coverage**

| Dimension | Supported |
|---|---|
| Outcome type | Continuous (mean difference), binary (risk difference), survival (survival-probability difference at t0) |
| Data type | Randomized trial (RCT), observational data (IPTW or external weights) |
| metalearner | S, T, X, R, DR (five families) |
| Interface | Functional API + mlr3 R6 Learner (plugs into `resample` / `benchmark` / `tune`) |

There is only one engine: the formulas of the five metalearners are outcome-agnostic — they all talk to
each other through an "outcome model": `predict(newX)` returns `E[Y|X]` for continuous outcomes,
`P(Y=1|X)` for binary outcomes, and `S(t0|X)` for survival outcomes.

> **Why build on mlr3? — swap the base learner whenever you like.**
> The five metalearners are just "recipes"; the real work is done by the base learner. Because
> `metalearner()` consumes `lrn()` objects directly, **switching from random forest to XGBoost,
> GLMnet, kNN, SVM … is a one-liner — `learner_base = lrn("regr.xgboost")` — and every other line
> of code, the interface, and the workflow stay untouched**:
>
> ```r
> fit <- metalearner("T", X, A, Y, learner_base = lrn("regr.ranger"))   # random forest
> fit <- metalearner("T", X, A, Y, learner_base = lrn("regr.xgboost"))  # XGBoost
> fit <- metalearner("T", X, A, Y, learner_base = lrn("regr.glmnet"))   # Lasso
> fit <- metalearner("T", X, A, Y, learner_base = lrn("regr.lm"))       # linear regression
> ```
>
> The full set of mlr3 learners (`ranger` / `xgboost` / `glmnet` / `kknn` / `svm` / `nnet` / `rpart` / `lm` …)
> and the tuning / resampling / benchmarking workflows (`tune` / `resample` / `benchmark`) come along for free.
> This is the core payoff of building on mlr3 instead of hand-rolling a training pipeline — see the tutorial
> section ["Swap base learners: pick any algorithm from the mlr3 ecosystem"](https://zhangkaicr.github.io/mlr3HTE/#/tutorial).

---

## 1 Installation and loading

Install from GitHub (recommended: `pak`, which resolves and installs all dependencies automatically;
`remotes` also works):

```r
# Option 1: pak (fast dependency resolution, parallel downloads — recommended)
pak::pak("zhangkaicr/mlr3HTE")

# Option 2: remotes
remotes::install_github("zhangkaicr/mlr3HTE")
```

During development you can also load the source directly:

```r
pkgload::load_all(".")      # development
# or, after installation
library(mlr3HTE)
```

> **`lrn()` is already available directly from `mlr3HTE`** — this package re-exports `mlr3::lrn()`,
> so every example below only needs `library(mlr3HTE)` and no extra `library(mlr3)`.
> However, the mlr3 workflow functions `resample()` / `benchmark()` / `rsmp()` are NOT re-exported;
> when using the R6 Learner path you must add `library(mlr3)` yourself.

Dependencies (all listed in `DESCRIPTION` → `Imports`, installed automatically, no manual step needed):
`mlr3`, `mlr3learners`, `paradox`, `R6`, `survival`, `ranger`, `dplyr`, `cli`.
Of these **`ranger` is a required dependency** — the package's default base learner is `regr.ranger`,
and every tutorial uses it (earlier docs saying "ranger is optional" have been corrected).
`testthat` is in `Suggests` and only needed to run the tests.

> **The survival branch has zero `mlr3proba` dependency.** Base learners are specified as strings:
> `"coxph"` (default, `survival::coxph`) or `"ranger"` (the `ranger` package, already installed via `Imports`).
> Passing `lrn("surv.*")` is explicitly rejected with a clear message — that would require mlr3proba,
> which this package does not pull in.

---

## 2 Functional API

### 2.1 Continuous outcome (RCT)

```r
set.seed(1)
d <- mlr3HTE_demo_data(n = 4000)

fit <- metalearner("T", d$X, d$A, d$Y,
                   learner_base = lrn("regr.ranger", num.trees = 300, seed = 1))
fit$ate            # ATE estimate
fit$cate_train     # CATE for each training observation
fit$predict(d$X)   # CATE on new data
```

### 2.2 Binary outcome (risk-difference scale)

```r
db <- mlr3HTE_demo_binary(n = 4000)

fit <- metalearner("T", db$X, db$A, db$Y,
                   learner_base = lrn("classif.ranger", num.trees = 300, seed = 1))
fit$ate            # average risk difference
```

### 2.3 Survival outcome (survival-probability difference at t0)

```r
ds <- mlr3HTE_demo_surv(n = 4000, t0 = 2)

fit <- metalearner("T", ds$X, ds$A, ds$Y,
                   learner_base = "coxph",   # or "ranger", both native implementations
                   t0 = 2)
fit$ate            # average S1(2) - S0(2)
```

When `t0` is omitted it defaults to the median event time. Censoring is handled in two parts:
the survival models of S/T already handle it correctly in the likelihood; X/R/DR need individual-scale
outcomes (using `I(T > t0)`) and then multiply by the censoring IPCW weight.

Survival outcomes have two engines (`engine` argument, default `"native"`, zero behavioral change):

```r
# Engine 2: survlearners (a GitHub package, install first; supports only S/T/X/R and S(t0) difference)
remotes::install_github("som-shahlab/survlearners", subdir = "r-package/survlearners")
fit <- metalearner("X", ds$X, ds$A, ds$Y, learner_base = "grf",
                   t0 = 2, engine = "survlearners")
```

| | `"native"` (default) | `"survlearners"` |
|---|---|---|
| metalearner | S/T/X/R/DR (five families) | S/T/X/R (no DR) |
| Effect scale | S(t0) diff + RMST diff | S(t0) diff only |
| Base learner | `"coxph"`/`"ranger"` + any mlr3 learner | `"coxph"`/`"grf"`/`"lasso"` (`"ranger"` is a grf alias) |
| Dependency | zero extra | requires survlearners (listed in Suggests) |

Note: survlearners' `T-coxph` combination has a systematic bias in practice (it multiplies the
uncentered baseline cumulative hazard by the centered `predict(type="risk")`). See tutorial 09 for details;
to use Cox for a T-learner, prefer the native engine.

### 2.4 Observational data

```r
do <- mlr3HTE_demo_obs(n = 4000)

# Option 1: fit propensity score internally for IPTW
fit <- metalearner("X", do$X, do$A, do$Y,
                   learner_base = lrn("regr.ranger"),
                   weighting = "iptw", stabilize = TRUE)

# Option 2: use your own pre-computed weights
fit <- metalearner("DR", do$X, do$A, do$Y, weighting = "external",
                   weights = my_weights)
```

### 2.5 Convenience wrappers

The `*_learner()` family mirrors the course-script signatures and returns the training-set CATE vector directly:

```r
s_learner(X, A, Y, learner_base = lrn("regr.ranger"))
t_learner(X, A, Y, learner_base = lrn("regr.ranger"))
x_learner(...); r_learner(...); dr_learner(...)
```

---

## 3 R6 Learner (plug into the mlr3 workflow)

Use `ml_task()` to encode the raw data into a Task, then hand it to `lrn("regr.metalearner")`:

```r
task <- ml_task(d$X, d$A, d$Y)                  # continuous / binary / survival, all in one
l    <- lrn("regr.metalearner", metalearner = "T")
l$learner_base <- lrn("regr.ranger", num.trees = 300, seed = 1)

l$train(task)
l$predict(task)$response                       # CATE

# Plug into the mlr3 workflow
resample(task, l, rsmp("cv", folds = 5))
benchmark(benchmark_grid(task,
           list(lrn("regr.metalearner", id = "T", metalearner = "T"),
                lrn("regr.metalearner", id = "X", metalearner = "X")),
           rsmp("cv", folds = 5)))
```

Encoding conventions of `ml_task()` (because an mlr3 Task's target column cannot hold a `Surv` object):

| Outcome | Target column `.outcome` | Extra column |
|---|---|---|
| Continuous / binary | `Y` (binary takes 0/1) | — |
| Survival | Follow-up time | `.status` = event indicator |

The outcome type, status-column name, and `t0` are recorded in `task$extra_args`. This field was
verified to survive `clone(deep = TRUE)$filter()` and `serialize()/unserialize()`, so metadata is not
lost when `resample()` splits into folds.

**Mutable fields** (not params, because paradox's `p_uty` cannot hold a Learner object):

| Field | Description |
|---|---|
| `learner_base` | Outcome-model base learner; type must match the outcome |
| `learner_tau` | Second-stage effect-regression learner; `NULL` uses the engine's regularized default |
| `learner_ps` | Propensity-score learner (used for IPTW, default `classif.log_reg`) |
| `treatment_col` | Treatment column name, default `"A"` |
| `t0` | Survival effect time point |
| `stabilize` | Whether IPTW uses stabilized weights |

**Tunable params** (`param_set`, usable in `tune()`): `metalearner` (S/T/X/R/DR),
`weighting` (none/iptw/external).

---

## 4 Methodological notes

| Learner | Formula | Remarks |
|---|---|---|
| S | One outcome model containing `A`, subtract counterfactual predictions | Most data-efficient, but if the base learner does not model interactions the CATE is near-constant |
| T | Fit one outcome model per arm, subtract predictions | Simple and robust; halves the sample size per arm |
| X | Impute individual effects, then fuse by `g(X)` | Performs well when the two arms are unbalanced (Künzel et al. 2019) |
| R | Robinson residualization `(Y - m(X))/(A - e(X))`, weighted regression by `(A-e)^2` | Nie & Wager 2021 |
| DR | Pseudo-outcome `psi = m1 - m0 + A(Y-m1)/e - (1-A)(Y-m0)/(1-e)`, then regress | Doubly robust (Kennedy 2020) |

**On the default `learner_tau`**: the second stage of X/R/DR regresses on a **pseudo-outcome** whose
noise structure is completely different from the outcome model (R/DR targets contain a `1/(A-e)` amplification).
ranger regression defaults to `min.node.size = 5`, which grows very deep trees and fits the pseudo-outcome's
noise too — empirically this drops R/DR CATE correlation from 0.9 to 0.2. Therefore, when
`learner_tau = NULL` the engine does **not** reuse `learner_base`; it builds a separate ranger with
`min.node.size = 50`. Override it for more flexibility; on survival R/DR, `learner_tau = lrn("regr.lm")`
is often better (large pseudo-outcome noise, near-linear truth → linear model is more stable).

**Known limitations**

- Survival R/DR CATE is the result of a two-stage regression and is **not bounded by the `[-1, 1]` probability
  scale**; individual points may go out of range. S/T CATE is the difference of two survival probabilities and is
  strictly bounded.
- Weights are implemented via **importance resampling** (mlr3 1.8's Task/Learner has no case-weights API),
  which introduces Monte-Carlo noise; call `set.seed()` before fitting if you need reproducible results.
- The survival branch's default `coxph` is a linear-prediction structure, so the S-learner struggles to capture
  heterogeneity (T/X are unaffected).

---

## 5 Scripts and files

```
R/
  aaa.R            .onLoad registration + .metalearner_registry model registry
  survival_base.R  native survival base learners (coxph/ranger) + censoring IPCW
  engine.R         engine: outcome-model abstraction + five metalearners + dispatcher
  api.R            functional API + ml_task() + 4 demo datasets
  learner.R        R6 Learner lrn("regr.metalearner")
smoke_test.R       continuous-outcome RCT smoke test
smoke_test2.R      binary / survival / observational smoke test
smoke_test3.R      R6 Learner three outcomes + resample smoke test
tests/testthat/   119 tests
```

Demo datasets (`*_obs_*` are observational versions with a true PS):

| Function | Outcome | Data | Truth returned with data |
|---|---|---|---|
| `mlr3HTE_demo_data()` | Continuous | RCT | `tau`, `ate` |
| `mlr3HTE_demo_binary()` | Binary | RCT | `tau`, `ate` |
| `mlr3HTE_demo_surv()` | Survival | RCT | `tau`, `ate`, `t0` |
| `mlr3HTE_demo_obs()` | Continuous | Observational | `tau`, `ate`, `ps_true` |
| `mlr3HTE_demo_obs_binary()` | Binary | Observational | `tau`, `ate`, `ps_true` |
| `mlr3HTE_demo_obs_surv()` | Survival | Observational | `tau`, `ate`, `ps_true` |

Each returns the true `tau`, which makes direct reconciliation easy — the most useful part for teaching.

## 5.5 Companion tutorial

**Online bilingual docs site**: <https://zhangkaicr.github.io/mlr3HTE/>
(global search, language toggle, light-dark theme; content kept in sync with this README)

Under `tutorial/` is the full tutorial, covering **three outcome types × randomized/observational** = 6 combinations:

- `tutorial/00_教程.md` — main document: unified architecture, 6-cell matrix, the five learner formulas and when to use which, tuning pitfalls (with table of contents and cross-reference tables)
- `tutorial/code/01..08_*.R` — 8 companion scripts, each with its own section outline, runnable independently

Run (from inside the `mlr3HTE/` directory):

```r
Rscript tutorial/code/01_连续结局_随机化RCT.R
```

| Script | Content |
|---|---|
| `01_连续结局_随机化RCT.R` | Continuous + RCT, five-learner reconciliation |
| `02_连续结局_观察性研究.R` | Continuous + observational, IPTW vs unadjusted |
| `03_二分类结局_随机化RCT.R` | Binary + RCT, risk-difference scale |
| `04_二分类结局_观察性研究.R` | Binary + observational |
| `05_生存结局_随机化RCT.R` | Survival + RCT, t0 survival-probability difference |
| `06_生存结局_观察性研究.R` | Survival + observational, IPTW × IPCW |
| `07_五种metalearner横向对比.R` | Three outcomes × five learners comparison table |
| `08_mlr3工作流集成.R` | `ml_task` + `resample` + `benchmark` |
| `09_生存结局_survlearners引擎.R` | Survival's second engine `engine = "survlearners"`, side-by-side with the native engine |
| `10_HTE评价指标.R` | Qini / c-for-benefit / TOC: model discrimination evaluation, with random-ordering control |
| `11_评价指标真值对账.R` | Use the known true `tau` as a ruler: decompose error into ranking loss and estimation noise; closed-form upper bound for c-for-benefit |
| `12_三类结局评价指标.R` | Run all three metrics on continuous / binary / survival; survival needs IPCW, and demonstrates the "fit-then-split" leakage |
| `13_换基学习器_基准对比.R` | **The core payoff of the mlr3 ecosystem**: swap base learners in one line (ranger / xgboost / glmnet / rpart / lm), and reuse `benchmark()` for side-by-side comparison |

---

## 6 Dependencies and runtime environment

The **dependency package versions** and **test environment** needed to reproduce every tutorial and test
result in this repository are detailed below (versions are the real values captured from the test
environment on 2026-10-21).

### 6.1 Test environment

| Item | Value |
|---|---|
| R version | 4.5.1 (2025-06-13 ucrt) |
| Platform | x86_64-w64-mingw32/x64 |
| OS | Windows 11 x64 (build 26200) |
| Locale | Requires `en_US.UTF-8` (LC_CTYPE) — under `LC_CTYPE=C`, R rewrites string constants when parsing source files containing UTF-8 bytes; this was a real pitfall encountered in this project |
| Test command | `Rscript -e 'Sys.setlocale("LC_CTYPE","en_US.UTF-8"); pkgload::load_all("."); testthat::test_local()'` |
| Test scale | 8 test files / 58 `test_that` blocks / 293 expectations, all passing |
| CI | GitHub Actions `R-CMD-check.yaml`, running on `ubuntu-latest` |

### 6.2 Direct dependencies (DESCRIPTION · Imports)

Resolved and installed automatically by `pak` / `remotes` when installing mlr3HTE; no manual step needed.

| Package | Version | Role |
|---|---|---|
| `mlr3` | 1.8.0 | Core framework: Task / Learner / resample / benchmark |
| `mlr3learners` | 0.16.0 | Base-learner registry (ranger, xgboost, glmnet, lm…) |
| `paradox` | 1.0.1 | Parameter space and tuning (tune) |
| `R6` | 2.6.1 | Object orientation (Learner subclass) |
| `survival` | 3.8-3 | Survival analysis basics (coxph, survfit) |
| `ranger` | 0.18.0 | Default base learner (random forest, with survival branch) |
| `dplyr` | 1.2.1 | Data wrangling |
| `cli` | 3.6.6 | Runtime messages and warnings |
| `ggplot2` | 4.0.3 | Result visualization |

### 6.3 Suggested dependencies (DESCRIPTION · Suggests)

Only needed to run tests, plot, or demonstrate in tutorials.

| Package | Version | Role |
|---|---|---|
| `testthat` | 3.3.2 | Unit testing (8 files / 58 blocks / 293 expectations) |
| `patchwork` | 1.3.2 | Multi-plot layout |
| `ggdag` | 0.2.13 | DAG plotting (tutorial diagrams) |
| `survlearners` | 0.0.1 | Survival-learner demo (optional) |
| `rcmdcheck` | (provided by CI) | R CMD check; not installed in the current environment, provided by GitHub Actions |

### 6.4 Full recursive dependency list (89 packages)

<details>
<summary>Expand all 89 packages (pkg@version)</summary>

- MASS@7.3-65
- Matrix@1.7-3
- MatrixModels@0.5-4
- R6@2.6.1
- Rcpp@1.1.2
- Rdpack@2.6.6
- S7@0.2.2
- askpass@1.2.1
- backports@1.5.1
- base64enc@0.1-6
- brio@1.1.5
- bslib@0.11.0
- cachem@1.1.0
- callr@3.7.6
- checkmate@2.3.4
- class@7.3-23
- cli@3.6.6
- colorspace@2.1-4
- covr@3.6.5
- curl@7.1.0
- data.table@1.18.4
- desc@1.4.3
- diffobj@0.3.9
- digest@0.6.39
- dplyr@1.2.1
- evaluate@1.0.5
- farver@2.1.2
- fastmap@1.2.0
- fontawesome@0.5.3
- forcats@1.0.1
- future@1.76.0
- future.apply@1.20.2
- generics@0.1.4
- ggdag@0.2.13
- ggforce@0.5.0
- ggplot2@4.0.3
- ggraph@2.2.2
- glue@1.8.1
- gridExtra@2.3
- gtable@0.3.6
- highr@0.12
- htmltools@0.5.9
- igraph@2.3.4
- isoband@0.3.0
- jquerylib@0.1.4
- jsonlite@2.0.0
- labeling@0.4.3
- lgr@0.5.2
- lifecycle@1.0.5
- magrittr@2.0.5
- memoise@2.0.1
- mgcv@1.9-3
- mlr3@1.8.0
- mlr3learners@0.16.0
- mlr3measures@1.3.0
- mlr3misc@0.23.0
- nlme@3.1-168
- nnet@7.3-20
- paradox@1.0.1
- patchwork@1.3.2
- pillar@1.11.1
- pkgload@1.5.3
- polyclip@1.10-7
- praise@1.0.0
- prettyunits@1.2.0
- processx@3.9.0
- ps@1.9.3
- purrr@1.2.2
- ranger@0.18.0
- rbibutils@2.4.1
- rematch2@2.1.2
- sass@0.4.10
- scales@1.4.0
- splines@4.5.1
- stringi@1.8.7
- stringr@1.6.0
- survival@3.8-3
- survlearners@0.0.1
- sys@3.4.3
- testthat@3.3.2
- tibble@3.3.1
- tidygraph@1.3.1
- uuid@1.2-2
- vctrs@0.7.3
- waldo@0.6.2
- withr@3.0.2
- xfun@0.57
- xml2@1.5.2
- yaml@2.3.12

</details>

### 6.5 Reproduction and version locking

- **Version locking**: `renv.lock` at the repository root records the exact versions of all dependencies;
  run `renv::restore()` then `pkgload::load_all('.')` to return to the environment listed in this section.
- **Live check**: run `sessionInfo()` in R to print the versions of all currently loaded packages.
- **Survival branch has no `mlr3proba` dependency**: base learners are specified as strings `"coxph"` / `"ranger"`, pulling in no extra packages.

### 6.6 Version-number rule: +0.01 on every push

The version number is a **two-decimal batch counter**, not a semantic three-part number: `0.20` → `0.21` → `0.22` → …,
each pushed update adds `0.01` (features, fixes, and pure docs are all treated alike).

When shipping a batch, four places must stay in sync:

| Location | Content |
|---|---|
| `DESCRIPTION` | `Version: 0.22` |
| `CHANGELOG.md` | New `## [0.22]` section at the top |
| `docs/assets/js/content-home.js` | `SITE_META.version` (read by the footer) |
| `docs/assets/js/content-changelog.js` | `lede`'s "current version" and the current section's `heading` |

The mechanical parts of the first two are handled by a script; the latter two still need a human:

```r
# Run at the package root: edits DESCRIPTION and SITE_META, and lists files still referencing the old version
Rscript dev/bump_version.R 0.22
```

`tests/testthat/test-version.R` asserts that `DESCRIPTION` and `SITE_META.version` agree and that both the
Chinese and English changelog ledes show the current version — if the version drifts again, CI goes red.
