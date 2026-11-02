# =====================================================================
# dag.R
# Purpose: draw a companion causal diagram (DAG) for the demo datasets, illustrating
#          "why RCTs have no confounding, while observational data suffer from
#          confounding by indication". Pure ggplot2 implementation, without pulling
#          in heavy dependencies such as ggdag.
# Input:  design (rct / obs), outcome (continuous / binary / survival)
# Output: mlr3HTE_dag() returns a ggplot; mlr3HTE_dag_data() returns nodes and edges
# Depends on: ggplot2
#
# Key conventions about arrows (fixed in v0.34):
#   Between any two nodes only **one** directed edge is allowed, and no edge is
#   allowed to pass through a third node. In earlier versions A -> Y was a straight
#   line that happened to pass through the mu node, visually looking like "two arrows
#   between mu and Y", leaving readers unable to tell which is which.
#   Now: edges are first de-duplicated, then .route_edges() checks each one for
#   passing through another node, and if so automatically adds curvature to that edge
#   (binary search for the minimal feasible curvature) to route it around the node.
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
#' Plotting data for the DAG (nodes and edges)
#'
#' @description
#' The node table and edge table used by \code{\link{mlr3HTE_dag}} for plotting.
#' Provided separately to facilitate redrawing with other tools (ggraph, DiagrammeR)
#' or inspecting the routing result of each edge.
#'
#' @param design The study design, \code{"rct"} or \code{"obs"}.
#' @param outcome The outcome type, which only affects the title text and does not
#'   change the causal structure.
#' @return A list:
#'   \itemize{
#'     \item \code{nodes}: \code{id} / \code{x} / \code{y} / \code{label} / \code{role}
#'     \item \code{edges}: \code{from} / \code{to} / \code{type} (\code{"conf"} is the
#'       confounding path drawn in red) / \code{x} \code{y} \code{xend} \code{yend}
#'       (original endpoints) / \code{xs} \code{ys} \code{xe} \code{ye} (endpoints
#'       after retreating, used for drawing) / \code{curve} (the edge's curvature; 0
#'       means a straight line)
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

#' Causal diagram (DAG): the data-generating mechanism of the demo datasets
#'
#' @description
#' Draw a companion causal directed acyclic graph (DAG) for the mlr3HTE demo
#' datasets, illustrating the **data-generating mechanism (DGP)** and **where the
#' truth comes from**:
#' \itemize{
#'   \item \code{design = "rct"}: treatment \code{A} is randomized and independent of
#'     covariates \code{X} (\code{A} has no parent), so there is no confounding and the
#'     unadjusted difference is an unbiased estimate of the ATE.
#'   \item \code{design = "obs"}: the treatment probability \code{e} is determined by
#'     covariates (the sicker you are, the more likely you receive treatment,
#'     confounding by indication), and \code{X} is a common cause of both \code{A} and
#'     the outcome \code{Y}, opening a back-door path \code{A <- e <- X -> mu -> Y};
#'     \code{X} must be adjusted: S/T/X condition on \code{X} in the outcome model, R
#'     uses Robinson residualization, DR uses AIPW doubly robust estimation.
#' }
#' In both designs, \code{X} simultaneously drives the true CATE (\code{tau}, effect
#' modification) and the baseline outcome (\code{mu}, prognosis), which is exactly the
#' source of heterogeneous treatment effects (HTE).
#'
#' In the diagram there is only one directed edge between any two nodes; if an edge
#' would pass through a third node, curvature is added automatically to route around
#' it (see the \code{curve} column of \code{\link{mlr3HTE_dag_data}}).
#'
#' @param design The study design, \code{"rct"} (randomized) or \code{"obs"}
#'   (observational / with confounding).
#' @param outcome The outcome type, \code{"continuous"} (continuous), \code{"binary"}
#'   (binary) or \code{"survival"} (survival). It only affects the plot title and node
#'   text, not the causal structure.
#'
#' @return A \code{ggplot} object, which can be further customized with \code{+} or
#'   exported with \code{ggsave()}.
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
