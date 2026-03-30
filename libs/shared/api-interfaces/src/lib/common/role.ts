import { ObjectValues } from '@shared/common';

export const Role = {
  Admin: 'admin',
  User: 'user',
} as const;

export type Role = ObjectValues<typeof Role>;
export const ROLES = Object.values(Role);
