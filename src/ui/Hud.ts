import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../game/gameSettings';

const HUD_FONT = 'Arial, Helvetica, sans-serif';

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly gameOverText: Phaser.GameObjects.Text;
  private readonly restartText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add
      .text(64, 56, 'SCORE 0', {
        fontFamily: HUD_FONT,
        fontSize: '46px',
        color: COLORS.text,
      })
      .setDepth(50);

    this.livesText = scene.add
      .text(GAME_WIDTH - 64, 56, 'LIVES 3', {
        fontFamily: HUD_FONT,
        fontSize: '46px',
        color: COLORS.text,
      })
      .setOrigin(1, 0)
      .setDepth(50);

    this.gameOverText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 92, 'GAME OVER', {
        fontFamily: HUD_FONT,
        fontSize: '92px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setVisible(false);

    this.restartText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, 'TAP TO RESTART', {
        fontFamily: HUD_FONT,
        fontSize: '38px',
        color: COLORS.mutedText,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setVisible(false);
  }

  setScore(score: number): void {
    this.scoreText.setText(`SCORE ${score}`);
  }

  setLives(lives: number): void {
    this.livesText.setText(`LIVES ${lives}`);
  }

  showGameOver(score: number): void {
    this.gameOverText.setText(`GAME OVER\n${score}`);
    this.gameOverText.setVisible(true);
    this.restartText.setVisible(true);
  }

  hideGameOver(): void {
    this.gameOverText.setVisible(false);
    this.restartText.setVisible(false);
  }
}
