import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../common/mail/mail.service';
import { PasswordResetMessage } from '../common/mail/messages/password-reset.message';
import { RequestPasswordResetEvent } from './events/request-password-reset.event';

@Injectable()
export class AuthListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent(RequestPasswordResetEvent.ID, { promisify: true })
  async handleRequestPasswordResetEvent(event: RequestPasswordResetEvent): Promise<void> {
    await this.mailService.build(PasswordResetMessage).context({ token: event.token }).to(event.email).send();
  }
}
