export type StageModifier = 'faster-balls' | 'danger-balls' | 'shrinking-paddle' | 'double-spawn' | 'fog' | 'zigzag';

export type ProgressionState = {
  elapsedSeconds: number;
  stage: number;
  nextStageAt: number;
  activeModifiers: StageModifier[];
};

const STAGE_MODIFIERS: StageModifier[] = [
  'faster-balls',
  'danger-balls',
  'shrinking-paddle',
  'double-spawn',
  'fog',
  'zigzag',
];

export class ProgressionManager {
  private state: ProgressionState = {
    elapsedSeconds: 0,
    stage: 0,
    nextStageAt: 30,
    activeModifiers: [],
  };

  reset(): void {
    this.state = {
      elapsedSeconds: 0,
      stage: 0,
      nextStageAt: 30,
      activeModifiers: [],
    };
  }

  update(deltaMs: number): StageModifier | undefined {
    this.state.elapsedSeconds += deltaMs / 1000;

    if (this.state.elapsedSeconds < this.state.nextStageAt) {
      return undefined;
    }

    const modifier = STAGE_MODIFIERS[this.state.stage % STAGE_MODIFIERS.length];

    this.state.stage += 1;
    this.state.nextStageAt += 30 + (this.state.stage % 4) * 5;

    if (!this.state.activeModifiers.includes(modifier)) {
      this.state.activeModifiers.push(modifier);
    }

    return modifier;
  }

  getState(): ProgressionState {
    return {
      elapsedSeconds: this.state.elapsedSeconds,
      stage: this.state.stage,
      nextStageAt: this.state.nextStageAt,
      activeModifiers: [...this.state.activeModifiers],
    };
  }

  has(modifier: StageModifier): boolean {
    return this.state.activeModifiers.includes(modifier);
  }

  getSpeedMultiplier(): number {
    return 1 + this.state.stage * 0.08 + (this.has('faster-balls') ? 0.24 : 0);
  }

  getSpawnMultiplier(): number {
    return this.has('double-spawn') ? 0.55 : 1;
  }

  canSpawnDamageBalls(): boolean {
    return this.state.stage >= 1 || this.has('danger-balls');
  }

  canSpawnBonusBalls(): boolean {
    return this.state.elapsedSeconds >= 12;
  }
}
