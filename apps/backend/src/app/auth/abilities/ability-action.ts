import { ObjectValues } from '@shared/common';

export const AbilityAction = {
  Manage: 'manage',
  Create: 'create',
  ReadAll: 'readAll',
  Read: 'read',
  Update: 'update',
  Delete: 'delete',
} as const;

export type AbilityAction = ObjectValues<typeof AbilityAction>;
