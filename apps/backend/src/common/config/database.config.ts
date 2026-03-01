import { buildDatabaseConfig, DatabaseConfig } from '@backend/database';
import { registerAs } from '@nestjs/config';
import { resolve } from 'path';

export { type DatabaseConfig };

export const databaseConfigDefinition = registerAs<DatabaseConfig>('database', () =>
  buildDatabaseConfig(resolve(__dirname)),
);
