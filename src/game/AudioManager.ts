import Phaser from 'phaser';
import { SaveManager } from './SaveManager';
import type { BallType } from './gameSettings';

export class AudioManager {
  constructor(private readonly scene: Phaser.Scene) {}

  playCatch(type: BallType, combo: number): void {
    this.playPlaceholder(type === 'bonus' ? 760 : 540 + combo * 14, 0.035, 0.8);
  }

  playDamage(): void {
    this.playPlaceholder(165, 0.06, 1);
  }

  playUi(): void {
    this.playPlaceholder(420, 0.03, 0.45);
  }

  playGameOver(): void {
    this.playPlaceholder(100, 0.1, 1);
  }

  vibrate(pattern: number | number[]): void {
    if (!SaveManager.load().settings.vibrationEnabled || !('vibrate' in navigator)) {
      return;
    }

    navigator.vibrate(pattern);
  }

  private playPlaceholder(frequency: number, durationSeconds: number, intensity: number): void {
    const { sfxVolume } = SaveManager.load().settings;

    if (sfxVolume <= 0 || !(this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager)) {
      return;
    }

    const audioContext = this.scene.sound.context;

    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045 * sfxVolume * intensity, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.02);
  }
}
