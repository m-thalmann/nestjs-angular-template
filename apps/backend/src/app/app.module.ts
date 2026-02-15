import { appConfigDefinition, databaseConfigDefinition } from '@backend/config';
import { UniqueValidator } from '@backend/validation';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(
        // check whether the app is in dev-serve or build-run -> different location of .env file
        process.env.NX_WORKSPACE_ROOT ? `${process.env.NX_WORKSPACE_ROOT}/apps/backend/src` : __dirname,
        '.env',
      ),
      load: [appConfigDefinition, databaseConfigDefinition],
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

    // AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [UniqueValidator],
  exports: [UniqueValidator],
})
export class AppModule {}
