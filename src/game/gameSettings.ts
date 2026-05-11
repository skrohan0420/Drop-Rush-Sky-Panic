export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1920;
export const GAME_BACKGROUND_COLOR = '#05070d';

export const COLORS = {
  background: 0x05070d,
  backgroundSoft: 0x07111d,
  paddle: 0x46f3ff,
  paddleGlow: 0x0b6e82,
  cyanBall: 0x65f2ff,
  redBall: 0xff4268,
  goldBall: 0xffd166,
  white: 0xf8fbff,
  text: '#e8fbff',
  mutedText: '#7f95a8',
  danger: 0xff4268,
  goldText: '#ffd166',
} as const;

export const PADDLE = {
  width: 300,
  height: 44,
  bottomMargin: 166,
  // Lower values feel snappier; this is still lerped and never direct snapping.
  smoothing: 0.16,
} as const;

export const BALL = {
  radius: 48,
  spawnY: -72,
} as const;

export type BallType = 'normal' | 'damage' | 'bonus';

export const BALL_TYPES: Record<
  BallType,
  {
    textureKey: string;
    color: number;
    points: number;
    comboGain: number;
    weight: number;
  }
> = {
  normal: {
    textureKey: 'ball-cyan',
    color: COLORS.cyanBall,
    points: 1,
    comboGain: 1,
    weight: 74,
  },
  damage: {
    textureKey: 'ball-red',
    color: COLORS.redBall,
    points: 0,
    comboGain: 0,
    weight: 17,
  },
  bonus: {
    textureKey: 'ball-gold',
    color: COLORS.goldBall,
    points: 5,
    comboGain: 2,
    weight: 9,
  },
};

export const DIFFICULTY = {
  initialBallSpeed: 430,
  maxBallSpeed: 1560,
  speedIncreasePerSecond: 22,
  initialSpawnIntervalMs: 780,
  minSpawnIntervalMs: 260,
  spawnIntervalDecreasePerSecond: 8,
  startingLives: 3,
} as const;
