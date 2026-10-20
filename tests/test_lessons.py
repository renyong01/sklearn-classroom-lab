"""Run real reference solutions and their behavioral checks. Node exports fixtures first."""
import contextlib
import io
import json
from pathlib import Path

lessons = json.loads((Path(__file__).parent / 'lessons.generated.json').read_text(encoding='utf-8'))
for index, lesson in enumerate(lessons):
    ns = {'__name__': '__main__'}
    checks = []
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(lesson['solution'], f'lesson_{index + 1}.py', 'exec'), ns)
        ns['check'] = lambda label, passed: checks.append((label, bool(passed)))
        exec(compile(lesson['checks'], 'checks.py', 'exec'), ns)
    assert len(checks) == 2 and all(passed for _, passed in checks), (index + 1, checks)
    # Deliberately incorrect outputs must fail at least one substantive check.
    if index == 0:
        ns['X'] = ns['X'][:10]
    elif index == 1:
        ns['test_y'] = ns['test_y'][::-1]
    elif index in (2,3,4,7):
        ns['test_acc'] = -1
    elif index == 5:
        ns['scores']['SVM'] = ns['scores']['SVM'] * 0
    elif index == 6:
        ns['search'].best_params_ = {'kernel': 'invalid'}
    checks.clear()
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(lesson['checks'], 'checks.py', 'exec'), ns)
    assert any(not passed for _, passed in checks), ('Incorrect output accepted', index + 1)
    print(f'PASS lesson {index + 1}: reference accepted, incorrect output rejected')

print('All 8 reference solutions and 8 negative checks passed.')
