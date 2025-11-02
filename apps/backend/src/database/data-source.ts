import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

const isRunningWithNx = process.env.NX_WORKSPACE_ROOT !== undefined; // when running with nx the .env file is loaded automatically

const envPath = resolve(__dirname, '../.env'); // data-source lives in database folder, .env on root level

dotenvConfig({ path: isRunningWithNx ? undefined : envPath, quiet: true });

// eslint-disable-next-line @typescript-eslint/init-declarations
let databaseConfig: MysqlConnectionOptions | PostgresConnectionOptions | SqliteConnectionOptions;

if (process.env.DATABASE_TYPE === 'sqlite') {
  if (process.env.DATABASE_DATABASE === undefined) {
    throw new Error('DATABASE_DATABASE must be defined for sqlite database type.');
  }

  databaseConfig = {
    type: 'sqlite',
    database: resolve(`${__dirname}/..`, process.env.DATABASE_DATABASE),
  };
} else if (
  process.env.DATABASE_TYPE === 'mysql' ||
  process.env.DATABASE_TYPE === 'mariadb' ||
  process.env.DATABASE_TYPE === 'postgres'
) {
  databaseConfig = {
    type: process.env.DATABASE_TYPE,
    database: process.env.DATABASE_DATABASE,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT === undefined ? undefined : parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  };
} else {
  throw new Error('Unsupported DATABASE_TYPE. Please use "sqlite", "mysql", "mariadb", or "postgres".');
}

export default new DataSource({ ...databaseConfig, migrations: [resolve(__dirname, 'migrations/**')] });
