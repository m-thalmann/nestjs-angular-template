import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3000;
const DEFAULT_BASE_PATH = '/api';

export interface AppConfig {
  port: number;
  host: string;
  basePath: string;
}

export const appConfigDefinition = registerAs<AppConfig>('app', () => ({
  port: process.env.APP_PORT === undefined ? DEFAULT_PORT : parseInt(process.env.APP_PORT, 10),
  host: process.env.APP_HOST ?? 'localhost',
  basePath: process.env.APP_BASE_PATH ?? DEFAULT_BASE_PATH,
}));
