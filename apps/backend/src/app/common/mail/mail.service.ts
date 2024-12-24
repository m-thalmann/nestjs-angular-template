import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SentMessageInfo } from 'nodemailer/lib/smtp-connection';
import { isNativeError } from 'util/types';
import { BaseMessage } from './base.message';

@Injectable()
export class MailService {
  private readonly logger: Logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly moduleRef: ModuleRef,
  ) {}

  build<T extends BaseMessage<unknown>>(message: new (mailService: MailService, moduleRef: ModuleRef) => T): T {
    return new message(this, this.moduleRef);
  }

  async sendMail(message: BaseMessage<unknown>): Promise<boolean> {
    const mailOptions = await message.getMailOptions();

    try {
      (await this.mailerService.sendMail(mailOptions)) as SentMessageInfo;
    } catch (error) {
      const errorMessage = isNativeError(error) ? error.message : String(error);

      this.logger.error(`Error sending email (${message.getErrorContext()}): ${errorMessage}`);

      return false;
    }

    return true;
  }
}
