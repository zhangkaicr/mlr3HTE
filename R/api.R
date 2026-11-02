# =====================================================================
# api.R -- Functional API (consistent with the teaching-code style of Course Module 3)
#
# metalearner() returns a full fitted object (with $predict / $ate / $cate_train / $models);
# s_learner()/t_learner()/... return the training-set CATE vector directly, for easy comparison with course scripts;
# ml_task() encodes the raw X/A/Y into an mlr3 Task for use by the R6 Learner.
#
# Three outcome types (auto-detected from learner_base's type, or set explicitly via outcome):
#   continuous  Y is numeric, paired with regr.* learners, CATE = E[Y|A=1] - E[Y|A=0]
#   binary      Y is 0/1 or a two-level factor, paired with classif.* learners, CATE = risk difference
#   survival    Y is a survival::Surv object. Two engines (via the engine argument):
#                 "native" (default) native "coxph"/"ranger" base learners (no mlr3proba dependency),
#                   CATE = survival-probability difference at t0, S1(t0) - S0(t0); all five families + RMST supported
#                 "survlearners" delegates to the survlearners package (Suggests, GitHub-only),
#                   S/T/X/R families + S(t0) difference, with built-in IPCW and R-family cross-fitting
# =====================================================================

#' Fit a metalearner and return an object that supports prediction
#'
#' @param type metalearner type: S / T / X / R / DR
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base Outcome-model base learner; its type must match the outcome: use regr.* for continuous,
#'   classif.* for binary, and "coxph"/"ranger" for survival (native implementation, no mlr3proba dependency);
#'   default is regr.ranger. You may pass a single learner (shared across all groups / stages, for backward compatibility)
#'   or a named list to specify a different learner per group / stage: T-Learner uses
#'   \code{list(treated = ..., control = ...)}; X-Learner uses
#'   \code{list(m1 = ..., m0 = ...)}. The S / R / DR learners and the survlearners engine accept only a single learner.
#' @param learner_tau Effect-stage regression learner; by default the regression-type learner_base is reused, otherwise
#'   regr.ranger (min.node.size = 50). For the X-Learner the two effect regressions can be specified separately via
#'   \code{list(tau1 = ..., tau0 = ...)}; for all other learners pass a single learner.
#' @param learner_ps Propensity score. Used only by X / R / DR; ignored by S / T (they are pure outcome regressions,
#'   achieving confounding control by conditioning on \code{X} which includes the confounders). Three forms:
#'   \describe{
#'     \item{mlr3 classification learner}{fitted internally; the default approach for observational data; when not
#'       supplied, \code{classif.log_reg} is used}
#'     \item{scalar}{a constant propensity score, for RCTs with a known randomization probability (e.g. \code{0.5}),
#'       also avoiding the noise of fitting one}
#'     \item{function}{a user-supplied \code{function(newX)}, e.g. wrapping an estimate produced by another package}
#'   }
#'   Note that the X-learner's \code{g(x)} blending, R's Robinson centering, and DR's AIPW pseudo-outcome
#'   all treat \code{e(x)} as a required input defined by the algorithm -- they are **not** toggleable confounding weights.
#' @param t0 Effect evaluation time point for survival outcomes; defaults to the median event time
#' @param outcome Outcome type: "auto"/"continuous"/"binary"/"survival"
#' @param effect Effect measure for survival outcomes: "survdiff" (survival-probability difference at t0, default)
#'   or "rmst" (restricted mean survival time difference at t0, RMST)
#' @param cross_fitting Whether R/DR perform cross-fitting (nuisance parameters are fitted on K training folds
#'   and pseudo-outcomes are computed on held-out folds); default FALSE
#' @param n_folds Number of cross-fitting folds; default 5
#' @param engine Estimation engine for survival outcomes: \code{"native"} (default, native coxph/ranger
#'   implementation, all five families supported, with RMST and arbitrary mlr3 base learners) or \code{"survlearners"}
#'   (delegates to the GitHub package survlearners, supporting only the S/T/X/R families and the S(t0) difference scale;
#'   DR and RMST will raise an explicit error; an installation hint is also provided if the package is missing)
#' @details
#' Internally, every metalearner **fits one mlr3 model per stage and per machine-learning algorithm**,
#' with \code{mlr3} handling training, prediction, and (if enabled) cross-fitting; all of these models are kept in the
#' \code{$models} field of the returned object for inspection and reuse. The \code{$models} naming for each type is:
#' \describe{
#'   \item{S}{a single outcome model \code{m} (treatment as an ordinary feature, counterfactual subtraction)}
#'   \item{T}{\code{m1} (treated-group outcome model), \code{m0} (control-group outcome model)}
#'   \item{X}{\code{m1}, \code{m0} (two-stage imputed outcome models) and \code{tau1}, \code{tau0} (effect regressions)}
#'   \item{R}{\code{mu} (\eqn{E[Y|X]} model), \code{tau} (Robinson residual regression)}
#'   \item{DR}{\code{m1}, \code{m0} (two-group outcome models) and \code{tau} (doubly-robust pseudo-outcome regression)}
#' }
#' \code{learner_base} / \code{learner_tau} / \code{learner_ps} can be either a single mlr3 learner
#' (shared across stages) or a role-named list (see the respective arguments) so that each group / stage uses a different algorithm.
#' For example, a T-Learner can use \code{list(treated = lrn("regr.lm"), control = lrn("regr.ranger"))}
#' to give the two groups different models; an X-Learner can also use \code{list(tau1 = ..., tau0 = ...)} to separate the two effect regressions.
#'
#' @section Observational data and the design boundary around "weighting":
#' This package **does not provide** \code{weighting} / \code{weights} / \code{stabilize} arguments (removed since v0.40).
#' The reason: the classic metalearner literature (the X-learner of Künzel et al. 2019, PNAS, and CausalML's
#' BaseS / BaseT / BaseX) never applies inverse-probability weights to the S/T/X outcome models. Each learner handles
#' confounding differently, and each does so by construction:
#' \describe{
#'   \item{S / T / X}{relies on **putting the confounders into \code{X}** and conditioning on them via the outcome model.
#'     When a confounder is omitted, the bias equals that of the naive estimator -- no weighting can recover from it}
#'   \item{R}{Robinson residualization: both outcome and treatment are residualized on \code{X} before regression}
#'   \item{DR}{AIPW doubly-robust pseudo-outcome: consistent as long as \strong{one} of \code{(m1, m0)} or \code{e(x)} is correctly specified,
#'     the most robust choice under observational data}
#' }
#' A "single-robust" weighting that only re-estimates the outcome model is neither the literature's approach nor able to
#' deconfound on its own, so it is no longer retained. Survival outcomes additionally use **censoring IPCW** (multiplied onto the
#' individual outcome \code{I(T > t0)} when \code{effect = "survdiff"}), which is the estimator's standard handling of censoring,
#' not a user-toggleable option.
#'
#' @return A fitted object containing \code{$predict(newX)}, \code{$ate}, \code{$cate_train}, and \code{$models}
#'   (the fitted mlr3 models for each stage; see \code{@@details})
#' @seealso \code{\link{s_learner}}, \code{\link{ml_task}}
#' @export
#' @examples
#' # RCT: defaults suffice; no weighting needed
#' d <- mlr3HTE_demo_data(n = 500, seed = 1)
#' fit <- metalearner("T", d$X, d$A, d$Y, learner_base = mlr3::lrn("regr.lm"))
#' cor(fit$cate_train, d$tau)
#'
#' # Observational data: the DR-Learner fits the propensity score internally by default (doubly robust)
#' dobs <- mlr3HTE_demo_obs(n = 800, seed = 1)
#' fit_obs <- metalearner("DR", dobs$X, dobs$A, dobs$Y)
#' fit_obs$ate                     # compare against dobs$ate (true ATE)
#'
#' # For an RCT with a known randomization probability of 0.5, pass a constant propensity score to X/R/DR
#' fit_rct <- metalearner("X", d$X, d$A, d$Y, learner_ps = 0.5)
metalearner <- function(type, X, A, Y,
                        learner_base = mlr3::lrn("regr.ranger"),
                        learner_tau = NULL,
                        learner_ps = NULL,
                        t0 = NULL, outcome = "auto",
                        effect = "survdiff",
                        cross_fitting = FALSE, n_folds = 5L,
                        engine = "native") {
  ml_fit(type = type, X = X, A = A, Y = Y,
         learner_base = learner_base, learner_tau = learner_tau,
         learner_ps = learner_ps, t0 = t0, outcome = outcome, effect = effect,
         cross_fitting = cross_fitting, n_folds = n_folds, engine = engine)
}

