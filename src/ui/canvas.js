import { VH, VW } from '../config.js';

export const canvas = document.getElementById('game'),
  ctx = canvas.getContext('2d');
export function fitCanvas() {
  const main = document.querySelector('main'),
    stage = document.getElementById('stage');
  // Reset and the bank sit beside the box when the window has room; otherwise reset joins the top bar and the bank the header
  const side = (window.innerWidth - main.getBoundingClientRect().width) / 2;
  const rb = document.getElementById('resetBtn'),
    bk = document.getElementById('bankBtn'),
    wrap = document.getElementById('boxWrap');
  if (side >= 76) {
    if (rb.parentElement !== wrap) wrap.appendChild(rb);
    rb.classList.add('beside');
  } else {
    const bar = document.querySelector('.topbar');
    if (rb.parentElement !== bar) bar.prepend(rb);
    rb.classList.remove('beside');
  }
  if (side >= 112) {
    if (bk.parentElement !== wrap) wrap.appendChild(bk);
    bk.classList.add('beside');
  } else {
    const nx = document.querySelector('.next');
    if (bk.nextElementSibling !== nx) nx.before(bk);
    bk.classList.remove('beside');
  }
  const cs = getComputedStyle(main),
    gap = parseFloat(cs.rowGap) || 0;
  let used = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  for (const el of main.children) if (el !== stage) used += el.getBoundingClientRect().height + gap;
  const availH = Math.max(240, main.clientHeight - used),
    availW = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const scale = Math.min(availW / VW, availH / VH);
  const cssW = Math.floor(VW * scale),
    cssH = Math.floor(VH * scale),
    dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.__k = canvas.width / VW;
  canvas.__css = cssW / VW;
  stage.style.height = cssH + 'px';
}
addEventListener('resize', fitCanvas);
