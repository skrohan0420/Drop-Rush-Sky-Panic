import Phaser from 'phaser';
import { BALL, BALL_TYPES, type BallType, GAME_HEIGHT } from '../game/gameSettings';

export class Ball extends Phaser.Physics.Arcade.Image {
  readonly ballType: BallType;
  readonly points: number;
  readonly comboGain: number;
  private fallSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, ballType: BallType) {
    const settings = BALL_TYPES[ballType];

    super(scene, x, y, settings.textureKey);

    this.ballType = ballType;
    this.points = settings.points;
    this.comboGain = settings.comboGain;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(BALL.radius);
  }

  startFall(x: number, y: number, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    this.fallSpeed = speed;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    body.enable = true;
    body.reset(x, y);
    body.setVelocity(0, speed);
  }

  keepFalling(globalSpeed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const intendedSpeed = Math.max(this.fallSpeed, globalSpeed * 0.92);

    this.fallSpeed = intendedSpeed;

    if (!body.enable || body.velocity.y <= 0) {
      body.enable = true;
      body.setVelocity(0, intendedSpeed);
    }
  }

  freeze(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
  }

  isMissed(): boolean {
    return this.y - BALL.radius > GAME_HEIGHT;
  }
}
