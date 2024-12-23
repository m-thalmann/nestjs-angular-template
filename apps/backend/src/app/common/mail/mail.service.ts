import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SentMessageInfo } from 'nodemailer/lib/smtp-connection';
import { BaseMessage } from './base.message';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly moduleRef: ModuleRef,
  ) {}

  build<T extends BaseMessage<unknown>>(message: new (mailService: MailService, moduleRef: ModuleRef) => T): T {
    return new message(this, this.moduleRef);
  }

  async sendMail(message: BaseMessage<unknown>): Promise<boolean> {
    // TODO: add error handling and logging
    const mailOptions = await message.getMailOptions();

    (await this.mailerService.sendMail(mailOptions)) as SentMessageInfo;

    return true;
  }
}
