import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfigDefinition, authConfigDefinition } from '../common/config';
import { UsersModule } from '../users/users.module';
import { AuthToken } from './auth-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

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
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
