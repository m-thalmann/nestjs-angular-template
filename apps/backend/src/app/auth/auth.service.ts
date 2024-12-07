import { ObjectValue } from '@app/shared-types';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { authConfigDefinition } from '../common/config';
import { generateRandomString } from '../common/util';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthToken } from './auth-token.entity';
import { AUTH_TOKEN_TYPES } from './dto/auth-token-type.dto';

const JWT_TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

type JwtTokenType = ObjectValue<typeof JWT_TOKEN_TYPES>;

interface JwtTokenPayload<T extends JwtTokenType> {
  sub: string;
  tokenGroupUuid: string;
  updatedAt: Date;
  type: T;
}

const TOKEN_LENGTH = 64;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    @Inject(authConfigDefinition.KEY)
    private readonly authConfig: ConfigType<typeof authConfigDefinition>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async loginUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findOneByEmail(email);

    if (user === null) {
      throw new UnauthorizedException();
    }

    const isCorrectPassword = await argon2.verify(user.password, password);

    if (!isCorrectPassword) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async buildTokenPair(user: User, groupUuid?: string): Promise<{ refreshToken: string; accessToken: string }> {
    const refreshTokenExpiration = new Date();
    refreshTokenExpiration.setMinutes(
      refreshTokenExpiration.getMinutes() + this.authConfig.refreshTokenExpirationMinutes,
    );

    const refreshAuthToken = new AuthToken();

    refreshAuthToken.user = user;
    refreshAuthToken.type = AUTH_TOKEN_TYPES.REFRESH;
    refreshAuthToken.token = generateRandomString(TOKEN_LENGTH);
    refreshAuthToken.groupUuid = groupUuid ?? crypto.randomUUID();
    refreshAuthToken.expiresAt = refreshTokenExpiration;

    await this.authTokenRepository.save(refreshAuthToken);

    const refreshTokenPayLoad: JwtTokenPayload<'refresh'> = {
      sub: user.uuid,
      tokenGroupUuid: refreshAuthToken.groupUuid,
      updatedAt: user.updatedAt,
      type: JWT_TOKEN_TYPES.REFRESH,
    };

    const accessTokenPayload: JwtTokenPayload<'access'> = {
      sub: user.uuid,
      tokenGroupUuid: refreshAuthToken.groupUuid,
      updatedAt: user.updatedAt,
      type: JWT_TOKEN_TYPES.ACCESS,
    };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayLoad, {
      expiresIn: `${this.authConfig.refreshTokenExpirationMinutes}m`,
    });
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);

    return { refreshToken, accessToken };
  }
}