#' Bootstrap confidence intervals for CATE / ATE
#'
#' Performs B bootstrap resamples of the whole fitting pipeline (sampling rows with replacement at the same sample size),
#' and reports pointwise CATE intervals and an ATE interval via the percentile method.
#'
#' Note: this is a **nonparametric bootstrap** that reflects only sampling variation, not model-specification bias;
#' each run refits the model, so the cost is non-trivial for large B (try a small B first).
#'
#' @param type metalearner type, or "auto" to reuse the type of the fit
#' @param X covariate data.frame
#' @param A treatment indicator
#' @param Y outcome
#' @param B number of bootstrap repetitions; default 100
#' @param level confidence level; default 0.95
#' @param seed random seed, for reproducibility
#' @param newX new data for which CATE intervals are needed; defaults to the training set X
#' @param ... other arguments passed to metalearner() (learner_base, t0, effect, etc.)
#' @return a list: cate_lo / cate_hi (pointwise CATE intervals), ate_lo / ate_hi,
#'   cate_mean, ate, B, level
#' @seealso \code{\link{metalearner}}
#' @export
#' @examples
#' \donttest{
#' d <- mlr3HTE_demo_data(n = 800, seed = 1)
#' ci <- cate_ci("T", d$X, d$A, d$Y, B = 50, seed = 1)
#' mean(ci$cate_mean); c(ci$ate_lo, ci$ate_hi)
#' }
cate_ci <- function(type, X, A, Y, B = 100L, level = 0.95, seed = NULL,
                    newX = NULL, ...) {
  X <- as.data.frame(X)
  n <- nrow(X)
  if (!is.null(seed)) set.seed(seed)
  if (is.null(newX)) newX <- X

  boot <- vector("list", B)
  ates <- numeric(B)
  for (b in seq_len(B)) {
    idx <- sample.int(n, size = n, replace = TRUE)
    fit <- ml_fit(type = type, X = X[idx, , drop = FALSE], A = A[idx],
                  Y = .subset_Y(Y, idx), ...)
    boot[[b]] <- as.numeric(fit$predict(newX))
    ates[b] <- fit$ate
  }
  M <- do.call(cbind, boot)                     # length(newX) x B
  a <- (1 - level) / 2
  probs <- c(a, 1 - a)
  q_cate <- t(apply(M, 1L, quantile, probs = probs, na.rm = TRUE))
  list(
    cate_lo   = as.numeric(q_cate[, 1L]),
    cate_hi   = as.numeric(q_cate[, 2L]),
    cate_mean = rowMeans(M, na.rm = TRUE),
    ate       = mean(ates),
    ate_lo    = unname(quantile(ates, probs = a, na.rm = TRUE)),
    ate_hi    = unname(quantile(ates, probs = 1 - a, na.rm = TRUE)),
    B = B, level = level
  )
}

