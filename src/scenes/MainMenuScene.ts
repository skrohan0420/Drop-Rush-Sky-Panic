import Phaser from 'phaser';
import { AudioManager } from '../game/AudioManager';
import { SaveManager } from '../game/SaveManager';
import { COLORS } from '../game/gameSettings';
import { THEMES } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { SceneButton } from '../ui/SceneButton';
import { getSafeArea } from '../ui/layout';

export class MainMenuScene extends Phaser.Scene {
  private background!: AnimatedBackground;
  private audio!: AudioManager;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const save = SaveManager.load();
    const theme = THEMES[save.settings.selectedTheme];
    const safe = getSafeArea(this, 56);

    this.background = new AnimatedBackground(this, theme, 72);
    this.audio = new AudioManager(this);

    this.add
      .text(safe.centerX, safe.top + 210, 'DROP RUSH', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '96px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(safe.centerX, safe.top + 292, 'SKY PANIC', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '38px',
        color: COLORS.mutedText,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(safe.centerX, safe.top + 440, `BEST ${save.highScore}`, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '44px',
        color: COLORS.goldText,
      })
      .setOrigin(0.5)
      .setDepth(20);

    new SceneButton(this, safe.centerX, safe.centerY - 80, 'PLAY', () => this.goToGame(), Math.min(520, safe.width - 80));
    new SceneButton(this, safe.centerX, safe.centerY + 42, 'STATS', () => this.goToStats(), Math.min(520, safe.width - 80));
    new SceneButton(this, safe.centerX, safe.centerY + 164, 'SETTINGS', () => this.goToSettings(), Math.min(520, safe.width - 80));

    this.add
      .text(safe.centerX, safe.bottom - 90, 'Catch cyan and gold. Avoid red.', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '30px',
        color: COLORS.mutedText,
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  update(_time: number, delta: number): void {
    this.background.update(delta, 0.02);
  }

  private goToGame(): void {
    this.audio.playUi();
    this.scene.start('GameScene');
  }

  private goToStats(): void {
    this.audio.playUi();
    this.scene.start('StatsScene');
  }

  private goToSettings(): void {
    this.audio.playUi();
    this.scene.start('SettingsScene');
  }
}
