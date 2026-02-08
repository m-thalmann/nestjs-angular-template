import { CommonModule, ConfigService } from '@backend/common';
import { FeatureUsersModule } from '@backend/feature-users';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';

@Module({
  imports: [
    CommonModule,
    FeatureUsersModule,
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
