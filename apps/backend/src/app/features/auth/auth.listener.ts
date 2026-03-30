import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../user/events/user-created.event';
import { UserEmailUpdatedEvent } from '../user/events/user-email-updated.event';
import { EmailVerificationService } from './email-verification/email-verification.service';

@Injectable()
export class AuthListener {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @OnEvent(UserCreatedEvent.ID, { promisify: true })
  async handleUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    await this.emailVerificationService.sendVerificationEmail(event.user, true);
  }

  @OnEvent(UserEmailUpdatedEvent.ID, { promisify: true })
  async handleUserEmailUpdatedEvent(event: UserEmailUpdatedEvent): Promise<void> {
    await this.emailVerificationService.sendVerificationEmail(event.user, false);
  }
}
