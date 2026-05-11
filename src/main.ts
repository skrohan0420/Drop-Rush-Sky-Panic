import Phaser from 'phaser';
import { gameConfig } from './game/gameConfig';

// Main browser entry point. Keep bootstrapping small so game systems can grow
// inside src/game and scene behavior can stay focused inside src/scenes.
new Phaser.Game(gameConfig);
