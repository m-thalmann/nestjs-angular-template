import { NotificationChannelName, NotificationChannelPayload } from './notification-channels';

export interface NotificationRecipient {
  name: string;
  email: string;
}

export interface NotificationChannel<TPayload> {
  send(recipient: NotificationRecipient, payload: TPayload): Promise<void>;
}

export type Notification = {
  [TChannelName in NotificationChannelName]?: (
    recipient: NotificationRecipient,
  ) => Promise<NotificationChannelPayload<TChannelName>>;
};