# 各 learner 的便捷封装：直接返回训练集 CATE 向量（与课程脚本同款签名）
# 完整控制（含 $predict、$ate、$cate_train）请用 metalearner()。
#' S-Learner (convenience wrapper, returns the training-set CATE directly)
#'
#' @description Fit an S-Learner and return the CATE vector on the training set, for easy comparison with course scripts.
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base outcome-model base learner; default \code{regr.ranger}
#' @param ... other arguments passed to \code{\link{metalearner}} (\code{t0},
#'   \code{effect}, \code{cross_fitting}, etc.)
#' @return a per-sample CATE numeric vector on the training set
#' @seealso \code{\link{metalearner}}
#' @export
s_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("S", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' T-Learner (convenience wrapper, returns the training-set CATE directly)
#'
#' @description Fit a T-Learner and return the CATE vector on the training set.
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base outcome-model base learner; default \code{regr.ranger}
#' @param ... other arguments passed to \code{\link{metalearner}}
#' @return a per-sample CATE numeric vector on the training set
#' @seealso \code{\link{metalearner}}
#' @export
t_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("T", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' X-Learner (convenience wrapper, returns the training-set CATE directly)
#'
#' @description Fit an X-Learner and return the CATE vector on the training set.
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base outcome-model base learner; default \code{regr.ranger}
#' @param ... other arguments passed to \code{\link{metalearner}}
#' @return a per-sample CATE numeric vector on the training set
#' @seealso \code{\link{metalearner}}
#' @export
x_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("X", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' R-Learner (convenience wrapper, returns the training-set CATE directly)
#'
#' @description Fit an R-Learner and return the CATE vector on the training set.
#'   Cross-fitting can be enabled with \code{cross_fitting = TRUE}.
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base outcome-model base learner; default \code{regr.ranger}
#' @param ... other arguments passed to \code{\link{metalearner}}
#' @return a per-sample CATE numeric vector on the training set
#' @seealso \code{\link{metalearner}}
#' @export
r_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("R", X, A, Y, learner_base = learner_base, ...)$cate_train
}
#' DR-Learner (convenience wrapper, returns the training-set CATE directly)
#'
#' @description Fit a DR-Learner and return the CATE vector on the training set (doubly robust).
#'   Cross-fitting can be enabled with \code{cross_fitting = TRUE}.
#' @param X covariate data.frame (excluding treatment and outcome)
#' @param A treatment indicator (0/1, or logical)
#' @param Y outcome: continuous (numeric) / binary (0-1 or two-level factor) / survival (Surv object)
#' @param learner_base outcome-model base learner; default \code{regr.ranger}
#' @param ... other arguments passed to \code{\link{metalearner}}
#' @return a per-sample CATE numeric vector on the training set
#' @seealso \code{\link{metalearner}}
#' @export
dr_learner <- function(X, A, Y, learner_base = mlr3::lrn("regr.ranger"), ...) {
  ml_fit("DR", X, A, Y, learner_base = learner_base, ...)$cate_train
}

#' Encode the raw X/A/Y into an mlr3 Task ready to feed to lrn("regr.metalearner")
#'
#' An mlr3 Task's target column can only be a single numeric column, which cannot hold a Surv object, so the encoding is as follows:
#' \describe{
#'   \item{continuous / binary}{target column \code{.outcome} = Y (binary uses 0/1 numeric)}
#'   \item{survival}{target column \code{.outcome} = follow-up time, plus a feature column \code{.status} = event indicator}
#' }
#' The outcome type and (for survival) t0 are recorded in \code{task$extra_args}. Testing confirms this field survives
#' \code{clone(deep = TRUE)$filter()} and \code{serialize()/unserialize()},
#' so the metadata is not lost when \code{resample()} splits into folds.
#'
#' @param X covariate data.frame
#' @param A treatment indicator (0/1)
#' @param Y outcome (numeric / 0-1 / two-level factor / Surv object)
#' @param t0 effect evaluation time point for survival outcomes
#' @param id id of the Task
#' @param treatment_col name of the treatment column in the Task (default "A")
#' @return a \code{TaskRegr}, directly usable with \code{lrn("regr.metalearner")}
#' @seealso \code{\link{metalearner}}, \code{\link{LearnerRegrMetalearner}}
#' @export
ml_task <- function(X, A, Y, t0 = NULL, id = "ml_hte", treatment_col = "A") {
  X <- as.data.frame(X)
  A <- as.integer(A)
  if (nrow(X) != length(A)) stop("X 的行数与 A 的长度不一致。")
  if (treatment_col %in% names(X)) {
    stop(sprintf("协变量里已经有名为 '%s' 的列，请换个 treatment_col。", treatment_col))
  }

  outcome <- .resolve_outcome("auto", Y)
  d <- X
  d[[treatment_col]] <- A

  if (outcome == "survival") {
    d$.outcome <- as.numeric(Y[, 1L])
    d$.status  <- as.integer(Y[, 2L])
    extra <- list(
      ml_outcome = "survival", ml_status_col = ".status",
      ml_t0 = t0, ml_treatment_col = treatment_col
    )
  } else {
    d$.outcome <- if (is.factor(Y)) as.integer(Y == levels(Y)[2L]) else as.numeric(Y)
    extra <- list(
      ml_outcome = outcome, ml_status_col = NULL,
      ml_t0 = t0, ml_treatment_col = treatment_col
    )
  }
  task <- mlr3::as_task_regr(d, target = ".outcome", id = id)
  task$extra_args <- extra
  task
}

# 1 连续结局 RCT 演示数据（与课程模块三同款 DGP）------------------------------
# 真实 CATE: tau = 1.0 + 0.8*z1 - 0.5*z2 + 0.6*(z1>1 & z2<0)
# 真实基线均值: mu = 6 + 0.4*z1 + 0.5*z2 - 0.02*(age-60) + 0.3*sex
#' Demo data: continuous-outcome RCT
#'
#' @description Generate RCT demo data with a continuous outcome (by default treatment A is independent of covariates X, no confounding).
#'   The true CATE and ATE are returned alongside the data, for assessing the metalearner's fit quality.
#' @param n sample size; default 4000
#' @param treat_frac treated-group proportion; default 0.5
#' @param seed random seed
#' @return a list: X (covariates), A (treatment), Y (outcome), tau (true CATE vector), ate (true ATE)
#' @export
mlr3HTE_demo_data <- function(n = 4000, treat_frac = 0.5, seed = 1201) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 1.0 + 0.8 * z1 - 0.5 * z2 + 0.6 * (z1 > 1 & z2 < 0)
  mu  <- 6 + 0.4 * z1 + 0.5 * z2 - 0.02 * (age - 60) + 0.3 * sex
  A   <- rbinom(n, 1, treat_frac)
  Y   <- mu + A * tau + rnorm(n, 0, 1)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau))
}

