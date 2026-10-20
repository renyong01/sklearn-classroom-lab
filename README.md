# 青芽实验室 · scikit-learn 在线练习

面向人工智能基础课程的中文交互练习网站，根据 `scikit_learn_demo.pdf` 与配套 Notebook 改编。

**学生入口：[打开在线课堂](https://renyong01.github.io/sklearn-classroom-lab/)**

## 学生可以做什么

- 8 关练习：Iris 数据探索、训练/测试划分、SVM、逻辑回归、随机森林、五折交叉验证、GridSearchCV、综合挑战。
- 修改 Python 代码，使用真实 scikit-learn 计算，查看输出与任务检查结果。
- 使用提示和参考答案；每关都有随堂问题与解析。
- 探索真实 Iris 散点图、数据划分示意、交叉验证流程与实验结果。
- 本机自动保存进度；导出包含代码与结果的 Markdown 作业报告，或导出/导入 JSON 备份。
- 下载 `downloads/sklearn-practice.ipynb`，在 Jupyter 中继续练习。

## 上课方式

1. 向学生分享在线课堂地址，推荐在电脑上的现代浏览器打开。
2. 点击“启动环境”，等待 Python 与 scikit-learn 加载。首次通常需要 1–3 分钟，时间取决于网络及设备；可切换下载节点。
3. 每关补全 `...`，点击“运行并检查”（Ctrl / Cmd + Enter），完成随堂问题。
4. 综合挑战后填写结论，导出学习记录，通过现有教学平台提交给老师。

建议课时约 100 分钟。课前请在学生网络测试 CDN 与 GitHub Pages 访问。运行环境来自 jsDelivr CDN；网络受限时使用可下载的 Notebook。网站不保证离线运行。

## 教学内容修订

本网站保留讲义 V1.0 → V2.0 → V3.0 主线，并修正了以下示例问题：

- 统一 `X` / `y` 命名，避免 Notebook 中 `x` 与 `X` 不一致。
- 统一 `test_size=0.2, random_state=42, stratify=y`，便于复现与比较。原示例采用 `0.1 / 0`，运行数值不要求和原讲义一致。
- `accuracy_score` 称“准确率”，与 precision“精确率”区分。
- 交叉验证与搜索只使用训练集。基础模型关卡用于展示固定划分下的结果；综合挑战按训练集验证分数选模型，最后才使用保留测试集。
- 不将验证分数的均值 ± 2 倍标准差直接称为严格置信区间。
- 去掉重复的 `C=100` 候选，缩小 gamma 网格。课程网格共 11 组、五折，55 次验证拟合，另有一次 refit。
- 逻辑回归使用 `max_iter=1000`；综合挑战把标准化放进 Pipeline，避免在交叉验证前拟合预处理器。
- 分类、回归、聚类是常见任务，并非机器学习任务的完整清单。

## 技术与隐私

纯 HTML / CSS / ES Modules，无构建依赖、无服务器。GitHub Pages 可直接托管仓库根目录。

Python 通过 Web Worker 中的 **Pyodide 0.27.7 / CPython 3.12 / scikit-learn 1.6.1** 真实执行。每次运行使用独立变量命名空间，每关代码包含所需的数据准备，可独立执行；停止按钮会终止 Worker，避免无限循环卡住界面。运行环境最多等待 4 分钟，计算最多等待 90 秒。

代码、答题记录、可选姓名和实验结论存储在学生浏览器 `localStorage`，本网站不提供服务端收集或教师成绩后台。运行依赖由第三方 CDN 下载。执行学生自行编写的代码时，仍应注意浏览器代码本身可具备的网络能力。

自动检查是学习辅助，课程源代码及答案公开，JSON / Markdown 报告由学生本机生成，不适合防作弊考试。教师应结合代码、实验结论和课堂表现评阅。点击参考答案会记入学习报告。

原 PDF 与原 Notebook 未直接放入公开仓库；下载的 Notebook 是本课程生成的独立练习版。

## 本地运行

```sh
python -m http.server 4173 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4173/`。请通过 HTTP 服务访问，不要直接双击 `index.html`，因为浏览器对 `file://` 的模块和 Worker 有限制。

本机 Notebook 环境：

```sh
python -m pip install -r requirements.txt
jupyter lab downloads/sklearn-practice.ipynb
```

## 验证

Node.js 18+ 与 Python 环境：

```sh
node --check assets/app.js
node --check assets/python-worker.js
node tests/check.mjs --export
python tests/test_lessons.py
```

验证内容包括课程结构、所有资源链接、150 个 Iris 样本，以及 8 份参考代码的真实执行和错误结果的拒绝。浏览器端另需确认 Pyodide 首次加载、运行/停止、代码修改后进度失效、答题、进度恢复、导出及窄屏布局。

## GitHub Pages

仓库 Settings → Pages → Deploy from a branch → `main` / `/ (root)`。每次推送 main 后 GitHub Pages 会自动更新，通常需要短暂等待。

## 官方参考

- [scikit-learn：交叉验证](https://scikit-learn.org/stable/modules/cross_validation.html)
- [scikit-learn：GridSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html)
- [Pyodide 0.27.7 的可用软件包](https://pyodide.org/en/0.27.7/usage/packages-in-pyodide.html)
- [scikit-learn：Iris 数据集](https://scikit-learn.org/stable/datasets/toy_dataset.html#iris-plants-dataset)

Iris 数据预览由本机 scikit-learn 内置 `load_iris()` 导出，保留全部 150 个样本与三种标签。
