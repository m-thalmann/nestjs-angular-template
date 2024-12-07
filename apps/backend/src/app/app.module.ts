import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { appConfigDefinition, authConfigDefinition, databaseConfigDefinition } from './common/config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(__dirname, '.env'),

      load: [appConfigDefinition, databaseConfigDefinition, authConfigDefinition],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfigDefinition)],
      inject: [databaseConfigDefinition.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfigDefinition>) =>
        ({
          ...dbConfig,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
        }) satisfies TypeOrmModuleOptions,
    }),

    CommonModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
