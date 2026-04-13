import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { User } from '@backend/user';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { EmailVerificationNotification } from '../notifications/email-verification.notification';

@Injectable()
export class EmailVerificationService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
  ) {}

  async verifyEmail(user: User, token: string): Promise<User> {
    if (user.isEmailVerified) {
      return user;
    }

    const isValidToken = await this.validateVerificationToken(user, token);

    if (!isValidToken) {
      throw new ForbiddenException('Invalid token');
    }

    return await this.userService.markEmailAsVerified(user);
  }

  async sendVerificationEmail(user: User, isNewUser: boolean): Promise<void> {
    const token = await this.generateVerificationToken(user);

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

  async generateVerificationToken(user: User): Promise<string> {
    return await this.jwtService.signAsync(
      { sub: user.uuid, email: user.email },
      { expiresIn: `${EmailVerificationService.TOKEN_EXPIRATION_MINUTES}m` },
    );
  }

  async validateVerificationToken(user: User, token: string): Promise<boolean> {
    let payload: { sub: string; email: string } | null = null;

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
    } catch {
      return false;
    }

    if (user.uuid !== payload.sub || user.email !== payload.email) {
      return false;
    }

    return true;
  }
}
