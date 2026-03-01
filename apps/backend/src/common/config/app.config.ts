import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3000;
const DEFAULT_BASE_PATH = '/api';

const MIN_SECRET_LENGTH = 32;

const DEFAULT_REQUESTS_PER_MINUTE = 60;

export interface AppConfig {
  port: number;
  host: string;
  basePath: string;
  secret: string;
  frontendUrl: string;
  signUpEnabled: boolean;
  requestsPerMinute: number;
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
    host: process.env.APP_HOST ?? 'localhost',
    basePath: process.env.APP_BASE_PATH ?? DEFAULT_BASE_PATH,
    frontendUrl: process.env.APP_FRONTEND_URL ?? 'http://localhost:4200/',
    secret,
    signUpEnabled: process.env.APP_SIGN_UP_ENABLED === 'true',
    requestsPerMinute: DEFAULT_REQUESTS_PER_MINUTE,
  };
});
