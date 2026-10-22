Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
suppressMessages(library(mlr3))
db <- mlr3HTE_scenario("rct_lin", "continuous", n = 400, seed = 1)
bm <- hte_benchmark(db$X, db$A, db$Y, learners = c("S", "T"),
                    learner_base = lrn("regr.lm"), n_folds = 2, seed = 1)
qd <- hte_benchmark_data(bm, "qini")
print(head(qd[qd$learner == "T", c("learner", "fraction", "qini")], 3), row.names = FALSE)
print(attr(qd, "reference"), row.names = FALSE)
