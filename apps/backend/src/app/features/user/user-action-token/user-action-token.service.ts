import { appConfigDefinition } from '@backend/config';
import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { isNull } from '@shared/common';
import { createHmac, randomBytes } from 'node:crypto';
import { LessThanOrEqual, Repository } from 'typeorm';
import { User } from '../user.entity';
import { UserActionToken, UserActionTokenType } from './user-action-token.entity';

const SECONDS_IN_MINUTE = 60;

interface CreateTokenOptions {
  type: UserActionTokenType;
  user: User;
  expirationMinutes: number;
  data?: Record<string, unknown> | null;
  deleteExistingTokensWithSameTypeForUser?: boolean;
}

interface TokenFindOptions {
  type: UserActionTokenType;
  token: string;
}

@Injectable()
export class UserActionTokenService {
  protected static readonly TOKEN_LENGTH_BYTES = 32;

  private readonly logger = new Logger(UserActionTokenService.name);

  constructor(
    @InjectRepository(UserActionToken)
    private readonly userActionTokenRepository: Repository<UserActionToken>,
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
  ) {}

  async createToken(options: CreateTokenOptions): Promise<string> {
    const { type, user, expirationMinutes, data, deleteExistingTokensWithSameTypeForUser = false } = options;

    if (deleteExistingTokensWithSameTypeForUser) {
      await this.userActionTokenRepository.delete({
        userId: user.id,
        type,
      });
    }

    const plainTextToken = this.generateToken();

    const expiresAt = new Date(Date.now() + expirationMinutes * SECONDS_IN_MINUTE * 1000);

    const token = new UserActionToken();
    token.token = this.hashToken(plainTextToken);
    token.type = type;
    token.userId = user.id;
    token.data = data ?? null;
    token.expiresAt = expiresAt;

    await this.userActionTokenRepository.save(token);

    return plainTextToken;
  }

  async findToken(options: TokenFindOptions): Promise<UserActionToken | null> {
    const { type, token } = options;

    const hashedToken = this.hashToken(token);

    const tokenEntity = await this.userActionTokenRepository.findOne({
      where: {
        token: hashedToken,
        type,
      },
    });

    if (isNull(tokenEntity) || tokenEntity.expiresAt < new Date()) {
      return null;
    }

    return tokenEntity;
  }

  async useToken<TResult>(
    callback: (actionToken: UserActionToken) => Promise<TResult>,
    options: TokenFindOptions,
  ): Promise<TResult> {
    const { type, token } = options;

    const tokenEntity = await this.findToken({ type, token });

    if (isNull(tokenEntity)) {
      throw new ForbiddenException('Invalid token');
    }

    const result = await callback(tokenEntity);

    await this.deleteToken(token);

    return result;
  }

  async deleteToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    await this.userActionTokenRepository.delete({ token: hashedToken });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredTokens(): Promise<void> {
    const deleteResult = await this.userActionTokenRepository.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });

    this.logger.log(`Purged expired tokens: ${deleteResult.affected ?? 0}`);
  }

  protected hashToken(token: string): string {
    return createHmac('sha256', this.appConfig.secret).update(token).digest('hex');
  }

  protected generateToken(): string {
    return randomBytes(UserActionTokenService.TOKEN_LENGTH_BYTES).toString('hex');
  }
}
