# 目的：用用户虚拟环境（dowhy）里的 econml / causalml 生成基准数据集 CSV + 元信息
# 输入：econml.data.dgps.ihdp_surface_B / causalml.dataset.make_uplift_classification / causalml.dataset.regression.synthetic_data
# 输出：inst/extdata/benchmarks/{econml_ihdp,causalml_uplift,causalml_continuous}.csv + benchmarks_meta.csv
# 依赖：D:/Analysis/Anaconda3/envs/dowhy 环境（含 econml 0.16.0 与 causalml 0.15.5 定制版）
# 说明：该环境的 econml/causalml 为定制版，函数名与上游不同，但均带真实 CATE：
#       econml.ihdp_surface_B -> (Y, T, X, true_TE)
#       causalml.make_uplift_classification -> DataFrame，含 treatment_effect（真实 uplift）
#       causalml.regression.synthetic_data -> (y, X, w, tau, b, e)，tau 即真实 CATE

import warnings, os, json
warnings.filterwarnings("ignore")
import numpy as np
import pandas as pd

OUT = "D:/Project/mlr3_HTE/mlr3HTE/inst/extdata/benchmarks"
os.makedirs(OUT, exist_ok=True)
SEED = 20261001
np.random.seed(SEED)

meta = []  # 收集元信息

# 1 econml IHDP（响应曲面 B，异质 CATE）------------------------------------------
from econml.data.dgps import ihdp_surface_B
Y, T, X, true_TE = ihdp_surface_B(random_state=SEED)
df = pd.DataFrame({
    "outcome": np.asarray(Y, float),
    "treatment": np.asarray(T, int),
    **{f"x{i+1}": np.asarray(X[:, i], float) for i in range(X.shape[1])},
    "cate_true": np.asarray(true_TE, float),
})
df.to_csv(os.path.join(OUT, "econml_ihdp.csv"), index=False)
meta.append(dict(
    dataset="econml_ihdp", source_package="econml", source_function="econml.data.dgps.ihdp_surface_B",
    n=len(df), n_features=X.shape[1], outcome_type="continuous", treatment_type="binary",
    has_ground_truth="yes", true_ate=round(float(df["cate_true"].mean()), 4),
    description="econml 内置 IHDP 模拟基准（响应曲面 B，异质处理效应）；真实 CATE 由模拟给出。该定制版 econml 无经典 ihdp()/twins()/jobs()，以此替代。",
    columns=",".join(df.columns),
))

# 2 causalml uplift 分类（合成，带真实 uplift）-----------------------------------
from causalml.dataset.classification import make_uplift_classification
out = make_uplift_classification(n_samples=2000, n_classification_features=10, random_seed=SEED)
upl = out[0] if isinstance(out, tuple) else out
upl = upl.rename(columns={"treatment_effect": "cate_true"})
upl.to_csv(os.path.join(OUT, "causalml_uplift.csv"), index=False)
meta.append(dict(
    dataset="causalml_uplift", source_package="causalml", source_function="causalml.dataset.classification.make_uplift_classification",
    n=len(upl), n_features=sum(1 for c in upl.columns if c.startswith("x")),
    outcome_type="binary", treatment_type="multinomial(control/treatment1-3)",
    has_ground_truth="yes", true_ate=round(float(upl["cate_true"].mean()), 4),
    description="causalml 合成 uplift 分类数据（上游 make_uplift 的等价物）；treatment_effect 列为真实 uplift（相对 control）。",
    columns=",".join(upl.columns),
))

# 3 causalml 连续型合成（Hillstrom 风格，带真实 CATE）-----------------------------
from causalml.dataset.regression import synthetic_data
y, Xc, w, tau, b, e = synthetic_data(mode=1, n=5000, p=10, sigma=1.0, adj=0.0)
dfc = pd.DataFrame({
    "outcome": np.asarray(y, float),
    **{f"x{i+1}": np.asarray(Xc[:, i], float) for i in range(Xc.shape[1])},
    "treatment": np.asarray(w, int),
    "cate_true": np.asarray(tau, float),
    "baseline": np.asarray(b, float),
    "propensity": np.asarray(e, float),
})
dfc.to_csv(os.path.join(OUT, "causalml_continuous.csv"), index=False)
meta.append(dict(
    dataset="causalml_continuous", source_package="causalml", source_function="causalml.dataset.regression.synthetic_data",
    n=len(dfc), n_features=Xc.shape[1], outcome_type="continuous", treatment_type="binary",
    has_ground_truth="yes", true_ate=round(float(dfc["cate_true"].mean()), 4),
    description="causalml 合成连续型数据（上游 make_continuous/Hillstrom 的等价物）；tau 为真实 CATE，另含 baseline 与 propensity。",
    columns=",".join(dfc.columns),
))

# 写出元信息表 --------------------------------------------------------------------
meta_df = pd.DataFrame(meta, columns=["dataset","source_package","source_function","n","n_features",
                                      "outcome_type","treatment_type","has_ground_truth","true_ate","description","columns"])
meta_df.to_csv(os.path.join(OUT, "benchmarks_meta.csv"), index=False)

print("=== 生成完成 ===")
for m in meta:
    print(f"  {m['dataset']}: n={m['n']} feat={m['n_features']} trueATE={m['true_ate']}")
print("  benchmarks_meta.csv 行数:", len(meta_df))
