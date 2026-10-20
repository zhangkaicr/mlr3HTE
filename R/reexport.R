# 目的：再导出 mlr3 的 lrn()，使 library(mlr3HTE) 之后可直接使用，无需再 library(mlr3)
# 输入：无运行时代码，仅 roxygen 声明
# 输出：NAMESPACE 中的 importFrom(mlr3, lrn) 与 export(lrn)
# 依赖：mlr3（Imports）

# 0 环境与依赖 ----

# roxygen 的 re-export 写法：@export 作用在 pkg::name 上，
# 会同时生成 importFrom(mlr3, lrn) 与 export(lrn)。
# 为什么再导出：文档站与教程里 lrn("regr.ranger", ...) 出现频率极高，
# 且本包默认基学习器就是 mlr3 learner。若不导出，用户照文档执行
#   library(mlr3HTE); lrn("regr.ranger")
# 会报「没有 lrn 这个函数」——这是真实发生过的消费者故障，不是假设。
# 再导出的是同一个函数对象，与 mlr3 同时 attach 不会产生冲突。

# 1 再导出 ----

#' @export
mlr3::lrn
