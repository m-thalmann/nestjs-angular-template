import { config as dotenvConfig } from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { buildDatabaseConfig } from './config';

dotenvExpand(dotenvConfig({ quiet: false, path: resolve(__dirname, '../.env') }));

const databaseConfig = buildDatabaseConfig(resolve(__dirname, '..'));

databaseConfig.database = resolve(__dirname, databaseConfig.database);

export default new DataSource({ ...databaseConfig, migrations: [resolve(__dirname, 'migrations/**')] });
