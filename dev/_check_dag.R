Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages(pkgload::load_all(".", quiet = TRUE))

for (ds in c("rct", "obs")) {
  dd <- mlr3HTE_dag_data(ds, "continuous")
  cli::cli_h2("{ds}")
  print(dd$edges[, c("from", "to", "type", "curve")], row.names = FALSE)
  # 任意两节点之间不能有多条边
  key <- paste(dd$edges$from, dd$edges$to)
  stopifnot(!any(duplicated(key)))
  cli::cli_alert_success("边数 {nrow(dd$edges)}，无重复方向对")
  g <- mlr3HTE_dag(ds, "continuous")
  ggplot2::ggsave(sprintf("dev/_dag_%s.png", ds), g, width = 7.6, height = 4.6, dpi = 120)
}
