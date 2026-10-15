import { $ } from './dom.js';
import { theme } from './theme.js';

let confetti = [],
  confettiRAF = 0;
export function launchConfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confetti'),
    dpr = window.devicePixelRatio || 1,
    W = innerWidth,
    H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const cols = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'gold'].map(k => theme[k]).filter(Boolean);
  const burst = (x, dir, n) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + dir * (0.25 + Math.random() * 0.55),
        v = 9 + Math.random() * 10;
      confetti.push({
        x,
        y: H * 0.95,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.35,
        wob: Math.random() * 6.28,
        col: cols[i % cols.length],
        life: 0,
      });
    }
  };
  confetti = [];
  burst(0, 1, 110);
  burst(W, -1, 110);
  // a second, gentler shower from the top
  setTimeout(() => {
    for (let i = 0; i < 90; i++)
      confetti.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.3,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 2,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        wob: Math.random() * 6.28,
        col: cols[i % cols.length],
        life: 0,
      });
  }, 350);
  cancelAnimationFrame(confettiRAF);
  const x = c.getContext('2d');
  const tick = () => {
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    for (const p of confetti) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.vy = Math.min(p.vy, 5.5);
      p.wob += 0.12;
      p.x += p.vx + Math.sin(p.wob) * 0.8;
      p.y += p.vy;
      p.r += p.vr;
      p.life++;
      x.save();
      x.translate(p.x, p.y);
      x.rotate(p.r);
      x.scale(1, Math.cos(p.wob * 1.3));
      x.fillStyle = p.col;
      x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      x.restore();
    }
    confetti = confetti.filter(p => p.y < H + 40 && p.life < 600);
    if (confetti.length) confettiRAF = requestAnimationFrame(tick);
    else x.clearRect(0, 0, W, H);
  };
  confettiRAF = requestAnimationFrame(tick);
}
export function stopConfetti() {
  cancelAnimationFrame(confettiRAF);
  confetti = [];
  const c = $('confetti');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}
