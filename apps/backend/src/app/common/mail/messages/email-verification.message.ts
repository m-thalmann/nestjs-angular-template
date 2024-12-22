import { ConfigType } from '@nestjs/config';
import { EmailVerificationService } from '../../../auth/email-verification/email-verification.service';
import { User } from '../../../users/user.entity';
import { appConfigDefinition } from '../../config/app.config';
import { BaseMessage } from '../base.message';

interface EmailVerificationMessageContext {
  user: User;
  isNewUser: boolean;
}

export class EmailVerificationMessage extends BaseMessage<EmailVerificationMessageContext> {
  private _context: EmailVerificationMessageContext | undefined;

  context(context: EmailVerificationMessageContext): this {
    this._context = context;
    return this;
  }

  override getSubject(): string {
    return 'Verify Email Address';
  }

  override getTemplate(): string {
    return 'email-verification';
  }

  override async getContext(): Promise<Record<string, unknown>> {
    if (this._context === undefined) {
      throw new Error('Context is not set');
    }

    const verificationUrl = await this.buildVerificationUrl(this._context.user);

    return {
      verificationUrl,
      isNewUser: this._context.isNewUser,
    };
  }

  protected async buildVerificationUrl(user: User): Promise<string> {
    const appConfig = this.moduleRef.get<ConfigType<typeof appConfigDefinition>>(appConfigDefinition.KEY, {
      strict: false,
    });
    const emailVerificationService = this.moduleRef.get(EmailVerificationService, { strict: false });

    const verifyToken = await emailVerificationService.generateVerificationToken(user);

    const url = new URL(appConfig.frontendUrl);
    url.pathname += `verify-email/${verifyToken}`;

    return url.toString();
  }
}