# 2 二分类结局 RCT 演示数据 ----------------------------------------------------
# logit P(Y=1|A=0) = -1.2 + 0.5*z1 + 0.4*z2 + 0.1*(age-60)/12 + 0.2*sex
# 治疗在对数几率尺度上加 tau_logit = 0.6 + 0.5*z1 - 0.4*z2；
# 风险差尺度的真实 CATE 按基线概率逐一换算，随数据一并返回。
#' Demo data: binary-outcome RCT
#'
#' @description Generate RCT demo data with a binary outcome (no confounding). The treatment applies a
#'   heterogeneous effect on the log-odds scale; the true CATE on the risk-difference scale is converted from the baseline
#'   probabilities individually and returned with the data.
#' @param n sample size; default 4000
#' @param treat_frac treated-group proportion; default 0.5
#' @param seed random seed
#' @return a list: X, A, Y, tau (true CATE on the risk-difference scale), ate (true ATE)
#' @export
mlr3HTE_demo_binary <- function(n = 4000, treat_frac = 0.5, seed = 1202) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  p0 <- plogis(-1.2 + 0.5 * z1 + 0.4 * z2 + 0.1 * (age - 60) / 12 + 0.2 * sex)
  tau_logit <- 0.6 + 0.5 * z1 - 0.4 * z2
  p1 <- plogis(qlogis(p0) + tau_logit)
  tau <- p1 - p0                                   # 风险差尺度的真实 CATE
  A   <- rbinom(n, 1, treat_frac)
  Y   <- rbinom(n, 1, ifelse(A == 1L, p1, p0))
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau))
}

