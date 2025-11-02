export interface AppConfig {
  app: {
    port: number;
    basePath: string;
  };
  database: DatabaseConfig;
}

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
