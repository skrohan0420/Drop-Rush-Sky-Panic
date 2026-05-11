import Phaser from 'phaser';
import { Ball } from '../entities/Ball';
import { PlayerPaddle } from '../entities/PlayerPaddle';
import { SoundManager } from '../game/SoundManager';
import {
  BALL,
  BALL_TYPES,
  type BallType,
  COLORS,
  DIFFICULTY,
  GAME_BACKGROUND_COLOR,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE,
} from '../game/gameSettings';
import { Hud } from '../ui/Hud';

const TEXTURE_KEYS = {
  paddle: 'generated-paddle',
  particle: 'generated-particle',
} as const;

type AmbientStar = Phaser.GameObjects.Arc & {
  driftSpeed: number;
  parallax: number;
};

export class GameScene extends Phaser.Scene {
  private paddle!: PlayerPaddle;
  private balls!: Phaser.Physics.Arcade.Group;
  private hud!: Hud;
  private soundManager!: SoundManager;
  private catchEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private damageEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private vignette!: Phaser.GameObjects.Rectangle;
  private ambientStars: AmbientStar[] = [];
  private targetX = GAME_WIDTH / 2;
  private score = 0;
  private lives = DIFFICULTY.startingLives;
  private combo = 1;
  private ballSpeed: number = DIFFICULTY.initialBallSpeed;
  private spawnInterval: number = DIFFICULTY.initialSpawnIntervalMs;
  private spawnAccumulator = 0;
  private elapsedSeconds = 0;
  private isGameOver = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    // This prototype uses generated textures. Drop real sprites/audio into
    // src/assets later and load them here without changing game rules.
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GAME_BACKGROUND_COLOR);
    this.createGeneratedTextures();
    this.createBackground();
    this.createPlayer();
    this.createEffects();

    this.balls = this.physics.add.group({ allowGravity: false });
    this.hud = new Hud(this);
    this.soundManager = new SoundManager(this);

    this.physics.add.overlap(this.paddle, this.balls, this.handleCatch, undefined, this);
    this.setupPointerControls();
    this.resetGame();
  }

  update(_time: number, delta: number): void {
    this.updateBackground(delta);
    this.paddle.moveToward(this.targetX, delta);

    if (this.isGameOver) {
      return;
    }

    this.updateDifficulty(delta);
    this.updateSpawning(delta);
    this.keepBallsFalling();
    this.checkMissedBalls();
  }

  spawnBall(): void {
    if (this.isGameOver) {
      return;
    }

    this.spawnBallAt(BALL.spawnY, this.pickBallType());
  }

  resetGame(): void {
    this.score = 0;
    this.lives = DIFFICULTY.startingLives;
    this.combo = 1;
    this.ballSpeed = DIFFICULTY.initialBallSpeed;
    this.spawnInterval = DIFFICULTY.initialSpawnIntervalMs;
    this.spawnAccumulator = 0;
    this.elapsedSeconds = 0;
    this.isGameOver = false;
    this.targetX = GAME_WIDTH / 2;

    this.physics.resume();
    this.cameras.main.setAlpha(1);
    this.balls.clear(true, true);
    this.paddle.setFrozen(false);
    this.paddle.resetPosition();
    this.hud.resetLogo();
    this.hud.setScore(this.score);
    this.hud.setLives(this.lives);
    this.hud.setCombo(this.combo);
    this.hud.hideGameOver();
    this.soundManager.playRestart();

    this.time.delayedCall(160, () => this.hud.shrinkLogo());

    // Seed the screen so the first second always feels alive.
    this.spawnBallAt(110, 'normal');
    this.time.delayedCall(220, () => this.spawnBallAt(BALL.spawnY, 'normal'));
    this.time.delayedCall(500, () => this.spawnBall());
  }

  updateDifficulty(delta: number): void {
    this.elapsedSeconds += delta / 1000;
    this.ballSpeed = Phaser.Math.Clamp(
      DIFFICULTY.initialBallSpeed + this.elapsedSeconds * DIFFICULTY.speedIncreasePerSecond,
      DIFFICULTY.initialBallSpeed,
      DIFFICULTY.maxBallSpeed,
    );
    this.spawnInterval = Phaser.Math.Clamp(
      DIFFICULTY.initialSpawnIntervalMs - this.elapsedSeconds * DIFFICULTY.spawnIntervalDecreasePerSecond,
      DIFFICULTY.minSpawnIntervalMs,
      DIFFICULTY.initialSpawnIntervalMs,
    );
  }

  private spawnBallAt(y: number, ballType: BallType): void {
    const margin = BALL.radius + 24;
    const x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
    const speedMultiplier = Phaser.Math.FloatBetween(0.92, 1.18);
    const ball = new Ball(this, x, y, ballType);

    this.balls.add(ball);
    ball.startFall(x, y, this.ballSpeed * speedMultiplier);
    this.tweens.add({
      targets: ball,
      scale: { from: 0.72, to: 1 },
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  private updateSpawning(delta: number): void {
    this.spawnAccumulator += delta;

    while (this.spawnAccumulator >= this.spawnInterval) {
      this.spawnAccumulator -= this.spawnInterval;
      this.spawnBall();
    }
  }

  private pickBallType(): BallType {
    const totalWeight = Object.values(BALL_TYPES).reduce((sum, settings) => sum + settings.weight, 0);
    let roll = Phaser.Math.Between(1, totalWeight);

    for (const [type, settings] of Object.entries(BALL_TYPES) as Array<[BallType, (typeof BALL_TYPES)[BallType]]>) {
      roll -= settings.weight;

      if (roll <= 0) {
        return type;
      }
    }

    return 'normal';
  }

  private createGeneratedTextures(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-100);

    graphics.fillStyle(COLORS.paddleGlow, 0.48);
    graphics.fillRoundedRect(0, 0, PADDLE.width, PADDLE.height, 22);
    graphics.fillStyle(COLORS.paddle, 1);
    graphics.fillRoundedRect(10, 7, PADDLE.width - 20, PADDLE.height - 14, 16);
    graphics.generateTexture(TEXTURE_KEYS.paddle, PADDLE.width, PADDLE.height);
    graphics.clear();

    this.generateBallTexture(graphics, 'normal');
    this.generateBallTexture(graphics, 'damage');
    this.generateBallTexture(graphics, 'bonus');

    graphics.fillStyle(COLORS.white, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture(TEXTURE_KEYS.particle, 10, 10);
    graphics.destroy();
  }

  private generateBallTexture(graphics: Phaser.GameObjects.Graphics, ballType: BallType): void {
    const settings = BALL_TYPES[ballType];
    const ballSize = BALL.radius * 2;

    graphics.clear();
    graphics.fillStyle(0x031824, 0.82);
    graphics.fillCircle(BALL.radius, BALL.radius + 5, BALL.radius);
    graphics.fillStyle(settings.color, 1);
    graphics.fillCircle(BALL.radius, BALL.radius, BALL.radius);
    graphics.lineStyle(5, COLORS.white, 0.9);
    graphics.strokeCircle(BALL.radius, BALL.radius, BALL.radius - 3);
    graphics.fillStyle(COLORS.white, 0.92);
    graphics.fillCircle(BALL.radius - 14, BALL.radius - 16, BALL.radius * 0.3);

    if (ballType === 'damage') {
      graphics.lineStyle(7, 0x5a0619, 0.8);
      graphics.lineBetween(BALL.radius - 18, BALL.radius - 18, BALL.radius + 18, BALL.radius + 18);
      graphics.lineBetween(BALL.radius + 18, BALL.radius - 18, BALL.radius - 18, BALL.radius + 18);
    }

    if (ballType === 'bonus') {
      graphics.lineStyle(4, 0x7a4a00, 0.45);
      graphics.strokeCircle(BALL.radius, BALL.radius, BALL.radius * 0.52);
    }

    graphics.generateTexture(settings.textureKey, ballSize, ballSize);
    graphics.clear();
  }

  private createBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.vignette = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.backgroundSoft, 0.16)
      .setDepth(0);

    for (let i = 0; i < 60; i += 1) {
      const star = this.add
        .circle(
          Phaser.Math.Between(28, GAME_WIDTH - 28),
          Phaser.Math.Between(120, GAME_HEIGHT - 160),
          Phaser.Math.Between(2, 6),
          COLORS.cyanBall,
          Phaser.Math.FloatBetween(0.1, 0.34),
        )
        .setDepth(1) as AmbientStar;

      star.driftSpeed = Phaser.Math.FloatBetween(5, 24);
      star.parallax = Phaser.Math.FloatBetween(0.35, 1.2);
      this.ambientStars.push(star);
    }
  }

  private updateBackground(delta: number): void {
    const dt = delta / 1000;
    const pointerOffset = (this.targetX - GAME_WIDTH / 2) / GAME_WIDTH;

    this.vignette.setAlpha(0.12 + Math.sin(this.time.now / 1200) * 0.025);

    for (const star of this.ambientStars) {
      star.y += star.driftSpeed * dt;
      star.x += pointerOffset * star.parallax * 0.45;

      if (star.y > GAME_HEIGHT + 20) {
        star.y = Phaser.Math.Between(-90, -20);
        star.x = Phaser.Math.Between(28, GAME_WIDTH - 28);
      }
    }
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
      lifespan: 520,
      speed: { min: 180, max: 470 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 0.95, end: 0 },
      quantity: 0,
      blendMode: Phaser.BlendModes.ADD,
      tint: COLORS.cyanBall,
    });
    this.catchEmitter.setDepth(44);

    this.damageEmitter = this.add.particles(0, 0, TEXTURE_KEYS.particle, {
      lifespan: 520,
      speed: { min: 150, max: 420 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      quantity: 0,
      blendMode: Phaser.BlendModes.ADD,
      tint: COLORS.redBall,
    });
    this.damageEmitter.setDepth(44);

    this.flashOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.white, 0)
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

  private handleCatch: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_paddleObject, ballObject): void => {
    const ball = this.getBallFromCollisionObject(ballObject);

    if (this.isGameOver || ball === undefined) {
      return;
    }

    if (ball.ballType === 'damage') {
      this.damageEmitter.explode(24, ball.x, ball.y);
      this.soundManager.playDamage();
      this.resetCombo();
      ball.destroy();
      this.loseLife(true);
      return;
    }

    const earned = ball.points * this.combo;

    this.score += earned;
    this.combo += ball.comboGain;
    this.hud.setScore(this.score);
    this.hud.setCombo(this.combo);
    this.hud.showFloatingScore(ball.x, ball.y, earned, ball.ballType === 'bonus' ? COLORS.goldText : COLORS.text);
    this.paddle.pulse(ball.ballType === 'bonus' ? 1.35 : 1);
    this.flashScreen(BALL_TYPES[ball.ballType].color, ball.ballType === 'bonus' ? 0.14 : 0.08);
    this.cameras.main.shake(ball.ballType === 'bonus' ? 85 : 50, ball.ballType === 'bonus' ? 0.0035 : 0.002);
    this.catchEmitter.setParticleTint(BALL_TYPES[ball.ballType].color);
    this.catchEmitter.explode(ball.ballType === 'bonus' ? 34 : 22, ball.x, ball.y);
    this.soundManager.playCatch(ball.ballType, this.combo);
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

      const missedType = child.ballType;
      child.destroy();

      if (missedType !== 'damage') {
        this.loseLife(false);
      }

      this.resetCombo();
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

  private loseLife(hitDamageBall: boolean): void {
    if (this.isGameOver) {
      return;
    }

    this.lives -= 1;
    this.hud.setLives(Math.max(this.lives, 0));
    this.flashScreen(COLORS.danger, hitDamageBall ? 0.34 : 0.22);
    this.cameras.main.shake(hitDamageBall ? 170 : 120, hitDamageBall ? 0.008 : 0.005);
    this.soundManager.playDamage();

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  private resetCombo(): void {
    this.combo = 1;
    this.hud.setCombo(this.combo);
  }

  private flashScreen(color: number, alpha: number): void {
    this.tweens.killTweensOf(this.flashOverlay);
    this.flashOverlay.setFillStyle(color, alpha);
    this.flashOverlay.setAlpha(1);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 230,
      ease: 'Sine.easeOut',
    });
  }

  private endGame(): void {
    this.isGameOver = true;
    this.flashScreen(COLORS.white, 0.28);
    this.cameras.main.shake(260, 0.01);
    this.soundManager.playGameOver();
    this.paddle.setFrozen(true);

    this.balls.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Ball) {
        child.freeze();
      }

      return true;
    });

    this.hud.showGameOver(this.score);
  }
}
