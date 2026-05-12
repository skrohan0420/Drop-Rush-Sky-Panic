import Phaser from 'phaser';
import { gameConfig } from './game/gameConfig';

// Main browser entry point. Keep bootstrapping small so game systems can grow
// inside src/game and scene behavior can stay focused inside src/scenes.
const game = new Phaser.Game(gameConfig);

const refreshGameScale = (): void => {
  game.scale.refresh();
};

window.addEventListener('resize', refreshGameScale);
window.addEventListener('orientationchange', refreshGameScale);

if (typeof window !== 'undefined' && window.visualViewport) {
  window.visualViewport.addEventListener('resize', refreshGameScale);
  window.visualViewport.addEventListener('scroll', refreshGameScale);
}

// Capacitor / Android WebView often finishes layout after the first frame; refresh again so FIT
// scaling and pointer→world mapping match the real viewport (fixes stray letterboxing and touches).
window.addEventListener('load', refreshGameScale);
window.addEventListener('focus', refreshGameScale);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshGameScale();
  }
});

requestAnimationFrame(refreshGameScale);
window.setTimeout(refreshGameScale, 120);
window.setTimeout(refreshGameScale, 380);
