export type ThemeId = 'neon' | 'gold' | 'danger';

export type Theme = {
  id: ThemeId;
  name: string;
  background: number;
  backgroundSoft: number;
  particle: number;
  accent: number;
};

export const THEMES: Record<ThemeId, Theme> = {
  neon: {
    id: 'neon',
    name: 'Neon Sky',
    background: 0x05070d,
    backgroundSoft: 0x07111d,
    particle: 0x65f2ff,
    accent: 0x46f3ff,
  },
  gold: {
    id: 'gold',
    name: 'Gold Rush',
    background: 0x080707,
    backgroundSoft: 0x17100a,
    particle: 0xffd166,
    accent: 0xffd166,
  },
  danger: {
    id: 'danger',
    name: 'Red Alert',
    background: 0x090509,
    backgroundSoft: 0x180812,
    particle: 0xff4268,
    accent: 0xff4268,
  },
};
