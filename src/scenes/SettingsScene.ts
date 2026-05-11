import Phaser from 'phaser';
import { AudioManager } from '../game/AudioManager';
import { SaveManager, type GameSave } from '../game/SaveManager';
import { COLORS } from '../game/gameSettings';
import { THEMES } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { SceneButton } from '../ui/SceneButton';
import { getSafeArea } from '../ui/layout';

export class SettingsScene extends Phaser.Scene {
  private save!: GameSave;
  private background!: AnimatedBackground;
  private audio!: AudioManager;
  private musicButton!: SceneButton;
  private sfxButton!: SceneButton;
  private vibrationButton!: SceneButton;
  private themeButton!: SceneButton;

  constructor() {
    super('SettingsScene');
  }

  create(): void {
    this.save = SaveManager.load();
    const safe = getSafeArea(this, 56);
    this.background = new AnimatedBackground(this, THEMES[this.save.settings.selectedTheme], 48);
    this.audio = new AudioManager(this);

    this.add
      .text(safe.centerX, safe.top + 170, 'SETTINGS', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '72px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(20);

    const buttonWidth = Math.min(600, safe.width - 70);

    this.musicButton = new SceneButton(this, safe.centerX, safe.centerY - 250, '', () => this.cycleMusic(), buttonWidth);
    this.sfxButton = new SceneButton(this, safe.centerX, safe.centerY - 130, '', () => this.cycleSfx(), buttonWidth);
    this.vibrationButton = new SceneButton(this, safe.centerX, safe.centerY - 10, '', () => this.toggleVibration(), buttonWidth);
    this.themeButton = new SceneButton(this, safe.centerX, safe.centerY + 110, '', () => this.cycleTheme(), buttonWidth);

    new SceneButton(this, safe.centerX, safe.bottom - 170, 'BACK', () => {
      this.audio.playUi();
      this.scene.start('MainMenuScene');
    });

    this.refreshLabels();
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
  }

  private cycleMusic(): void {
    const next = this.nextVolume(this.save.settings.musicVolume);
    this.save = SaveManager.updateSettings({ musicVolume: next });
    this.audio.playUi();
    this.refreshLabels();
  }

  private cycleSfx(): void {
    const next = this.nextVolume(this.save.settings.sfxVolume);
    this.save = SaveManager.updateSettings({ sfxVolume: next });
    this.audio.playUi();
    this.refreshLabels();
  }

  private toggleVibration(): void {
    this.save = SaveManager.updateSettings({ vibrationEnabled: !this.save.settings.vibrationEnabled });
    this.audio.playUi();
    this.audio.vibrate(20);
    this.refreshLabels();
  }

  private cycleTheme(): void {
    const themes = this.save.unlockedThemes;
    const currentIndex = themes.indexOf(this.save.settings.selectedTheme);
    const selectedTheme = themes[(currentIndex + 1) % themes.length] ?? 'neon';

    this.save = SaveManager.updateSettings({ selectedTheme });
    this.audio.playUi();
    this.scene.restart();
  }

  private refreshLabels(): void {
    const settings = this.save.settings;
    const theme = THEMES[settings.selectedTheme];

    this.musicButton.setText(`MUSIC ${Math.round(settings.musicVolume * 100)}%`);
    this.sfxButton.setText(`SFX ${Math.round(settings.sfxVolume * 100)}%`);
    this.vibrationButton.setText(`VIBRATION ${settings.vibrationEnabled ? 'ON' : 'OFF'}`);
    this.themeButton.setText(`THEME ${theme.name.toUpperCase()}`);
  }

  private nextVolume(value: number): number {
    return value >= 1 ? 0 : Number((value + 0.25).toFixed(2));
  }
}
