import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
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
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
    activePointers: 2,
  },
};
