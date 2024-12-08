import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfigDefinition, authConfigDefinition } from '../common/config';
import { UsersModule } from '../users';
import { AuthToken } from './auth-token.entity';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthToken]),

    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(appConfigDefinition), ConfigModule.forFeature(authConfigDefinition)],
      inject: [appConfigDefinition.KEY, authConfigDefinition.KEY],
      useFactory: (
        appConfig: ConfigType<typeof appConfigDefinition>,
        authConfig: ConfigType<typeof authConfigDefinition>,
      ) => ({
        global: true,
        secret: appConfig.secret,
        signOptions: { expiresIn: `${authConfig.accessTokenExpirationMinutes}m` },
      }),
    }),

    UsersModule,
  ],
  providers: [
    AuthService,
    AuthTokenService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
