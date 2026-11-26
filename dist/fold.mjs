// A sheet is a rectangular grid of tracing-paper stacks. A cell stores its ink marks.
export const names = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' };
export const sides = Object.keys(names);
export const depthLimit = (grid, side) =>
  Math.floor((side === 'left' || side === 'right' ? grid[0].length : grid.length) / 2);

export function sheet(rows) {
  return rows.map(row => [...row].map(c => c === '.' ? '' : c));
}

export function fold(grid, side, depth) {
  if (!sides.includes(side) || !Number.isInteger(depth) || depth < 1 || depth > depthLimit(grid, side)) {
    throw new RangeError('The flap must fit within the sheet');
  }
  const h = grid.length, w = grid[0].length;
  const across = side === 'left' || side === 'right';
  const near = side === 'left' || side === 'top';
  const span = across ? w : h;
  const crease = near ? depth : span - depth;
  const paper = Array.from({length: h - (across ? 0 : depth)},
    () => Array(w - (across ? depth : 0)).fill(''));
  grid.forEach((row, y) => row.forEach((marks, x) => {
    let v = across ? x : y;
    if (near ? v < crease : v >= crease) v = 2 * crease - v - 1;
    if (near) v -= depth;
    const ny = across ? y : v, nx = across ? v : x;
    paper[ny][nx] += marks;
  }));
  return paper.map(row => row.map(cell => [...cell].sort().join('')));
}
export const key = grid => JSON.stringify(grid);
export const match = (a,b) => key(a) === key(b);

export function solution(grid, target) {
  const seen = new Set([key(grid)]);
  const queue = [[grid, []]];
  for (let i = 0; i < queue.length; i++) {
    const [current, path] = queue[i];
    if (match(current, target)) return path;
    for (const side of sides) for (let n = 1; n <= depthLimit(current, side); n++) {
      const next = fold(current, side, n);
      if (next.length < target.length || next[0].length < target[0].length) continue;
      const id = key(next);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push([next, [...path, [side,n]]]);
    }
  }
  return null;
}

const specs = [
  ['First crease', ['.o..','....','....','..d.'], [['left',2]]],
  ['Corner pocket', ['.o..','d...','....','..o.'], [['bottom',2],['left',1]]],
  ['Ink sandwich', ['o..d.','.....','.r..o','d....','.o.r.'], [['right',2],['top',2]]],
  ['Three small turns', ['o..d..','..r..o','.....d','r.....','..o...','....d.'], [['left',2],['bottom',2],['right',2]]],
  ['Double impression', ['.d..o.','o....r','..r...','.....d','..o...','r..d..'], [['top',2],['right',2],['bottom',1],['left',2]]],
  ['The last crease', ['o...d..','..r...o','.d...r.','...o...','r.....d','..o....','....d.r'], [['right',2],['bottom',3],['left',2],['top',1],['right',1]]],
];
export const levels = specs.map(([name,rows,moves]) => {
  const start = sheet(rows);
  const target = moves.reduce((grid, [side,n]) => fold(grid,side,n),start);
  return {name,start,target,example:moves};
});
