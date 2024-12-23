import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../common/mail/mail.service';
import { EmailVerificationMessage } from '../common/mail/messages/email-verification.message';
import { UserCreatedEvent } from './events/user-created.event';
import { UserEmailUpdatedEvent } from './events/user-email-updated.event';
import { User } from './user.entity';

// TODO: maybe only one listener for emails? And create custom email event where the others extend from? Then error handling could be done there

@Injectable()
export class UsersListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent(UserCreatedEvent.ID, { promisify: true })
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    await this.sendEmailVerificationMessage(event.user, true);
  }

  @OnEvent(UserEmailUpdatedEvent.ID, { promisify: true })
  async handleUserEmailUpdatedEvent(event: UserEmailUpdatedEvent): Promise<void> {
    await this.sendEmailVerificationMessage(event.user, false);
  }

  protected async sendEmailVerificationMessage(user: User, isNewUser: boolean): Promise<void> {
    await this.mailService.build(EmailVerificationMessage).context({ user, isNewUser }).to(user.email).send();
  }
}
