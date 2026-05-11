import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/gameSettings';
import type { Theme } from '../game/themes';

type Star = Phaser.GameObjects.Arc & {
  driftSpeed: number;
  sway: number;
};

export class AnimatedBackground {
  private readonly scene: Phaser.Scene;
  private readonly stars: Star[] = [];
  private readonly glow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, theme: Theme, density = 64) {
    this.scene = scene;

    scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, theme.background).setDepth(0);
    this.glow = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, theme.backgroundSoft, 0.18)
      .setDepth(0);

    for (let i = 0; i < density; i += 1) {
      const star = scene.add
        .circle(
          Phaser.Math.Between(24, GAME_WIDTH - 24),
          Phaser.Math.Between(0, GAME_HEIGHT),
          Phaser.Math.Between(2, 6),
          theme.particle,
          Phaser.Math.FloatBetween(0.1, 0.34),
        )
        .setDepth(1) as Star;

      star.driftSpeed = Phaser.Math.FloatBetween(10, 36);
      star.sway = Phaser.Math.FloatBetween(0.4, 1.8);
      this.stars.push(star);
    }
  }

  update(delta: number, parallaxX = 0): void {
    const dt = delta / 1000;

    this.glow.setAlpha(0.14 + Math.sin(this.scene.time.now / 1300) * 0.03);

    for (const star of this.stars) {
      star.y += star.driftSpeed * dt;
      star.x += Math.sin(this.scene.time.now / 1000 + star.y * 0.01) * star.sway * 0.04 + parallaxX;

      if (star.y > GAME_HEIGHT + 24) {
        star.y = Phaser.Math.Between(-100, -20);
        star.x = Phaser.Math.Between(24, GAME_WIDTH - 24);
      }
    }
  }
}
