# 目的：确认 mlr3HTE_dag() 当前实际产出的图层类型与数量，判断文档站里
#       内嵌的示例输出与已导出的 PNG 是否已过期。
# 输入：无（直接调用包内函数）
# 输出：控制台打印每种 design × outcome 的图层构成
# 依赖：pkgload::load_all()

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
pkgload::load_all(".", quiet = TRUE)

# 1 逐个组合打印图层构成 ----
for (ds in c("rct", "obs")) {
  for (oc in c("continuous", "binary", "survival")) {
    p <- mlr3HTE_dag(ds, oc)
    geoms <- vapply(p$layers, function(l) class(l$geom)[1], character(1))
    print(sprintf("%-5s / %-11s : %d 层 -> %s",
                  ds, oc, length(p$layers), paste(geoms, collapse = ", ")))
    ed <- mlr3HTE_dag_data(ds, oc)$edges
    print(ed[, c("from", "to", "curve")])
  }
}

# 2 当前 ggsave 默认设备 ----
print(getOption("bitmapType"))
print(names(grDevices::devices()))

# 99 收尾 ----
cli::cli_alert_success("DAG 图层核查完毕")
