import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // TypeOrmModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) =>
    //     ({
    //       ...configService.database,
    //       autoLoadEntities: true,
    //       synchronize: false,
    //       migrationsRun: false,
    //     }) satisfies TypeOrmModuleOptions,
    // }),

    ScheduleModule.forRoot(),

    // JwtModule.registerAsync({
    //   // imports: [ConfigService],
    //   inject: [ConfigService],
    //   global: true,
    //   useFactory: (configService: ConfigService) => ({
    //     global: true,
    //     secret: 'my secret',
    //     // TODO:
    //     // secret: appConfig.secret,
    //     // signOptions: { expiresIn: `${authConfig.accessTokenExpirationMinutes}m` },
    //     signOptions: { expiresIn: `60m` },
    //   }),
    // }),

    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
