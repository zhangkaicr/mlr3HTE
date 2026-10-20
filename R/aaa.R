# 包级初始化：把 LearnerRegrMetalearner 注册进 mlr3 词典，使 lrn("regr.metalearner") 可用
.onLoad <- function(libname, pkgname) {
  if (requireNamespace("mlr3", quietly = TRUE)) {
    x <- try(mlr3::mlr_learners$get("regr.metalearner"), silent = TRUE)
    if (inherits(x, "try-error") || is.null(x)) {
      mlr3::mlr_learners$add("regr.metalearner", LearnerRegrMetalearner)
    }
  }
  # 默认基学习器是 mlr3::lrn("regr.ranger")/classif.ranger，由 mlr3learners 提供。
  # 该包只是 Imports（惰性加载），mlr3HTE 代码又不直接调用 mlr3learners::*，
  # 若不在此显式加载，其 .onLoad 不会运行，regr.ranger 等 learner 就不会注册进
  # mlr_learners 词典，导致 lrn("regr.ranger") 报 "not found"。这里确保它加载注册。
  if (requireNamespace("mlr3learners", quietly = TRUE)) {
    loadNamespace("mlr3learners")
  }
}

# 模型登记处：存放真正装「嵌套 ranger 基学习器 + predict 函数」的拟合结果。
# 原因：mlr3 在 resample/benchmark 时会克隆并（反）序列化 Learner 对象；而 ranger 的
# C++ 模型无法安全序列化，会导致段错误（segfault）。因此 Learner 对象本身只持有
# 一个字符串 id（model_id），真实模型存在这里，预测时按 id 取回。这样 Learner 对象
# 完全可序列化，resample 的克隆/序列化不再触碰 C++ 模型。单进程下（含顺序 resample）
# 该登记处一直有效。
.metalearner_registry <- new.env(hash = TRUE, parent = emptyenv())
