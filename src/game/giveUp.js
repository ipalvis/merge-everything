import { endBlend } from './blend.js';
import { gameOver } from './game.js';
import { G } from '../state.js';
import { $ } from '../ui/dom.js';

let giveUpArmed = -Infinity;
export function giveUp() {
  if (G.tut || !['playing', 'blending', 'clearing'].includes(G.state)) return;
  const btn = $('giveUpBtn'),
    now = performance.now();
  if (now - giveUpArmed > 3000) {
    giveUpArmed = now;
    btn.classList.add('armed');
    btn.setAttribute('aria-label', 'Are you sure? Tap again to give up');
    setTimeout(() => {
      if (performance.now() - giveUpArmed >= 2900) {
        btn.classList.remove('armed');
        btn.removeAttribute('aria-label');
      }
    }, 3000);
    return;
  }
  giveUpArmed = -Infinity;
  btn.classList.remove('armed');
  btn.removeAttribute('aria-label');
  clearTimeout(G.clearTimer);
  endBlend();
  gameOver('giveup');
}
