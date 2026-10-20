const DATA = `from sklearn.datasets import load_iris
import numpy as np

iris = load_iris()
X, y = iris.data, iris.target
`;
const SPLIT = DATA + `
from sklearn.model_selection import train_test_split
train_x, test_x, train_y, test_y = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
`;

export const lessons = [
  {
    title: '认识 Iris 数据集', short: '数据与问题', group: '准备工作', version: 'START', time: '8 分钟', tag: '数据探索', page: '1–2',
    intro: '从 150 朵鸢尾花开始，走完一次机器学习实验。先弄清楚：模型看到了什么，又需要预测什么？',
    theory: '<p>分类预测<strong>类别</strong>（如花的品种）；回归预测连续数值（如房价）；聚类在没有标签时寻找数据中的组。它们是常见任务，机器学习还包含其他任务。</p><p>Iris 是一个三分类数据集：150 个样本、4 个数值特征、3 个品种，每种 50 个样本。<code>X</code> 是特征，<code>y</code> 是标签。此处的内置数据可直接使用，不意味着所有数据都已清洗好。</p>',
    goals: ['使用 load_iris() 加载数据', '将特征、标签分别存入 X 和 y', '打印两个数组的 shape，观察数据预览'],
    hint: 'load_iris() 返回一个 Bunch 对象。特征在 iris.data 中，标签在 iris.target 中。shape 是属性，不加括号。',
    starter: `from sklearn.datasets import load_iris

iris = load_iris()
# TODO：用 iris 的属性替换下方的 ...
X = ...
y = ...

print("特征形状：", X.shape)
print("标签形状：", y.shape)
print("品种：", iris.target_names)
`,
    solution: DATA + `
print("特征形状：", X.shape)
print("标签形状：", y.shape)
print("品种：", iris.target_names)
`,
    checks: `from sklearn.datasets import load_iris as _load
import numpy as _np
_ref = _load()
check('X 正确包含 150 个样本、4 个特征', isinstance(X, _np.ndarray) and X.shape == (150, 4) and _np.array_equal(X, _ref.data))
check('y 正确包含 150 个品种标签', isinstance(y, _np.ndarray) and y.shape == (150,) and _np.array_equal(y, _ref.target))`,
    quiz: { question: '根据花萼和花瓣尺寸，预测鸢尾花的品种，属于什么任务？', options: ['回归', '分类', '聚类'], answer: 1, explanation: '目标是 setosa、versicolor、virginica 三个离散类别，因此是有监督的三分类任务。' },
    visual: 'scatter'
  },
  {
    title: '给模型留一份“期末卷”', short: '划分数据集', group: '准备工作', version: 'START', time: '10 分钟', tag: '数据划分', page: '2',
    intro: '模型需要在没见过的数据上接受检验。把数据分成训练集和测试集，建立公平的实验起点。',
    theory: '<p><code>train_test_split</code> 将数据拆为训练集和测试集。训练集用于学习与模型选择；测试集保留到方案确定后，评估泛化能力。</p><p><code>test_size=0.2</code> 留出 30 个样本；<code>random_state=42</code> 固定随机性；<code>stratify=y</code> 让两部分保持品种比例。本课程统一采用 80% / 20%，原讲义示例为 90% / 10%。</p>',
    goals: ['使用 20% 的样本作为测试集', '固定 random_state=42，并按 y 分层', '打印训练、测试特征的形状'],
    hint: '函数依次返回 train_x, test_x, train_y, test_y。将 test_size 设为 0.2，random_state 设为 42，stratify 设为 y。',
    starter: DATA + `
from sklearn.model_selection import train_test_split
train_x, test_x, train_y, test_y = train_test_split(
    X, y, test_size=..., random_state=..., stratify=...
)
print("训练集：", train_x.shape)
print("测试集：", test_x.shape)
print("测试集各类数量：", np.bincount(test_y))
`,
    solution: SPLIT + `
print("训练集：", train_x.shape)
print("测试集：", test_x.shape)
print("测试集各类数量：", np.bincount(test_y))
`,
    checks: `from sklearn.model_selection import train_test_split as _split
import numpy as _np
_a, _b, _c, _d = _split(X, y, test_size=0.2, random_state=42, stratify=y)
check('训练与测试特征为正确的 120 / 30 划分', _np.array_equal(train_x, _a) and _np.array_equal(test_x, _b))
check('标签与特征匹配，且采用固定种子的分层抽样', _np.array_equal(train_y, _c) and _np.array_equal(test_y, _d))`,
    quiz: { question: '为什么不能根据测试集分数反复选择参数？', options: ['测试集会间接参与模型选择，评估可能偏乐观', '测试集样本不能包含数字', '每个模型只能调用一次 predict'], answer: 0, explanation: '反复看测试分数再改方案，会泄露测试集信息。用训练集上的交叉验证选模型，再用保留测试集做最终评估。' }, visual: 'split'
  },
  {
    title: '训练第一个 SVM 分类器', short: 'SVM 分类', group: 'V1.0 · 基础建模', version: 'V1.0', time: '12 分钟', tag: '模型训练', page: '3–5',
    intro: '导入、实例化、fit、predict、评估。掌握这一条工作流，就能开始使用 scikit-learn 中的许多模型。',
    theory: '<p><code>SVC</code> 是支持向量分类器，默认使用 RBF 核。<code>fit(train_x, train_y)</code> 学习特征与标签的关系；<code>predict(test_x)</code> 给出预测类别。</p><p><code>accuracy_score</code> 是<strong>准确率</strong>：正确预测数 / 总样本数，不是 precision（精确率）。本节用固定划分观察基础结果；后续用训练集交叉验证进行模型选择。</p>',
    goals: ['实例化 SVC()，保存为 model', '在 train_x 和 train_y 上拟合', '保存 test_pred 和 test_acc，并输出准确率'],
    hint: 'model.fit(train_x, train_y) → test_pred = model.predict(test_x) → test_acc = accuracy_score(test_y, test_pred)。',
    starter: SPLIT + `
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

model = SVC()
# TODO：补全训练与预测
model.fit(..., ...)
test_pred = model.predict(...)
test_acc = accuracy_score(..., ...)
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    solution: SPLIT + `
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
model = SVC()
model.fit(train_x, train_y)
test_pred = model.predict(test_x)
test_acc = accuracy_score(test_y, test_pred)
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    checks: `from sklearn.svm import SVC as _SVC
from sklearn.metrics import accuracy_score as _acc
import numpy as _np
_ref = _SVC(**model.get_params()).fit(train_x, train_y)
check('SVC 在训练集上完成拟合并输出正确预测', isinstance(model, _SVC) and _np.array_equal(model.support_vectors_, _ref.support_vectors_) and _np.array_equal(test_pred, _ref.predict(test_x)))
check('test_acc 来自正确的测试标签与预测', abs(float(test_acc) - _acc(test_y, test_pred)) < 1e-10)`,
    quiz: { question: 'model.fit() 应该接收哪一组数据？', options: ['test_x 和 test_y', 'train_x 和 test_y', 'train_x 和 train_y'], answer: 2, explanation: 'fit 在训练集特征和对应标签上学习。测试集用来检验模型的泛化能力。' }, visual: 'workflow'
  },
  {
    title: '换一个模型：逻辑回归', short: '逻辑回归', group: 'V1.0 · 基础建模', version: 'V1.0', time: '10 分钟', tag: '模型迁移', page: '5',
    intro: '保留同一套数据与工作流，把 SVC 换成 LogisticRegression。你会发现：接口相同，建模思想不同。',
    theory: '<p>名字中虽然有“回归”，<code>LogisticRegression</code> 解决的是分类问题。它通过线性组合特征来估计类别概率。</p><p>设置 <code>max_iter=1000</code> 为优化过程留出足够迭代次数。本节保持原始特征以便对照讲义；综合挑战会使用 <code>StandardScaler</code> 和 <code>Pipeline</code>。</p>',
    goals: ['创建 LogisticRegression(max_iter=1000)', '训练 model，并生成 test_pred', '计算 test_acc，观察与 SVM 的差别'],
    hint: '从 sklearn.linear_model 导入 LogisticRegression。其余 fit、predict、accuracy_score 的写法和 SVC 相同。',
    starter: SPLIT + `
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
model = LogisticRegression(max_iter=1000)
# TODO：补全下面三行
model.fit(..., ...)
test_pred = ...
test_acc = ...
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    solution: SPLIT + `
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
model = LogisticRegression(max_iter=1000)
model.fit(train_x, train_y)
test_pred = model.predict(test_x)
test_acc = accuracy_score(test_y, test_pred)
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    checks: `from sklearn.linear_model import LogisticRegression as _LR
from sklearn.metrics import accuracy_score as _acc
import numpy as _np
_ref = _LR(**model.get_params()).fit(train_x, train_y)
check('逻辑回归已在训练集拟合，预测与模型一致', isinstance(model, _LR) and model.max_iter >= 1000 and _np.allclose(model.coef_, _ref.coef_) and _np.array_equal(test_pred, model.predict(test_x)))
check('准确率的计算与测试标签一致', abs(float(test_acc) - _acc(test_y, test_pred)) < 1e-10)`,
    quiz: { question: 'LogisticRegression 在本实验中预测的是什么？', options: ['花瓣长度的连续数值', '鸢尾花的品种类别', '没有标签的数据簇'], answer: 1, explanation: '逻辑回归是一种分类方法。本实验中它预测三种鸢尾花类别。' }, visual: 'workflow'
  },
  {
    title: '让多棵树一起投票', short: '随机森林', group: 'V1.0 · 基础建模', version: 'V1.0', time: '10 分钟', tag: '集成学习', page: '5–6',
    intro: '一棵树可能会记住训练样本。随机森林组合多棵决策树，通过投票给出分类结果。',
    theory: '<p><code>RandomForestClassifier</code> 属于集成学习。<code>n_estimators</code> 控制树的数量，<code>max_depth</code> 限制树的深度，<code>random_state</code> 固定随机性。</p><p>训练准确率达到 100% 不代表泛化能力也完美。尝试把 <code>max_depth</code> 改为 1、3、None，观察训练结果的变化；正式选参应使用训练集交叉验证。</p>',
    goals: ['创建含 80 棵树的随机森林，random_state=42', '在训练集拟合并保存 test_pred', '计算并输出 test_acc'],
    hint: 'RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)。n_jobs=1 适合浏览器中运行。',
    starter: SPLIT + `
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
model = RandomForestClassifier(n_estimators=..., random_state=42, n_jobs=1)
model.fit(..., ...)
test_pred = ...
test_acc = ...
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    solution: SPLIT + `
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
model = RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)
model.fit(train_x, train_y)
test_pred = model.predict(test_x)
test_acc = accuracy_score(test_y, test_pred)
print(f"训练准确率：{model.score(train_x, train_y):.4f}")
print(f"测试准确率：{test_acc:.4f}")
`,
    checks: `from sklearn.ensemble import RandomForestClassifier as _RF
from sklearn.metrics import accuracy_score as _acc
import numpy as _np
_ref = _RF(**model.get_params()).fit(train_x, train_y)
check('80 棵树、固定种子，且预测来自训练集拟合的模型', isinstance(model, _RF) and model.n_estimators == 80 and model.random_state == 42 and _np.array_equal(test_pred, _ref.predict(test_x)) and _np.allclose(model.feature_importances_, _ref.feature_importances_))
check('测试准确率计算正确', abs(float(test_acc) - _acc(test_y, test_pred)) < 1e-10)`,
    quiz: { question: '训练准确率 100%，测试准确率 90%，能得出什么结论？', options: ['模型已经完美', '树越多，测试准确率必然越高', '可能存在过拟合，应结合交叉验证继续评估'], answer: 2, explanation: '训练表现好不保证对新数据也好；单次测试差异也有随机性，需要更稳健的评估。' }, visual: 'workflow'
  },
  {
    title: '用五折验证比较三个模型', short: '交叉验证', group: 'V2.0 · 稳健评估', version: 'V2.0', time: '15 分钟', tag: '模型评估', page: '6–12',
    intro: '把训练集轮流分成训练部分和验证部分。让比较建立在多次验证上，而不是一次幸运的划分上。',
    theory: '<p>五折交叉验证会训练 5 次，每一折轮流作验证集。<code>cross_val_score</code> 每次克隆并训练模型，无需提前 fit。这里只传入 <code>train_x, train_y</code>。</p><p>使用相同的 <code>StratifiedKFold</code> 比较 SVM、逻辑回归、随机森林。均值描述平均验证表现，标准差描述折间波动；均值 ± 2 倍标准差<strong>不能直接解释为严格置信区间</strong>。</p>',
    goals: ['创建 5 折、shuffle=True、random_state=42 的分层划分器 cv', '在训练集上对三个模型计算 accuracy', '将每个模型的五个分数存入 scores 字典'],
    hint: 'scores[name] = cross_val_score(model, train_x, train_y, cv=cv, scoring="accuracy", n_jobs=1)。测试集不传给这个函数。',
    starter: SPLIT + `
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
models = {"SVM": SVC(), "LR": LogisticRegression(max_iter=1000),
          "RF": RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)}
