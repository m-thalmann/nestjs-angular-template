import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3000;

const MIN_SECRET_LENGTH = 32;

export interface AppConfig {
  port: number;
  basePath: string;
  secret: string;
  url: string;
  frontendUrl: string;
  signUpEnabled: boolean;
}

export const appConfigDefinition = registerAs<AppConfig>('app', () => {
  const secret = process.env.APP_SECRET;

  if (secret === undefined) {
    throw new Error('APP_SECRET environment variable is missing');
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error('APP_SECRET must be at least 32 characters long');
  }

  return {
    port: process.env.APP_PORT === undefined ? DEFAULT_PORT : parseInt(process.env.APP_PORT, 10),
    basePath: process.env.APP_BASE_PATH ?? '',
    secret,
    url: process.env.APP_URL ?? 'http://localhost:3000',
    frontendUrl: process.env.APP_FRONTEND_URL ?? 'http://localhost:4200',
    signUpEnabled: process.env.APP_SIGN_UP_ENABLED === 'true',
  };
});