# 3 生存结局 RCT 演示数据 ------------------------------------------------------
# 指数基线风险，治疗把风险乘以 exp(-tau)，tau 随协变量变化；
# 效应度量 = t0 时点生存概率差。含随机关闭，删失比例约 15%。
#' Demo data: survival-outcome RCT
#'
#' @description Generate RCT demo data with a survival outcome (exponential baseline hazard, with about 15% independent censoring).
#'   The default effect measure is the survival-probability difference at t0, S1(t0) - S0(t0); the RMST version of the true effect
#'   is also returned (tau_rmst / ate_rmst).
#' @param n sample size; default 4000
#' @param treat_frac treated-group proportion; default 0.5
#' @param t0 effect evaluation time point; default 2
#' @param seed random seed
#' @return a list: X, A, Y (Surv object), tau (true CATE on the survival-probability-difference scale), ate,
#'   t0, tau_rmst, ate_rmst
#' @export
mlr3HTE_demo_surv <- function(n = 4000, treat_frac = 0.5, t0 = 2, seed = 1203) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 0.5 + 0.4 * z1 - 0.3 * z2                  # 对数风险尺度的异质性效应
  base_rate <- exp(-1.0 + 0.3 * z1 + 0.2 * z2 + 0.1 * (age - 60) / 12 + 0.15 * sex)
  A <- rbinom(n, 1, treat_frac)
  rate <- base_rate * exp(-A * tau)                 # 治疗把风险乘以 exp(-tau)
  T <- stats::rexp(n, rate = rate)
  C <- stats::rexp(n, rate = 0.12)                         # 独立删失
  time <- pmin(T, C)
  status <- as.integer(T <= C)

  s1 <- exp(-base_rate * exp(-tau) * t0)            # 无删失下的真实 S(t0|A=1,X)
  s0 <- exp(-base_rate * t0)                        # 无删失下的真实 S(t0|A=0,X)
  # 指数分布下 RMST(τ) = ∫₀^τ e^{-λu} du = (1 - e^{-λτ}) / λ
  rmst <- function(lam) (1 - exp(-lam * t0)) / lam
  lam0 <- base_rate
  lam1 <- base_rate * exp(-tau)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0,
       tau_rmst = rmst(lam1) - rmst(lam0),
       ate_rmst = mean(rmst(lam1) - rmst(lam0)))
}

