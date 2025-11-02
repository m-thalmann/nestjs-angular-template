/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from './config.model';
import { ConfigService } from './config.service';

jest.mock('dotenv/config');

const OLD_ENV = process.env;

class ConfigServiceTestClass extends ConfigService {
  override getAppConfig(): ReturnType<ConfigService['getAppConfig']> {
    return super.getAppConfig();
  }

  override getDatabaseConfig(): AppConfig['database'] {
    return super.getDatabaseConfig();
  }
}

describe('ConfigService', () => {
  let service: ConfigServiceTestClass;

  beforeEach(() => {
    jest.resetModules();
    // Set default environment variables for service instantiation
    process.env = {
      ...OLD_ENV,
      DATABASE_TYPE: 'sqlite',
      DATABASE_DATABASE: 'test.db',
    };
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

  describe('getDatabaseConfig', () => {
    it('should throw an error when database type is not configured', () => {
      process.env = {
        ...process.env,
        DATABASE_TYPE: undefined,
        DATABASE_DATABASE: 'test_db',
      };

      expect(() => service.getDatabaseConfig()).toThrow('DATABASE_TYPE is not configured correctly');
    });

    it('should throw an error when database type is invalid', () => {
      process.env = {
        ...process.env,
        DATABASE_TYPE: 'invalid',
        DATABASE_DATABASE: 'test_db',
      };

      expect(() => service.getDatabaseConfig()).toThrow('DATABASE_TYPE is not configured correctly');
    });

    it('should throw an error when DATABASE_DATABASE is not set', () => {
      process.env = {
        ...process.env,
        DATABASE_TYPE: 'postgres',
        DATABASE_DATABASE: undefined,
      };

      expect(() => service.getDatabaseConfig()).toThrow('DATABASE_DATABASE is not configured');
    });

    describe('mariadb', () => {
      it('should return correct config with all required fields', () => {
        const MOCK_ENV = {
          DATABASE_TYPE: 'mariadb',
          DATABASE_DATABASE: 'test_db',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '3306',
          DATABASE_USERNAME: 'root',
          DATABASE_PASSWORD: 'password123',
        };

        process.env = { ...process.env, ...MOCK_ENV };

        const config = service.getDatabaseConfig();

        expect(config.type).toBe('mariadb');
        expect(config.database).toBe('test_db');
        if (config.type !== 'sqlite') {
          expect(config.host).toBe('localhost');
          expect(config.port).toBe(3306);
          expect(config.username).toBe('root');
          expect(config.password).toBe('password123');
        }
      });

      it('should throw an error when DATABASE_HOST is missing', () => {
        process.env = {
          ...process.env,
          DATABASE_TYPE: 'mariadb',
          DATABASE_DATABASE: 'test_db',
          DATABASE_HOST: undefined,
        };

        expect(() => service.getDatabaseConfig()).toThrow('DATABASE_HOST is not configured');
      });

      it('should throw an error when DATABASE_PORT is missing', () => {
        process.env = {
          ...process.env,
          DATABASE_TYPE: 'mariadb',
          DATABASE_DATABASE: 'test_db',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: undefined,
        };

        expect(() => service.getDatabaseConfig()).toThrow('DATABASE_PORT is not configured');
      });

      it('should throw an error when DATABASE_USERNAME is missing', () => {
        process.env = {
          ...process.env,
          DATABASE_TYPE: 'mariadb',
          DATABASE_DATABASE: 'test_db',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '3306',
          DATABASE_USERNAME: undefined,
        };

        expect(() => service.getDatabaseConfig()).toThrow('DATABASE_USERNAME is not configured');
      });

      it('should throw an error when DATABASE_PASSWORD is missing', () => {
        process.env = {
          ...process.env,
          DATABASE_TYPE: 'mariadb',
          DATABASE_DATABASE: 'test_db',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '3306',
          DATABASE_USERNAME: 'root',
          DATABASE_PASSWORD: undefined,
        };

        expect(() => service.getDatabaseConfig()).toThrow('DATABASE_PASSWORD is not configured');
      });
    });

    describe('mysql', () => {
      it('should return correct config with all required fields', () => {
        const MOCK_ENV = {
          DATABASE_TYPE: 'mysql',
          DATABASE_DATABASE: 'my_database',
          DATABASE_HOST: '127.0.0.1',
          DATABASE_PORT: '3307',
          DATABASE_USERNAME: 'admin',
          DATABASE_PASSWORD: 'secret',
        };

        process.env = { ...process.env, ...MOCK_ENV };

        const config = service.getDatabaseConfig();

        expect(config.type).toBe('mysql');
        expect(config.database).toBe('my_database');
        if (config.type !== 'sqlite') {
          expect(config.host).toBe('127.0.0.1');
          expect(config.port).toBe(3307);
          expect(config.username).toBe('admin');
          expect(config.password).toBe('secret');
        }
      });
    });

    describe('postgres', () => {
      it('should return correct config with all required fields', () => {
        const MOCK_ENV = {
          DATABASE_TYPE: 'postgres',
          DATABASE_DATABASE: 'postgres_db',
          DATABASE_HOST: 'db.example.com',
          DATABASE_PORT: '5432',
          DATABASE_USERNAME: 'postgres',
          DATABASE_PASSWORD: 'pg_password',
        };

        process.env = { ...process.env, ...MOCK_ENV };

        const config = service.getDatabaseConfig();

        expect(config.type).toBe('postgres');
        expect(config.database).toBe('postgres_db');
        if (config.type !== 'sqlite') {
          expect(config.host).toBe('db.example.com');
          expect(config.port).toBe(5432);
          expect(config.username).toBe('postgres');
          expect(config.password).toBe('pg_password');
        }
      });
    });

    describe('sqlite', () => {
      it('should return correct config with resolved database path', () => {
        const MOCK_ENV = {
          DATABASE_TYPE: 'sqlite',
          DATABASE_DATABASE: 'test.db',
        };

        process.env = { ...process.env, ...MOCK_ENV };

        const config = service.getDatabaseConfig();

        expect(config.type).toBe('sqlite');
        expect(config.database).toContain('test.db');
        // The path should be an absolute path
        expect(config.database).toMatch(/[/\\]test\.db$/);
      });

      it('should not require host, port, username, or password', () => {
        const MOCK_ENV = {
          DATABASE_TYPE: 'sqlite',
          DATABASE_DATABASE: 'local.db',
          DATABASE_HOST: undefined,
          DATABASE_PORT: undefined,
          DATABASE_USERNAME: undefined,
          DATABASE_PASSWORD: undefined,
        };

        process.env = { ...process.env, ...MOCK_ENV };

        expect(() => service.getDatabaseConfig()).not.toThrow();
        const config = service.getDatabaseConfig();
        expect(config.type).toBe('sqlite');
      });
    });
  });
});
