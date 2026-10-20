import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../assets/lessons.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(lessons.length, 8);
for (const lesson of lessons) {
  assert.ok(lesson.title && lesson.intro && lesson.theory && lesson.hint);
  assert.equal(lesson.goals.length, 3);
  assert.equal(lesson.quiz.options.length, 3);
  assert.ok(Number.isInteger(lesson.quiz.answer) && lesson.quiz.answer >= 0 && lesson.quiz.answer < 3);
  assert.match(lesson.starter, /\.\.\./);
  assert.doesNotMatch(lesson.solution, /\.\.\./);
  assert.equal((lesson.checks.match(/check\('/g) || []).length, 2);
}
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const app = fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
for (const [,id] of app.matchAll(/\$\('([^']+)'\)/g)) {
  assert.ok(ids.includes(id) || ['x-axis','y-axis','scatter-plot','split-slider','split-percent','split-blocks','train-count','test-count','student-name','export-md','export-json','import-json'].includes(id), `Missing UI element: ${id}`);
}
const data = JSON.parse(fs.readFileSync(path.join(root,'assets/iris.json'),'utf8'));
assert.equal(data.data.length,150);assert.equal(data.target.length,150);
assert.ok(data.data.every(row=>row.length===4));
for (const target of [0,1,2]) assert.equal(data.target.filter(v=>v===target).length,50);
for (const [,ref] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) assert.ok(fs.existsSync(path.join(root,ref)), `Missing asset: ${ref}`);
console.log('PASS: 8 lessons, task/quiz contracts, UI element bindings, local assets, and all 150 Iris samples.');
if (process.argv.includes('--export')) {
  fs.writeFileSync(path.join(root,'tests/lessons.generated.json'),JSON.stringify(lessons));
  console.log('Exported Python lesson fixtures.');
}
