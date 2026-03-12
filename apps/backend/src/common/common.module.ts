import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { appConfigDefinition, authConfigDefinition, databaseConfigDefinition } from './config';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UniqueValidator } from './validation/unique.validator';

@Global()
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
      load: [appConfigDefinition, databaseConfigDefinition, authConfigDefinition],
    }),

    MailModule,
    NotificationsModule,
  ],
  providers: [UniqueValidator],
  exports: [UniqueValidator, MailModule, NotificationsModule],
})
export class CommonModule {}
