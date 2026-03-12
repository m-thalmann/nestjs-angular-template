import { Type } from '@nestjs/common';
import { MailNotificationChannelService } from './channels/mail-notification-channel.service';
import { NotificationChannel } from './types';

export const NOTIFICATION_CHANNELS = {
  mail: MailNotificationChannelService,
} as const satisfies Record<string, Type<NotificationChannel<unknown>>>;

export type NotificationChannelName = keyof typeof NOTIFICATION_CHANNELS;

export type NotificationChannelPayload<TChannelName extends NotificationChannelName> =
  InstanceType<(typeof NOTIFICATION_CHANNELS)[TChannelName]> extends NotificationChannel<infer TPayload>
    ? TPayload
    : never;
