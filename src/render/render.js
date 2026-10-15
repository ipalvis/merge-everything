import { BOX, CFG, VH, VW } from '../config.js';
import { canDrop, hoverY } from '../game/aim.js';
import { dangerY } from '../game/game.js';
import { STATES } from '../map/geometry.js';
import { G } from '../state.js';
import { canvas, ctx } from '../ui/canvas.js';
import { theme } from '../ui/theme.js';

function path(c, pts) {
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.closePath();
}
export function drawState(c, st, fill, lw, label) {
  for (const p of st.parts) {
    path(c, p.outline);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = lw;
    c.strokeStyle = theme.stroke;
    c.lineJoin = 'round';
    c.stroke();
  }
  if (label && st.area > 700) {
    c.fillStyle = theme.stroke;
    c.font = `800 ${st.area > 3000 ? 14.5 : 11.5}px "Public Sans", system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(st.id, st.labelAt.x, st.labelAt.y);
  }
}
function drawGroup(g, now) {
  ctx.save();
  ctx.translate(g.position.x, g.position.y);
  ctx.rotate(g.angle);
  ctx.translate(-g.m0.x, -g.m0.y);
  const f = G.flashes.find(f => f.g === g);
  const glow = f ? Math.max(0, 1 - (now - f.t) / 450) : 0;
  const pick = g === G.bankTarget;
  if (g.golden || glow || pick) {
    ctx.shadowColor = theme.gold;
    ctx.shadowBlur = g.golden || pick ? 22 : 18 * glow;
  }
  for (const id of g.ids) {
    const st = STATES[id];
    drawState(ctx, st, g.golden ? theme.gold : theme['c' + st.color], 1.1, false);
  }
  ctx.shadowBlur = 0;
  for (const id of g.ids) {
    const st = STATES[id];
    drawState(ctx, st, 'transparent', 0, true);
  }
  ctx.restore();
}
export function render(now) {
  const k = canvas.__k || 1;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, VW, VH);
  // water inside the box, with a faint graticule
  ctx.fillStyle = theme.box;
  ctx.fillRect(BOX.l, 0, CFG.boxW, BOX.b);
  ctx.strokeStyle = theme['box-line'];
  ctx.lineWidth = 1;
  for (let x = BOX.l + 50; x < BOX.r; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BOX.b);
    ctx.stroke();
  }
  for (let y = BOX.b - 50; y > 0; y -= 50) {
    ctx.beginPath();
    ctx.moveTo(BOX.l, y);
    ctx.lineTo(BOX.r, y);
    ctx.stroke();
  }
  // danger line
  const dy = dangerY(),
    warn = G.dangerSince !== null;
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = warn ? 3 : 2;
  ctx.strokeStyle = theme['box-danger'];
  ctx.globalAlpha = warn ? 0.6 + 0.4 * Math.sin(now / 90) : 0.7;
  ctx.beginPath();
  ctx.moveTo(BOX.l, dy);
  ctx.lineTo(BOX.r, dy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // pieces
  for (const g of G.groups) drawGroup(g, now);
  // aiming preview, circled by rotation arrows that turn with it
  if (G.state === 'playing' && G.current) {
    const pc = G.current,
      cy = hoverY(pc),
      ready = canDrop();
    const spinning = G.press && performance.now() - G.press.t0 > CFG.rotateDelay;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = theme['box-guide'];
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(G.aimX, cy + pc.R + CFG.ringGap);
    ctx.lineTo(G.aimX, BOX.b);
    ctx.stroke();
    ctx.setLineDash([]);
    drawSpinRing(G.aimX, cy, pc.R + CFG.ringGap, G.aimAngle, spinning);
    ctx.globalAlpha = ready ? 0.95 : 0.35;
    ctx.save();
    ctx.translate(G.aimX, cy);
    ctx.rotate(G.aimAngle);
    ctx.translate(-pc.c.x, -pc.c.y);
    for (const sid of pc.states) drawState(ctx, STATES[sid], theme['c' + STATES[sid].color], 1.1, true);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // the box itself: walls and floor
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(BOX.l - 3, 6);
  ctx.lineTo(BOX.l - 3, BOX.b + 3);
  ctx.lineTo(BOX.r + 3, BOX.b + 3);
  ctx.lineTo(BOX.r + 3, 6);
  ctx.stroke();
  if (G.blend) {
    ctx.beginPath();
    ctx.moveTo(BOX.l - 3, 3);
    ctx.lineTo(BOX.r + 3, 3);
    ctx.stroke();
  } // the lid
  if (G.state === 'bankpick') {
    // picking a piece to bank: the game is paused
    const fs = Math.max(15, 13 / (canvas.__css || 1)),
      msg = 'Tap a piece to bank it';
    ctx.save();
    ctx.font = `800 ${fs}px "Public Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(msg).width + fs * 1.8,
      h = fs * 2.2;
    ctx.fillStyle = theme.page;
    ctx.globalAlpha = 0.94;
    ctx.beginPath();
    ctx.roundRect(VW / 2 - w / 2, 30, w, h, h / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = theme.ink;
    ctx.fillText(msg, VW / 2, 30 + h / 2);
    ctx.restore();
  }
  G.flashes = G.flashes.filter(f => now - f.t < 450);
}
/* Two large clockwise arrows on a circle around the waiting piece; they turn with it. */
function drawSpinRing(x, y, R, ang, active) {
  const s = Math.max(1, 0.8 / (canvas.__css || 1)); // keep lines and heads visible when the box is drawn small
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = ctx.fillStyle = active ? theme.gold : theme.frame;
  ctx.globalAlpha = active ? 0.95 : 0.45;
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  for (const base of [0, Math.PI]) {
    const a0 = base - Math.PI * 0.8,
      a1 = base - Math.PI * 0.12; // each arrow covers a bit over a third of the circle
    ctx.beginPath();
    ctx.arc(0, 0, R, a0, a1);
    ctx.stroke();
    const ex = R * Math.cos(a1),
      ey = R * Math.sin(a1),
      tx = -Math.sin(a1),
      ty = Math.cos(a1),
      nx = Math.cos(a1),
      ny = Math.sin(a1),
      h = 7 * s;
    ctx.beginPath();
    ctx.moveTo(ex + tx * h, ey + ty * h);
    ctx.lineTo(ex + nx * h * 0.6, ey + ny * h * 0.6);
    ctx.lineTo(ex - nx * h * 0.6, ey - ny * h * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
