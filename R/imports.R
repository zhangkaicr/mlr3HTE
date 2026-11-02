# =====================================================================
# imports.R
# Purpose: centrally declare the base-function imports that the package code uses directly / needs written into NAMESPACE.
# Background: once a package has a NAMESPACE, only base is visible automatically; functions in stats such as rnorm/predict/
#       quantile will trigger an R CMD check
#       "no visible global function definition" NOTE unless explicitly importFrom'd. Explicit declaration both clears the NOTE
#       and documents the real dependencies. These functions are scattered across R/api.R (DGP random numbers and outcome equations),
#       R/dag.R (setNames renaming), R/survival_base.R (predict), etc.
#
# Two further dependency warnings from R CMD check are also resolved here:
#   1) "Namespaces in Imports field not imported from: R6 / paradox /
#      mlr3learners" -- the Imports in DESCRIPTION must have a matching
#      import directive in NAMESPACE; merely using pkg:: in code is not enough. R6 and paradox are used explicitly by R/learner.R
#      (R6Class, ParamSet, p_fct); mlr3learners itself exports no useful symbols,
#      but lrn("regr.ranger") relies on it to register into the mlr3 dictionary, so it is imported wholesale via @import.
#   2) "'::' or ':::' imports not declared from: tibble / tidyr" --
#      R/benchmark.R uses tibble::tibble() and tidyr::pivot_longer(),
#      so both packages must be declared in DESCRIPTION.
# =====================================================================

#' @importFrom stats rnorm rbinom plogis qlogis quantile predict rexp setNames
#' @importFrom graphics plot abline
#' @importFrom R6 R6Class
#' @importFrom paradox ParamSet p_fct
#' @importFrom tibble tibble
#' @importFrom tidyr pivot_longer
#' @import mlr3learners
NULL
