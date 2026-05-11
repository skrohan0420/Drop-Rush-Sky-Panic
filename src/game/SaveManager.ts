import type { ThemeId } from './themes';

const SAVE_KEY = 'drop-rush-sky-panic-save-v1';

export type GameSettings = {
  musicVolume: number;
  sfxVolume: number;
  vibrationEnabled: boolean;
  selectedTheme: ThemeId;
};

export type GameStats = {
  gamesPlayed: number;
  totalBallsCaught: number;
  longestSurvivalTime: number;
  highestCombo: number;
};

export type GameSave = {
  highScore: number;
  unlockedThemes: ThemeId[];
  settings: GameSettings;
  stats: GameStats;
};

export type RunResult = {
  score: number;
  ballsCaught: number;
  survivalTime: number;
  longestCombo: number;
};

const DEFAULT_SAVE: GameSave = {
  highScore: 0,
  unlockedThemes: ['neon'],
  settings: {
    musicVolume: 0.45,
    sfxVolume: 0.7,
    vibrationEnabled: true,
    selectedTheme: 'neon',
  },
  stats: {
    gamesPlayed: 0,
    totalBallsCaught: 0,
    longestSurvivalTime: 0,
    highestCombo: 1,
  },
};

export class SaveManager {
  static load(): GameSave {
    const rawSave = window.localStorage.getItem(SAVE_KEY);

    if (rawSave === null) {
      return SaveManager.cloneDefault();
    }

    try {
      const parsed = JSON.parse(rawSave) as Partial<GameSave>;
      return SaveManager.normalize(parsed);
    } catch {
      return SaveManager.cloneDefault();
    }
  }

  static save(data: GameSave): void {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static updateSettings(settings: Partial<GameSettings>): GameSave {
    const save = SaveManager.load();
    const nextSave: GameSave = {
      ...save,
      settings: {
        ...save.settings,
        ...settings,
      },
    };

    SaveManager.save(nextSave);
    return nextSave;
  }

  static recordRun(result: RunResult): GameSave {
    const save = SaveManager.load();
    const unlockedThemes = new Set(save.unlockedThemes);

    if (result.score >= 50) {
      unlockedThemes.add('gold');
    }

    if (save.stats.gamesPlayed + 1 >= 5 || result.longestCombo >= 8) {
      unlockedThemes.add('danger');
    }

    const nextSave: GameSave = {
      ...save,
      highScore: Math.max(save.highScore, result.score),
      unlockedThemes: Array.from(unlockedThemes),
      stats: {
        gamesPlayed: save.stats.gamesPlayed + 1,
        totalBallsCaught: save.stats.totalBallsCaught + result.ballsCaught,
        longestSurvivalTime: Math.max(save.stats.longestSurvivalTime, result.survivalTime),
        highestCombo: Math.max(save.stats.highestCombo, result.longestCombo),
      },
    };

    SaveManager.save(nextSave);
    return nextSave;
  }

  private static normalize(partial: Partial<GameSave>): GameSave {
    const base = SaveManager.cloneDefault();
    const selectedTheme = partial.settings?.selectedTheme ?? base.settings.selectedTheme;
    const unlockedThemes = partial.unlockedThemes?.length ? partial.unlockedThemes : base.unlockedThemes;

    return {
      highScore: partial.highScore ?? base.highScore,
      unlockedThemes: unlockedThemes.includes(selectedTheme) ? unlockedThemes : [...unlockedThemes, selectedTheme],
      settings: {
        musicVolume: partial.settings?.musicVolume ?? base.settings.musicVolume,
        sfxVolume: partial.settings?.sfxVolume ?? base.settings.sfxVolume,
        vibrationEnabled: partial.settings?.vibrationEnabled ?? base.settings.vibrationEnabled,
        selectedTheme,
      },
      stats: {
        gamesPlayed: partial.stats?.gamesPlayed ?? base.stats.gamesPlayed,
        totalBallsCaught: partial.stats?.totalBallsCaught ?? base.stats.totalBallsCaught,
        longestSurvivalTime: partial.stats?.longestSurvivalTime ?? base.stats.longestSurvivalTime,
        highestCombo: partial.stats?.highestCombo ?? base.stats.highestCombo,
      },
    };
  }

  private static cloneDefault(): GameSave {
    return structuredClone(DEFAULT_SAVE);
  }
}
