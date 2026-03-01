import { CommonModule } from '@backend/common.module';
import { appConfigDefinition, authConfigDefinition, databaseConfigDefinition } from '@backend/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    CommonModule,

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

    EventEmitterModule.forRoot({
      global: true,
      verboseMemoryLeak: true,
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfigDefinition)],
      inject: [appConfigDefinition.KEY],
      useFactory: (appConfig: ConfigType<typeof appConfigDefinition>) => [
        {
          ttl: minutes(1),
          limit: appConfig.requestsPerMinute,
        },
      ],
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

    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
