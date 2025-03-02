import { ForbiddenException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { RequestPasswordResetEvent } from '../events/request-password-reset.event';

@Injectable()
export class ResetPasswordService {
  static readonly TOKEN_EXPIRATION_MINUTES = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
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

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (user === null) {
      return;
    }

    const token = await this.generateResetToken(user.email, user.updatedAt);

    this.eventEmitter.emit(RequestPasswordResetEvent.ID, new RequestPasswordResetEvent(user.email, token));
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
