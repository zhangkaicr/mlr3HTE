# grf_causal

- **来源包**: grf
- **生成函数**: `grf::generate_causal_data()`
- **样本量**: 2000，特征数: 10
- **结局类型**: continuous
- **处理类型**: binary
- **是否含真实处理效应**: yes（列名 `cate_true`，真实 ATE ≈ 0.0689）

## 字段说明

| 列名 | 含义 |
| --- | --- |
| treatment / treatment_group_key | 处理分配（0/1 或 control/treatment1-3） |
| outcome / conversion / time+event | 结局（连续 / 二分类 / 生存时间+事件） |
| x1..xN | 协变量特征 |
| cate_true | **真实个体处理效应**（评估 HTE 估计量的黄金标准） |

## 说明

grf 内置合成因果数据（连续结局），真实 CATE 由生成器给出。

完整数据字典见 [benchmarks_meta.csv](../benchmarks_meta.csv)。生成脚本：grf 用 `dev/_gen_grf.R`，econml/causalml 用 `dev/_gen_python.py`。
