/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

jest.mock('dotenv/config');

const OLD_ENV = process.env;

class ConfigServiceTestClass extends ConfigService {
  override getAppConfig(): ReturnType<ConfigService['getAppConfig']> {
    return super.getAppConfig();
  }
}

describe('ConfigService', () => {
  let service: ConfigServiceTestClass;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigServiceTestClass],
    }).compile();

    service = module.get<ConfigServiceTestClass>(ConfigServiceTestClass);
  });

  describe('getAppConfig', () => {
    it('should return the correct app config', () => {
      const MOCK_ENV = {
        APP_PORT: '3111',
        APP_BASE_PATH: '/my-api',
      };

      process.env = { ...process.env, ...MOCK_ENV };

      const config = service.getAppConfig();

      expect(config.port).toBe(3111);
      expect(config.basePath).toBe('/my-api');
    });

    it('should return default app config values when env vars are not set', () => {
      const config = service.getAppConfig();

      expect(config.port).toBe(3000);
      expect(config.basePath).toBe('/api');
    });
  });
});
