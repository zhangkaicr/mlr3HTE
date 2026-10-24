# =====================================================================
# dag.R
# 目的：为演示数据集画出配套的因果图（DAG），说明「为什么 RCT 无混杂、
#       观察性数据存在 confounding by indication」。纯 ggplot2 实现，
#       不引入 ggdag 等重依赖。
# 输入：design（rct / obs）、outcome（continuous / binary / survival）
# 输出：mlr3HTE_dag() 返回 ggplot；mlr3HTE_dag_data() 返回节点与边
# 依赖：ggplot2
#
# 关于箭头的关键约定（v0.34 修正）：
#   任意两个节点之间只允许**一条**有向边，且任何一条边都不允许从
#   第三个节点身上穿过。早期版本里 A -> Y 是一条直线，恰好穿过 mu 节点，
#   视觉上看起来就是「mu 与 Y 之间有两条箭头」，读者无法判断哪条是哪条。
#   现在改为：边先去重，再由 .route_edges() 逐条检测是否穿过其他节点，
#   穿过就自动给这条边加曲率（二分搜索最小可行曲率），从节点旁绕过去。
# =====================================================================

# ggplot2 的 aes() 里引用的数据列名对 codetools 不可见，
# R CMD check 会报 "no visible binding for global variable" NOTE。
utils::globalVariables(c("x", "y", "xend", "yend", "label", "role",
                         "curve", "type", "xs", "ys", "xe", "ye"))

# 0 环境与依赖 ----

# 1 节点布局 -------------------------------------------------------------------
# 同一设计内三种结局的因果结构完全一致，只改标题与节点文字，所以布局只按
# design 分两套。
.dag_nodes <- function(design, outcome) {
  outcome_zh <- c(continuous = "连续结局", binary = "二分类结局",
                  survival = "生存结局")[outcome]
  outcome_en <- c(continuous = "continuous", binary = "binary",
                  survival = "survival")[outcome]

  if (identical(design, "rct")) {
    # 布局刻意让 A -> Y 这条边从 mu 下方通过：Y 放在下半区，
    # tau / mu 依次向上，避免 A->Y 与 mu->Y 在视觉上重叠成「两条箭头」。
    nodes <- data.frame(
      id = c("X", "A", "tau", "mu", "Y"),
      x  = c(1.1, 1.1, 3.9, 3.9, 6.8),
      y  = c(3.0, 0.8, 4.0, 2.6, 1.6),
      label = c("X\n协变量", "A\n处理\n(随机化)",
                "tau\n真实 CATE\n(效应修饰)", "mu\n基线结局\n(预后)",
                "Y\n结局"),
      role = c("cov", "trt", "eff", "prog", "out"),
      stringsAsFactors = FALSE
    )
    edges <- data.frame(
      from = c("X", "X", "A", "tau", "mu"),
      to   = c("tau", "mu", "Y", "Y", "Y"),
      type = "base",
      stringsAsFactors = FALSE
    )
    subtitle <- "RCT：A 无父节点（随机化，A ⊥ X），无混杂；未调整差分即无偏"
  } else {
    nodes <- data.frame(
      id = c("X", "e", "A", "tau", "mu", "Y"),
      x  = c(1.1, 3.0, 5.9, 3.9, 3.9, 7.3),
      y  = c(3.0, 0.9, 0.9, 4.0, 2.5, 1.8),
      label = c("X\n协变量", "e\n处理概率\n(混杂)", "A\n处理",
                "tau\n真实 CATE\n(效应修饰)", "mu\n基线结局\n(预后)",
                "Y\n结局"),
      role = c("cov", "ps", "trt", "eff", "prog", "out"),
      stringsAsFactors = FALSE
    )
    edges <- data.frame(
      from = c("X", "X", "X", "e", "tau", "mu", "A"),
      to   = c("tau", "mu", "e", "A", "Y", "Y", "Y"),
      type = c("base", "base", "conf", "conf", "base", "base", "base"),
      stringsAsFactors = FALSE
    )
    subtitle <- "观察性：X→e→A 打开后门 A←e←X→mu→Y（混杂），须把 X 纳入调整/条件化"
  }

  attr(nodes, "outcome_zh") <- outcome_zh
  attr(nodes, "outcome_en") <- outcome_en
  attr(nodes, "subtitle") <- subtitle
  list(nodes = nodes, edges = edges)
}

