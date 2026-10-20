import fs from 'node:fs';
import { lessons } from '../assets/lessons.js';
const md = source => ({cell_type:'markdown',metadata:{},source});
const code = source => ({cell_type:'code',metadata:{},execution_count:null,outputs:[],source});
const cells=[md('# 青芽实验室 · scikit-learn 动手练习\n\n在线课程：https://renyong01.github.io/sklearn-classroom-lab/\n\n在 Jupyter 中独立完成每关的 `...`。每关自带数据准备，可单独运行。环境需有 numpy 和 scikit-learn（建议 >=1.6,<2）。\n\n统一采用 80% / 20% 分层划分，random_state=42；训练集内部交叉验证选择模型，测试集仅用于最终评估。')];
for (const [i,l] of lessons.entries()) {
  cells.push(md(`## ${i+1}. ${l.title}\n\n${l.intro}\n\n${l.theory}\n\n### 任务\n\n${l.goals.map(g=>'- '+g).join('\n')}\n\n提示：${l.hint}`));
  cells.push(code(l.starter));
  cells.push(md(`### 随堂一问\n\n${l.quiz.question}\n\n${l.quiz.options.map((o,j)=>`${String.fromCharCode(65+j)}. ${o}`).join('\n\n')}\n\n我的选择与理由：`));
}
cells.push(md('## 综合实验结论\n\n- 我根据什么选择模型：\n- 交叉验证均值：\n- 最终测试准确率与混淆矩阵：\n- 本实验的局限：\n\n本 Notebook 为配套教学材料改编的练习版，参考解法及在线检查见课程网站。'));
const notebook={nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python',version:'3.12'}},cells:cells.map((c,i)=>({...c,id:`qingya-cell-${i+1}`}))};
fs.mkdirSync(new URL('../downloads/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../downloads/sklearn-practice.ipynb',import.meta.url),JSON.stringify(notebook,null,2));
console.log('Built student notebook with 8 independent experiments.');
