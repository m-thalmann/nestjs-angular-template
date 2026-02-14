import { AuthModule } from '@backend/auth';
import { CommonModule, ConfigService } from '@backend/common';
import { FeatureUsersModule } from '@backend/feature-users';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          ...configService.database,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
        }) satisfies TypeOrmModuleOptions,
    }),

    ScheduleModule.forRoot(),

    JwtModule.registerAsync({
      // imports: [ConfigService],
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: 'my secret',
        // TODO:
        // secret: appConfig.secret,
        // signOptions: { expiresIn: `${authConfig.accessTokenExpirationMinutes}m` },
        signOptions: { expiresIn: `60m` },
      }),
    }),

    CommonModule,
    AuthModule,
    FeatureUsersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
