import Phaser from 'phaser';
import { GAME_WIDTH, PADDLE } from '../game/gameSettings';

export class PlayerPaddle extends Phaser.Physics.Arcade.Image {
  private readonly glow: Phaser.GameObjects.Image;
  private readonly halfWidth = PADDLE.width / 2;
  private currentSpeed = 0;
  private widthScale = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);

    this.glow = scene.add
      .image(x, y + 2, textureKey)
      .setTint(0x2ff3ff)
      .setAlpha(0.28)
      .setScale(1.18, 1.7)
      .setDepth(18);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(20);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(PADDLE.width, PADDLE.height);
  }

  moveToward(targetX: number, delta: number): void {
    const clampedX = this.clampX(targetX);
    const previousX = this.x;
    const smoothing = 1 - Math.pow(PADDLE.smoothing, delta / 16.666);
    const nextX = Phaser.Math.Linear(this.x, clampedX, smoothing);

    this.currentSpeed = Math.abs(nextX - previousX) / Math.max(delta, 1);
    this.setPaddleX(nextX);
    this.updateMovementSquash();
  }

  resetPosition(): void {
    this.currentSpeed = 0;
    this.widthScale = 1;
    this.setPaddleX(GAME_WIDTH / 2);
    this.setScale(1);
    this.updateGlow();
  }

  setGameplayWidthScale(widthScale: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.widthScale = widthScale;
    this.scaleX = widthScale;
    body.setSize(PADDLE.width * widthScale, PADDLE.height);
    this.updateGlow();
  }

  pulse(intensity = 1): void {
    this.scene.tweens.killTweensOf([this, this.glow]);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1 + 0.1 * intensity,
      scaleY: 1 + 0.22 * intensity,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
      onUpdate: () => this.updateGlow(),
      onComplete: () => this.updateGlow(),
    });
  }

  setFrozen(frozen: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = !frozen;
  }

  private updateMovementSquash(): void {
    const stretch = Phaser.Math.Clamp(this.currentSpeed / 42, 0, 0.18);
    const targetScaleX = this.widthScale + stretch;
    const targetScaleY = 1 - stretch * 0.45;

    this.scaleX = Phaser.Math.Linear(this.scaleX, targetScaleX, 0.2);
    this.scaleY = Phaser.Math.Linear(this.scaleY, targetScaleY, 0.2);
    this.updateGlow();
  }

  private setPaddleX(x: number): void {
    const clampedX = this.clampX(x);
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.x = clampedX;
    body.reset(clampedX, this.y);
    this.updateGlow();
  }

  private updateGlow(): void {
    this.glow.setPosition(this.x, this.y + 2);
    this.glow.setScale(this.scaleX * 1.2, this.scaleY * 1.72);
  }

  private clampX(x: number): number {
    return Phaser.Math.Clamp(x, this.halfWidth, GAME_WIDTH - this.halfWidth);
  }
}
