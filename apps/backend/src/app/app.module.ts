import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { appConfigDefinition } from './common/config/app.config';
import { authConfigDefinition } from './common/config/auth.config';
import { databaseConfigDefinition } from './common/config/database.config';
import { mailConfigDefinition } from './common/config/mail.config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(__dirname, '.env'), // located  in /src directory

      load: [appConfigDefinition, databaseConfigDefinition, authConfigDefinition, mailConfigDefinition],
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

    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(appConfigDefinition), ConfigModule.forFeature(authConfigDefinition)],
      inject: [appConfigDefinition.KEY, authConfigDefinition.KEY],
      global: true,
      useFactory: (
        appConfig: ConfigType<typeof appConfigDefinition>,
        authConfig: ConfigType<typeof authConfigDefinition>,
      ) => ({
        global: true,
        secret: appConfig.secret,
        signOptions: { expiresIn: `${authConfig.accessTokenExpirationMinutes}m` },
      }),
    }),

    EventEmitterModule.forRoot({
      global: true,
      verboseMemoryLeak: true,
    }),

    ScheduleModule.forRoot(),

    CommonModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
