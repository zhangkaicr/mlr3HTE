# -*- coding: utf-8 -*-
# 目的：以 UTF-8 重写 benchmarks_meta.csv（修复此前 GBK 写入导致的中文乱码）
# 输入：inst/extdata/benchmarks/*.csv（数据本身正确，仅取统计量与列结构）
# 输出：inst/extdata/benchmarks/benchmarks_meta.csv（UTF-8，含中文描述）
# 说明：Windows 下 open() 默认 GBK，必须显式 encoding="utf-8" 才不会乱码。
import csv, os, glob

OUT = "inst/extdata/benchmarks"
datasets = ["grf_causal", "grf_survival", "econml_ihdp",
            "causalml_uplift", "causalml_continuous"]

# 静态描述（中文，UTF-8 源文件 + UTF-8 写出 = 不乱码）
desc = {
    "grf_causal": "grf 内置合成因果数据（连续结局），真实 CATE 由生成器给出。用于评估连续 HTE 估计量。",
    "grf_survival": "grf 内置合成生存因果数据（含删失），真实 CATE 为 t0 时点生存概率差。用于评估生存 HTE 估计量。",
    "econml_ihdp": "econml 的 IHDP 基准（婴儿健康与发展干预），真实 CATE 已知，是 HTE 文献最常用的基准之一。",
    "causalml_uplift": "causalml 合成 uplift 数据，多处理组（control/treatment1-3），真实 uplift 已知，用于 uplift 建模评估。",
    "causalml_continuous": "causalml 合成连续结局数据（Hillstrom 邮件营销风格），真实 CATE 已知，并附 baseline 与 propensity。",
}
src_pkg = {"grf_causal": "grf", "grf_survival": "grf", "econml_ihdp": "econml",
           "causalml_uplift": "causalml", "causalml_continuous": "causalml"}
src_fn = {
    "grf_causal": "grf::generate_causal_data()",
    "grf_survival": "grf::generate_causal_survival_data()",
    "econml_ihdp": "econml.data.dgps.ihdp_surface_B()",
    "causalml_uplift": "causalml.dataset.classification.make_uplift_classification()",
    "causalml_continuous": "causalml.dataset.regression.synthetic_data()",
}
outcome_type = {"grf_causal": "continuous", "grf_survival": "survival(time+event)",
                "econml_ihdp": "continuous", "causalml_uplift": "binary",
                "causalml_continuous": "continuous"}
treat_type = {"grf_causal": "binary", "grf_survival": "binary", "econml_ihdp": "binary",
              "causalml_uplift": "multinomial(control/treatment1-3)", "causalml_continuous": "binary"}
columns = {
    "grf_causal": "treatment,outcome,x1..x10,cate_true",
    "grf_survival": "treatment,time,event,x1..x10,cate_true",
    "econml_ihdp": "outcome,treatment,x1..x26,cate_true",
    "causalml_uplift": "treatment_group_key,x1_informative..x19_increase_mix,conversion,cate_true",
    "causalml_continuous": "outcome,x1..x10,treatment,cate_true,baseline,propensity",
}

rows = []
for nm in datasets:
    path = os.path.join(OUT, nm + ".csv")
    with open(path, encoding="utf-8") as f:
        r = list(csv.reader(f))
    header = r[0]
    n = len(r) - 1
    reserved = {"treatment", "outcome", "time", "event", "treatment_group_key",
                "conversion", "cate_true", "baseline", "propensity"}
    n_feat = len([c for c in header if c not in reserved])
    # 真值 ATE = cate_true 均值（第 2 行起，最后一列应为 cate_true）
    ci = header.index("cate_true")
    vals = [float(row[ci]) for row in r[1:] if row[ci] != ""]
    true_ate = round(sum(vals) / len(vals), 4)
    rows.append([nm, src_pkg[nm], src_fn[nm], n, n_feat, outcome_type[nm],
                 treat_type[nm], "yes", true_ate, desc[nm], columns[nm]])

header_out = ["dataset", "source_package", "source_function", "n", "n_features",
              "outcome_type", "treatment_type", "has_ground_truth", "true_ate",
              "description", "columns"]
with open(os.path.join(OUT, "benchmarks_meta.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(header_out)
    w.writerows(rows)
print("benchmarks_meta.csv 已用 UTF-8 写出，行数:", len(rows))
for row in rows:
    print(" ", row[0], "n=", row[3], "feat=", row[4], "ATE=", row[8])

# 每个数据集的「说明」专有注释（保留各集特有信息）
readme_note = {
    "grf_causal": "grf 内置合成因果数据（连续结局），真实 CATE 由生成器给出。",
    "grf_survival": "grf 内置合成生存因果数据，cate_true 为生存概率差尺度真实 CATE。",
    "econml_ihdp": "econml 内置 IHDP 模拟基准（响应曲面 B，异质处理效应）；该定制版 econml 无经典 ihdp()/twins()/jobs()，以此替代。",
    "causalml_uplift": "causalml 合成 uplift 分类数据（上游 make_uplift 等价物）；cate_true 即相对 control 的真实 uplift。",
    "causalml_continuous": "causalml 合成连续型数据（上游 make_continuous/Hillstrom 等价物）；另含 baseline 与 propensity。",
}

for row in rows:
    nm, pkg, fn, n, n_feat, otype, ttype, _, ate, _, cols = row
    md = (
        "# %s\n\n"
        "- **来源包**: %s\n"
        "- **生成函数**: `%s`\n"
        "- **样本量**: %s，特征数: %s\n"
        "- **结局类型**: %s\n"
        "- **处理类型**: %s\n"
        "- **是否含真实处理效应**: yes（列名 `cate_true`，真实 ATE ≈ %s）\n\n"
        "## 字段说明\n\n"
        "| 列名 | 含义 |\n"
        "| --- | --- |\n"
        "| treatment / treatment_group_key | 处理分配（0/1 或 control/treatment1-3） |\n"
        "| outcome / conversion / time+event | 结局（连续 / 二分类 / 生存时间+事件） |\n"
        "| x1..xN | 协变量特征 |\n"
        "| cate_true | **真实个体处理效应**（评估 HTE 估计量的黄金标准） |\n\n"
        "## 说明\n\n"
        "%s\n\n"
        "完整数据字典见 [benchmarks_meta.csv](../benchmarks_meta.csv)。"
        "生成脚本：grf 用 `dev/_gen_grf.R`，econml/causalml 用 `dev/_gen_python.py`。\n"
    ) % (nm, pkg, fn, n, n_feat, otype, ttype, ate, readme_note[nm])
    with open(os.path.join(OUT, nm + "_README.md"), "w", encoding="utf-8") as f:
        f.write(md)
print("5 个 README.md 已用 UTF-8 写出")
