import Matter from 'matter-js';
import { Sound } from '../audio/sound.js';
import { BOX, CFG } from '../config.js';
import { extent } from '../map/geometry.js';
import { addGroup, buildGroup, overlapDepth } from '../physics/world.js';
import { G } from '../state.js';
import { canvas } from '../ui/canvas.js';
import { toast, updateHUD } from '../ui/hud.js';

const { Body } = Matter;

/* The waiting piece aims as a circle the size of its arrow ring: the ring stops at the walls, and spinning never shifts it */
function ringReach(pc) {
  return pc.R + CFG.ringGap + 0.8 * Math.max(1, 0.8 / (canvas.__css || 1));
}
export function clampAim() {
  if (!G.current) return;
  const r = ringReach(G.current),
    lo = BOX.l + r,
    hi = BOX.r - r;
  G.aimX = lo <= hi ? Math.max(lo, Math.min(hi, G.aimX)) : (BOX.l + BOX.r) / 2;
}
export function canDrop() {
  return G.state === 'playing' && G.current && performance.now() - G.lastDrop > CFG.dropCooldown;
}
function hoverTop() {
  return 8;
}
/* Height of the waiting piece's centre: fixed, and low enough that the piece and its arrow ring never reach the top at any angle */
export function hoverY(pc) {
  return hoverTop() + pc.R + CFG.ringGap;
}
export function drop() {
  if (!canDrop()) return;
  const pc = G.current,
    g = buildGroup(pc.states),
    e = extent(pc, G.aimAngle);
  // place so the rotated piece lines up exactly with the aiming preview
  const ax = G.aimX,
    ay = hoverY(pc),
    cs = Math.cos(G.aimAngle),
    sn = Math.sin(G.aimAngle);
  const dx = pc.c.x - g.m0.x,
    dy = pc.c.y - g.m0.y;
  Body.setAngle(g, G.aimAngle);
  Body.setPosition(g, { x: ax - (cs * dx - sn * dy), y: ay - (sn * dx + cs * dy) });
  // If something is still sitting in the drop zone, spawn higher instead of inside it
  for (let lift = 0; lift < 240 && overlapDepth(g, []) > CFG.snapTolerance; lift += 8)
    Body.setPosition(g, { x: g.position.x, y: g.position.y - 8 });
  addGroup(g);
  Sound.fx.drop();
  G.lastDrop = performance.now();
  G.current = G.deck.pop() || null;
  G.aimAngle = 0;
  if (G.current) clampAim();
  else
    toast(
      G.bankPhase === 'holding' ? 'Drop your banked piece to finish' : 'Every piece is in. Shake to connect the rest',
    );
  updateHUD();
}
