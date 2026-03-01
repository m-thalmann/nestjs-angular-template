import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';

@Injectable()
export class ResetPasswordService {
  static readonly TOKEN_EXPIRATION_MINUTES: number = 10;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
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

    await this.usersService.patch(user, { password: newPassword });
  }

  async sendResetPasswordEmail(_email: string): Promise<void> {
    // TODO: implement
  }

  async generateResetToken(email: string, updatedAt: Date): Promise<string> {
    return await this.jwtService.signAsync(
      { email, userUpdatedAt: updatedAt.getTime() },
      { expiresIn: `${ResetPasswordService.TOKEN_EXPIRATION_MINUTES}m` },
    );
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const payload = await this.jwtService.verifyAsync<{ email: string; userUpdatedAt: number }>(token);

    const user = await this.usersService.findOneByEmail(payload.email);

    if (user !== null && user.updatedAt.getTime() !== payload.userUpdatedAt) {
      throw new Error('User was updated since token was issued');
    }

    return user;
  }
}
