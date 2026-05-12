import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/gameSettings';

export type SafeArea = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export function getSafeArea(scene: Phaser.Scene, padding = 48): SafeArea {
  const parent = scene.scale.parentSize;
  const display = scene.scale.displaySize;
  // Android WebView can briefly report 0×0 before layout; avoid NaNs that break bounds and input.
  const dw = Math.max(1, display.width);
  const dh = Math.max(1, display.height);
  const pw = Math.max(1, parent.width);
  const ph = Math.max(1, parent.height);
  const visibleWidth = GAME_WIDTH * (pw / dw);
  const visibleHeight = GAME_HEIGHT * (ph / dh);
  const left = Math.max(0, (GAME_WIDTH - visibleWidth) / 2) + padding;
  const top = Math.max(0, (GAME_HEIGHT - visibleHeight) / 2) + padding;
  const right = Math.min(GAME_WIDTH, left + visibleWidth - padding * 2);
  const bottom = Math.min(GAME_HEIGHT, top + visibleHeight - padding * 2);

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}