# 4 观察性数据（连续结局 + 混杂）-----------------------------------------------
# 处理概率依赖协变量（confounding by indication）：病情越重越容易接受处理，
# 因此未调整的差分会偏离真实 ATE。强度由 strength 控制：0 = 与 RCT 等价
# （处理与协变量独立），越大混杂越强。
#' Demo data: continuous outcome + observational (confounding)
#'
#' @description Generate **observational** demo data with a continuous outcome, where the treatment probability depends on covariates
#'   (the sicker the patient, the more likely to be treated = confounding by indication), so the unadjusted difference deviates from the true ATE.
#'   The proper way to deconfound under observational data: S/T/X put the confounders into \code{X} and condition on them via the outcome model,
#'   the R-Learner uses Robinson residualization, and the DR-Learner uses AIPW doubly-robust estimation (most robust).
#'   The true propensity score \code{ps_true} is also returned for inspection.
#' @param n sample size; default 4000
#' @param strength confounding strength; default 1. When \code{0} the treatment probability is independent of covariates (equivalent to an RCT),
#'   larger values mean stronger confounding; used to scan estimator performance under varying confounding strength
#' @param seed random seed
#' @return a list: X, A, Y, tau (true CATE), ate (true ATE), ps_true (true propensity score)
#' @export
mlr3HTE_demo_obs <- function(n = 4000, strength = 1, seed = 1204) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 1.0 + 0.8 * z1 - 0.5 * z2 + 0.6 * (z1 > 1 & z2 < 0)
  mu  <- 6 + 0.4 * z1 + 0.5 * z2 - 0.02 * (age - 60) + 0.3 * sex
  e <- plogis(-0.5 + strength * (0.8 * z1 + 0.4 * z2))   # 处理概率随病情上升
  A <- rbinom(n, 1, e)
  Y <- mu + A * tau + rnorm(n, 0, 1)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau), ps_true = e)
}

