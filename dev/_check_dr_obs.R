# 混杂更强的观察性二分类：DR  vs 未调整。
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
for (id in c("obs_lin_lin_sharedF", "obs_nonlin_nonlin_sharedT")) {
  for (oc in c("binary", "continuous")) {
    b <- mlr3HTE_bench(id, oc)
    unadj <- mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])
    dr <- dr_pseudo_outcome(b$X, b$A, b$Y, seed = 1)
    cli::cli_alert_info("{id}/{oc}: 真值 {round(b$ate,4)} | 未调整 {round(unadj,4)} (偏差 {round(unadj-b$ate,4)}) | DR {round(dr$ate,4)} (偏差 {round(dr$ate-b$ate,4)})")
  }
}
