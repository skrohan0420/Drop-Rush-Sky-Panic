import Phaser from 'phaser';
import { Ball } from '../entities/Ball';
import { PlayerPaddle } from '../entities/PlayerPaddle';
import { BALL, COLORS, DIFFICULTY, GAME_BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, PADDLE } from '../game/gameSettings';
import { Hud } from '../ui/Hud';

const TEXTURE_KEYS = {
  paddle: 'generated-paddle',
  ball: 'generated-ball',
  particle: 'generated-particle',
} as const;

export class GameScene extends Phaser.Scene {
  private paddle!: PlayerPaddle;
  private balls!: Phaser.Physics.Arcade.Group;
  private hud!: Hud;
  private catchEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private targetX = GAME_WIDTH / 2;
  private score = 0;
  private lives = DIFFICULTY.startingLives;
  private ballSpeed: number = DIFFICULTY.initialBallSpeed;
  private elapsedSeconds = 0;
  private isGameOver = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    // External art can be loaded from src/assets later. This prototype uses
    // generated textures so it runs immediately after npm install.
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GAME_BACKGROUND_COLOR);
    this.createGeneratedTextures();
    this.createBackground();
    this.createPlayer();
    this.createEffects();

    this.balls = this.physics.add.group({ allowGravity: false });
    this.hud = new Hud(this);

    this.physics.add.overlap(this.paddle, this.balls, this.handleCatch, undefined, this);
    this.setupPointerControls();
    this.resetGame();
  }

  update(_time: number, delta: number): void {
    this.paddle.moveToward(this.targetX, delta);

    if (this.isGameOver) {
      return;
    }

    this.updateDifficulty(delta);
    this.keepBallsFalling();
    this.checkMissedBalls();
  }

  spawnBall(): void {
    if (this.isGameOver) {
      return;
    }

    this.spawnBallAt(BALL.spawnY);
  }

  private spawnBallAt(y: number): void {
    const margin = BALL.radius + 24;
    const x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
    const speedMultiplier = Phaser.Math.FloatBetween(0.92, 1.16);
    const ball = new Ball(this, x, y, TEXTURE_KEYS.ball);

    this.balls.add(ball);
    ball.startFall(x, y, this.ballSpeed * speedMultiplier);
  }

  resetGame(): void {
    this.score = 0;
    this.lives = DIFFICULTY.startingLives;
    this.ballSpeed = DIFFICULTY.initialBallSpeed;
    this.elapsedSeconds = 0;
    this.isGameOver = false;
    this.targetX = GAME_WIDTH / 2;

    this.balls.clear(true, true);
    this.paddle.resetPosition();
    this.hud.setScore(this.score);
    this.hud.setLives(this.lives);
    this.hud.hideGameOver();
    this.startSpawning();

    // Seed the screen immediately so a fresh run never looks idle.
    this.spawnBallAt(120);
    this.time.delayedCall(260, () => this.spawnBall());
    this.time.delayedCall(520, () => this.spawnBall());
  }

  updateDifficulty(delta: number): void {
    this.elapsedSeconds += delta / 1000;
    this.ballSpeed = Phaser.Math.Clamp(
      DIFFICULTY.initialBallSpeed + this.elapsedSeconds * DIFFICULTY.speedIncreasePerSecond,
      DIFFICULTY.initialBallSpeed,
      DIFFICULTY.maxBallSpeed,
    );
  }

  private createGeneratedTextures(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-100);

    graphics.fillStyle(COLORS.paddleGlow, 0.42);
    graphics.fillRoundedRect(0, 0, PADDLE.width, PADDLE.height, 20);
    graphics.fillStyle(COLORS.paddle, 1);
    graphics.fillRoundedRect(8, 6, PADDLE.width - 16, PADDLE.height - 12, 16);
    graphics.generateTexture(TEXTURE_KEYS.paddle, PADDLE.width, PADDLE.height);
    graphics.clear();

    const ballSize = BALL.radius * 2;
    graphics.fillStyle(0x063846, 0.72);
    graphics.fillCircle(BALL.radius, BALL.radius + 4, BALL.radius);
    graphics.fillStyle(COLORS.ballCore, 1);
    graphics.fillCircle(BALL.radius, BALL.radius, BALL.radius);
    graphics.lineStyle(5, COLORS.ball, 0.9);
    graphics.strokeCircle(BALL.radius, BALL.radius, BALL.radius - 3);
    graphics.fillStyle(COLORS.ball, 1);
    graphics.fillCircle(BALL.radius - 14, BALL.radius - 16, BALL.radius * 0.32);
    graphics.generateTexture(TEXTURE_KEYS.ball, ballSize, ballSize);
    graphics.clear();

    graphics.fillStyle(COLORS.ballCore, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(TEXTURE_KEYS.particle, 8, 8);
    graphics.destroy();
  }

  private createBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    for (let i = 0; i < 18; i += 1) {
      const x = Phaser.Math.Between(32, GAME_WIDTH - 32);
      const y = Phaser.Math.Between(180, GAME_HEIGHT - 260);
      const alpha = Phaser.Math.FloatBetween(0.12, 0.34);

      this.add.circle(x, y, Phaser.Math.Between(2, 5), 0x5ddfff, alpha).setDepth(0);
    }

    this.add
      .text(GAME_WIDTH / 2, 142, 'DROP RUSH', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '72px',
        color: COLORS.text,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(GAME_WIDTH / 2, 210, 'SKY PANIC', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '34px',
        color: COLORS.mutedText,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);
  }

  private createPlayer(): void {
    this.paddle = new PlayerPaddle(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - PADDLE.bottomMargin,
      TEXTURE_KEYS.paddle,
    );
  }

  private createEffects(): void {
    this.catchEmitter = this.add.particles(0, 0, TEXTURE_KEYS.particle, {
      lifespan: 420,
      speed: { min: 120, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      quantity: 0,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.catchEmitter.setDepth(40);

    this.flashOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.danger, 0)
      .setDepth(45);
  }

  private setupPointerControls(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) {
        this.resetGame();
        return;
      }

      this.targetX = pointer.x;
    });
  }

  private startSpawning(): void {
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.time.addEvent({
      delay: DIFFICULTY.spawnIntervalMs,
      callback: this.spawnBall,
      callbackScope: this,
      loop: true,
    });
  }

  private handleCatch: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_paddleObject, ballObject): void => {
    const ball = this.getBallFromCollisionObject(ballObject);

    if (this.isGameOver || ball === undefined) {
      return;
    }

    this.score += BALL.scoreValue;
    this.hud.setScore(this.score);
    this.paddle.pulse();
    this.catchEmitter.explode(18, ball.x, ball.y);
    ball.destroy();
  };

  private getBallFromCollisionObject(
    object: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  ): Ball | undefined {
    if (object instanceof Ball) {
      return object;
    }

    if ('gameObject' in object && object.gameObject instanceof Ball) {
      return object.gameObject;
    }

    return undefined;
  }

  private checkMissedBalls(): void {
    this.balls.children.each((child: Phaser.GameObjects.GameObject) => {
      if (!(child instanceof Ball) || !child.isMissed()) {
        return true;
      }

      child.destroy();
      this.loseLife();
      return true;
    });
  }

  private keepBallsFalling(): void {
    this.balls.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Ball) {
        child.keepFalling(this.ballSpeed);
      }

      return true;
    });
  }

  private loseLife(): void {
    if (this.isGameOver) {
      return;
    }

    this.lives -= 1;
    this.hud.setLives(Math.max(this.lives, 0));
    this.flashScreen();

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  private flashScreen(): void {
    this.tweens.killTweensOf(this.flashOverlay);
    this.flashOverlay.setAlpha(0.32);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 220,
      ease: 'Sine.easeOut',
    });
  }

  private endGame(): void {
    this.isGameOver = true;
    this.spawnTimer?.remove(false);
    this.balls.setVelocityY(0);
    this.hud.showGameOver(this.score);
  }
}
