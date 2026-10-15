import Matter from 'matter-js';
import { CFG, VH, VW } from '../config.js';
import { clampAim, drop, hoverY } from '../game/aim.js';
import { askBank, closeBank, endBankPick } from '../game/bank.js';
import { blendIt } from '../game/blend.js';
import { shake } from '../game/shake.js';
import { G, tutBlocks } from '../state.js';
import { canvas } from '../ui/canvas.js';

function toLogicalXY(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * VW) / r.width, y: ((e.clientY - r.top) * VH) / r.height };
}
function onWaiting(p) {
  const pc = G.current;
  return pc && Math.hypot(p.x - G.aimX, p.y - hoverY(pc)) <= pc.R + CFG.ringGap;
}
function pieceAt(p) {
  for (const g of G.groups)
    for (const q of g.parts.slice(1))
      if (Matter.Bounds.contains(q.bounds, p) && Matter.Vertices.contains(q.vertices, p)) return g;
  return null;
}
canvas.addEventListener('pointerdown', e => {
  const p = toLogicalXY(e);
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (_) {}
  if (G.state === 'bankpick') {
    const g = onWaiting(p) ? G.current : pieceAt(p);
    if (g) askBank(g);
    else endBankPick();
    return;
  }
  if (G.state !== 'playing' || tutBlocks('drop')) return;
  G.aimX = p.x;
  clampAim();
  G.press = { t0: performance.now() }; // holding anywhere spins the waiting piece; letting go drops it
});
canvas.addEventListener('pointermove', e => {
  if (G.state !== 'playing') return; // e.g. while picking a piece to bank, the waiting piece stays put
  const p = toLogicalXY(e);
  G.aimX = p.x;
  clampAim();
});
canvas.addEventListener('pointerup', e => {
  const pr = G.press;
  G.press = null;
  if (!pr) return;
  const p = toLogicalXY(e);
  G.aimX = p.x;
  clampAim();
  drop();
});
canvas.addEventListener('pointercancel', () => {
  G.press = null;
});
addEventListener('keydown', e => {
  if (G.state === 'banking' && e.key === 'Escape') {
    closeBank(false);
    return;
  }
  if (G.state === 'bankpick' && e.key === 'Escape') {
    endBankPick();
    return;
  }
  if (G.state !== 'playing') return;
  const k = e.key.toLowerCase();
  if (tutBlocks(k === 's' ? 'shake' : k === 'b' ? 'blend' : 'drop')) return;
  if (e.key === 'ArrowLeft') {
    G.aimX -= 14;
    clampAim();
    e.preventDefault();
  } else if (e.key === 'ArrowRight') {
    G.aimX += 14;
    clampAim();
    e.preventDefault();
  } else if (e.key === ' ' || e.key === 'ArrowDown') {
    drop();
    e.preventDefault();
  } else if (e.key === 'z' || e.key === 'Z') {
    G.aimAngle -= Math.PI / 12;
    clampAim();
  } else if (e.key === 'x' || e.key === 'X') {
    G.aimAngle += Math.PI / 12;
    clampAim();
  } else if (e.key === 's' || e.key === 'S') shake();
  else if (e.key === 'b' || e.key === 'B') blendIt();
});
