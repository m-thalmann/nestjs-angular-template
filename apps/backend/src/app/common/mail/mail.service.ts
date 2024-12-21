import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer/lib/smtp-connection';
import { BaseMessage } from './base.message';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(message: BaseMessage): Promise<boolean> {
    // TODO: send over queue
    (await this.mailerService.sendMail(message.getMailOptions())) as SentMessageInfo;

    return true;
  }
}
