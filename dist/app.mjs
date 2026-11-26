import {depthLimit, fold, levels, match, names, sides, solution} from './fold.mjs';

const $ = id => document.getElementById(id);
const glyphs = {o:['dot','dot'],d:['diamond','diamond'],r:['ring','ring']};
const storage = 'hydro-fold-test-v1';
function saved() {
  try {
    const value = JSON.parse(localStorage.getItem(storage));
    return Array.isArray(value) ? value.filter(n => Number.isInteger(n) && n >= 0 && n < levels.length) : [];
  } catch { return []; }
}
const completed = new Set(saved());
let index = levels.findIndex((_, i) => !completed.has(i));
if (index < 0) index = 0;
let grid, past, side, depth, won, message;
function button(text, action, {label, className} = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  if (label) b.setAttribute('aria-label',label);
  if (className) b.className = className;
  b.addEventListener('click',action);
  return b;
}
const levelButtons = levels.map((level,i) => button(String(i+1),() => start(i),
  {label:`Puzzle ${i+1}: ${level.name}`,className:'level-btn'}));
$('levels').append(...levelButtons);
const sideButtons = sides.map(s => button(names[s],() => {
  side = s;
  depth = Math.min(depth, depthLimit(grid,side)) || 1;
  message = '';
  render();
}));
$('edges').append(...sideButtons);

const size = g => `${g[0].length} × ${g.length}`;
const cells = n => n === 1 ? 'cell' : 'cells';
function draw(el,g,preview,label) {
  const w = g[0].length, h = g.length;
  el.style.gridTemplateColumns = `repeat(${w}, var(--edge))`;
  const description = [];
  const items = g.flatMap((row,y) => row.map((ink,x) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (preview) {
      const flap = {left: x < depth, right: x >= w-depth, top: y < depth, bottom: y >= h-depth}[side];
      const edge = {left: x === depth-1 ? 'right' : '',right: x === w-depth ? 'left' : '',
        top: y === depth-1 ? 'bottom' : '',bottom: y === h-depth ? 'top' : ''}[side];
      if (flap) cell.classList.add('flap');
      if (edge) cell.classList.add('crease-'+edge);
    }
    if (ink) {
      const stack = document.createElement('span');
      stack.className = 'marks';
      for (const mark of ink) {
        const shape = document.createElement('span');
        shape.className = 'mark '+glyphs[mark][0];
        stack.append(shape);
      }
      cell.append(stack);
      description.push(`row ${y+1}, column ${x+1}: ${[...ink].map(k=>glyphs[k][1]).join(', ')}`);
    }
    return cell;
  }));
  el.replaceChildren(...items);
  el.setAttribute('aria-label',`${label}, ${w} columns by ${h} rows. ${description.join('; ') || 'No marks'}.`);
}
function selectSide() {
  if (!depthLimit(grid,side)) side = sides.find(s => depthLimit(grid,s)) ?? 'top';
  depth = Math.min(depth,depthLimit(grid,side)) || 1;
}
function start(i) {
  index = i;
  grid = levels[index].start;
  past = [];
  side = i === 0 ? 'left' : 'top';
  depth = 1;
  won = false;
  message = i === 0 ? 'Pick a flap depth and make your first fold.' : 'Match the target’s shape and marks.';
  render();
}
function render() {
  const {name,target} = levels[index];
  $('progress').textContent = `Puzzle ${index+1} of ${levels.length} · ${completed.size} solved`;
  $('level-name').textContent = name;
  $('sheet-size').textContent = size(grid);
  $('target-size').textContent = size(target);
  levelButtons.forEach((b,i) => {
    b.setAttribute('aria-current',String(i === index));
    b.classList.toggle('done',completed.has(i));
    b.setAttribute('aria-label',`Puzzle ${i+1}: ${levels[i].name}${completed.has(i) ? ', solved' : ''}`);
  });
  sideButtons.forEach((b,i) => {
    b.disabled = won || !depthLimit(grid,sides[i]);
    b.setAttribute('aria-pressed',String(side === sides[i]));
  });
  const limit = depthLimit(grid,side);
  const focus = document.activeElement?.dataset?.depth;
  const depths = Array.from({length:limit},(_, i) => {
    const n = i+1;
    const b = button(String(n),() => {
      depth = n;
      message = '';
      render();
    },{label:`Fold ${n} ${cells(n)} deep`});
    b.dataset.depth = String(n);
    b.setAttribute('aria-pressed',String(n === depth));
    b.disabled = won;
    return b;
  });
  $('depths').replaceChildren(...depths);
  if (focus && depths[Number(focus)-1] && !won) depths[Number(focus)-1].focus();
  draw($('paper'),grid,!won && limit>0,'Your sheet');
  draw($('goal'),target,false,'Target');
  $('apply').textContent = won ? (index < levels.length-1 ? 'Next puzzle' : 'Back to first puzzle') : 'Make fold';
  $('apply').disabled = !won && !limit;
  $('undo').disabled = !past.length;
  $('reset').disabled = !past.length;
  $('hint').disabled = won;
  $('fold-count').textContent = `${past.length} ${past.length===1 ? 'fold' : 'folds'}`;
  $('message').classList.toggle('success',won);
  $('message').textContent = message || `${names[side]} flap, ${depth} ${cells(depth)} deep. The tint shows what will move.`;
}
$('apply').addEventListener('click',() => {
  if (won) {
    start((index+1) % levels.length);
    return;
  }
  if (!depthLimit(grid,side)) return;
  past.push({grid,side,depth});
  grid = fold(grid,side,depth);
  won = match(grid,levels[index].target);
  if (won) {
    completed.add(index);
    try { localStorage.setItem(storage,JSON.stringify([...completed])); } catch { /* play still works */ }
    message = completed.size === levels.length ? 'Matched. All six puzzles solved.' : 'Matched. Nicely folded.';
  } else if (grid.length < levels[index].target.length || grid[0].length < levels[index].target[0].length) {
    message = 'The sheet is smaller than the target now. Undo this fold and try another.';
  } else {
    message = 'Fold made. Compare the shape and marks with the target.';
  }
  selectSide();
  render();
});
$('undo').addEventListener('click',() => {
  if (!past.length) return;
  ({grid,side,depth} = past.pop());
  won = false;
  message = 'Last fold undone.';
  render();
  if (!past.length) $('apply').focus();
});
$('reset').addEventListener('click',() => {
  start(index);
  message = 'Back to a flat sheet.';
  render();
  $('apply').focus();
});
$('hint').addEventListener('click',() => {
  const path = solution(grid,levels[index].target);
  if (!path?.length) message = 'No route from this shape. Undo a fold or start again.';
  else {
    [side,depth] = path[0];
    message = `Try the ${names[side].toLowerCase()} flap, ${depth} ${cells(depth)} deep.`;
  }
  render();
});
start(index);