cv = StratifiedKFold(n_splits=..., shuffle=True, random_state=42)
scores = {}
for name, model in models.items():
    scores[name] = cross_val_score(model, ..., ..., cv=cv, scoring="accuracy", n_jobs=1)
    print(name, np.round(scores[name], 4), "均值：", scores[name].mean())
`,
    solution: SPLIT + `
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
models = {"SVM": SVC(), "LR": LogisticRegression(max_iter=1000),
          "RF": RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = {}
for name, model in models.items():
    scores[name] = cross_val_score(model, train_x, train_y, cv=cv, scoring="accuracy", n_jobs=1)
    print(name, np.round(scores[name], 4), "均值：", scores[name].mean(), "标准差：", scores[name].std())
`,
    checks: `from sklearn.model_selection import StratifiedKFold as _SKF, cross_val_score as _cvs
import numpy as _np
check('采用固定随机种子的五折分层验证', isinstance(cv, _SKF) and cv.n_splits == 5 and cv.shuffle and cv.random_state == 42)
_ok = set(scores) == {'SVM','LR','RF'}
if _ok:
    for _name, _model in models.items():
        _expected = _cvs(_model, train_x, train_y, cv=cv, scoring='accuracy', n_jobs=1)
        _ok = _ok and _np.asarray(scores[_name]).shape == (5,) and _np.allclose(scores[_name], _expected)
check('三个模型的分数均来自训练集的五折验证', _ok)`,
    quiz: { question: '五折交叉验证时，应该传入哪些数据？', options: ['保留测试集', '全部数据（包含保留测试集）', '训练集，测试集继续保留'], answer: 2, explanation: '在训练集内部进行模型比较与调参，独立测试集仅用于最终评估。' }, visual: 'cv'
  },
  {
    title: '用网格搜索寻找合适参数', short: '网格调参', group: 'V3.0 · 参数优化', version: 'V3.0', time: '15 分钟', tag: '参数搜索', page: '12–15',
    intro: '把“试一试参数”变成可重复的搜索。用同样的五折划分，比较每组候选参数的验证表现。',
    theory: '<p><code>get_params()</code> 可查看模型参数。<code>GridSearchCV</code> 枚举候选组合，按验证均值选出最优配置，默认再用整个训练集重新拟合。</p><p>本节共 11 组候选：linear 3 组、poly 2 组、rbf 6 组，需要 55 次交叉验证拟合，另加 1 次重新拟合。<code>best_score_</code> 是最佳交叉验证均值，<code>best_params_</code> 是参数，<code>cv_results_</code> 包含所有候选结果。</p>',
    goals: ['建立含 linear、poly、rbf 的参数网格', '使用训练集、五折验证和 accuracy 运行 search', '打印最佳参数与最佳验证均值'],
    hint: 'search = GridSearchCV(SVC(), params, cv=cv, scoring="accuracy", n_jobs=1)，然后 search.fit(train_x, train_y)。',
    starter: SPLIT + `
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV, StratifiedKFold
params = [
    {"kernel": ["linear"], "C": [1, 10, 100]},
    {"kernel": ["poly"], "C": [1], "degree": [2, 3]},
    {"kernel": ["rbf"], "C": [1, 10, 100], "gamma": [0.1, 0.01]}
]
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
search = GridSearchCV(SVC(), ..., cv=cv, scoring="accuracy", n_jobs=1)
search.fit(..., ...)
print("最佳参数：", search.best_params_)
print("最佳验证均值：", search.best_score_)
`,
    solution: SPLIT + `
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV, StratifiedKFold
params = [
    {"kernel": ["linear"], "C": [1, 10, 100]},
    {"kernel": ["poly"], "C": [1], "degree": [2, 3]},
    {"kernel": ["rbf"], "C": [1, 10, 100], "gamma": [0.1, 0.01]}
]
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
search = GridSearchCV(SVC(), params, cv=cv, scoring="accuracy", n_jobs=1)
search.fit(train_x, train_y)
print("最佳参数：", search.best_params_)
print("最佳验证均值：", search.best_score_)
print("候选组合数：", len(search.cv_results_["params"]))
`,
    checks: `from sklearn.model_selection import GridSearchCV as _GS
import numpy as _np
check('完整搜索了 11 个候选参数组合并采用五折验证', isinstance(search, _GS) and len(search.cv_results_['params']) == 11 and search.n_splits_ == 5 and search.scoring == 'accuracy')
_ref = _GS(search.estimator, search.param_grid, cv=search.cv, scoring='accuracy', n_jobs=1).fit(train_x, train_y)
check('最优参数与验证均值来自训练集搜索', search.best_params_ == _ref.best_params_ and _np.allclose(search.cv_results_['mean_test_score'], _ref.cv_results_['mean_test_score']))`,
    quiz: { question: '11 组参数，每组做 5 折验证，交叉验证部分需要拟合几次？', options: ['55 次', '11 次', '5 次'], answer: 0, explanation: '11 × 5 = 55 次。默认 refit=True 还会用最优参数在完整训练集上再拟合一次，总计 56 次。' }, visual: 'grid'
  },
  {
    title: '完成一次可复现的分类实验', short: '综合挑战', group: '综合实践', version: 'CHALLENGE', time: '20 分钟', tag: '独立实践', page: '全篇综合',
    intro: '把前面的技能串起来：在训练集上比较方案，锁定模型，再打开测试集，写下你的实验结论。',
    theory: '<p>为 SVM 和逻辑回归创建 <code>StandardScaler → 分类器</code> 的 Pipeline，避免在交叉验证前用全体数据拟合标准化器。随机森林通常不要求标准化。</p><p>按训练集的交叉验证均值选择模型，锁定后在整个训练集拟合，最后计算测试准确率与混淆矩阵。混淆矩阵行是真实类别、列是预测类别。单次小样本实验不能证明算法普遍优劣。</p>',
    goals: ['用 Pipeline 封装标准化，并比较三个模型的五折分数', '根据 cv_scores 的均值选择 best_name，拟合 best_model', '保存 test_pred、test_acc 和 cm，填写实验记录后导出'],
    hint: 'best_name = max(cv_scores, key=cv_scores.get)。best_model = models[best_name]，在训练集上 fit 后用 test_x 预测。cm = confusion_matrix(test_y, test_pred)。',
    starter: SPLIT + `
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, confusion_matrix
models = {
    "SVM": make_pipeline(StandardScaler(), SVC()),
    "LR": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "RF": RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)
}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = {}
for name, model in models.items():
    cv_scores[name] = cross_val_score(model, ..., ..., cv=cv, n_jobs=1).mean()
