import { Injectable } from '@nestjs/common';
import 'dotenv/config';
import { resolve } from 'path';
import { DeepReadonly } from '../types/deep-readonly';
import { AppConfig } from './config.model';

const DEFAULT_APP_PORT = 3000;
const DEFAULT_APP_BASE_PATH = '/api';

@Injectable()
export class ConfigService {
  readonly config: DeepReadonly<AppConfig>;

  get app(): DeepReadonly<AppConfig['app']> {
    return this.config.app;
  }

  get database(): DeepReadonly<AppConfig['database']> {
    return this.config.database;
  }

  constructor() {
    this.config = {
      app: this.getAppConfig(),
      database: this.getDatabaseConfig(),
    };
  }

  protected getAppConfig(): AppConfig['app'] {
    return {
      port: process.env.APP_PORT === undefined ? DEFAULT_APP_PORT : parseInt(process.env.APP_PORT, 10),
      basePath: process.env.APP_BASE_PATH ?? DEFAULT_APP_BASE_PATH,
    };
  }

  protected getDatabaseConfig(): AppConfig['database'] {
    const type = process.env.DATABASE_TYPE;
    const database = process.env.DATABASE_DATABASE;
    const host = process.env.DATABASE_HOST;
    const port = process.env.DATABASE_PORT;
    const username = process.env.DATABASE_USERNAME;
    const password = process.env.DATABASE_PASSWORD;

    // const migrations = [resolve(__dirname, 'migrations', '*.js')];

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
        // migrations,
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
        // migrations,
        database: resolve(__dirname, database),
      };
    }

    throw new Error('DATABASE_TYPE is not configured correctly');
  }
}
