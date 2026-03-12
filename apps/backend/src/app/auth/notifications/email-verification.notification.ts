import { MailNotificationBuilder, Notification } from '@backend/notifications';

export class EmailVerificationNotification implements Notification {
  constructor(
    protected readonly options: {
      frontendUrl: string;
      isNewUser: boolean;
      token: string;
    },
  ) {}

  async mail(): Promise<MailNotificationBuilder> {
    return new MailNotificationBuilder()
      .subject('Verify Email Address')
      .line(
        this.options.isNewUser
          ? 'Thank you for signing up. To complete your registration, please verify your email address by clicking the button below.'
          : 'You recently updated your email. To complete the process, please verify your email address by clicking the button below.',
      )
      .action('Verify email →', this.buildVerificationUrl())
      .line(`If you did not create an account, no further action is required.`);
  }

  protected buildVerificationUrl(): string {
    const url = new URL(this.options.frontendUrl);
    url.pathname += `verify-email/${this.options.token}`;

    return url.toString();
  }
}
