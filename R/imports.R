# =====================================================================
# imports.R
# 目的：集中声明包代码里直接裸用 / 需要写进 NAMESPACE 的基础函数导入。
# 背景：一旦包有了 NAMESPACE，只有 base 自动可见，stats 里的 rnorm/predict/
#       quantile 等若不显式 importFrom，R CMD check 会报
#       "no visible global function definition" NOTE。显式声明既消 NOTE
#       也把真实依赖写清楚。这些函数散落在 R/api.R（DGP 随机数与结局方程）、
#       R/dag.R（setNames 改名）、R/survival_base.R（predict）等。
#
# 另外两条来自 R CMD check 的依赖警告也在这里一并解决：
#   1) "Namespaces in Imports field not imported from: R6 / paradox /
#      mlr3learners" —— DESCRIPTION 的 Imports 必须在 NAMESPACE 里有对应
#      导入指令，光在代码里用 pkg:: 不算。R6 与 paradox 由 R/learner.R 显式
#      使用（R6Class、ParamSet、p_fct）；mlr3learners 本身不导出有用符号，
#      但 lrn("regr.ranger") 必须靠它注册进 mlr3 词典，所以用 @import 整体导入。
#   2) "'::' or ':::' imports not declared from: tibble / tidyr" ——
#      R/benchmark.R 用了 tibble::tibble() 与 tidyr::pivot_longer()，
#      DESCRIPTION 必须声明这两个包。
# =====================================================================

#' @importFrom stats rnorm rbinom plogis qlogis quantile predict rexp setNames
#' @importFrom graphics plot abline
#' @importFrom R6 R6Class
#' @importFrom paradox ParamSet p_fct
#' @importFrom tibble tibble
#' @importFrom tidyr pivot_longer
#' @import mlr3learners
NULL
