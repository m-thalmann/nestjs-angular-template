import { ObjectValue } from '@app/shared-types';

export const AUTH_TOKEN_TYPES = {
  ACCESS: 'ACCESS',
  REFRESH_PAIR: 'REFRESH_PAIR',
} as const;

export type AuthTokenType = ObjectValue<typeof AUTH_TOKEN_TYPES>;
