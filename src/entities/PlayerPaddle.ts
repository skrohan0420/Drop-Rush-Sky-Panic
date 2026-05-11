import Phaser from 'phaser';
import { GAME_WIDTH, PADDLE } from '../game/gameSettings';

export class PlayerPaddle extends Phaser.Physics.Arcade.Image {
  private readonly halfWidth = PADDLE.width / 2;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);

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
    const smoothing = 1 - Math.pow(PADDLE.smoothing, delta / 16.666);
    const nextX = Phaser.Math.Linear(this.x, clampedX, smoothing);

    this.setPaddleX(nextX);
  }

  resetPosition(): void {
    this.setPaddleX(GAME_WIDTH / 2);
    this.setScale(1);
  }

  pulse(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.14,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private setPaddleX(x: number): void {
    const clampedX = this.clampX(x);
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.x = clampedX;
    body.reset(clampedX, this.y);
  }

  private clampX(x: number): number {
    return Phaser.Math.Clamp(x, this.halfWidth, GAME_WIDTH - this.halfWidth);
  }
}
