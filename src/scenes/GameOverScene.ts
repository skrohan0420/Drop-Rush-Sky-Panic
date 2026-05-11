import Phaser from 'phaser';
import { AudioManager } from '../game/AudioManager';
import { SaveManager, type RunResult } from '../game/SaveManager';
import { COLORS, GAME_WIDTH } from '../game/gameSettings';
import { THEMES } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { SceneButton } from '../ui/SceneButton';

export class GameOverScene extends Phaser.Scene {
  private background!: AnimatedBackground;
  private audio!: AudioManager;

  constructor() {
    super('GameOverScene');
  }

  create(data: RunResult): void {
    const fallback: RunResult = {
      score: 0,
      ballsCaught: 0,
      survivalTime: 0,
      longestCombo: 1,
    };
    const result = { ...fallback, ...data };
    const save = SaveManager.recordRun(result);

    this.background = new AnimatedBackground(this, THEMES[save.settings.selectedTheme], 52);
    this.audio = new AudioManager(this);
    this.cameras.main.fadeIn(260, 5, 7, 13);

    this.add
      .text(GAME_WIDTH / 2, 220, 'RUN COMPLETE', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '66px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        GAME_WIDTH / 2,
        430,
        [
          `FINAL SCORE  ${result.score}`,
          `BEST SCORE   ${save.highScore}`,
          `LONGEST COMBO x${result.longestCombo}`,
          `SURVIVED     ${Math.floor(result.survivalTime)}s`,
        ],
        {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '44px',
          color: COLORS.text,
          align: 'center',
          lineSpacing: 30,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(20);

    new SceneButton(this, GAME_WIDTH / 2, 980, 'RETRY', () => {
      this.audio.playUi();
      this.scene.start('GameScene');
    });

    new SceneButton(this, GAME_WIDTH / 2, 1100, 'MAIN MENU', () => {
      this.audio.playUi();
      this.scene.start('MainMenuScene');
    });
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
  }
}
