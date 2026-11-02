# =====================================================================
# learner.R -- Parametric mlr3 Learner subclass ("A learner")
#
# A single Learner covers all metalearner types (S/T/X/R/DR) and outcome types
# (continuous / binary / survival), and slots seamlessly into resample() / benchmark() / tune().
# The propensity score serves only the algorithmic definitions of X/R/DR (g(x) blending / Robinson
# centering / AIPW pseudo-outcome), not as a toggleable weighting -- see metalearner()'s design-boundary note.
#
# The Task must be built with ml_task(): it encodes X/A/Y into a Task and writes the outcome type,
# the survival status column, and t0 into task$extra_args. This field has been verified to survive
# clone(deep = TRUE)$filter() and serialize()/unserialize(),
# so the metadata is not lost when resample splits into folds. (A Task has no extra field; custom
# col_roles are rejected by assert_names, so only extra_args is usable.)
#
# Encoding conventions (see ml_task):
#   target column .outcome = Y (continuous/binary) or follow-up time (survival)
#   for survival there is an extra feature column .status = event indicator, which must be dropped from covariates at fit time
#   the treatment column name is given by ml_treatment_col, default "A"
#
# mlr3 1.8 train/predict chain notes:
#   Learner$train(task) -> .__Learner__train -> learner_train
#     -> private$.train(task)   <-- the real training logic (also called directly by resample)
#   Learner$predict(task) -> .__Learner__predict -> learner_predict
#     -> private$.predict(task) <-- the real prediction logic
# Hence the hooks must live in private; overriding the public train/predict would replace
# .__Learner__train, leaving state$train_task unset.
#
# Key engineering point (avoiding resample segfaults):
#   mlr3 calls unmarshal_model() on self$state$model at the end of .__Learner__train.
#   Our fitted result holds multiple base learners + a predict closure, which breaks on recursive (de)serialization,
#   so .train returns only a harmless placeholder list() to the framework, while the real result is stored in
#   the .metalearner_registry registry; this object keeps only a string model_id.
#   Also, the truth passed to PredictionRegr$new() must come from the prediction task itself; passing NULL
#   makes the measure's (e.g. regr.mse) assert_regr assertion fail.
# =====================================================================

