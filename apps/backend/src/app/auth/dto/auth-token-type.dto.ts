import { ObjectValue } from '@app/shared-types';

export const AUTH_TOKEN_TYPES = {
  AUTH: 'AUTH',
  REFRESH: 'REFRESH',
} as const;

export type AuthTokenType = ObjectValue<typeof AUTH_TOKEN_TYPES>;
