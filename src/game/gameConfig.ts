import Phaser from 'phaser';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { StatsScene } from '../scenes/StatsScene';
import { GAME_BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './gameSettings';

export { GAME_BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from './gameSettings';

// Central Phaser configuration. Scenes, scale behavior, renderer, and global
// arcade settings belong here so features can be added without crowding main.ts.
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: GAME_BACKGROUND_COLOR,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scene: [MainMenuScene, GameScene, GameOverScene, SettingsScene, StatsScene],
  scale: {
    // FIT keeps the full game world on screen with letterboxing. On Android
    // WebViews, ENVELOP often misaligns pointer coordinates when the viewport
    // or safe area changes; FIT maps touches to the canvas reliably.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    // Default is 500ms — WebView layout can settle late; faster checks fix wrong aspect & touch mapping.
    resizeInterval: 100,
    // Let ScaleManager expand parent/body to 100% height so #app reliably fills the WebView.
    expandParent: true,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: 0,
      },
    },
  },
  input: {
    // One finger for paddle + UI; extra pointers can confuse hit testing on some devices.
    activePointers: 1,
    // preventDefault on touch so the WebView does not steal gestures (scroll/zoom) from the canvas.
    touch: { capture: true },
  },
};
