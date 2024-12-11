import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { authConfigDefinition } from '../../common/config';
import { getDateAfterMinutes } from '../../common/util';
import { User } from '../../users';
import { AuthToken } from './auth-token.entity';

interface TokenPayload {
  sub: string;
  token: string;
  version: number;
  isRefreshToken?: true;
}

@Injectable()
export class AuthTokenService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    @Inject(authConfigDefinition.KEY)
    private readonly authConfig: ConfigType<typeof authConfigDefinition>,
    private readonly jwtService: JwtService,
  ) {}

  async validateToken(
    token: string,
    options?: { expectRefreshToken?: boolean },
  ): Promise<{ user: User; authToken: AuthToken }> {
    let payload: TokenPayload | null = null;

    const expectRefreshToken = options?.expectRefreshToken ?? false;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (expectRefreshToken !== (payload.isRefreshToken ?? false)) {
      throw new UnauthorizedException();
    }

    const authToken: AuthToken | null = await this.authTokenRepository.findOne({
      where: {
        user: { uuid: payload.sub },
        uuid: payload.token,
      },
      relations: {
        user: true,
      },
    });

    if (authToken === null) {
      throw new UnauthorizedException();
    }

    if (authToken.version !== payload.version) {
      if (expectRefreshToken) {
        // TODO: handle detected reuse

        await this.authTokenRepository.delete(authToken.id);
      }

      throw new UnauthorizedException();
    }

    if (authToken.expiresAt !== null && authToken.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    const user = await authToken.user;

    return { user, authToken };
  }

  async createAuthToken(
    user: User,
    options?: { version?: number; expirationMinutes?: number; name?: string },
  ): Promise<AuthToken> {
    const version = options?.version ?? 1;
    const expirationMinutes = options?.expirationMinutes;
    const name = options?.name ?? null;

    let expirationDate: Date | null = null;

    if (expirationMinutes !== undefined) {
      expirationDate = getDateAfterMinutes(expirationMinutes);
    }

    const authToken = new AuthToken();

    authToken.user = Promise.resolve(user);
    authToken.version = version;
    authToken.name = name;
    authToken.expiresAt = expirationDate;

    return await this.authTokenRepository.save(authToken);
  }

  async buildJwtToken(
    authToken: AuthToken,
    options?: { isRefreshToken?: boolean; expirationMinutes?: number },
  ): Promise<string> {
    const user = await authToken.user;

    const payload: TokenPayload = {
      sub: user.uuid,
      token: authToken.uuid,
      version: authToken.version,
    };

    if (options?.isRefreshToken) {
      payload.isRefreshToken = true;
    }

    const jwtOptions: JwtSignOptions = {};

    if (options?.expirationMinutes !== undefined) {
      jwtOptions.expiresIn = `${options.expirationMinutes}m`;
    }

    return await this.jwtService.signAsync(payload, jwtOptions);
  }

  protected async buildJwtTokenPair(authToken: AuthToken): Promise<{ refreshToken: string; accessToken: string }> {
    const expirationMinutes = this.authConfig.refreshTokenExpirationMinutes;

    const refreshToken = await this.buildJwtToken(authToken, {
      isRefreshToken: true,
      expirationMinutes,
    });

    const accessToken = await this.buildJwtToken(authToken);

    return { refreshToken, accessToken };
  }

  async createAndBuildTokenPair(
    user: User,
  ): Promise<{ refreshToken: string; accessToken: string; authToken: AuthToken }> {
    const expirationMinutes = this.authConfig.refreshTokenExpirationMinutes;

    const authToken = await this.createAuthToken(user, { expirationMinutes });

    const tokenPair = await this.buildJwtTokenPair(authToken);

    return { ...tokenPair, authToken };
  }

  async refreshTokenPair(
    authToken: AuthToken,
  ): Promise<{ refreshToken: string; accessToken: string; authToken: AuthToken }> {
    const expirationMinutes = this.authConfig.refreshTokenExpirationMinutes;

    const updatedToken = this.authTokenRepository.merge(authToken, {
      version: authToken.version + 1,
      expiresAt: getDateAfterMinutes(expirationMinutes),
    });

    await this.authTokenRepository.save(updatedToken);

    const tokenPair = await this.buildJwtTokenPair(updatedToken);

    return { ...tokenPair, authToken: updatedToken };
  }

  async logoutToken(authToken: AuthToken): Promise<void> {
    await this.authTokenRepository.delete(authToken.id);
  }
}
