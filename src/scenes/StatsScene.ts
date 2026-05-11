import Phaser from 'phaser';
import { AudioManager } from '../game/AudioManager';
import { SaveManager } from '../game/SaveManager';
import { COLORS, GAME_WIDTH } from '../game/gameSettings';
import { THEMES } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { SceneButton } from '../ui/SceneButton';

export class StatsScene extends Phaser.Scene {
  private background!: AnimatedBackground;
  private audio!: AudioManager;

  constructor() {
    super('StatsScene');
  }

  create(): void {
    const save = SaveManager.load();
    const stats = save.stats;

    this.background = new AnimatedBackground(this, THEMES[save.settings.selectedTheme], 48);
    this.audio = new AudioManager(this);

    this.add
      .text(GAME_WIDTH / 2, 220, 'STATISTICS', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '72px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        GAME_WIDTH / 2,
        430,
        [
          `GAMES PLAYED  ${stats.gamesPlayed}`,
          `TOTAL CAUGHT  ${stats.totalBallsCaught}`,
          `LONGEST RUN   ${Math.floor(stats.longestSurvivalTime)}s`,
          `HIGHEST COMBO x${stats.highestCombo}`,
          `HIGH SCORE    ${save.highScore}`,
        ],
        {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '42px',
          color: COLORS.text,
          align: 'center',
          lineSpacing: 30,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(20);

    new SceneButton(this, GAME_WIDTH / 2, 1250, 'BACK', () => {
      this.audio.playUi();
      this.scene.start('MainMenuScene');
    });
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
  }
}
