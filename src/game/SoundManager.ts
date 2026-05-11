import Phaser from 'phaser';
import type { BallType } from './gameSettings';

// Placeholder sound facade. Real audio assets can be wired here without
// touching gameplay code, keeping effects calls simple and centralized.
export class SoundManager {
  constructor(private readonly scene: Phaser.Scene) {}

  playCatch(type: BallType, combo: number): void {
    this.playPlaceholder(type === 'bonus' ? 760 : 560 + combo * 18, 0.035);
  }

  playDamage(): void {
    this.playPlaceholder(180, 0.055);
  }

  playGameOver(): void {
    this.playPlaceholder(110, 0.08);
  }

  playRestart(): void {
    this.playPlaceholder(440, 0.04);
  }

  private playPlaceholder(frequency: number, durationSeconds: number): void {
    if (!(this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager)) {
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
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.02);
  }
}
