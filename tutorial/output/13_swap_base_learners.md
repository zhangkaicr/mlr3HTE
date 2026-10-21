# 换基学习器：mlr3 生态随便挑

同一套 T-learner 配方，只改 `learner_base = lrn("regr.xxx")` 一行，
就能在随机森林 / XGBoost / GLMnet / CART 决策树 / 线性回归之间切换。
下方为连续 RCT 模拟数据（n=4000，真值 ATE = 1.048）上的实测：

## 各基学习器的 ATE 与 CATE 相关

| 算法 | ATE | ATE偏差 | CATE相关 |
| --- | --- | --- | --- |
| ranger | 0.9496 | -0.0981 | 0.843 |
| xgboost | 0.9601 | -0.0876 | 0.656 |
| glmnet | 0.9545 | -0.0932 | 0.986 |
| rpart | 0.9572 | -0.0905 | 0.907 |
| lm | 0.9546 | -0.0931 | 0.987 |

## benchmark：跨基学习器的 5 折 CV MSE

| learner_id | regr.mse |
| --- | --- |
| T_ranger | 34.61219 |
| T_ranger | 34.49744 |
| T_ranger | 35.45111 |
| T_ranger | 34.46372 |
| T_ranger | 35.52809 |
| T_xgboost | 35.36248 |
| T_xgboost | 35.42636 |
| T_xgboost | 36.16108 |
| T_xgboost | 34.82570 |
| T_xgboost | 36.35150 |

结论：换算法不影响 mlr3HTE 的接口与流程，只影响拟合能力与噪声；
这正是基于 mlr3 体系而非自写训练循环的核心收益。
