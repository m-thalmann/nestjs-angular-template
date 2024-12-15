import { ObjectValue } from '@app/shared-types';

export const ABILITY_ACTIONS = {
  MANAGE: 'manage',
  CREATE: 'create',
  READ_ALL: 'readAll',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type AbilityAction = ObjectValue<typeof ABILITY_ACTIONS>;
