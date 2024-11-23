import { resolve } from 'path';

export type DatabaseConfig = ServerDatabaseConfig | SqliteDatabaseConfig;

export interface BaseDatabaseConfig {
  type: 'mariadb' | 'mysql' | 'postgres' | 'sqlite';
  migrations: Array<string>;
}

export interface SqliteDatabaseConfig extends BaseDatabaseConfig {
  type: 'sqlite';
  database: string;
}

export interface ServerDatabaseConfig extends BaseDatabaseConfig {
  type: 'mariadb' | 'mysql' | 'postgres';
  database: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export function buildDatabaseConfig(): DatabaseConfig {
  const type = process.env.DATABASE_TYPE;
  const database = process.env.DATABASE_DATABASE;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT;
  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;

  const migrations = [resolve(__dirname, 'migrations', '*.js')];

  if (database === undefined) {
    throw new Error('DATABASE_DATABASE is not configured');
  }

  if (type === 'mariadb' || type === 'mysql' || type === 'postgres') {
    if (host === undefined) {
      throw new Error('DATABASE_HOST is not configured');
    }

    if (port === undefined) {
      throw new Error('DATABASE_PORT is not configured');
    }

    if (username === undefined) {
      throw new Error('DATABASE_USERNAME is not configured');
    }

    if (password === undefined) {
      throw new Error('DATABASE_PASSWORD is not configured');
    }

    return {
      type,
      migrations,
      database,
      host,
      port: parseInt(port, 10),
      username,
      password,
    };
  }

  if (type === 'sqlite') {
    return {
      type,
      migrations,
      database: resolve(__dirname, database),
    };
  }

  throw new Error('DATABASE_TYPE is not configured correctly');
}
