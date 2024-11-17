import { registerAs } from '@nestjs/config';
import { ConfigVariables } from './config-variables.model';

const DEFAULT_PORT = 3000;

export default registerAs<ConfigVariables['app']>('app', () => ({
  port: process.env.APP_PORT === undefined ? DEFAULT_PORT : parseInt(process.env.APP_PORT, 10),
  basePath: process.env.APP_BASE_PATH ?? '',
}));
