import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../game/gameSettings';

export class SceneButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, width = 420) {
    super(scene, x, y);

    this.background = scene.add
      .rectangle(0, 0, width, 86, COLORS.backgroundSoft, 0.78)
      .setStrokeStyle(3, COLORS.paddle, 0.7);
    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '36px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add([this.background, this.label]);
    this.setSize(width, 86);
    this.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -43, width, 86), Phaser.Geom.Rectangle.Contains);
    this.setDepth(80);

    // Touch devices fire bogus/overlapping hover events; keep feedback to press/release only.
    this.on(Phaser.Input.Events.POINTER_DOWN, () => this.setScale(0.96));
    this.on(Phaser.Input.Events.POINTER_UP, () => {
      this.setScale(1);
      onClick();
    });
    this.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => this.setScale(1));

    scene.add.existing(this);
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  centerX(): this {
    this.x = GAME_WIDTH / 2;
    return this;
  }
}
