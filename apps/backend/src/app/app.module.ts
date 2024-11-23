import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(__dirname, '.env'),

      load: [appConfig, databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        ...dbConfig,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
