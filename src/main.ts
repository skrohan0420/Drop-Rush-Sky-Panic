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
