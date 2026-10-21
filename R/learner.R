# =====================================================================
# learner.R —— 参数化 mlr3 Learner 子类（"A learner"）
#
# 一个 Learner 包揽全部 metalearner 类型（S/T/X/R/DR）、加权方式
# （none/iptw/external）与结局类型（连续/二分类/生存），可无缝接入
# resample() / benchmark() / tune()。
#
# Task 的构造必须用 ml_task()：它把 X/A/Y 编码成 Task，并把结局类型、
# 生存的状态列与 t0 写进 task$extra_args。该字段经实测在
# clone(deep = TRUE)$filter() 与 serialize()/unserialize() 之后都保留，
# 所以 resample 分折时元数据不丢。（Task 没有 extra 字段，自定义
# col_roles 会被 assert_names 拒绝，只有 extra_args 可用。）
#
# 编码约定（见 ml_task）：
#   目标列 .outcome = Y（连续/二分类）或随访时间（生存）
#   生存时另有特征列 .status = 事件指示，拟合时需从协变量中剔除
#   处理列列名由 ml_treatment_col 指定，默认 "A"
#
# mlr3 1.8 训练/预测链说明：
#   Learner$train(task) -> .__Learner__train -> learner_train
#     -> private$.train(task)   <-- 真正的训练逻辑（resample 也直接调它）
#   Learner$predict(task) -> .__Learner__predict -> learner_predict
#     -> private$.predict(task) <-- 真正的预测逻辑
# 因此钩子必须写在 private 里；覆盖公开 train/predict 会替换掉
# .__Learner__train，导致 state$train_task 不被设置。
#
# 关键工程点（避免 resample 段错误）：
#   mlr3 在 .__Learner__train 末尾会对 self$state$model 调 unmarshal_model()。
#   我们的拟合结果装着多个基学习器 + predict 闭包，递归（反）序列化会出问题，
#   因此 .train 只向框架返回一个无害的占位 list()，真实结果存进
#   .metalearner_registry 登记处，本对象只留一个字符串 model_id。
#   另外 PredictionRegr$new() 的 truth 必须取自预测任务本身，传 NULL 会让
#   measure（如 regr.mse）的 assert_regr 断言失败。
# =====================================================================

#' mlr3 参数化 Metalearner 学习器
#'
#' @description 一个 \code{\link[mlr3]{LearnerRegr}} 子类，把全部 metalearner 类型、
#'   加权方式（none / iptw / external）与结局类型（连续 / 二分类 / 生存）封装进同一个
#'   \code{Learner}，可直接接入 \code{resample()} / \code{benchmark()} / \code{tune()}。
#'   须知：构造 Task 必须用 \code{\link{ml_task}}（它会把结局类型、生存状态列与 t0 写进
#'   \code{task$extra_args}，该字段在 resample 分折后仍保留）。
#' @format \code{R6Class} 对象；用 \code{mlr3::lrn("regr.metalearner")} 获取。
#' @section 参数(param_set):
#'   \describe{
#'     \item{metalearner}{字符，S / T / X / R / DR，默认 "T"}
#'     \item{weighting}{字符，none / iptw / external，默认 "none"}
#'     \item{engine}{字符，native / survlearners，默认 "native"；
#'       生存结局的第二套引擎（survlearners 包，只支持 S/T/X/R 与 S(t0) 差）}
#'   }
#' @field learner_base 结局模型基学习器（类型须与结局匹配；生存用 "coxph"/"ranger"，
#'   survlearners 引擎下用 "coxph"/"grf"/"lasso"）。T / X Learner 可传命名 list
#'   （\code{list(treated=, control=)} 或 \code{list(m1=, m0=)}）让分组 / 阶段各自用不同算法。
#' @field learner_tau 效应阶段回归学习器；NULL 时引擎用偏正则化的 ranger。
#'   X-Learner 可传 \code{list(tau1=, tau0=)} 分别指定两个效应回归。
#' @field learner_ps 倾向得分学习器（weighting = "iptw" 时）
#' @field treatment_col 处理列名（可被 task$extra_args$ml_treatment_col 覆盖）
#' @field status_col 生存事件指示列名（可被 ml_status_col 覆盖）
#' @field t0 生存效应评估时点；NULL 时取 extra_args$ml_t0，再取事件中位数
#' @field stabilize IPTW 是否使用稳定化权重
#' @field engine 生存结局估计引擎：native（默认）/ survlearners
#' @field model_id 真实拟合结果在登记处的 id
#' @section 预测:
#'   返回 CATE（个体处理效应）作为 \code{response}，可直接与真实 tau 比较。
#' @method initialize 构造函数
#' @param id 学习器 id
#' @seealso \code{\link{ml_task}}, \code{\link{metalearner}}
#' @export
LearnerRegrMetalearner <- R6::R6Class("LearnerRegrMetalearner",
  inherit = mlr3::LearnerRegr,
  public = list(
    # 以下作为字段暴露（paradox 的 p_uty 只能存函数/NULL，存不下 Learner 对象）
    learner_base  = NULL,      # 结局模型基学习器，类型须与结局匹配
    learner_tau   = NULL,      # 效应阶段回归学习器，NULL 时用引擎的正则化默认值
    learner_ps    = NULL,      # 倾向得分学习器（IPTW 时用）
    treatment_col = "A",       # 处理列名（可被 task$extra_args$ml_treatment_col 覆盖）
    status_col    = ".status", # 生存事件指示列名（可被 ml_status_col 覆盖）
    t0            = NULL,      # 生存效应时点，NULL 时取 extra_args$ml_t0，再取事件中位数
    stabilize     = FALSE,     # IPTW 是否用稳定化权重
    engine        = "native",  # 生存引擎：native（原生 coxph/ranger）/ survlearners
    model_id      = NULL,      # 真实拟合结果在登记处的 id

    initialize = function(id = "regr.metalearner") {
      param_set <- paradox::ParamSet$new(list(
        metalearner = paradox::p_fct(levels = c("S", "T", "X", "R", "DR"), default = "T"),
        weighting   = paradox::p_fct(levels = c("none", "iptw", "external"), default = "none"),
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
      self$stabilize     <- FALSE
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
        learner_ps = self$learner_ps, weighting = pv$weighting,
        weights = NULL, stabilize = self$stabilize,
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
