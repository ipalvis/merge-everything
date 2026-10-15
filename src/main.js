/*
 * Entry point: loads every module, wires the control buttons, and starts the game loop.
 * Modules that only register event listeners are imported for their side effects.
 */
import './ui/theme.js';
import './ui/canvas.js';
import './audio/sound.js';
import './input/input.js';
import './game/bank.js';
import { TEST_IDS } from './config.js';
import { blendIt } from './game/blend.js';
import { goEndless, newGame } from './game/game.js';
import { giveUp } from './game/giveUp.js';
import { frame } from './game/loop.js';
import { shake } from './game/shake.js';
import { endTutorial, startTutorial, tutorialDone } from './game/tutorial.js';
import { setupWorld } from './physics/world.js';
import { canvas, fitCanvas } from './ui/canvas.js';
import { $ } from './ui/dom.js';
import { updateHUD } from './ui/hud.js';

$('shakeBtn').addEventListener('click', shake);
$('resetBtn').addEventListener('click', () => {
  endTutorial();
  $('startOverlay').hidden = true;
  $('overOverlay').hidden = true;
  newGame();
});
$('blendBtn').addEventListener('click', blendIt);
$('giveUpBtn').addEventListener('click', giveUp);
/* Title card. New players get "Start Tutorial" (big) or "Skip"; returning players get "Play" (big) or "Tutorial". */
{
  const firstTime = !tutorialDone();
  const play = () => {
    $('startOverlay').hidden = true;
    endTutorial(); // also remembers that the tutorial was offered
    newGame();
    canvas.focus?.();
  };
  const tutorial = () => {
    $('startOverlay').hidden = true;
    startTutorial();
  };
  $('titleTagline').hidden = !firstTime;
  $('titlePrimary').textContent = firstTime ? 'Start Tutorial' : 'Play';
  $('titleSecondary').textContent = firstTime ? 'Skip' : 'Tutorial';
  $('titlePrimary').addEventListener('click', firstTime ? tutorial : play);
  $('titleSecondary').addEventListener('click', firstTime ? play : tutorial);
}
$('againBtn').addEventListener('click', () => {
  $('overOverlay').hidden = true;
  newGame();
});
$('restartBtn').addEventListener('click', () => {
  newGame();
});
$('endlessBtn').addEventListener('click', goEndless);
if (TEST_IDS) document.title += ` (Test: ${TEST_IDS.length} states)`;

fitCanvas();
setupWorld();
updateHUD();
requestAnimationFrame(frame);
document.fonts && document.fonts.ready.then(() => updateHUD());
