import { ObjectValues } from '@shared/common';

export const DARK_THEME_CLASS = 'theme-dark';

export const Theme = {
  System: 'system',
  Dark: 'dark',
  Light: 'light',
} as const;

export type Theme = ObjectValues<typeof Theme>;
