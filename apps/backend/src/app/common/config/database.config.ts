import { registerAs } from '@nestjs/config';
import { DatabaseConfig as TypeormDatabaseConfig, buildDatabaseConfig } from 'apps/backend/src/database/config';

export type DatabaseConfig = TypeormDatabaseConfig;

export default registerAs<DatabaseConfig>('database', () => buildDatabaseConfig());
