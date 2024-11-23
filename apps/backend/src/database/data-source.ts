import { config as dotenvConfig } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseConfig } from './config';

/**
 * IMPORTANT: THIS FILE IS ONLY USED AFTER BUILD AND CANNOT BE USED DIRECTLY IN THE SOURCE
 */

dotenvConfig({ path: '.env' });

const config = buildDatabaseConfig();

export const connectionSource = new DataSource(config);
