# Purpose: re-export mlr3's lrn() so that after library(mlr3HTE) it can be used directly, without loading mlr3 again
# Input: no runtime code, only roxygen declarations
# Output: importFrom(mlr3, lrn) and export(lrn) in NAMESPACE
# Dependencies: mlr3 (Imports)

# 0 环境与依赖 ----

# roxygen's re-export idiom: @export placed on pkg::name
# generates both importFrom(mlr3, lrn) and export(lrn).
# Why re-export: lrn("regr.ranger", ...) appears extremely frequently across the docs site and tutorials,
# and this package's default base learner is an mlr3 learner. If not re-exported, a user following the docs and running
#   library(mlr3HTE); lrn("regr.ranger")
# would get "no such function lrn" -- this is a real, observed consumer failure, not a hypothetical.
# The re-exported object is the same function, so attaching it together with mlr3 causes no conflict.

# 1 再导出 ----

#' @export
mlr3::lrn
