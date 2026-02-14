import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { buildDatabaseConfig } from './config';

const isRunningWithNx = process.env.NX_WORKSPACE_ROOT !== undefined; // when running with nx the .env file is loaded automatically

const envPath = resolve(__dirname, '../.env'); // data-source lives in database folder, .env on root level

dotenvConfig({ path: isRunningWithNx ? undefined : envPath, quiet: true });

const databaseConfig = buildDatabaseConfig(resolve(__dirname, '..'));

databaseConfig.database = resolve(__dirname, databaseConfig.database);

export default new DataSource({ ...databaseConfig, migrations: [resolve(__dirname, 'migrations/**')] });
