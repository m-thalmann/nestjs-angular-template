import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { User } from '@backend/user';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { PasswordResetNotification } from '../notifications/password-reset.notification';

@Injectable()
export class ResetPasswordService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
  ) {}

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let user: User | null = null;

    try {
      user = await this.getUserFromToken(token);
    } catch {
      throw new ForbiddenException('Invalid token');
    }

    if (user === null) {
      return;
    }

    await this.userService.patch(user, { password: newPassword });
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);

    if (user === null) {
      return;
    }

    const token = await this.generateResetToken(user.email, user.updatedAt);

    await this.notificationService.send(
      user,
      new PasswordResetNotification({ frontendUrl: this.appConfig.frontendUrl, token }),
    );
  }

  async generateResetToken(email: string, updatedAt: Date): Promise<string> {
    return await this.jwtService.signAsync(
      { email, userUpdatedAt: updatedAt.getTime() },
      { expiresIn: `${ResetPasswordService.TOKEN_EXPIRATION_MINUTES}m` },
    );
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const payload = await this.jwtService.verifyAsync<{ email: string; userUpdatedAt: number }>(token);

    const user = await this.userService.findOneByEmail(payload.email);

    if (user !== null && user.updatedAt.getTime() !== payload.userUpdatedAt) {
      throw new Error('User was updated since token was issued');
    }

    return user;
  }
}
