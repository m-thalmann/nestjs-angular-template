import { appConfigDefinition, databaseConfigDefinition } from '@backend/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: resolve(__dirname, '.env'), // located  in /src directory
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
    // UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
