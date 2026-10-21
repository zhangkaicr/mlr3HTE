# =====================================================================
# imports.R
# 目的：集中声明包代码里直接裸用的基础函数导入。
# 背景：一旦包有了 NAMESPACE，只有 base 自动可见，stats 里的 rnorm/predict/
#       quantile 等若不显式 importFrom，R CMD check 会报
#       "no visible global function definition" NOTE。显式声明既消 NOTE
#       也把真实依赖写清楚。这些函数散落在 R/api.R（DGP 随机数与结局方程）、
#       R/dag.R（setNames 改名）、R/survival_base.R（predict）等。
# =====================================================================

#' @importFrom stats rnorm rbinom plogis qlogis quantile predict
NULL