# 2 边的几何路由 ---------------------------------------------------------------
# 目标：任何一条边都不能从「非端点节点」身上穿过。
# 做法：对每条边尝试一组由小到大的曲率，取第一个能清空所有节点的。
# 曲率与 grid::curveGrob 的约定一致：控制点 C = 中点 + 0.5 * curvature * (dy, -dx)，
# 这样检测用的二次贝塞尔曲线与最终画出来的是同一条。
.route_edges <- function(edges, nodes,
                         half_w = 1.15, half_h = 0.55, margin = 0.10) {
  # 先去重：同一对 (from, to) 只保留一条，否则图上就会出现两条箭头
  key <- paste(edges$from, edges$to, sep = "->")
  edges <- edges[!duplicated(key), , drop = FALSE]
  rownames(edges) <- NULL

  pos <- nodes[, c("id", "x", "y")]
  e <- merge(edges, stats::setNames(pos, c("from", "x", "y")), by = "from", sort = FALSE)
  e <- merge(e, stats::setNames(pos, c("to", "xend", "yend")), by = "to", sort = FALSE)

  # 端点沿边方向回退：geom_label 是不透明底色且画在更上层，
  # 若边终止在节点中心，箭头会被标签盒整个吞掉。
  shrink <- 0.55
  dx <- e$xend - e$x
  dy <- e$yend - e$y
  L  <- sqrt(dx^2 + dy^2)
  k  <- shrink / L
  e$xs <- e$x + dx * k
  e$ys <- e$y + dy * k
  e$xe <- e$xend - dx * k
  e$ye <- e$yend - dy * k

  # 采样二次贝塞尔，返回路径上到某点的最小距离
  bezier_pts <- function(x0, y0, x1, y1, curvature, n = 80L) {
    mx <- (x0 + x1) / 2
    my <- (y0 + y1) / 2
    cxp <- mx + 0.5 * curvature * (y1 - y0)
    cyp <- my - 0.5 * curvature * (x1 - x0)
    t <- seq(0, 1, length.out = n)
    data.frame(
      px = (1 - t)^2 * x0 + 2 * (1 - t) * t * cxp + t^2 * x1,
      py = (1 - t)^2 * y0 + 2 * (1 - t) * t * cyp + t^2 * y1
    )
  }

  # 逐条挑曲率：0 优先（直线最美观），不行再左右两侧对称试。
  # 碰撞判据用「矩形」而不是「圆形」——geom_label 画出的是标签盒，
  # 宽高比约 2:1，用圆近似会低估横向占用。
  cand <- c(0, 0.10, -0.10, 0.18, -0.18, 0.26, -0.26, 0.34, -0.34)
  e$curve <- 0
  for (i in seq_len(nrow(e))) {
    others <- setdiff(nodes$id, c(e$from[i], e$to[i]))
    if (!length(others)) next
    ox <- nodes$x[match(others, nodes$id)]
    oy <- nodes$y[match(others, nodes$id)]

    for (cv in cand) {
      pts <- bezier_pts(e$xs[i], e$ys[i], e$xe[i], e$ye[i], cv)
      hit <- any(vapply(seq_along(others), function(j) {
        any(abs(pts$px - ox[j]) < half_w + margin &
              abs(pts$py - oy[j]) < half_h + margin)
      }, logical(1)))
      if (!hit) {
        e$curve[i] <- cv
        break
      }
    }
  }
  e
}

# 3 对外接口：绘图数据 ---------------------------------------------------------
#' DAG 图的绘图数据（节点与边）
#'
#' @description
#' \code{\link{mlr3HTE_dag}} 画图所用的节点表与边表。单独提供出来，便于
#' 用其他工具（ggraph、DiagrammeR）重画，或检查每条边的路由结果。
#'
#' @param design 研究设计，\code{"rct"} 或 \code{"obs"}。
#' @param outcome 结局类型，只影响标题文字，不改变因果结构。
#' @return list：
#'   \itemize{
#'     \item \code{nodes}：\code{id} / \code{x} / \code{y} / \code{label} / \code{role}
#'     \item \code{edges}：\code{from} / \code{to} / \code{type}（\code{"conf"} 为
#'       红绘的混杂路径）/ \code{x} \code{y} \code{xend} \code{yend}（原始端点）/
#'       \code{xs} \code{ys} \code{xe} \code{ye}（回退后用于绘制的端点）/
#'       \code{curve}（该边的曲率；0 表示直线）
#'   }
#' @seealso \code{\link{mlr3HTE_dag}}
#' @export
mlr3HTE_dag_data <- function(design = c("rct", "obs"),
                             outcome = c("continuous", "binary", "survival")) {
  design  <- match.arg(design)
  outcome <- match.arg(outcome)
  lay <- .dag_nodes(design, outcome)
  edges <- .route_edges(lay$edges, lay$nodes)
  list(
    nodes = lay$nodes,
    edges = edges,
    subtitle = attr(lay$nodes, "subtitle"),
    outcome_zh = attr(lay$nodes, "outcome_zh"),
    outcome_en = attr(lay$nodes, "outcome_en")
  )
}

