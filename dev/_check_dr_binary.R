# RCT 二分类：未调整差值是金标准，用它检验 DR 伪结局实现是否正确。
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))
for (id in c("rct_lin", "rct_nonlin")) {
  b <- mlr3HTE_bench(id, "binary")
  unadj <- mean(b$Y[b$A == 1]) - mean(b$Y[b$A == 0])
  dr <- dr_pseudo_outcome(b$X, b$A, b$Y, seed = 1)
  # 关掉交叉拟合再看一次
  dr_nocf <- dr_pseudo_outcome(b$X, b$A, b$Y, cross_fitting = FALSE, seed = 1)
  cli::cli_alert_info("{id}: 真值 {round(b$ate,4)} | 未调整 {round(unadj,4)} | DR(cf) {round(dr$ate,4)} | DR(no-cf) {round(dr_nocf$ate,4)}")
}
