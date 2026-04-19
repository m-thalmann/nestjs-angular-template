import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { User, UserActionTokenService, UserActionTokenType } from '@backend/user';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { EmailVerificationNotification } from '../notifications/email-verification.notification';

@Injectable()
export class EmailVerificationService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
    private readonly userActionTokenService: UserActionTokenService,
  ) {}

  async verifyEmail(user: User, token: string): Promise<User> {
    if (user.isEmailVerified) {
      return user;
    }

    return await this.userActionTokenService.useToken(
      async (actionToken) => {
        if (user.email !== actionToken.data?.email) {
          throw new ForbiddenException('Invalid token');
        }

        return await this.userService.markEmailAsVerified(user);
      },
      { type: UserActionTokenType.EmailVerification, token },
    );
  }

  async sendVerificationEmail(user: User, isNewUser: boolean): Promise<void> {
    const token = await this.userActionTokenService.createToken({
      type: UserActionTokenType.EmailVerification,
      user,
      expirationMinutes: EmailVerificationService.TOKEN_EXPIRATION_MINUTES,
      data: { email: user.email },
      deleteExistingTokensWithSameTypeForUser: true,
    });

    await this.notificationService.send(
      user,
      new EmailVerificationNotification({ isNewUser, token, frontendUrl: this.appConfig.frontendUrl }),
    );
  }

  async resendVerificationEmail(user: User): Promise<void> {
    if (user.emailVerifiedAt) {
      throw new ForbiddenException('Email already verified');
    }

    const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

    await this.sendVerificationEmail(user, isNewUser);
  }
}
