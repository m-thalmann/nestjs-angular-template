import { MailService } from '@backend/mail';
import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationRecipient } from '../types';
import { MailNotificationBuilder } from './mail-notification-builder';

@Injectable()
export class MailNotificationChannelService implements NotificationChannel<MailNotificationBuilder> {
  constructor(private readonly mailService: MailService) {}

  async send(recipient: NotificationRecipient, payload: MailNotificationBuilder): Promise<void> {
    const mailOptions = payload.getMailOptions();

    await this.mailService.sendMail({
      ...mailOptions,
      to: recipient.email,
    });
  }
}