# 5 观察性数据（二分类结局 + 混杂）---------------------------------------------
# 与 mlr3HTE_demo_obs 同一套混杂结构（病情越重越容易接受处理），
# 结局换成二分类：治疗在对数几率尺度上加 tau_logit，
# 风险差尺度的真实 CATE 按基线概率逐一换算。
#' Demo data: binary outcome + observational (confounding)
#'
#' @description Same confounding structure as \code{\link{mlr3HTE_demo_obs}} (the sicker the patient, the more likely to be treated),
#'   but with a binary outcome. The true CATE on the risk-difference scale is returned with the data, along with \code{ps_true}.
#' @param n sample size; default 4000
#' @param strength confounding strength; default 1; \code{0} is equivalent to an RCT
#' @param seed random seed
#' @return a list: X, A, Y, tau (true CATE on the risk-difference scale), ate (true ATE), ps_true
#' @export
mlr3HTE_demo_obs_binary <- function(n = 4000, strength = 1, seed = 1205) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  p0 <- plogis(-1.2 + 0.5 * z1 + 0.4 * z2 + 0.1 * (age - 60) / 12 + 0.2 * sex)
  tau_logit <- 0.6 + 0.5 * z1 - 0.4 * z2
  p1 <- plogis(qlogis(p0) + tau_logit)
  tau <- p1 - p0                                   # 风险差尺度的真实 CATE
  e <- plogis(-0.5 + strength * (0.8 * z1 + 0.4 * z2))  # 处理概率随病情上升
  A <- rbinom(n, 1, e)
  Y <- rbinom(n, 1, ifelse(A == 1L, p1, p0))
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = Y, tau = tau, ate = mean(tau), ps_true = e)
}

# 6 观察性数据（生存结局 + 混杂）-----------------------------------------------
# 同一套混杂结构，结局换成生存时间；效应度量 = t0 时点生存概率差。
#' Demo data: survival outcome + observational (confounding)
#'
#' @description Same confounding structure as \code{\link{mlr3HTE_demo_obs}}, but with a survival-time outcome.
#'   The default effect measure is the survival-probability difference at t0; the RMST version of the true effect and \code{ps_true} are also returned.
#' @param n sample size; default 4000
#' @param t0 effect evaluation time point; default 2
#' @param strength confounding strength; default 1; \code{0} is equivalent to an RCT
#' @param seed random seed
#' @return a list: X, A, Y (Surv object), tau (true CATE on the survival-probability-difference scale), ate, t0,
#'   ps_true, tau_rmst, ate_rmst
#' @export
mlr3HTE_demo_obs_surv <- function(n = 4000, t0 = 2, strength = 1, seed = 1206) {
  set.seed(seed)
  age   <- rnorm(n, 60, 12)
  lac   <- rnorm(n, 2.5, 1.2)
  tumor <- rnorm(n, 5, 2)
  sex   <- rbinom(n, 1, 0.45)
  z1 <- scale(lac)[, 1]
  z2 <- scale(tumor)[, 1]
  tau <- 0.5 + 0.4 * z1 - 0.3 * z2                  # 对数风险尺度的异质性效应
  base_rate <- exp(-1.0 + 0.3 * z1 + 0.2 * z2 + 0.1 * (age - 60) / 12 + 0.15 * sex)
  e <- plogis(-0.5 + strength * (0.8 * z1 + 0.4 * z2))
  A <- rbinom(n, 1, e)
  rate <- base_rate * exp(-A * tau)
  T <- stats::rexp(n, rate = rate)
  C <- stats::rexp(n, rate = 0.12)                         # 独立删失
  time <- pmin(T, C)
  status <- as.integer(T <= C)

  s1 <- exp(-base_rate * exp(-tau) * t0)
  s0 <- exp(-base_rate * t0)
  # 指数分布下 RMST(τ) = ∫₀^τ e^{-λu} du = (1 - e^{-λτ}) / λ
  rmst <- function(lam) (1 - exp(-lam * t0)) / lam
  lam0 <- base_rate
  lam1 <- base_rate * exp(-tau)
  list(X = data.frame(age = age, lac = lac, tumor = tumor, sex = sex),
       A = A, Y = survival::Surv(time, status),
       tau = s1 - s0, ate = mean(s1 - s0), t0 = t0, ps_true = e,
       tau_rmst = rmst(lam1) - rmst(lam0),
       ate_rmst = mean(rmst(lam1) - rmst(lam0)))
}
