import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../game/gameSettings';
import { getSafeArea } from './layout';

const HUD_FONT = 'Arial, Helvetica, sans-serif';

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly gameOverText: Phaser.GameObjects.Text;
  private readonly restartText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const safe = getSafeArea(scene, 42);

    this.scoreText = scene.add
      .text(safe.left, safe.top + 8, 'SCORE 0', {
        fontFamily: HUD_FONT,
        fontSize: '46px',
        color: COLORS.text,
      })
      .setDepth(50);

    this.livesText = scene.add
      .text(safe.right, safe.top + 8, 'LIVES 3', {
        fontFamily: HUD_FONT,
        fontSize: '46px',
        color: COLORS.text,
      })
      .setOrigin(1, 0)
      .setDepth(50);

    this.comboText = scene.add
      .text(safe.centerX, safe.top + 72, 'COMBO x1', {
        fontFamily: HUD_FONT,
        fontSize: '38px',
        color: COLORS.goldText,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0)
      .setDepth(50);

    this.titleText = scene.add
      .text(safe.centerX, safe.top + 160, 'DROP RUSH', {
        fontFamily: HUD_FONT,
        fontSize: '76px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.subtitleText = scene.add
      .text(safe.centerX, safe.top + 230, 'SKY PANIC', {
        fontFamily: HUD_FONT,
        fontSize: '34px',
        color: COLORS.mutedText,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.gameOverText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, 'GAME OVER', {
        fontFamily: HUD_FONT,
        fontSize: '94px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setVisible(false);

    this.restartText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 44, 'TAP TO RESTART', {
        fontFamily: HUD_FONT,
        fontSize: '40px',
        color: COLORS.mutedText,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setVisible(false);
  }

  setScore(score: number): void {
    this.scoreText.setText(`SCORE ${score}`);
    this.pulseText(this.scoreText, 1.08);
  }

  setLives(lives: number): void {
    this.livesText.setText(`LIVES ${lives}`);
    this.pulseText(this.livesText, 1.1);
  }

  setCombo(combo: number): void {
    const visible = combo > 1;

    this.comboText.setText(`COMBO x${combo}`);
    this.comboText.setAlpha(visible ? 1 : 0);

    if (visible) {
      this.pulseText(this.comboText, 1.18);
    }
  }

  showFloatingScore(x: number, y: number, value: number, color: string): void {
    const text = this.scene.add
      .text(x, y, `+${value}`, {
        fontFamily: HUD_FONT,
        fontSize: '46px',
        color,
      })
      .setOrigin(0.5)
      .setDepth(65);

    this.scene.tweens.add({
      targets: text,
      y: y - 92,
      alpha: 0,
      scale: 1.35,
      duration: 620,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  shrinkLogo(): void {
    this.scene.tweens.add({
      targets: [this.titleText, this.subtitleText],
      y: '-=48',
      scale: 0.72,
      alpha: 0.48,
      duration: 420,
      ease: 'Cubic.easeOut',
    });
  }

  resetLogo(): void {
    const safe = getSafeArea(this.scene, 42);

    this.scene.tweens.killTweensOf([this.titleText, this.subtitleText]);
    this.titleText.setPosition(safe.centerX, safe.top + 160).setScale(1).setAlpha(1);
    this.subtitleText.setPosition(safe.centerX, safe.top + 230).setScale(1).setAlpha(1);
  }

  showGameOver(score: number): void {
    this.gameOverText.setText(`GAME OVER\nSCORE ${score}`);
    this.gameOverText.setVisible(true).setAlpha(0).setScale(0.88);
    this.restartText.setVisible(true).setAlpha(0);

    this.scene.tweens.add({
      targets: this.gameOverText,
      alpha: 1,
      scale: 1,
      duration: 360,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this.restartText,
      alpha: 1,
      delay: 260,
      duration: 280,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.restartText,
          scale: 1.08,
          alpha: 0.58,
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  hideGameOver(): void {
    this.scene.tweens.killTweensOf([this.gameOverText, this.restartText]);
    this.gameOverText.setVisible(false);
    this.restartText.setVisible(false).setScale(1).setAlpha(1);
  }

  private pulseText(text: Phaser.GameObjects.Text, scale: number): void {
    this.scene.tweens.killTweensOf(text);
    text.setScale(scale);
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }
}
