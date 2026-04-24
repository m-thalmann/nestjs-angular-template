import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { UserActionTokenService, UserActionTokenType } from '@backend/user';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { isNull } from '@shared/common';
import { UserService } from '../../user/user.service';
import { PasswordResetNotification } from '../notifications/password-reset.notification';

@Injectable()
export class ResetPasswordService {
  static readonly TOKEN_EXPIRATION_MINUTES = 10;

  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
    private readonly userActionTokenService: UserActionTokenService,
  ) {}

  async validateToken(token: string): Promise<void> {
    const actionToken = await this.userActionTokenService.findToken({
      type: UserActionTokenType.PasswordReset,
      token,
    });

    if (isNull(actionToken)) {
      throw new ForbiddenException('Invalid token');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.userActionTokenService.useToken(
      async (actionToken) => {
        if (actionToken.user.updatedAt.getTime() !== actionToken.data?.userUpdatedAt) {
          throw new ForbiddenException('User was updated since token was issued');
        }

        await this.userService.patch(actionToken.user, { password: newPassword });
      },
      { type: UserActionTokenType.PasswordReset, token },
    );
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);

    if (isNull(user)) {
      return;
    }

    const token = await this.userActionTokenService.createToken({
      type: UserActionTokenType.PasswordReset,
      user,
      expirationMinutes: ResetPasswordService.TOKEN_EXPIRATION_MINUTES,
      data: { userUpdatedAt: user.updatedAt.getTime() },
      deleteExistingTokensWithSameTypeForUser: false,
    });

    await this.notificationService.send(
      user,
      new PasswordResetNotification({ frontendUrl: this.appConfig.frontendUrl, token }),
    );
  }
}
