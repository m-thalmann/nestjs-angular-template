import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/adapters/pug.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { join } from 'path';
import { mailConfigDefinition } from '../config/mail.config';
import { LogMailerTransport } from './log-mailer.transport';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(mailConfigDefinition)],
      inject: [mailConfigDefinition.KEY],
      useFactory: (mailConfig: ConfigType<typeof mailConfigDefinition>) => ({
        transport:
          mailConfig.type === 'log'
            ? LogMailerTransport
            : {
                host: mailConfig.host,
                port: mailConfig.port,
                secure: mailConfig.secure,
                auth: {
                  user: mailConfig.username,
                  pass: mailConfig.password,
                },
              },
        defaults: {
          from: `"${mailConfig.fromName}" <${mailConfig.fromAddress}>`,
        },
        template: {
          dir: join(__dirname, 'templates/mail'), // located in /src directory
          adapter: new PugAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
