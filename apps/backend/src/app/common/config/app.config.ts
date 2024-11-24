import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3000;

export interface AppConfig {
  port: number;
  basePath: string;
}

export const appConfigDefinition = registerAs<AppConfig>('app', () => ({
  port: process.env.APP_PORT === undefined ? DEFAULT_PORT : parseInt(process.env.APP_PORT, 10),
  basePath: process.env.APP_BASE_PATH ?? '',
}));
