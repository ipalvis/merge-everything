import { $ } from './dom.js';
import { updateHUD } from './hud.js';

export const theme = {};
function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  for (const k of [
    'box',
    'box-line',
    'box-danger',
    'box-guide',
    'ocean',
    'ocean-line',
    'frame',
    'stroke',
    'danger',
    'gold',
    'ink',
    'page',
    'c0',
    'c1',
    'c2',
    'c3',
    'c4',
    'c5',
    'c6',
  ])
    theme[k] = cs.getPropertyValue('--' + k).trim();
}
function applyTheme(t, save) {
  document.documentElement.dataset.theme = t;
  $('themeToggle').setAttribute('aria-checked', t === 'dark');
  readTheme();
  if (save) updateHUD();
}
{
  const t = 'light';
  document.documentElement.dataset.theme = t;
  document.getElementById('themeToggle').setAttribute('aria-checked', t === 'dark');
}
readTheme();
document
  .getElementById('themeToggle')
  .addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true),
  );