print("验证均值：", cv_scores)
best_name = ...
best_model = models[best_name]
best_model.fit(..., ...)
test_pred = ...
test_acc = ...
cm = ...
print("所选模型：", best_name)
print("最终测试准确率：", test_acc)
print("混淆矩阵：\\n", cm)
`,
    solution: SPLIT + `
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, confusion_matrix
models = {
    "SVM": make_pipeline(StandardScaler(), SVC()),
    "LR": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "RF": RandomForestClassifier(n_estimators=80, random_state=42, n_jobs=1)
}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = {}
for name, model in models.items():
    cv_scores[name] = cross_val_score(model, train_x, train_y, cv=cv, n_jobs=1).mean()
print("验证均值：", cv_scores)
best_name = max(cv_scores, key=cv_scores.get)
best_model = models[best_name]
best_model.fit(train_x, train_y)
test_pred = best_model.predict(test_x)
test_acc = accuracy_score(test_y, test_pred)
cm = confusion_matrix(test_y, test_pred)
print("所选模型：", best_name)
print("最终测试准确率：", test_acc)
print("混淆矩阵：\\n", cm)
`,
    checks: `from sklearn.model_selection import cross_val_score as _cvs
from sklearn.metrics import accuracy_score as _acc, confusion_matrix as _cm
from sklearn.pipeline import Pipeline as _Pipeline
from sklearn.preprocessing import StandardScaler as _Scaler
from sklearn.base import clone as _clone
import numpy as _np
_expected = {n: _cvs(m, train_x, train_y, cv=cv, n_jobs=1).mean() for n,m in models.items()}
_pipes = all(isinstance(models[n], _Pipeline) and isinstance(models[n].steps[0][1], _Scaler) for n in ['SVM','LR'])
check('标准化在 Pipeline 内，且根据训练集五折分数选模型', _pipes and cv.n_splits == 5 and set(cv_scores) == set(_expected) and all(abs(cv_scores[n]-v)<1e-10 for n,v in _expected.items()) and best_name == max(_expected,key=_expected.get))
_ref = _clone(models[best_name]).fit(train_x, train_y)
check('最终预测、准确率与混淆矩阵一致', _np.array_equal(test_pred, _ref.predict(test_x)) and abs(float(test_acc)-_acc(test_y,test_pred))<1e-10 and _np.array_equal(cm,_cm(test_y,test_pred)))`,
    quiz: { question: '标准化应该放在哪里，才能避免交叉验证中的数据泄露？', options: ['划分数据集前，在全部数据上 fit', '和分类器放入同一个 Pipeline 内再交叉验证', '在保留测试集上 fit'], answer: 1, explanation: 'Pipeline 确保每一折的标准化器只在该折训练部分拟合，再应用于验证部分。' }, visual: 'final'
  }
];