#' Parameterized mlr3 Metalearner learner
#'
#' @description A \code{\link[mlr3]{LearnerRegr}} subclass that wraps all metalearner types
#'   (S / T / X / R / DR) and outcome types (continuous / binary / survival) into a single
#'   \code{Learner}, which can be plugged directly into \code{resample()} / \code{benchmark()} / \code{tune()}.
#'   Note: the Task must be built with \code{\link{ml_task}} (it writes the outcome type, the survival status column, and t0 into
#'   \code{task$extra_args}, and this field survives resample's fold splitting).
#' @format \code{R6Class} object; obtain it via \code{mlr3::lrn("regr.metalearner")}.
#' @section Parameters (param_set):
#'   \describe{
#'     \item{metalearner}{character, S / T / X / R / DR, default "T"}
#'     \item{engine}{character, native / survlearners, default "native";
#'       the second engine for survival outcomes (survlearners package, supports only S/T/X/R and the S(t0) difference)}
#'   }
#' @field learner_base Outcome-model base learner (type must match the outcome; for survival use "coxph"/"ranger",
#'   or "coxph"/"grf"/"lasso" under the survlearners engine). T / X Learners may take a named list
#'   (\code{list(treated=, control=)} or \code{list(m1=, m0=)}) so each group / stage uses a different algorithm.
#' @field learner_tau Effect-stage regression learner; when NULL the engine uses a lightly-regularized ranger.
#'   The X-Learner may take \code{list(tau1=, tau0=)} to specify the two effect regressions separately.
#' @field learner_ps Propensity score, used only by X / R / DR (ignored by S / T): an mlr3 classification learner,
#'   a constant propensity-score scalar, or \code{function(newX)}; when NULL the engine defaults to \code{classif.log_reg}
#' @field treatment_col Name of the treatment column (overridable by task$extra_args$ml_treatment_col)
#' @field status_col Name of the survival event-indicator column (overridable by ml_status_col)
#' @field t0 Survival effect evaluation time point; when NULL uses extra_args$ml_t0, then the median event time
#' @field engine Survival-outcome estimation engine: native (default) / survlearners
#' @field model_id id of the real fitted result in the registry
#' @section Prediction:
#'   Returns the CATE (conditional average treatment effect for the individual) as \code{response}, which can be
#'   compared directly with the true tau.
#' @method initialize Constructor
#' @param id learner id
#' @seealso \code{\link{ml_task}}, \code{\link{metalearner}}
#' @export
LearnerRegrMetalearner <- R6::R6Class("LearnerRegrMetalearner",
  inherit = mlr3::LearnerRegr,
  public = list(
    # 以下作为字段暴露（paradox 的 p_uty 只能存函数/NULL，存不下 Learner 对象）
    learner_base  = NULL,      # 结局模型基学习器，类型须与结局匹配
    learner_tau   = NULL,      # 效应阶段回归学习器，NULL 时用引擎的正则化默认值
    learner_ps    = NULL,      # 倾向得分（X/R/DR 用；S/T 忽略）
    treatment_col = "A",       # 处理列名（可被 task$extra_args$ml_treatment_col 覆盖）
    status_col    = ".status", # 生存事件指示列名（可被 ml_status_col 覆盖）
    t0            = NULL,      # 生存效应时点，NULL 时取 extra_args$ml_t0，再取事件中位数
    engine        = "native",  # 生存引擎：native（原生 coxph/ranger）/ survlearners
    model_id      = NULL,      # 真实拟合结果在登记处的 id

    initialize = function(id = "regr.metalearner") {
      param_set <- paradox::ParamSet$new(list(
        metalearner = paradox::p_fct(levels = c("S", "T", "X", "R", "DR"), default = "T"),
        engine      = paradox::p_fct(levels = c("native", "survlearners"), default = "native")
      ))
      super$initialize(
        id = id,
        param_set = param_set,
        predict_types = "response",
        feature_types = c("logical", "integer", "numeric", "factor", "character"),
        properties = character(0),
        packages = c("mlr3HTE", "mlr3", "mlr3learners", "survival"),
        man = "mlr3HTE::LearnerRegrMetalearner"
      )
      self$learner_base  <- mlr3::lrn("regr.ranger")
      self$learner_tau   <- NULL
      self$learner_ps    <- NULL
      self$treatment_col <- "A"
      self$status_col    <- ".status"
      self$t0            <- NULL
      self$engine        <- "native"
      self$model_id      <- NULL
    }
  ),
  private = list(
    # 从 Task 还原出引擎需要的 X / A / Y / outcome / t0。
    # 优先读 task$extra_args 的元数据（ml_task 写进去的），字段只作兜底。
    .ml_ctx = function(task) {
      ex <- task$extra_args
      tc <- if (!is.null(ex$ml_treatment_col)) ex$ml_treatment_col else self$treatment_col
      sc <- if (!is.null(ex$ml_status_col)) ex$ml_status_col else self$status_col
      outcome <- if (!is.null(ex$ml_outcome)) ex$ml_outcome else "auto"
      t0 <- if (!is.null(self$t0)) self$t0 else ex$ml_t0

      # extra_args 缺失时（用户手工建的 Task）：有状态列就按生存处理
      if (identical(outcome, "auto") && sc %in% names(task$data())) outcome <- "survival"

      drop_cols <- unique(c(tc, if (identical(outcome, "survival")) sc))
      cov_cols <- setdiff(task$feature_names, drop_cols)
      if (!tc %in% names(task$data())) {
        stop(sprintf("Task 里找不到处理列 '%s'；请用 ml_task() 构造 Task。", tc))
      }

      X <- as.data.frame(task$data(cols = cov_cols))
      A <- as.integer(task$data(cols = tc)[[1]])
      Y <- if (identical(outcome, "survival")) {
        survival::Surv(task$truth(), as.integer(task$data(cols = sc)[[1]]))
      } else {
        task$truth()
      }
      list(X = X, A = A, Y = Y, outcome = outcome, t0 = t0)
    },

    # 训练：还原 X/A/Y -> 调引擎 ml_fit -> 真实结果进登记处，只回占位对象
    .train = function(task) {
      pv <- self$param_set$values
      ctx <- private$.ml_ctx(task)
      lb <- self$learner_base
      if (is.null(lb)) lb <- mlr3::lrn("regr.ranger")

      fit <- ml_fit(
        type = pv$metalearner, X = ctx$X, A = ctx$A, Y = ctx$Y,
        learner_base = lb, learner_tau = self$learner_tau,
        learner_ps = self$learner_ps,
        t0 = ctx$t0, outcome = ctx$outcome,
        engine = if (is.null(pv$engine)) self$engine else pv$engine
      )
      id <- tempfile("mm_")
      .metalearner_registry[[id]] <- fit
      self$model_id <- id
      list()   # 占位：state$model 收到它，可被 unmarshal_model 安全处理
    },

    # 预测：还原协变量 -> 调真实模型 -> 返回 CATE 的 PredictionRegr
    # truth 必须取自预测任务，否则 measure 的 assert_regr 会失败
    .predict = function(task) {
      fit <- .metalearner_registry[[self$model_id]]
      if (is.null(fit)) stop("模型尚未训练（或登记处已丢失），请先 $train()。")
      ctx <- private$.ml_ctx(task)
      cate <- as.numeric(fit$predict(ctx$X))
      mlr3::PredictionRegr$new(
        row_ids   = task$row_ids,
        truth     = task$truth(),
        response  = cate
      )
    }
  )
)
