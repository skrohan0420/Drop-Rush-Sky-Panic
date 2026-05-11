export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1920;
export const GAME_BACKGROUND_COLOR = '#05070d';

export const COLORS = {
  background: 0x05070d,
  panel: 0x111827,
  paddle: 0x46f3ff,
  paddleGlow: 0x0b6e82,
  ball: 0xf8fbff,
  ballCore: 0x65f2ff,
  text: '#e8fbff',
  mutedText: '#7f95a8',
  danger: 0xff4268,
} as const;

export const PADDLE = {
  width: 280,
  height: 42,
  bottomMargin: 168,
  smoothing: 0.22,
} as const;

export const BALL = {
  radius: 48,
  spawnY: -64,
  scoreValue: 10,
} as const;

export const DIFFICULTY = {
  initialBallSpeed: 430,
  maxBallSpeed: 1450,
  speedIncreasePerSecond: 18,
  spawnIntervalMs: 520,
  startingLives: 3,
} as const;
