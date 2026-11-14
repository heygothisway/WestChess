import { Chess } from './chess.js';

const G = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const $ = id => document.getElementById(id);
const boardEl = $('board'), statusEl = $('status');

let game = new Chess();
let sel = null, targets = [], thinking = false, last = null;

const isCpu = () => $('mode').value === 'cpu';
const humanColor = () => ($('side').value);
const flipped = () => isCpu() ? humanColor() === 'b' : false;

// ---------- AI ----------
function evaluate(g) {
  let s = 0;
  for (const row of g.board()) for (const p of row) {
    if (!p) continue;
    let v = VAL[p.type];
    if (p.type === 'p' || p.type === 'n' || p.type === 'b') {
      const f = 'abcdefgh'.indexOf(p.square[0]), r = +p.square[1] - 1;
      const rr = p.color === 'w' ? r : 7 - r;
      v += (3.5 - Math.abs(3.5 - f)) * 4 + (3.5 - Math.abs(3.5 - rr)) * 3;
      if (p.type === 'p') v += rr * 6;
    }
    s += p.color === 'w' ? v : -v;
  }
  return s;
}

function order(moves) {
  return moves.sort((a, b) =>
    ((b.captured ? VAL[b.captured] * 10 - VAL[b.piece] : 0) + (b.promotion ? 800 : 0)) -
    ((a.captured ? VAL[a.captured] * 10 - VAL[a.piece] : 0) + (a.promotion ? 800 : 0)));
}

function search(g, depth, alpha, beta) {
  if (g.isCheckmate()) return -100000 - depth;
  if (g.isDraw()) return 0;
  if (depth === 0) return (g.turn() === 'w' ? 1 : -1) * evaluate(g);
  let best = -Infinity;
  for (const m of order(g.moves({ verbose: true }))) {
    g.move(m);
    const v = -search(g, depth - 1, -beta, -alpha);
    g.undo();
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function pickMove(level) {
  const moves = game.moves({ verbose: true });
  if (level === 1 && Math.random() < 0.35) return moves[Math.random() * moves.length | 0];
  const depth = level === 1 ? 1 : level === 2 ? 2 : 3;
  let best = -Infinity, cands = [];
  for (const m of order(moves)) {
    game.move(m);
    const v = -search(game, depth - 1, -Infinity, Infinity) + Math.random() * 4;
    game.undo();
    if (v > best) { best = v; cands = [m]; }
  }
  return cands[0];
}

function cpuTurn() {
  if (game.isGameOver()) return;
  thinking = true; render();
  setTimeout(() => {
    const m = pickMove(+$('level').value);
    thinking = false;
    play(m);
  }, 50);
}

// ---------- UI ----------
function play(m) {
  const mv = game.move(m);
  last = mv;
  sel = null; targets = [];
  render();
  if (isCpu() && !game.isGameOver() && game.turn() !== humanColor()) cpuTurn();
}

function render() {
  const fl = flipped();
  boardEl.innerHTML = '';
  const kingSq = game.inCheck() ? game.board().flat().find(p => p && p.type === 'k' && p.color === game.turn())?.square : null;
  for (let i = 0; i < 64; i++) {
    const r = fl ? 7 - (i >> 3) : i >> 3, c = fl ? 7 - (i & 7) : i & 7;
    const sq = 'abcdefgh'[c] + (8 - r);
    const p = game.get(sq);
    const d = document.createElement('div');
    d.className = 'sq ' + ((r + c) % 2 ? 'd' : 'l');
    if (last && (sq === last.from || sq === last.to)) d.classList.add('last');
    if (sq === sel) d.classList.add('sel');
    if (sq === kingSq) d.classList.add('chk');
    if (targets.includes(sq)) d.classList.add('hint', ...(p ? ['cap'] : []));
    if (p) { d.textContent = G[p.type.toUpperCase()]; d.classList.add(p.color); }
    d.onclick = () => tap(sq);
    boardEl.appendChild(d);
  }
  const who = game.turn() === 'w' ? '白方' : '黑方';
  let t;
  if (game.isCheckmate()) t = `將死！${game.turn() === 'w' ? '黑方' : '白方'}獲勝 🎉`;
  else if (game.isStalemate()) t = '逼和（和棋）';
  else if (game.isDraw()) t = '和棋';
  else if (thinking) t = '電腦思考中…';
  else t = `輪到${who}` + (game.inCheck() ? '（被將軍！）' : '');
  statusEl.textContent = t;
}

function tap(sq) {
  if (thinking || game.isGameOver()) return;
  if (isCpu() && game.turn() !== humanColor()) return;
  if (sel) {
    const ms = game.moves({ square: sel, verbose: true }).filter(m => m.to === sq);
    if (ms.length) {
      if (ms[0].promotion) return askPromo(ms);
      return play(ms[0]);
    }
  }
  const p = game.get(sq);
  if (p && p.color === game.turn()) {
    sel = sq;
    targets = game.moves({ square: sq, verbose: true }).map(m => m.to);
  } else { sel = null; targets = []; }
  render();
}

function askPromo(ms) {
  const el = $('promo');
  el.innerHTML = '';
  el.style.display = 'flex';
  for (const m of ms) {
    const b = document.createElement('button');
    b.textContent = G[m.promotion.toUpperCase()];
    b.onclick = () => { el.style.display = 'none'; play(m); };
    el.appendChild(b);
  }
}

function newGame() {
  game = new Chess(); sel = null; targets = []; last = null; thinking = false;
  render();
  if (isCpu() && humanColor() === 'b') cpuTurn();
}

$('new').onclick = newGame;
$('mode').onchange = $('side').onchange = newGame;
$('undo').onclick = () => {
  if (thinking) return;
  game.undo();
  if (isCpu() && game.turn() !== humanColor()) game.undo();
  last = null; sel = null; targets = [];
  render();
};

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
