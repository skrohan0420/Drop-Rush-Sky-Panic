import Phaser from 'phaser';
import { Ball } from '../entities/Ball';
import { PlayerPaddle } from '../entities/PlayerPaddle';
import { AudioManager } from '../game/AudioManager';
import { ProgressionManager, type StageModifier } from '../game/ProgressionManager';
import { type RunResult, SaveManager } from '../game/SaveManager';
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
import { THEMES, type Theme } from '../game/themes';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { Hud } from '../ui/Hud';
import { SceneButton } from '../ui/SceneButton';
import { getSafeArea, type SafeArea } from '../ui/layout';

const TEXTURE_KEYS = {
  paddle: 'generated-paddle',
  particle: 'generated-particle',
} as const;

export class GameScene extends Phaser.Scene {
  private paddle!: PlayerPaddle;
  private balls!: Phaser.Physics.Arcade.Group;
  private hud!: Hud;
  private audio!: AudioManager;
  private progression = new ProgressionManager();
  private theme!: Theme;
  private safeArea!: SafeArea;
  private background!: AnimatedBackground;
  private catchEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private damageEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private fogOverlay!: Phaser.GameObjects.Rectangle;
  private stageText!: Phaser.GameObjects.Text;
  private pauseButton!: SceneButton;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private targetX = GAME_WIDTH / 2;
  private score = 0;
  private lives = DIFFICULTY.startingLives;
  private combo = 1;
  private longestComboThisRun = 1;
  private ballsCaughtThisRun = 0;
  private survivalTime = 0;
  private ballSpeed: number = DIFFICULTY.initialBallSpeed;
  private spawnInterval: number = DIFFICULTY.initialSpawnIntervalMs;
  private spawnAccumulator = 0;
  private isGameOver = false;
  private isPaused = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    // This prototype uses generated textures. Drop real sprites/audio into
    // src/assets later and load them here without changing game rules.
  }

  create(): void {
    const save = SaveManager.load();

    this.theme = THEMES[save.settings.selectedTheme];
    this.safeArea = getSafeArea(this, 42);
    this.cameras.main.setBackgroundColor(GAME_BACKGROUND_COLOR);
    this.createGeneratedTextures();
    this.createBackground();
    this.createPlayer();
    this.createEffects();

    this.balls = this.physics.add.group({ allowGravity: false });
    this.hud = new Hud(this);
    this.audio = new AudioManager(this);
    this.createPauseMenu();

    this.physics.add.overlap(this.paddle, this.balls, this.handleCatch, undefined, this);
    this.setupPointerControls();
    this.resetGame();
  }

  update(_time: number, delta: number): void {
    const parallax = (this.targetX - GAME_WIDTH / 2) / GAME_WIDTH;

    this.background.update(delta, parallax * 0.25);

    if (this.isPaused) {
      return;
    }

    this.paddle.moveToward(this.targetX, delta);

    if (this.isGameOver) {
      return;
    }

    this.updateDifficulty(delta);
    this.updateSpawning(delta);
    this.updateBallMotion(_time);
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
    this.longestComboThisRun = 1;
    this.ballsCaughtThisRun = 0;
    this.survivalTime = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.targetX = GAME_WIDTH / 2;
    this.progression.reset();

    this.physics.resume();
    this.cameras.main.setAlpha(1);
    this.balls.clear(true, true);
    this.paddle.setFrozen(false);
    this.paddle.setGameplayWidthScale(1);
    this.paddle.setHorizontalBounds(this.safeArea.left, this.safeArea.right);
    this.paddle.resetPosition();
    this.pauseOverlay.setVisible(false);
    this.pauseButton.setVisible(true);
    this.fogOverlay.setAlpha(0);
    this.hud.resetLogo();
    this.hud.setScore(this.score);
    this.hud.setLives(this.lives);
    this.hud.setCombo(this.combo);
    this.hud.hideGameOver();
    this.audio.playUi();

    this.time.delayedCall(160, () => this.hud.shrinkLogo());

    // Seed the screen so the first second always feels alive.
    this.spawnBallAt(110, 'normal');
    this.time.delayedCall(220, () => this.spawnBallAt(BALL.spawnY, 'normal'));
    this.time.delayedCall(500, () => this.spawnBall());
  }

  updateDifficulty(delta: number): void {
    this.survivalTime += delta / 1000;
    const newModifier = this.progression.update(delta);
    const progressionState = this.progression.getState();

    if (newModifier !== undefined) {
      this.showStageModifier(newModifier);
      this.applyStageModifier(newModifier);
    }

    this.ballSpeed = Phaser.Math.Clamp(
      (DIFFICULTY.initialBallSpeed + progressionState.elapsedSeconds * DIFFICULTY.speedIncreasePerSecond) *
        this.progression.getSpeedMultiplier(),
      DIFFICULTY.initialBallSpeed,
      DIFFICULTY.maxBallSpeed,
    );
    this.spawnInterval = Phaser.Math.Clamp(
      (DIFFICULTY.initialSpawnIntervalMs -
        progressionState.elapsedSeconds * DIFFICULTY.spawnIntervalDecreasePerSecond) *
        this.progression.getSpawnMultiplier(),
      DIFFICULTY.minSpawnIntervalMs,
      DIFFICULTY.initialSpawnIntervalMs,
    );
  }

  private spawnBallAt(y: number, ballType: BallType): void {
    const margin = BALL.radius + 24;
    const x = Phaser.Math.Between(this.safeArea.left + margin, this.safeArea.right - margin);
    const speedMultiplier = Phaser.Math.FloatBetween(0.92, 1.18);
    const ball = new Ball(this, x, y, ballType);

    this.balls.add(ball);
    ball.startFall(x, y, this.ballSpeed * speedMultiplier);
    ball.setZigzag(this.progression.has('zigzag'));
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
    const entries = (Object.entries(BALL_TYPES) as Array<[BallType, (typeof BALL_TYPES)[BallType]]>).filter(
      ([type]) => {
        if (type === 'damage') {
          return this.progression.canSpawnDamageBalls();
        }

        if (type === 'bonus') {
          return this.progression.canSpawnBonusBalls();
        }

        return true;
      },
    );
    const totalWeight = entries.reduce((sum, [, settings]) => sum + settings.weight, 0);
    let roll = Phaser.Math.Between(1, totalWeight);

    for (const [type, settings] of entries) {
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
    this.background = new AnimatedBackground(this, this.theme, 62);
    this.fogOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(43);
    this.stageText = this.add
      .text(this.safeArea.centerX, this.safeArea.top + 330, '', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '38px',
        color: COLORS.goldText,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(60);
  }

  private createPlayer(): void {
    this.paddle = new PlayerPaddle(
      this,
      this.safeArea.centerX,
      this.safeArea.bottom - PADDLE.bottomMargin,
      TEXTURE_KEYS.paddle,
    );
    this.paddle.setHorizontalBounds(this.safeArea.left, this.safeArea.right);
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
      if (this.isPaused) {
        return;
      }

      this.targetX = pointer.x;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused || this.isGameOver) {
        return;
      }

      this.targetX = pointer.x;
    });
  }

  private createPauseMenu(): void {
    this.pauseButton = new SceneButton(this, this.safeArea.right - 54, this.safeArea.top + 116, 'II', () => this.pauseGame(), 104);
    this.pauseOverlay = this.add.container(0, 0).setDepth(90).setVisible(false);

    const blocker = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68)
      .setInteractive();
    const title = this.add
      .text(GAME_WIDTH / 2, 520, 'PAUSED', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '74px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    title.setPosition(this.safeArea.centerX, this.safeArea.centerY - 250);
    const resume = new SceneButton(this, this.safeArea.centerX, this.safeArea.centerY - 44, 'RESUME', () => this.resumeGame(), 470);
    const restart = new SceneButton(this, this.safeArea.centerX, this.safeArea.centerY + 76, 'RESTART', () => this.resetGame(), 470);
    const menu = new SceneButton(this, this.safeArea.centerX, this.safeArea.centerY + 196, 'MAIN MENU', () => this.scene.start('MainMenuScene'), 470);

    this.pauseOverlay.add([blocker, title, resume, restart, menu]);
  }

  private pauseGame(): void {
    if (this.isGameOver) {
      return;
    }

    this.isPaused = true;
    this.physics.pause();
    this.pauseOverlay.setVisible(true);
    this.pauseButton.setVisible(false);
    this.audio.playUi();
  }

  private resumeGame(): void {
    this.isPaused = false;
    this.physics.resume();
    this.pauseOverlay.setVisible(false);
    this.pauseButton.setVisible(true);
    this.audio.playUi();
  }

  private handleCatch: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_paddleObject, ballObject): void => {
    const ball = this.getBallFromCollisionObject(ballObject);

    if (this.isGameOver || ball === undefined) {
      return;
    }

    if (ball.ballType === 'damage') {
      this.damageEmitter.explode(24, ball.x, ball.y);
      this.audio.playDamage();
      this.audio.vibrate([25, 30, 25]);
      this.resetCombo();
      ball.destroy();
      this.loseLife(true);
      return;
    }

    const earned = ball.points * this.combo;

    this.score += earned;
    this.ballsCaughtThisRun += 1;
    this.combo += ball.comboGain;
    this.longestComboThisRun = Math.max(this.longestComboThisRun, this.combo);
    this.hud.setScore(this.score);
    this.hud.setCombo(this.combo);
    this.hud.showFloatingScore(ball.x, ball.y, earned, ball.ballType === 'bonus' ? COLORS.goldText : COLORS.text);
    this.paddle.pulse(ball.ballType === 'bonus' ? 1.35 : 1);
    this.flashScreen(BALL_TYPES[ball.ballType].color, ball.ballType === 'bonus' ? 0.14 : 0.08);
    this.cameras.main.shake(ball.ballType === 'bonus' ? 85 : 50, ball.ballType === 'bonus' ? 0.0035 : 0.002);
    this.catchEmitter.setParticleTint(BALL_TYPES[ball.ballType].color);
    this.catchEmitter.explode(ball.ballType === 'bonus' ? 34 : 22, ball.x, ball.y);
    this.audio.playCatch(ball.ballType, this.combo);
    this.audio.vibrate(ball.ballType === 'bonus' ? 18 : 8);
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

  private updateBallMotion(time: number): void {
    this.balls.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Ball) {
        child.updateMotion(time);
      }

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
    this.audio.playDamage();

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
    this.audio.playGameOver();
    this.audio.vibrate([50, 40, 80]);
    this.paddle.setFrozen(true);
    this.pauseButton.setVisible(false);

    this.balls.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Ball) {
        child.freeze();
      }

      return true;
    });

    this.hud.showGameOver(this.score);
    this.time.delayedCall(720, () => {
      const result: RunResult = {
        score: this.score,
        ballsCaught: this.ballsCaughtThisRun,
        survivalTime: this.survivalTime,
        longestCombo: this.longestComboThisRun,
      };

      this.scene.start('GameOverScene', result);
    });
  }

  private showStageModifier(modifier: StageModifier): void {
    this.stageText.setText(this.formatModifier(modifier));
    this.stageText.setAlpha(0).setScale(0.9);
    this.tweens.add({
      targets: this.stageText,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 900,
    });
  }

  private applyStageModifier(modifier: StageModifier): void {
    if (modifier === 'shrinking-paddle') {
      this.paddle.setGameplayWidthScale(0.74);
    }

    if (modifier === 'fog') {
      this.tweens.add({
        targets: this.fogOverlay,
        alpha: 0.32,
        duration: 700,
        ease: 'Sine.easeOut',
      });
    }
  }

  private formatModifier(modifier: StageModifier): string {
    const labels: Record<StageModifier, string> = {
      'faster-balls': 'FASTER BALLS',
      'danger-balls': 'DANGER BALLS',
      'shrinking-paddle': 'PADDLE SHRINK',
      'double-spawn': 'DOUBLE RUSH',
      fog: 'DARKNESS MODE',
      zigzag: 'ZIGZAG BALLS',
    };

    return labels[modifier];
  }
}
