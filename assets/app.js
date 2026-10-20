import { lessons } from './lessons.js';

const $ = id => document.getElementById(id);
const KEY = 'qingya-sklearn-v1';
const colors = ['#5d9f84', '#d6ae65', '#8a94c0'];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageOK = true;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { storageOK = false; }
const state = {
  name: typeof saved.name === 'string' ? saved.name.slice(0,100) : '',
  reflection: typeof saved.reflection === 'string' ? saved.reflection : '',
  records: lessons.map((l, i) => {
    const r = Array.isArray(saved.records) && saved.records[i] && typeof saved.records[i] === 'object' ? saved.records[i] : {};
    return {code: typeof r.code === 'string' ? r.code : l.starter, quiz: Number.isInteger(r.quiz) ? r.quiz : null, quizPassed: r.quizPassed === true,
      codePassed: r.codePassed === true, referenceUsed: r.referenceUsed === true, attempts: Number(r.attempts) || 0, runs: Number(r.runs) || 0,
      result: r.result && typeof r.result === 'object' ? r.result : null};
  })
};
let current = 0;
let worker = null;
let engine = 'idle';
let activeRun = null;
let timer;
let toastTimer;
let irisData;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $('save-status').textContent = '● 已在本机保存';
    storageOK = true;
  } catch { storageOK = false; $('save-status').textContent = '保存受限，请导出记录'; }
}
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 3200); }
function isDone(i) { return state.records[i].codePassed && state.records[i].quizPassed; }
function renderNav() {
  let group = '';
  $('lesson-nav').innerHTML = lessons.map((l,i) => {
    const heading = l.group === group ? '' : `<div class="nav-group">${esc(l.group)}</div>`; group = l.group;
    return heading + `<button class="nav-item ${current === i ? 'active' : ''} ${isDone(i) ? 'done' : ''}" data-lesson="${i}" ${current === i ? 'aria-current="step"' : ''}><span class="nav-number">${isDone(i) ? '✓' : String(i+1).padStart(2,'0')}</span><span>${esc(l.short)}</span><span class="done-mark">${isDone(i) ? '已完成' : current === i ? '‹' : ''}</span></button>`;
  }).join('');
  const count = lessons.filter((_,i) => isDone(i)).length;
  $('overall-count').textContent = `${count} / 8`;
  $('overall-bar').style.width = `${count / 8 * 100}%`;
}
function lines() { $('line-numbers').textContent = Array.from({length:$('code').value.split('\n').length}, (_,i) => i+1).join('\n'); $('line-numbers').scrollTop = $('code').scrollTop; }
function render() {
  const l = lessons[current], r = state.records[current];
  document.title = `${l.short} · 青芽实验室`;
  $('crumb').textContent = l.group;
  $('version').textContent = l.version;
  $('lesson-index').textContent = `实验 ${String(current+1).padStart(2,'0')} / 08`;
  $('lesson-time').textContent = `◷ ${l.time}`;
  $('lesson-title').textContent = l.title;
  $('lesson-intro').textContent = l.intro;
  $('theory').innerHTML = l.theory;
  $('source-page').textContent = /^\d/.test(l.page) ? `讲义 P${l.page}` : `讲义 · ${l.page}`;
  $('goals').innerHTML = l.goals.map(g => `<li>${esc(g)}</li>`).join('');
  $('filename').textContent = `experiment_${String(current+1).padStart(2,'0')}.py`;
  $('code').value = r.code;
  $('code').readOnly = !!activeRun;
  $('hint').textContent = l.hint; $('hint').hidden = true; $('solution-notice').hidden = true;
  $('question').textContent = l.quiz.question;
  $('options').innerHTML = '<legend class="sr-only">请选择答案</legend>' + l.quiz.options.map((o,i) => `<label class="quiz-option"><input type="radio" name="quiz" value="${i}" ${r.quiz === i ? 'checked' : ''}><span>${String.fromCharCode(65+i)}. ${esc(o)}</span></label>`).join('');
  $('quiz-feedback').textContent = r.quizPassed ? `✓ ${l.quiz.explanation}` : '';
  $('quiz-feedback').className = r.quizPassed ? 'quiz-feedback correct' : 'quiz-feedback';
  $('quiz-status').textContent = r.quizPassed ? '✓ 已掌握' : '检验理解';
  $('quiz-submit').textContent = '检查答案';
  $('reflection-card').hidden = current !== 7;
  $('reflection').value = state.reflection;
  $('previous').disabled = current === 0;
  $('next').textContent = current === 7 ? '导出学习记录 ↗' : '下一关 →';
  renderNav(); lines(); renderVisual(); renderResult(r.result); renderCompletion();
  if (!storageOK) $('save-status').textContent = '保存受限，请导出记录';
}
function renderCompletion() {
  const r = state.records[current];
  $('completion').textContent = isDone(current) ? '✓ 本关已完成。继续下一关，或修改代码探索更多可能。' : r.codePassed ? '✓ 代码检查已通过，再完成随堂一问即可通关。' : r.quizPassed ? '✓ 随堂一问已通过，完成代码检查即可通关。' : '完成代码检查与随堂一问，即可点亮这一关。';
  $('completion').className = `lesson-completion ${isDone(current) ? 'success' : ''}`;
  $('footer-status').textContent = `${lessons.filter((_,i) => isDone(i)).length} / 8 关已完成 · 进度自动保存`;
}
function outputTab(which) {
  const output = which === 'output';
  $('tab-output').setAttribute('aria-selected', String(output));
  $('tab-checks').setAttribute('aria-selected', String(!output));
  $('tab-output').tabIndex = output ? 0 : -1;
  $('tab-checks').tabIndex = output ? -1 : 0;
  $('output-panel').hidden = !output; $('checks-panel').hidden = output;
}
function renderResult(result) {
  $('result-metrics').innerHTML = '';
  if (!result) {
    $('output').textContent = '# 实验准备就绪\n# 修改上方代码，点击「运行并检查」开始。\n# 每关独立运行，无需先执行上一关。';
    $('output').className = ''; $('checks').innerHTML = '<p class="empty">运行后，在这里查看每项任务的检查结果。</p>';
    $('check-count').textContent = '0/2'; $('run-time').textContent = ''; outputTab('output'); return;
  }
  $('output').textContent = [result.output, result.warnings, result.error, result.checkError ? `任务检查提示：${result.checkError}\n请确认已定义任务要求的变量，并按要求计算。` : ''].filter(Boolean).join('\n') || '代码已执行，没有文本输出。可使用 print() 查看结果。';
  $('output').className = result.error ? 'error' : '';
  const checks = Array.isArray(result.checks) ? result.checks : [];
  $('check-count').textContent = `${checks.filter(c=>c.passed).length}/2`;
  $('checks').innerHTML = checks.map(c => `<div class="check-row ${c.passed ? '' : 'fail'}"><span>${c.passed ? '✓' : '✕'}</span><span>${esc(c.label)}</span></div>`).join('') + (checks.length < 2 ? '<div class="check-row fail"><span>○</span><span>检查尚未完成。先修正代码中的错误，再运行一次。</span></div>' : '');
  $('run-time').textContent = result.duration ? `${(result.duration/1000).toFixed(2)} s` : '';
  const m = result.metrics || {};
  const metrics = [];
  if (Number.isFinite(m.test_acc)) metrics.push(`<div>测试准确率<strong>${(m.test_acc*100).toFixed(1)}<small>%</small></strong></div>`);
  if (Number.isFinite(m.best_score)) metrics.push(`<div>最优验证均值<strong>${(m.best_score*100).toFixed(1)}<small>%</small></strong></div>`);
  if (metrics.length) $('result-metrics').innerHTML = `<div class="metrics">${metrics.join('')}<div>实时计算结果<br>基于当前运行的代码</div></div>`;
  renderVisual();
}
function go(index) { if (index>=0 && index<lessons.length) location.hash = `lesson-${index+1}`; }
function readHash() { const match = location.hash.match(/^#lesson-([1-8])$/); current = match ? Number(match[1])-1 : 0; render(); }

async function renderVisual() {
  const visual = lessons[current].visual;
  const titles = {scatter:'看看这 150 朵花',split:'感受训练 / 测试的比例',workflow:'一套可以迁移的工作流',cv:'五折验证是如何轮换的？',grid:'参数组合 × 验证折数',final:'从验证选择，到最终评估'};
  $('visual-title').textContent = titles[visual];
  if (visual === 'scatter') {
    $('visual').innerHTML = '<div class="plot-controls"><label>横轴 <select id="x-axis" aria-label="散点图横轴"><option value="0">花萼长度</option><option value="1">花萼宽度</option><option value="2" selected>花瓣长度</option><option value="3">花瓣宽度</option></select></label><label>纵轴 <select id="y-axis" aria-label="散点图纵轴"><option value="0">花萼长度</option><option value="1">花萼宽度</option><option value="2">花瓣长度</option><option value="3" selected>花瓣宽度</option></select></label></div><div id="scatter-plot"></div><div class="legend"><span><i style="background:#5d9f84"></i>setosa</span><span><i style="background:#d6ae65"></i>versicolor</span><span><i style="background:#8a94c0"></i>virginica</span></div><p class="visual-note">每个点是一朵花。切换特征，看看哪些品种更容易区分。单位：cm。</p>';
    try { if (!irisData) { const r = await fetch('./assets/iris.json'); if (!r.ok) throw Error('数据加载失败'); irisData = await r.json(); } if (lessons[current].visual !== 'scatter') return; drawScatter(); $('x-axis').onchange = drawScatter; $('y-axis').onchange = drawScatter; }
    catch { if ($('scatter-plot')) $('scatter-plot').textContent = '数据预览加载失败，请刷新页面。'; }
  } else if (visual === 'split') {
    $('visual').innerHTML = '<label class="slider-label" for="split-slider"><span>测试集比例</span><strong id="split-percent">20%</strong></label><input id="split-slider" type="range" min="10" max="40" step="10" value="20"><div class="split-blocks" id="split-blocks"></div><div class="split-count"><span id="train-count"></span><span id="test-count"></span></div><p class="visual-note">这里只改变示意图。请在代码里设置 test_size=0.2，完成本关任务。</p>';
    const draw = () => { const n = Number($('split-slider').value); $('split-percent').textContent = n+'%'; $('split-blocks').innerHTML = Array.from({length:60},(_,i)=>`<i class="${i>=60*(1-n/100)?'test':''}"></i>`).join(''); $('train-count').textContent = `训练集 ${150*(1-n/100)} 个`; $('test-count').textContent = `测试集 ${150*n/100} 个`; }; $('split-slider').oninput=draw; draw();
  } else if (visual === 'workflow') {
    $('visual').innerHTML = '<div class="flow"><div>① 导入模型<br><code>import</code></div><span>→</span><div>② 实例化<br><code>model = ...</code></div><div>③ 训练<br><code>fit(X, y)</code></div><span>→</span><div>④ 预测<br><code>predict(X)</code></div><div class="wide">⑤ 评估 · accuracy_score(y_true, y_pred)</div></div><p class="visual-note">模型变了，熟悉的 fit / predict 接口依然适用。留意训练数据与评估数据的边界。</p>';
  } else if (visual === 'cv') {
    const result = state.records[current].result;
    $('visual').innerHTML = '<div class="legend" style="justify-content:flex-start;margin-bottom:12px"><span><i style="background:#a8c99b"></i>训练部分</span><span><i style="background:#e5bb79"></i>验证部分</span></div>' + Array.from({length:5},(_,i)=>`<div class="cv-row"><span>第 ${i+1} 折</span>${Array.from({length:5},(_,j)=>`<span class="cv-cell ${i===j?'validation':''}">${i===j?'验证':'训练'}</span>`).join('')}</div>`).join('') + '<div class="cv-holdout">保留测试集 · 不参与这五次训练与验证</div>' + cvBars(result?.metrics?.cv);
  } else if (visual === 'grid') {
    $('visual').innerHTML = '<div class="grid-tiles"><div><strong>3</strong>linear</div><div><strong>2</strong>poly</div><div><strong>6</strong>rbf</div></div><div class="cv-holdout">11 组候选 × 5 折 = 55 次验证拟合</div><p class="visual-note">另用最优参数在全部训练集上拟合 1 次。原讲义重复的 C 值已去重；这里缩小 gamma 网格以便课堂练习。</p>';
    const params = state.records[current].result?.metrics?.best_params;
    if (params) { const p = document.createElement('p'); p.className='visual-note';p.textContent='本次最优参数：'+params;$('visual').append(p); }
  } else {
    const metrics = state.records[current].result?.metrics || {};
    $('visual').innerHTML = '<div class="flow"><div>训练集内<br>交叉验证选模型</div><span>→</span><div>整个训练集<br>重新拟合</div><div class="wide">独立测试集 · 最终评估一次</div></div>' + cvBars(metrics.cv) + (Array.isArray(metrics.cm) && metrics.cm.length===3 && metrics.cm.every(r=>Array.isArray(r)&&r.length===3) ? '<p class="visual-note">混淆矩阵 · 行 = 真实 / 列 = 预测<br>顺序：setosa、versicolor、virginica</p><div class="cm-grid" aria-label="混淆矩阵">'+metrics.cm.flat().map(n=>`<span>${esc(n)}</span>`).join('')+'</div>' : '<p class="visual-note">运行代码后，这里会展示三个模型的验证均值与最终混淆矩阵。</p>');
  }
}
function cvBars(cv) { if (!cv || typeof cv!=='object') return ''; return Object.entries(cv).filter(([,v])=>Number.isFinite(v)).map(([n,v])=>`<div class="comparison-row"><span>${esc(n)}</span><div class="comparison-bar"><i style="width:${Math.max(0,Math.min(100,v*100))}%"></i></div><span>${(v*100).toFixed(1)}%</span></div>`).join('')+'<p class="visual-note">上述数值为本次代码计算的交叉验证均值。</p>'; }
function drawScatter() {
  if (!$('x-axis') || !irisData) return;
  const x = +$('x-axis').value, y=+$('y-axis').value, W=390,H=230,L=38,R=15,T=20,B=30;
  const xs=irisData.data.map(r=>r[x]), ys=irisData.data.map(r=>r[y]);
  const xmin=Math.floor(Math.min(...xs)*2)/2, xmax=Math.ceil(Math.max(...xs)*2)/2+.15;
  const ymin=Math.floor(Math.min(...ys)*2)/2, ymax=Math.ceil(Math.max(...ys)*2)/2+.15;
  const px=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),py=v=>H-B-(v-ymin)/(ymax-ymin)*(H-T-B);
  let svg=`<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Iris 数据集两个特征的散点图">`;
  for(let i=0;i<5;i++){const xv=xmin+(xmax-xmin)*i/4,yv=ymin+(ymax-ymin)*i/4;svg+=`<line class="plot-grid" x1="${px(xv)}" y1="${T}" x2="${px(xv)}" y2="${H-B}"/><line class="plot-grid" x1="${L}" y1="${py(yv)}" x2="${W-R}" y2="${py(yv)}"/><text x="${px(xv)}" y="${H-10}" text-anchor="middle">${xv.toFixed(1)}</text><text x="${L-8}" y="${py(yv)+3}" text-anchor="end">${yv.toFixed(1)}</text>`;}
  svg+=irisData.data.map((r,i)=>`<circle cx="${px(r[x])}" cy="${py(r[y])}" r="3.4" fill="${colors[irisData.target[i]]}" opacity=".8"><title>${esc(irisData.names[irisData.target[i]])}：${r[x]} / ${r[y]} cm</title></circle>`).join('')+'</svg>';
  $('scatter-plot').innerHTML=svg;
}

function setBusy(busy) {
  $('run').disabled=busy; $('stop').hidden=!busy; $('code').readOnly=busy;
  $('run').innerHTML=busy?'<span>◌</span> 正在运行…':'<span>▶</span> 运行并检查';
  $('reset-code').disabled=busy;$('solution-button').disabled=busy;$('cdn').disabled=busy;
}
function engineUI(status, text) {
  engine=status;
  $('runtime-dot').className=`status-dot ${status==='ready'?'ready':status==='loading'?'loading':status==='error'?'error':''}`;
  $('runtime-state').textContent=status==='ready'?'Python 环境已就绪':status==='loading'?'正在准备运行环境…':status==='error'?'环境未能启动':'Python 环境待启动';
  $('runtime-detail').textContent=text;
  $('init-runtime').textContent=status==='ready'?'已就绪 ✓':status==='loading'?'加载中…':'启动环境 ↗';
  $('init-runtime').disabled=status==='loading'||status==='ready';
}
function resetWorker(message) { if(worker) worker.terminate();worker=null;clearTimeout(timer);engineUI('idle',message||'再次运行时会重新启动环境。代码和学习进度已保留。'); }
function finishFailure(message) {
  if(activeRun){const index=activeRun.lesson;const result={output:'',error:message,checks:[],metrics:{}};state.records[index].result=result;state.records[index].codePassed=false;if(current===index){renderResult(result);outputTab('output');}activeRun=null;save();renderNav();renderCompletion();}
  setBusy(false);
}
function newWorker() {
  if(worker) return;
  worker = new Worker(new URL('./python-worker.js',import.meta.url));
  worker.onmessage=({data})=>{
    if(data.type==='status'){$('runtime-detail').textContent=data.text;return;}
    if(data.type==='ready'){clearTimeout(timer);engineUI('ready',`真实 Python 3.12 · scikit-learn ${data.version} · 当前页面内可重复运行。`);if(activeRun)armComputeTimer();return;}
    if(data.type==='fatal'){const msg='运行环境出错：'+data.message+'\n如果是下载失败，请切换下载节点后重试，或下载 Notebook 在本机运行。';resetWorker();engineUI('error',msg);finishFailure(msg);return;}
    if(data.type==='result' && activeRun && data.id===activeRun.id){
      clearTimeout(timer); const index=activeRun.lesson, r=state.records[index];
      r.result=data; r.runs++;
      r.codePassed=!data.error&&!data.checkError&&data.checks.length===2&&data.checks.every(c=>c.passed)&&r.code===activeRun.code;
      activeRun=null;setBusy(false);save();renderNav();renderCompletion();
      if(current===index){renderResult(data);outputTab(r.codePassed?'checks':'output');}
      if(r.codePassed)toast(`第 ${index+1} 关代码检查通过`);
    }
  };
  worker.onerror=event=>{event.preventDefault();resetWorker();finishFailure('Python Worker 启动失败：'+event.message+'。请刷新页面后重试。');};
}
function armComputeTimer(){clearTimeout(timer);timer=setTimeout(()=>{resetWorker();finishFailure('运行超过 90 秒，已停止。请检查是否有无限循环，或缩小参数网格后重试。');},90000);}
function startEnvironment() {
  if(engine==='ready'||engine==='loading')return;
  try { newWorker();engineUI('loading','正在连接下载节点，首次启动通常需要 1–3 分钟…');worker.postMessage({type:'init',indexURL:$('cdn').value});timer=setTimeout(()=>{resetWorker();engineUI('error','环境下载超过 4 分钟。请切换下载节点后重试，或使用 Notebook。');finishFailure('运行环境下载超时，请切换下载节点后重试。');},240000); }
  catch(error){resetWorker();engineUI('error',String(error));finishFailure(String(error));}
}
function run() {
  if(activeRun)return;
  const r=state.records[current]; r.code=$('code').value;r.codePassed=false;r.result=null;save();
  activeRun={id:Date.now(),lesson:current,code:r.code};setBusy(true);renderResult(null);renderCompletion();renderNav();
  $('output').textContent=engine==='ready'?'正在执行你的 Python 代码，并检查任务…':'正在准备 Python 环境。加载完成后将自动执行当前代码。';
  if(engine!=='ready')startEnvironment();else armComputeTimer();
  if(worker)worker.postMessage({type:'run',...activeRun,checks:lessons[current].checks,indexURL:$('cdn').value});
}

function openDialog(title, html) {$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('guide-dialog').showModal();}
function teacherGuide(){openDialog('教师指南',`<p>本课程面向刚接触 scikit-learn 的学生，建议先具备 Python 变量、函数调用和简单循环基础。</p><h3>建议课堂安排 · 约 100 分钟</h3><ol><li>数据与划分（18 分钟）：认识 X / y，练习留出测试集。</li><li>基础模型（32 分钟）：依次完成 SVM、逻辑回归、随机森林。</li><li>评估与调参（30 分钟）：比较训练集交叉验证结果，运行网格搜索。</li><li>综合挑战（20 分钟）：用 Pipeline 预处理，按验证分数选模型，最终测试并写结论。</li></ol><h3>如何收作业</h3><p>请学生点击右上角“导出学习记录”，填写姓名 / 学号，下载 Markdown 报告或 JSON 备份，再通过你的教学平台提交。报告包括代码、运行输出、检查结果、答题情况、是否查看参考答案与实验结论。</p><p class="dialog-note">网站不收集学生身份或成绩，进度只在当前浏览器保存。自动检查是学习辅助，学生可查看全部源代码，不适用于防作弊考试；导出的记录应结合代码与课堂表现人工评阅。</p><h3>设备与网络</h3><p>推荐电脑上使用近期版本 Chrome、Edge 或 Firefox。首次使用需访问 Pyodide 下载节点，建议课前启动环境。手机可阅读、答题与运行，但电脑更适合编辑代码。环境加载受限时，可下载 <a href="./downloads/sklearn-practice.ipynb" download>练习 Notebook</a> 使用本机 Jupyter。</p><p>分享当前页面地址即可；也可复制地址末尾的 <code>#lesson-6</code> 直接定位到交叉验证关卡。</p>`);}
function about(){openDialog('课程说明与参考资料',`<p>本课程根据用户提供的 scikit_learn_demo.pdf（17 页）及配套 Notebook 改编，保留“基础建模 V1.0 → 交叉验证 V2.0 → 网格调参 V3.0”的学习主线，增加数据探索、任务检查和综合实践。</p><h3>教学修订</h3><ul><li>统一 X 命名，避免原 Notebook 中 x / X 不一致。</li><li>统一 80% / 20% 分层划分与固定种子 42；原示例是 90% / 10%，两者均可使用，数值结果不会完全相同。</li><li>准确率 accuracy 与精确率 precision 分开表述。</li><li>交叉验证和参数搜索只使用训练集，测试集保留给最终评估。</li><li>不把均值 ± 2 倍标准差直接称为严格置信区间。</li><li>去重参数网格，使用 max_iter=1000；综合挑战使用 Pipeline 避免预处理泄露。</li></ul><h3>官方参考</h3><ul><li><a href="https://scikit-learn.org/stable/modules/cross_validation.html" target="_blank" rel="noopener noreferrer">scikit-learn：交叉验证</a></li><li><a href="https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html" target="_blank" rel="noopener noreferrer">scikit-learn：GridSearchCV</a></li><li><a href="https://pyodide.org/en/0.27.7/usage/packages-in-pyodide.html" target="_blank" rel="noopener noreferrer">Pyodide 0.27.7：浏览器内科学计算</a></li></ul><h3>数据与隐私</h3><p>Iris 数据来自 scikit-learn 内置数据集。代码由 Pyodide 在浏览器 Worker 中真实执行；环境及依赖从第三方 CDN 下载。网站没有成绩服务器，关闭或清理浏览器数据会影响本机保存的进度，请及时导出。</p>`);}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exportDialog(){openDialog('导出学习记录',`<p>记录包含本机保存的 8 关代码与检查情况，综合挑战结论也会一并导出。它是自主练习记录，不是经过教师认证的成绩单。</p><label for="student-name">姓名 / 学号（可选，仅保存在本机）</label><input id="student-name" maxlength="100" style="width:100%;padding:10px;border:1px solid #dce4d9;border-radius:6px;margin:9px 0 20px" value="${esc(state.name)}" placeholder="例如：张同学 / 2026001"><div style="display:flex;gap:12px;flex-wrap:wrap"><button id="export-md" class="button">下载作业报告 .md</button><button id="export-json" class="button secondary">下载进度备份 .json</button></div><p>换设备时，可在同一页面导入 JSON 备份。</p><label class="download-link" for="import-json">↑ 导入进度备份<input id="import-json" type="file" accept="application/json,.json" style="display:block;margin-top:10px"></label>`);
  const remember=()=>{state.name=$('student-name').value.trim();save();};
  $('export-md').onclick=()=>{remember();exportMarkdown();};
  $('export-json').onclick=()=>{remember();download('sklearn-progress.json',JSON.stringify({schema:1,exportedAt:new Date().toISOString(),...state},null,2),'application/json;charset=utf-8');toast('进度备份已导出');};
  $('import-json').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{if(file.size>2e6)throw Error('备份文件过大');const data=JSON.parse(await file.text());if(data.schema!==1||!Array.isArray(data.records)||data.records.length!==8)throw Error('不是本课程的有效备份');
      if(!data.records.every(r=>r&&typeof r.code==='string'&&r.code.length<100000&&typeof r.quizPassed==='boolean'&&typeof r.codePassed==='boolean'&&(r.quiz===null||Number.isInteger(r.quiz)&&r.quiz>=0&&r.quiz<3)))throw Error('备份中的关卡记录无效');
      if(activeRun)throw Error('请先停止正在进行的运行');
      if(!confirm('导入将替换本机当前学习进度。确定导入这份备份？'))return;
      state.name=typeof data.name==='string'?data.name.slice(0,100):'';state.reflection=typeof data.reflection==='string'?data.reflection.slice(0,100000):'';
      state.records=data.records.map((r,i)=>({code:r.code,quiz:r.quiz,quizPassed:r.quizPassed&&r.quiz===lessons[i].quiz.answer,codePassed:r.codePassed,referenceUsed:!!r.referenceUsed,attempts:Number(r.attempts)||0,runs:Number(r.runs)||0,result:null}));save();$('guide-dialog').close();render();toast('备份已导入；运行输出需重新执行生成');
    }catch(error){toast('导入失败：'+error.message);}
  };
}
function exportMarkdown(){
  const fence=s=>'`'.repeat(Math.max(3,...(String(s).match(/`+/g)||[]).map(v=>v.length+1)));
  const block=(s,lang='')=>`${fence(s)}${lang}\n${s}\n${fence(s)}`;
  let text=`# scikit-learn 在线练习记录\n\n姓名 / 学号：${state.name||'未填写'}\n\n导出时间：${new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}（北京时间）\n\n已完成：${lessons.filter((_,i)=>isDone(i)).length} / 8 关\n\n说明：本报告由学生本机保存的练习记录生成，供教师结合代码评阅，不是防作弊考试成绩。\n`;
  lessons.forEach((l,i)=>{const r=state.records[i];text+=`\n## ${i+1}. ${l.title}\n\n代码检查：${r.codePassed?'通过':'未通过 / 尚未运行'}；随堂一问：${r.quizPassed?'通过':'未通过'}；运行次数：${r.runs}；查看参考答案：${r.referenceUsed?'是':'否'}\n\n${block(r.code,'python')}\n\n选择答案：${r.quiz===null?'未答':l.quiz.options[r.quiz]}\n`;if(r.result)text+=`\n运行记录：\n\n${block([r.result.output,r.result.warnings,r.result.error,r.result.checkError].filter(Boolean).join('\n')||'无文本输出')}\n`;});
  text+=`\n## 综合实验结论\n\n${state.reflection||'尚未填写。'}\n`;download('sklearn-learning-report.md',text,'text/markdown;charset=utf-8');toast('学习报告已导出');
}

$('lesson-nav').onclick=event=>{const button=event.target.closest('[data-lesson]');if(button)go(Number(button.dataset.lesson));};
window.addEventListener('hashchange',readHash);
$('code').addEventListener('input',()=>{const r=state.records[current];r.code=$('code').value;r.codePassed=false;r.result=null;save();lines();renderNav();renderCompletion();$('check-count').textContent='0/2';$('run-time').textContent='代码已修改，请重新运行';$('checks').innerHTML='<p class="empty">代码已修改，请重新运行生成检查结果。</p>';$('result-metrics').innerHTML='';renderVisual();});
$('code').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('code').scrollTop;});
$('code').addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();if(event.shiftKey)return;const a=$('code').selectionStart,b=$('code').selectionEnd;$('code').setRangeText('    ',a,b,'end');$('code').dispatchEvent(new Event('input'));}if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run();}});
$('run').onclick=run;$('init-runtime').onclick=startEnvironment;
$('stop').onclick=()=>{resetWorker();finishFailure('已停止运行。代码和学习进度已保留；再次运行会重新启动环境。');};
$('cdn').onchange=()=>{resetWorker('下载节点已切换。点击“启动环境”或“运行并检查”重新加载。');};
$('hint-button').onclick=()=>{$('hint').hidden=!$('hint').hidden;};
$('solution-button').onclick=()=>{if(!confirm('将用参考答案替换本关当前代码，是否继续？建议先尝试提示。'))return;const r=state.records[current];r.code=lessons[current].solution;r.codePassed=false;r.result=null;r.referenceUsed=true;save();render();$('solution-notice').hidden=false;};
$('reset-code').onclick=()=>{if(!confirm('恢复本关初始代码？当前代码会被替换，答题进度保留。'))return;const r=state.records[current];r.code=lessons[current].starter;r.codePassed=false;r.result=null;save();render();};
$('download-code').onclick=()=>download(`experiment_${String(current+1).padStart(2,'0')}.py`,$('code').value,'text/x-python;charset=utf-8');
$('quiz-submit').onclick=()=>{const selected=document.querySelector('input[name="quiz"]:checked');if(!selected){$('quiz-feedback').textContent='请先选择一个答案。';$('quiz-feedback').className='quiz-feedback wrong';return;}const r=state.records[current],q=lessons[current].quiz;r.quiz=Number(selected.value);r.attempts++;r.quizPassed=r.quiz===q.answer;$('quiz-feedback').textContent=(r.quizPassed?'✓ 回答正确。':'再想一想。')+q.explanation;$('quiz-feedback').className='quiz-feedback '+(r.quizPassed?'correct':'wrong');$('quiz-status').textContent=r.quizPassed?'✓ 已掌握':'继续思考';save();renderNav();renderCompletion();};
document.addEventListener('change',event=>{if(event.target.matches('input[name="quiz"]')){state.records[current].quiz=Number(event.target.value);state.records[current].quizPassed=false;$('quiz-status').textContent='请检查答案';$('quiz-feedback').textContent='';save();renderNav();renderCompletion();}});
$('reflection').oninput=()=>{state.reflection=$('reflection').value;save();};
$('previous').onclick=()=>{go(current-1);window.scrollTo({top:0});};$('next').onclick=()=>{if(current===7)exportDialog();else{go(current+1);window.scrollTo({top:0});}};
$('tab-output').onclick=()=>outputTab('output');$('tab-checks').onclick=()=>outputTab('checks');
for(const id of ['tab-output','tab-checks'])$(id).onkeydown=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const next=id==='tab-output'?'checks':'output';outputTab(next);$('tab-'+next).focus();}};
$('teacher-open').onclick=teacherGuide;$('about-open').onclick=about;$('export-top').onclick=exportDialog;
$('dialog-close').onclick=()=>$('guide-dialog').close();
$('guide-dialog').addEventListener('click',event=>{if(event.target===$('guide-dialog')){const rect=$('guide-dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('guide-dialog').close();}});
readHash();
