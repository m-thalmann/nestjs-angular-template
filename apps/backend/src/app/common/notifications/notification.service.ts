import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { isUndefined } from '@shared/common';
import { NOTIFICATION_CHANNELS, NotificationChannelName } from './notification-channels';
import { Notification, NotificationRecipient } from './types';

type NotificationChannelInstances = {
  [TChannelName in NotificationChannelName]: InstanceType<(typeof NOTIFICATION_CHANNELS)[TChannelName]>;
};

// TODO: setup queues for sending notifications

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  protected readonly channels: Partial<NotificationChannelInstances> = {};

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit(): void {
    (Object.keys(NOTIFICATION_CHANNELS) as Array<NotificationChannelName>).forEach((name) => {
      this.channels[name] = this.moduleRef.get(NOTIFICATION_CHANNELS[name]);
    });
  }

  async send(recipient: NotificationRecipient, notification: Notification): Promise<void> {
    const activeChannels = Object.keys(NOTIFICATION_CHANNELS) as Array<keyof typeof NOTIFICATION_CHANNELS>;

    const tasks = activeChannels.map(async (channelName) => {
      const handler = notification[channelName];

      if (typeof handler !== 'function') {
        return;
      }

      const channel = this.channels[channelName];

      if (isUndefined(channel)) {
        return;
      }

      try {
        const payload = await handler.call(notification, recipient);
        await channel.send(recipient, payload);
      } catch (error) {
        this.logger.error(
          `Failed to send ${channelName} notification to ${recipient.email}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

    await Promise.all(tasks);
  }
}
