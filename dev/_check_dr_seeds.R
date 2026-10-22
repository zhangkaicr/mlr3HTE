# 多种子对照：观察性二分类上，DR 三件套 vs 未调整差值，哪个更接近真值。
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
o <- mlr3HTE_bench("obs_lin_lin_sharedF", "binary")
rows <- lapply(1:8, function(sd) {
  dr <- dr_pseudo_outcome(o$X, o$A, o$Y, seed = sd)
  data.frame(seed = sd,
             dr = mean(dr$pseudo),
             unadj = mean(o$Y[o$A == 1]) - mean(o$Y[o$A == 0]),
             truth = o$ate)
})
d <- do.call(rbind, rows)
d$dr_bias <- round(d$dr - d$truth, 4)
d$unadj_bias <- round(d$unadj - d$truth, 4)
print(d, row.names = FALSE, digits = 4)
cli::cli_alert_info("DR 平均绝对偏差 = {round(mean(abs(d$dr_bias)), 4)}；未调整 = {round(mean(abs(d$unadj_bias)), 4)}")
