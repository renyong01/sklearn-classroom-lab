/* Real CPython + scikit-learn in an isolated worker. Stop terminates this worker. */
let pyodide;
let loading;
const ALLOWED = ['https://cdn.jsdelivr.net/pyodide/v0.27.7/full/', 'https://fastly.jsdelivr.net/pyodide/v0.27.7/full/'];
async function initialize(indexURL) {
  if (pyodide) return;
  if (loading) return loading;
  if (!ALLOWED.includes(indexURL)) throw new Error('不支持的运行环境来源');
  loading = (async () => {
    postMessage({ type: 'status', text: '正在加载 Python 运行环境…' });
    importScripts(indexURL + 'pyodide.js');
    const runtime = await loadPyodide({ indexURL });
    postMessage({ type: 'status', text: '正在下载 numpy、scipy 与 scikit-learn…' });
    await runtime.loadPackage(['scikit-learn'], { messageCallback: text => postMessage({ type: 'status', text }), errorCallback: text => postMessage({ type: 'status', text }) });
    await runtime.runPythonAsync('import sklearn, numpy\nfrom sklearn.datasets import load_iris\nload_iris()');
    pyodide = runtime;
    postMessage({ type: 'ready', version: pyodide.runPython('sklearn.__version__') });
  })();
  return loading;
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') { await initialize(data.indexURL); return; }
    if (data.type !== 'run') return;
    await initialize(data.indexURL);
    pyodide.globals.set('_student_source', data.code);
    pyodide.globals.set('_check_source', data.checks);
    const started = performance.now();
    const raw = await pyodide.runPythonAsync(`
import json as _json, io as _io, contextlib as _contextlib, traceback as _traceback
_ns = {'__name__': '__main__'}
_out, _err = _io.StringIO(), _io.StringIO()
_checks, _metrics, _error, _check_error = [], {}, '', ''
def _check(label, passed):
    _checks.append({'label': label, 'passed': bool(passed)})
with _contextlib.redirect_stdout(_out), _contextlib.redirect_stderr(_err):
    try:
        exec(compile(_student_source, 'experiment.py', 'exec'), _ns)
    except Exception:
        _error = _traceback.format_exc()
    if not _error:
        try:
            _check_ns = dict(_ns)
            _check_ns['check'] = _check
            exec(compile(_check_source, 'task_checks.py', 'exec'), _check_ns)
        except Exception as _e:
            _check_error = type(_e).__name__ + ': ' + str(_e)
        try:
            if 'test_acc' in _ns:
                _metrics['test_acc'] = float(_ns['test_acc'])
            if 'scores' in _ns and isinstance(_ns['scores'], dict):
                _metrics['cv'] = {str(k): float(v.mean()) for k,v in _ns['scores'].items()}
            if 'cv_scores' in _ns:
                _metrics['cv'] = {str(k): float(v) for k,v in _ns['cv_scores'].items()}
            if 'cm' in _ns:
                _metrics['cm'] = _ns['cm'].tolist()
            if 'search' in _ns and hasattr(_ns['search'], 'best_score_'):
                _metrics['best_score'] = float(_ns['search'].best_score_)
                _metrics['best_params'] = str(_ns['search'].best_params_)
        except Exception:
            pass
_stdout = _out.getvalue()
_stderr = _err.getvalue()
_json.dumps({'output': _stdout[:30000], 'warnings': _stderr[:10000], 'error': _error[:10000], 'checkError': _check_error, 'checks': _checks, 'metrics': _metrics}, ensure_ascii=False, allow_nan=False)
`);
    postMessage({ type: 'result', id: data.id, lesson: data.lesson, duration: performance.now() - started, ...JSON.parse(raw) });
  } catch (error) {
    postMessage({ type: 'fatal', id: data.id, message: String(error?.message || error) });
  }
};
