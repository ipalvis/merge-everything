import Matter from 'matter-js';
import { Sound } from '../audio/sound.js';
import { CFG } from '../config.js';
import { G } from '../state.js';
import { $ } from '../ui/dom.js';

const { Body, Sleeping } = Matter;

/* One push to every piece. side = 0 for a random toss, or -1 / +1 to sway with the box. */
function jolt(strength, side) {
  for (const g of G.groups) {
    Sleeping.set(g, false);
    const k = Math.min(1, 6 / Math.sqrt(g.ids.size)) * strength;
    const v = Body.getVelocity(g);
    const vx = side ? side * (3 + Math.random() * 3) : (Math.random() * 2 - 1) * 6;
    Body.setVelocity(g, { x: v.x + vx * k, y: v.y - (3 + Math.random() * 5) * k });
    Body.setAngularVelocity(g, Body.getAngularVelocity(g) + (Math.random() * 2 - 1) * 0.06 * k);
  }
}
export function shake() {
  const now = performance.now();
  if (G.state !== 'playing' || now - G.lastShake < CFG.shakeCooldown) return;
  G.lastShake = now;
  Sound.fx.shake(CFG.shakeDuration);
  // A big toss, then two smaller sways that follow the box's side-to-side motion
  const D = CFG.shakeDuration,
    r = G.round;
  jolt(1, 0);
  setTimeout(() => {
    if (G.state === 'playing' && G.round === r) jolt(0.6, 1);
  }, D * 0.3);
  setTimeout(() => {
    if (G.state === 'playing' && G.round === r) jolt(0.5, -1);
  }, D * 0.6);
  const st = $('stage');
  st.style.setProperty('--shake-dur', D + 'ms');
  st.classList.remove('shake');
  void st.offsetWidth;
  st.classList.add('shake');
  $('shakeBtn').disabled = true;
  setTimeout(() => {
    $('shakeBtn').disabled = G.state !== 'playing';
  }, CFG.shakeCooldown);
}
