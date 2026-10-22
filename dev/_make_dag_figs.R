# 目的：用当前 mlr3HTE_dag() 统一重生成 6 张 DAG 图（rct/obs × 三种结局）。
#       起因：binary / survival 那 4 张停留在 v0.34 之前——旧布局、
#       geom_segment 时代的箭头路由、且画布尺寸与 continuous 两张不一致。
# 输入：无（函数自带默认布局）
# 输出：docs/assets/img/dag/dag_{design}_{outcome}.png，共 6 张
# 依赖：pkgload::load_all()、ggplot2；区域须 en_US.UTF-8（标题与节点为中文）

# 0 环境与依赖 ----
Sys.setlocale("LC_CTYPE", "en_US.UTF-8")
suppressMessages({
  library(ggplot2)
  pkgload::load_all(".", quiet = TRUE)
})

out_dir <- "docs/assets/img/dag"
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

# 1 统一画布尺寸 ---------------------------------------------------------------
# 六张图必须同尺寸，否则在教程里并排出现时字号会不一致。
# 110 dpi × 8×5 in = 880×550 px。
fig_w <- 8
fig_h <- 5
fig_dpi <- 110

# 2 逐个组合导出 ---------------------------------------------------------------
grid <- expand.grid(
  design  = c("rct", "obs"),
  outcome = c("continuous", "binary", "survival"),
  stringsAsFactors = FALSE
)

for (i in seq_len(nrow(grid))) {
  ds <- grid$design[i]
  oc <- grid$outcome[i]
  p <- mlr3HTE_dag(ds, oc)
  path <- file.path(out_dir, sprintf("dag_%s_%s.png", ds, oc))
  ggsave(path, p, width = fig_w, height = fig_h, dpi = fig_dpi, bg = "white")
  cli::cli_alert_info("{path}  {round(file.size(path) / 1024)} KB")
}

# 3 尺寸一致性核查 -------------------------------------------------------------
# 用 png 头里的宽高做粗检，避免 ggsave 的 width/height 被某张图悄悄改写。
sizes <- vapply(
  list.files(out_dir, pattern = "^dag_.*\\.png$", full.names = TRUE),
  function(f) {
    con <- file(f, "rb")
    on.exit(close(con))
    hdr <- readBin(con, "raw", n = 24L)
    paste0(sum(as.integer(hdr[17:20]) * 256^(3:0)),
           "x",
           sum(as.integer(hdr[21:24]) * 256^(3:0)))
  },
  character(1)
)
print(sizes)

# 99 收尾 ----
cli::cli_alert_success("6 张 DAG 图重生成完毕")
