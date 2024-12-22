import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../common/mail/mail.service';
import { EmailVerificationMessage } from '../../common/mail/messages/email-verification.message';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerificationService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async verifyEmail(user: User, token: string): Promise<void> {
    if (user.isEmailVerified()) {
      return;
    }

    const isValidToken = await this.validateVerificationToken(user, token);

    if (!isValidToken) {
      throw new ForbiddenException('Invalid token');
    }

    await this.usersService.markEmailAsVerified(user);
  }

  async resendVerificationEmail(user: User): Promise<void> {
    if (user.isEmailVerified()) {
      throw new ForbiddenException('Email already verified');
    }

    const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

    await this.mailService.build(EmailVerificationMessage).context({ user, isNewUser }).to(user.email).send();
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
