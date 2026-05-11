import Phaser from 'phaser';
import { BALL, GAME_HEIGHT } from '../game/gameSettings';

export class Ball extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);

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

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    body.enable = true;
    body.reset(x, y);
    body.setVelocity(0, speed);
  }

  keepFalling(speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!body.enable || body.velocity.y <= 0) {
      body.enable = true;
      body.setVelocity(0, speed);
    }
  }

  isMissed(): boolean {
    return this.y - BALL.radius > GAME_HEIGHT;
  }
}
