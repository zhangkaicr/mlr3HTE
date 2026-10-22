# 目的：给 5 个「代码打不出文档里那份输出」的案例补上真实打印小节标题的语句。
#       原状态：文档输出里带 `--- 数据卡 ---` 这类分隔标题，但示例代码只是
#       顺序跑几条语句，从不打印这些标题 —— 读者复制代码会得到不一样的东西。
#       本脚本改的是 dev/_audit/case_XXX.R（从文档抽出来的那份代码），
#       改完用它重跑出新输出，再由 _apply_example_fix.py 写回 content-api.js。
# 输入：dev/_audit/case_0{11,13,19,21,31}.R
# 输出：同文件就地覆盖（已先备份为 .old.R）
# 依赖：无

# 0 环境与依赖 ----
audit_dir <- "dev/_audit"

# 1 逐案例插入小节标题 ---------------------------------------------------------
# 标题文字必须与文档里已有的完全一致，否则等于又制造一处不一致。
inserts <- list(
  "011" = list(
    list(after = "mlr3HTE_demo_data(n = 1200, seed = 1201)", cat = "--- 数据卡 ---", blank_before = FALSE),
    list(after = "处理率 = mean(d$A))",                       cat = "--- X 的列与前 3 行 ---", blank_before = TRUE),
    list(after = "head(d$X, 3)",                              cat = "--- 结局类型 ---", blank_before = TRUE)
  ),
  "013" = list(
    list(after = "mlr3HTE_demo_binary(n = 1200, seed = 1203)", cat = "--- 数据卡 ---", blank_before = FALSE),
    list(after = "结局率 = mean(d$Y))",                        cat = "--- Y 是 0/1 ---", blank_before = TRUE)
  ),
  "019" = list(
    list(after = "删失比例 = 1 - mean(d$Y[, 2L]))", cat = "--- Y 是 Surv 矩阵 ---", blank_before = TRUE)
  ),
  "021" = list(
    list(after = "删失比例 = 1 - mean(d$Y[, 2L]))", cat = "--- Y 是 Surv 矩阵 ---", blank_before = TRUE)
  ),
  "031" = list(
    list(after = "dr_pseudo_outcome(d$X, d$A, d$Y, seed = 1)", cat = "--- 返回的字段 ---", blank_before = FALSE),
    list(after = "tibble(DR_ATE = mean(dr$pseudo), 真实ATE = d$ate)", cat = "--- 伪结局的均值 = DR 估计的 ATE ---", blank_before = TRUE),
    list(after = "mu1_mean = mean(dr$mu1), mu0_mean = mean(dr$mu0))", cat = "--- 三件套的范围 ---", blank_before = TRUE)
  )
)

# 2 按行匹配插入 ---------------------------------------------------------------
# 用「整行以某片段结尾」判断位置，避免子串误命中。
for (tag in names(inserts)) {
  f <- file.path(audit_dir, sprintf("case_%s.R", tag))
  lines <- readLines(f, warn = FALSE, encoding = "UTF-8")
  # 从后往前插，插完不会打乱前面的行号
  rules <- inserts[[tag]]
  for (k in rev(seq_along(rules))) {
    r <- rules[[k]]
    hit <- which(endsWith(trimws(lines, which = "right"), r$after))
    if (length(hit) != 1L) {
      stop(sprintf("case_%s: 片段「%s」命中 %d 次，期望 1 次", tag, r$after, length(hit)))
    }
    head_txt <- if (r$blank_before) sprintf('cat("\\n%s\\n")', r$cat) else sprintf('cat("%s\\n")', r$cat)
    lines <- append(lines, head_txt, after = hit)
  }
  writeLines(lines, f, useBytes = TRUE)
  cli::cli_alert_info("case_{tag} 已插入 {length(rules)} 处标题")
}

# 99 收尾 ----
cli::cli_alert_success("5 个案例的示例代码已补齐小节标题")
