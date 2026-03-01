import { MailService } from '@backend/mail';
import { User } from '@backend/user';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { EmailVerificationMessage } from '../messages/email-verification.message';

@Injectable()
export class EmailVerificationService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async verifyEmail(user: User, token: string): Promise<void> {
    if (user.isEmailVerified) {
      return;
    }

    const isValidToken = await this.validateVerificationToken(user, token);

    if (!isValidToken) {
      throw new ForbiddenException('Invalid token');
    }

    await this.userService.markEmailAsVerified(user);
  }

  async sendVerificationEmail(user: User, isNewUser: boolean): Promise<void> {
    await this.mailService.build(EmailVerificationMessage).context({ user, isNewUser }).to(user.email).send();
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
