import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { authConfigDefinition } from '../common/config';
import { User } from '../users';
import { AuthToken } from './auth-token.entity';
import { AUTH_TOKEN_TYPES, AuthTokenType } from './dto/auth-token-type.dto';

interface JwtTokenPayload<T extends AuthTokenType> {
  sub: string;
  tokenUuid: string;
  type: T;
}

interface JwtRefreshTokenPairTokenPayload<T extends AuthTokenType> extends JwtTokenPayload<T> {
  tokenGroupUuid: string;
}

function isRefreshTokenPairTokenPayload<T extends AuthTokenType>(
  payload: JwtTokenPayload<AuthTokenType>,
): payload is JwtRefreshTokenPairTokenPayload<T> {
  return 'tokenGroupUuid' in payload && payload.tokenGroupUuid !== undefined;
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

  async validateToken(token: string, expectedTokenType: AuthTokenType): Promise<{ user: User; authToken: AuthToken }> {
    let payload: JwtTokenPayload<AuthTokenType> | null = null;

    try {
      payload = await this.jwtService.verifyAsync<JwtTokenPayload<AuthTokenType>>(token);
    } catch {
      payload = null;
    }

    if (payload === null || payload.type !== expectedTokenType) {
      throw new UnauthorizedException();
    }

    let authToken: AuthToken | null = null;

    if (isRefreshTokenPairTokenPayload(payload)) {
      authToken = await this.getRefreshTokenPairTokenFromPayload(payload);
    } else {
      authToken = await this.getTokenFromPayload(payload, expectedTokenType);
    }

    if (authToken === null) {
      throw new UnauthorizedException();
    }

    if (authToken.expiresAt !== null && authToken.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    const user = await authToken.user;

    return { user, authToken };
  }

  protected async getTokenFromPayload(
    payload: JwtTokenPayload<AuthTokenType>,
    expectedTokenType: AuthTokenType,
  ): Promise<AuthToken | null> {
    return await this.authTokenRepository.findOne({
      where: {
        user: { uuid: payload.sub },
        uuid: payload.tokenUuid,
        type: expectedTokenType,
        groupUuid: IsNull(),
      },
      relations: {
        user: true,
      },
    });
  }

  protected async getRefreshTokenPairTokenFromPayload(
    payload: JwtRefreshTokenPairTokenPayload<AuthTokenType>,
  ): Promise<AuthToken | null> {
    const authToken = await this.authTokenRepository.findOne({
      where: {
        user: { uuid: payload.sub },
        groupUuid: payload.tokenGroupUuid,
        type: AUTH_TOKEN_TYPES.REFRESH_PAIR,
      },
      relations: {
        user: true,
      },
    });

    if (authToken === null) {
      return null;
    }

    if (authToken.uuid !== payload.tokenUuid) {
      await this.authTokenRepository.delete(authToken.id);

      // TODO: handle detected reuse

      return null;
    }

    return authToken;
  }

  async buildTokenPair(user: User, groupUuid?: string): Promise<{ refreshToken: string; accessToken: string }> {
    const refreshTokenExpiration = new Date();
    refreshTokenExpiration.setMinutes(
      refreshTokenExpiration.getMinutes() + this.authConfig.refreshTokenExpirationMinutes,
    );

    const refreshAuthToken = new AuthToken();

    refreshAuthToken.user = Promise.resolve(user);
    refreshAuthToken.type = AUTH_TOKEN_TYPES.REFRESH_PAIR;
    refreshAuthToken.groupUuid = groupUuid ?? crypto.randomUUID();
    refreshAuthToken.expiresAt = refreshTokenExpiration;

    await this.authTokenRepository.save(refreshAuthToken);

    const refreshTokenPayLoad: JwtRefreshTokenPairTokenPayload<'REFRESH_PAIR'> = {
      sub: user.uuid,
      tokenUuid: refreshAuthToken.uuid,
      tokenGroupUuid: refreshAuthToken.groupUuid,
      type: AUTH_TOKEN_TYPES.REFRESH_PAIR,
    };

    const accessTokenPayload: JwtRefreshTokenPairTokenPayload<'ACCESS'> = {
      sub: user.uuid,
      tokenUuid: refreshAuthToken.uuid,
      tokenGroupUuid: refreshAuthToken.groupUuid,
      type: AUTH_TOKEN_TYPES.ACCESS,
    };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayLoad, {
      expiresIn: `${this.authConfig.refreshTokenExpirationMinutes}m`,
    });
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);

    return { refreshToken, accessToken };
  }

  async logoutToken(authToken: AuthToken): Promise<void> {
    await this.authTokenRepository.delete(authToken.id);
  }
}
