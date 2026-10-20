# =====================================================================
# dag.R
# 目的：为六个演示数据集画出配套的因果图（DAG），用来讲清"为什么 RCT 无混杂、
#       观察性数据有 confounding by indication"。纯 ggplot2 实现，不引入 ggdag 等重依赖，
#       保证教程脚本在只装了 DESCRIPTION::Imports 时也能画出 DAG。
# 输入：design（rct / obs）、outcome（continuous / binary / survival）
# 输出：一个 ggplot 对象（可直接 print 或 ggsave）
# 依赖：ggplot2
# =====================================================================

# 0 环境与依赖 ----

#' 因果图（DAG）：演示数据集的生成机制
#'
#' @description
#' 为 mlr3HTE 的六个演示数据集画出配套的因果有向无环图（DAG），直观展示
#' **数据生成机制（DGP）** 与**真实值从何而来**：
#' \itemize{
#'   \item \code{design = "rct"}：处理 \code{A} 随机化，与协变量 \code{X} 独立
#'     （\code{A} 没有任何父节点），因此不存在混杂，未调整的差分即可无偏估计 ATE。
#'   \item \code{design = "obs"}：处理概率 \code{e} 由协变量决定（病情越重越易接受治疗，
#'     confounding by indication），\code{X} 同时是 \code{A} 与结局 \code{Y} 的共同原因，
#'     打开了一条后门路径 \code{A <- e <- X -> mu -> Y}，须用 IPTW / DR 等校正。
#' }
#' 两种设计里，\code{X} 都同时驱动真实 CATE（\code{tau}，效应修饰）与基线结局
#' （\code{mu}，预后），这正是异质处理效应（HTE）存在的来源。
#'
#' @param design 研究设计，\code{"rct"}（随机化）或 \code{"obs"}（观察性 / 有混杂）。
#' @param outcome 结局类型，\code{"continuous"}（连续）、\code{"binary"}（二分类）或
#'   \code{"survival"}（生存）。仅影响图标题与节点文字，不改变因果结构。
#'
#' @return 一个 \code{ggplot} 对象。
#' @export
#'
#' @examples
#' if (requireNamespace("ggplot2", quietly = TRUE)) {
#'   print(mlr3HTE_dag("rct", "continuous"))
#'   print(mlr3HTE_dag("obs", "survival"))
#' }
mlr3HTE_dag <- function(design = c("rct", "obs"),
                        outcome = c("continuous", "binary", "survival")) {
  design <- match.arg(design)
  outcome <- match.arg(outcome)
  if (!requireNamespace("ggplot2", quietly = TRUE)) {
    stop("绘制 DAG 需要 ggplot2，请先安装：install.packages('ggplot2')")
  }
  outcome_zh <- c(continuous = "连续结局", binary = "二分类结局",
                  survival = "生存结局")[outcome]
  outcome_en <- c(continuous = "continuous", binary = "binary",
                  survival = "survival")[outcome]

  # 节点坐标（同一设计内，三种结局的因果结构完全一致，只改标题/文字）
  if (design == "rct") {
    nodes <- data.frame(
      id = c("X", "A", "tau", "mu", "Y"),
      x  = c(1.0, 1.0, 3.2, 3.2, 5.6),
      y  = c(3.2, 1.0, 3.7, 1.6, 2.6),
      label = c("X\n协变量", "A\n处理\n(随机化)",
                "tau\n真实 CATE\n(效应修饰)", "mu\n基线结局\n(预后)",
                "Y\n结局"),
      role = c("cov", "trt", "eff", "prog", "out")
    )
    edges <- data.frame(
      from = c("X", "X", "A", "tau", "mu"),
      to   = c("tau", "mu", "Y", "Y", "Y"),
      type = "base"
    )
    subtitle <- "RCT：A 无父节点（随机化，A ⊥ X），无混杂；未调整差分即无偏"
  } else {
    nodes <- data.frame(
      id = c("X", "e", "A", "tau", "mu", "Y"),
      x  = c(1.0, 3.2, 5.2, 3.2, 3.2, 6.8),
      y  = c(3.2, 0.9, 0.9, 3.7, 1.8, 2.7),
      label = c("X\n协变量", "e\n处理概率\n(混杂)", "A\n处理",
                "tau\n真实 CATE\n(效应修饰)", "mu\n基线结局\n(预后)",
                "Y\n结局"),
      role = c("cov", "ps", "trt", "eff", "prog", "out")
    )
    edges <- data.frame(
      from = c("X", "X", "X", "e", "tau", "mu", "A"),
      to   = c("tau", "mu", "e", "A", "Y", "Y", "Y"),
      type = c("base", "base", "conf", "conf", "base", "base", "base")
    )
    subtitle <- "观察性：X→e→A 打开后门 A←e←X→mu→Y（混杂），须 IPTW/DR 校正"
  }

  pos <- nodes[, c("id", "x", "y")]
  edges <- merge(edges, setNames(pos, c("from", "x", "y")), by = "from")
  edges <- merge(edges, setNames(pos, c("to", "xend", "yend")), by = "to")

  role_fill <- c(cov = "#4C78A8", trt = "#F58518", eff = "#B279A2",
                 prog = "#54A24B", out = "#E45756", ps = "#E45756")
  edges$col <- ifelse(edges$type == "conf", "#E45756", "#888888")

  g <- ggplot2::ggplot() +
    ggplot2::geom_segment(
      data = edges,
      ggplot2::aes(x = x, y = y, xend = xend, yend = yend, color = I(col)),
      arrow = ggplot2::arrow(length = ggplot2::unit(0.12, "inches"),
                             type = "closed"),
      linewidth = 1.1, alpha = 0.9) +
    ggplot2::geom_label(
      data = nodes,
      ggplot2::aes(x = x, y = y, label = label, fill = I(role_fill[role])),
      color = "white", size = 4.2, fontface = "bold",
      label.size = NA, linewidth = 0) +
    ggplot2::scale_x_continuous(limits = c(0.2, 7.6), expand = c(0, 0)) +
    ggplot2::scale_y_continuous(limits = c(0.2, 4.2), expand = c(0, 0)) +
    ggplot2::theme_void() +
    ggplot2::theme(
      plot.title = ggplot2::element_text(size = 14, face = "bold", hjust = 0.5),
      plot.subtitle = ggplot2::element_text(size = 11, hjust = 0.5,
                                            color = "#333333"),
      plot.caption = ggplot2::element_text(size = 9, hjust = 0.5,
                                           color = "#777777"),
      legend.position = "none"
    ) +
    ggplot2::labs(
      title = paste0("DAG · ", design, " · ", outcome_zh, " (", outcome_en, ")"),
      subtitle = subtitle,
      caption = "协变量 X = age, lac, tumor, sex（其中 lac、tumor 标准化为 z1、z2）"
    )
  g
}