#' 因果图（DAG）：演示数据集的生成机制
#'
#' @description
#' 为 mlr3HTE 的演示数据集画出配套的因果有向无环图（DAG），展示
#' **数据生成机制（DGP）** 与**真实值从何而来**：
#' \itemize{
#'   \item \code{design = "rct"}：处理 \code{A} 随机化，与协变量 \code{X} 独立
#'     （\code{A} 没有任何父节点），因此不存在混杂，未调整的差分即可无偏估计 ATE。
#'   \item \code{design = "obs"}：处理概率 \code{e} 由协变量决定（病情越重越易接受
#'     治疗，confounding by indication），\code{X} 同时是 \code{A} 与结局 \code{Y}
#'     的共同原因，打开了一条后门路径 \code{A <- e <- X -> mu -> Y}，
#'     必须调整 \code{X}：S/T/X 把 \code{X} 放进结局模型条件化，R 走 Robinson
#'     残差化，DR 走 AIPW 双重稳健。
#' }
#' 两种设计里，\code{X} 都同时驱动真实 CATE（\code{tau}，效应修饰）与基线结局
#' （\code{mu}，预后），这正是异质处理效应（HTE）存在的来源。
#'
#' 图中任意两个节点之间只有一条有向边；若某条边会从第三个节点身上穿过，
#' 自动加曲率绕行（见 \code{\link{mlr3HTE_dag_data}} 的 \code{curve} 列）。
#'
#' @param design 研究设计，\code{"rct"}（随机化）或 \code{"obs"}（观察性 / 有混杂）。
#' @param outcome 结局类型，\code{"continuous"}（连续）、\code{"binary"}（二分类）或
#'   \code{"survival"}（生存）。仅影响图标题与节点文字，不改变因果结构。
#'
#' @return 一个 \code{ggplot} 对象，可用 \code{+} 继续定制或 \code{ggsave()} 导出。
#' @seealso \code{\link{mlr3HTE_dag_data}}
#' @export
#'
#' @examples
#' if (requireNamespace("ggplot2", quietly = TRUE)) {
#'   p <- mlr3HTE_dag("rct", "continuous")
#'   class(p)
#'   head(mlr3HTE_dag_data("obs", "survival")$edges)
#' }
mlr3HTE_dag <- function(design = c("rct", "obs"),
                        outcome = c("continuous", "binary", "survival")) {
  design <- match.arg(design)
  outcome <- match.arg(outcome)
  if (!requireNamespace("ggplot2", quietly = TRUE)) {
    stop("绘制 DAG 需要 ggplot2，请先安装：install.packages('ggplot2')")
  }
  dd <- mlr3HTE_dag_data(design, outcome)
  nodes <- dd$nodes
  edges <- dd$edges
  edges$col <- ifelse(edges$type == "conf", "#E45756", "#888888")

  role_fill <- c(cov = "#4C78A8", trt = "#F58518", eff = "#B279A2",
                 prog = "#54A24B", out = "#E45756", ps = "#E45756")

  # geom_curve 的 curvature 是**参数**而不是 aesthetic，不能放进 aes() 里
  # 逐行取值（会报 "Ignoring unknown aesthetics: curvature" 并且全部退化成
  # 默认曲率）。所以按曲率分组，一组一层，各自传自己的 curvature。
  edge_layers <- lapply(split(edges, edges$curve), function(chunk) {
    ggplot2::geom_curve(
      data = chunk,
      ggplot2::aes(x = xs, y = ys, xend = xe, yend = ye, color = I(col)),
      curvature = chunk$curve[1],
      arrow = ggplot2::arrow(length = ggplot2::unit(0.11, "inches"),
                             type = "closed"),
      linewidth = 1.05, alpha = 0.92, ncp = 40
    )
  })

  ggplot2::ggplot() +
    edge_layers +
    ggplot2::geom_label(
      data = nodes,
      ggplot2::aes(x = x, y = y, label = label, fill = I(role_fill[role])),
      color = "white", size = 4.0, fontface = "bold",
      label.padding = ggplot2::unit(0.22, "lines"),
      linewidth = 0) +
    ggplot2::scale_x_continuous(limits = c(-0.35, 8.5), expand = c(0, 0)) +
    ggplot2::scale_y_continuous(limits = c(0.25, 4.65), expand = c(0, 0)) +
    ggplot2::theme_void() +
    ggplot2::theme(
      plot.title = ggplot2::element_text(size = 14, face = "bold", hjust = 0.5),
      plot.subtitle = ggplot2::element_text(size = 10.5, hjust = 0.5,
                                            color = "#333333"),
      plot.caption = ggplot2::element_text(size = 9, hjust = 0.5,
                                           color = "#777777"),
      plot.margin = ggplot2::margin(6, 12, 16, 12),
      legend.position = "none"
    ) +
    ggplot2::labs(
      title = paste0("DAG · ", design, " · ", dd$outcome_zh,
                     " (", dd$outcome_en, ")"),
      subtitle = dd$subtitle,
      caption = "协变量 X = age, lac, tumor, sex（其中 lac、tumor 标准化为 z1、z2）"
    )
}
