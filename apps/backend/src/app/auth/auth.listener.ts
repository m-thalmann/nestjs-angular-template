import { MailService } from '@backend/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../user/events/user-created.event';
import { UserEmailUpdatedEvent } from '../user/events/user-email-updated.event';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { RequestPasswordResetEvent } from './events/request-password-reset.event';
import { PasswordResetMessage } from './messages/password-reset.message';

@Injectable()
export class AuthListener {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly mailService: MailService,
  ) {}

  @OnEvent(UserCreatedEvent.ID, { promisify: true })
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    await this.emailVerificationService.sendVerificationEmail(event.user, true);
  }

  @OnEvent(UserEmailUpdatedEvent.ID, { promisify: true })
  async handleUserEmailUpdatedEvent(event: UserEmailUpdatedEvent): Promise<void> {
    await this.emailVerificationService.sendVerificationEmail(event.user, false);
  }

  @OnEvent(RequestPasswordResetEvent.ID, { promisify: true })
  async handleRequestPasswordResetEvent(event: RequestPasswordResetEvent): Promise<void> {
    await this.mailService.build(PasswordResetMessage).context({ token: event.token }).to(event.email).send();
  }
}
