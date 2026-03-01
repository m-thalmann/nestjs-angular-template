import { CommonModule } from '@backend/common.module';
import { databaseConfigDefinition } from '@backend/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { FeatureUsersModule } from './feature-users/feature-users.module';

@Module({
  imports: [
    CommonModule,
    FeatureUsersModule,
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
