import { Injectable } from '@nestjs/common';
import 'dotenv/config';
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

  constructor() {
    this.config = {
      app: this.getAppConfig(),
    };
  }

  protected getAppConfig(): AppConfig['app'] {
    return {
      port: process.env.APP_PORT === undefined ? DEFAULT_APP_PORT : parseInt(process.env.APP_PORT, 10),
      basePath: process.env.APP_BASE_PATH ?? DEFAULT_APP_BASE_PATH,
    };
  }
}
