import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  accessTokenExpirationMinutes: number;
  refreshTokenExpirationMinutes: number;
}

const DEFAULT_ACCESS_TOKEN_EXPIRATION_MINUTES = 10;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const DEFAULT_REFRESH_TOKEN_EXPIRATION_MINUTES = 60 * 24 * 30; // 30 days

export const authConfigDefinition = registerAs<AuthConfig>('auth', () => ({
  accessTokenExpirationMinutes: parseInt(
    process.env.AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES ?? DEFAULT_ACCESS_TOKEN_EXPIRATION_MINUTES.toString(),
    10,
  ),
  refreshTokenExpirationMinutes: parseInt(
    process.env.AUTH_REFRESH_TOKEN_EXPIRATION_MINUTES ?? DEFAULT_REFRESH_TOKEN_EXPIRATION_MINUTES.toString(),
    10,
  ),
}));
