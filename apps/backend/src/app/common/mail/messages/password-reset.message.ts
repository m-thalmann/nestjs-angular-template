import { ConfigType } from '@nestjs/config';
import { ResetPasswordService } from '../../../auth/reset-password/reset-password.service';
import { appConfigDefinition } from '../../config/app.config';
import { BaseMessage } from '../base.message';

export interface PasswordResetMessageContext {
  token: string;
}

export class PasswordResetMessage extends BaseMessage<PasswordResetMessageContext> {
  private _context: PasswordResetMessageContext | undefined;

  context(context: PasswordResetMessageContext): this {
    this._context = context;
    return this;
  }

  override getSubject(): string {
    return 'Reset Password Notification';
  }

  override getTemplate(): string {
    return 'password-reset';
  }

  override async getContext(): Promise<Record<string, unknown>> {
    if (this._context === undefined) {
      throw new Error('Context is not set');
    }

    const resetUrl = await this.buildResetUrl(this._context.token);

    return {
      resetUrl,
      expirationMinutes: ResetPasswordService.TOKEN_EXPIRATION_MINUTES,
    };
  }

  protected async buildResetUrl(token: string): Promise<string> {
    const appConfig = this.moduleRef.get<ConfigType<typeof appConfigDefinition>>(appConfigDefinition.KEY, {
      strict: false,
    });

    const url = new URL(appConfig.frontendUrl);
    url.pathname += `password-reset/${token}`;

    return url.toString();
  }
}
