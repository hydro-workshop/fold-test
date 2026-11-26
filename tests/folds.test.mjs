import { test } from 'node:test';
import assert from 'node:assert/strict';
import {depthLimit, fold, levels, match, sheet, sides, solution} from '../dist/fold.mjs';

test('all cardinal folds reflect coordinates and retain stacked marks', () => {
  const g = sheet(['or.d', '....','d..o','..r.']);
  assert.deepEqual(fold(g,'left',2)[0],['r','do']);
  assert.deepEqual(fold(g,'right',2)[0],['do','r']);
  assert.deepEqual(fold(g,'top',1)[0],['o','r','','d']);
  assert.deepEqual(fold(g,'bottom',1)[2],['d','','r','o']);
  assert.throws(() => fold(g,'left',3),RangeError);
  assert.throws(() => fold(g,'diagonal',1),RangeError);
  assert.deepEqual(g,sheet(['or.d','....','d..o','..r.']));
});
test('every puzzle is solvable, with all ink preserved and progressive depth', () => {
  const ink = grid => grid.flat().join('').split('').sort().join('');
  let previous = 0;
  for (const {start,target,example,name} of levels) {
    assert.equal(ink(start),ink(target),name);
    assert.ok(!match(start,target),name);
    const answer = solution(start,target);
    assert.ok(answer?.length >= previous, `${name}: ${answer?.length}`);
    assert.ok(answer.length <= example.length, name);
    previous = answer.length;
    assert.deepEqual(answer.reduce((g,[s,n])=>fold(g,s,n),start),target,name);
  }
});
test('unreachable states have no hint and 1×1 sheets cannot fold', () => {
  assert.equal(solution(sheet(['o']),sheet(['r'])),null);
  assert.ok(sides.every(s=>depthLimit(sheet(['o']),s)===0));
});
