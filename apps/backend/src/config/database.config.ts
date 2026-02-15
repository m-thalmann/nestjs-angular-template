import { buildDatabaseConfig } from '@backend/database';
import { registerAs } from '@nestjs/config';
import { resolve } from 'path';

type DatabaseConfig = ServerDatabaseConfig | SqliteDatabaseConfig;

interface BaseDatabaseConfig {
  type: 'mariadb' | 'mysql' | 'postgres' | 'sqlite';
}

interface SqliteDatabaseConfig extends BaseDatabaseConfig {
  type: 'sqlite';
  database: string;
}

interface ServerDatabaseConfig extends BaseDatabaseConfig {
  type: 'mariadb' | 'mysql' | 'postgres';
  database: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export const databaseConfigDefinition = registerAs<DatabaseConfig>('database', () =>
  buildDatabaseConfig(resolve(__dirname)),
);
