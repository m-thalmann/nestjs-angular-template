import { MailNotificationBuilder, Notification } from '@backend/notifications';
import { ResetPasswordService } from '../reset-password/reset-password.service';

export class PasswordResetNotification implements Notification {
  constructor(
    protected readonly options: {
      frontendUrl: string;
      token: string;
    },
  ) {}

  async mail(): Promise<MailNotificationBuilder> {
    return new MailNotificationBuilder()
      .subject('Reset Password Notification')
      .line('You are receiving this email because we received a password reset request for your account.')
      .action('Reset password →', this.buildResetUrl())
      .line(`This password reset link will expire in ${ResetPasswordService.TOKEN_EXPIRATION_MINUTES} minutes.`)
      .line('If you did not request a password reset, no further action is required.');
  }

  protected buildResetUrl(): string {
    const url = new URL(this.options.frontendUrl);
    url.pathname += `reset-password/${this.options.token}`;

    return url.toString();
  }
}
