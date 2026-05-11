import Phaser from 'phaser';
import { AudioManager } from '../game/AudioManager';
import { SaveManager } from '../game/SaveManager';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../game/gameSettings';
import { THEMES } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { SceneButton } from '../ui/SceneButton';

export class MainMenuScene extends Phaser.Scene {
  private background!: AnimatedBackground;
  private audio!: AudioManager;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const save = SaveManager.load();
    const theme = THEMES[save.settings.selectedTheme];

    this.background = new AnimatedBackground(this, theme, 72);
    this.audio = new AudioManager(this);

    this.add
      .text(GAME_WIDTH / 2, 300, 'DROP RUSH', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '96px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(GAME_WIDTH / 2, 382, 'SKY PANIC', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '38px',
        color: COLORS.mutedText,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(GAME_WIDTH / 2, 520, `BEST ${save.highScore}`, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '44px',
        color: COLORS.goldText,
      })
      .setOrigin(0.5)
      .setDepth(20);

    new SceneButton(this, GAME_WIDTH / 2, 760, 'PLAY', () => this.goToGame(), 470);
    new SceneButton(this, GAME_WIDTH / 2, 880, 'STATS', () => this.goToStats(), 470);
    new SceneButton(this, GAME_WIDTH / 2, 1000, 'SETTINGS', () => this.goToSettings(), 470);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 130, 'Catch cyan and gold. Avoid red.', {
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
