import { Module } from '@nestjs/common';
import { MailNotificationChannelService } from './channels/mail-notification-channel.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [],
  providers: [NotificationService, MailNotificationChannelService],
  exports: [NotificationService],
})
export class NotificationsModule {}
