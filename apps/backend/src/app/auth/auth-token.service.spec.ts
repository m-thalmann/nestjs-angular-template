/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { authConfigDefinition } from '../common/config';
import { User } from '../users';
import { AuthToken } from './auth-token.entity';
import { AuthTokenService } from './auth-token.service';
import { AUTH_TOKEN_TYPES, AuthTokenType } from './dto/auth-token-type.dto';

class AuthTokenServiceTestClass extends AuthTokenService {
  override async getTokenFromPayload(
    ...params: Parameters<AuthTokenService['getTokenFromPayload']>
  ): Promise<AuthToken | null> {
    return await super.getTokenFromPayload(...params);
  }

  override async getRefreshTokenPairTokenFromPayload(
    ...params: Parameters<AuthTokenService['getRefreshTokenPairTokenFromPayload']>
  ): Promise<AuthToken | null> {
    return await super.getRefreshTokenPairTokenFromPayload(...params);
  }
}

describe('AuthTokenService', () => {
  let service: AuthTokenServiceTestClass;

  let mockAuthTokenRepository: Partial<Repository<AuthToken>>;
  let mockAuthConfig: ConfigType<typeof authConfigDefinition>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockAuthTokenRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    mockAuthConfig = {
      accessTokenExpirationMinutes: 5,
      refreshTokenExpirationMinutes: 42,
    };

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenServiceTestClass,
        {
          provide: getRepositoryToken(AuthToken),
          useValue: mockAuthTokenRepository,
        },
        {
          provide: authConfigDefinition.KEY,
          useValue: mockAuthConfig,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthTokenServiceTestClass>(AuthTokenServiceTestClass);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateToken', () => {
    beforeEach(() => {
      service.getTokenFromPayload = jest.fn();
      service.getRefreshTokenPairTokenFromPayload = jest.fn();
    });

    it('should validate an access token and return the user and token', async () => {
      const expectedTokenType = AUTH_TOKEN_TYPES.ACCESS;
      const expectedUser = new User();
      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);
      const expectedJwtToken = 'my-token';

      const expectedPayload = {
        sub: 'userUuid',
        type: expectedTokenType,
        tokenUuid: 'tokenUuid',
      };

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(expectedPayload);

      (service.getTokenFromPayload as jest.Mock).mockResolvedValue(expectedAuthToken);

      const { user, authToken } = await service.validateToken(expectedJwtToken, expectedTokenType);

      expect(user).toBe(expectedUser);
      expect(authToken).toBe(expectedAuthToken);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(expectedJwtToken);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getTokenFromPayload).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getTokenFromPayload).toHaveBeenCalledWith(expectedPayload, expectedTokenType);
    });

    it('should validate a refresh token pair and return the user', async () => {
      const expectedTokenType = AUTH_TOKEN_TYPES.REFRESH_PAIR;
      const expectedUser = new User();
      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);
      const expectedJwtToken = 'my-token';

      const expectedPayload = {
        sub: 'userUuid',
        type: expectedTokenType,
        tokenUuid: 'tokenUuid',
        tokenGroupUuid: 'groupUuid',
      };

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(expectedPayload);

      (service.getRefreshTokenPairTokenFromPayload as jest.Mock).mockResolvedValue(expectedAuthToken);

      const { user, authToken } = await service.validateToken(expectedJwtToken, expectedTokenType);

      expect(user).toBe(expectedUser);
      expect(authToken).toBe(expectedAuthToken);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(expectedJwtToken);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRefreshTokenPairTokenFromPayload).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getRefreshTokenPairTokenFromPayload).toHaveBeenCalledWith(expectedPayload);
    });

    it('should throw an UnauthorizedException if the token is invalid', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());

      await expect(service.validateToken('invalid-token', AUTH_TOKEN_TYPES.ACCESS)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it.each([
      [AUTH_TOKEN_TYPES.ACCESS, AUTH_TOKEN_TYPES.REFRESH_PAIR],
      [AUTH_TOKEN_TYPES.REFRESH_PAIR, AUTH_TOKEN_TYPES.ACCESS],
    ])(
      'should throw an UnauthorizedException if the token type is incorrect (should be %s but is %s)',
      async (expectedTokenType: AuthTokenType, actualTokenType: AuthTokenType) => {
        const expectedPayload = {
          sub: 'userUuid',
          type: actualTokenType,
          tokenUuid: 'tokenUuid',
        };

        (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(expectedPayload);

        await expect(service.validateToken('my-token', expectedTokenType)).rejects.toThrow(UnauthorizedException);
      },
    );

    it.each<['getRefreshTokenPairTokenFromPayload' | 'getTokenFromPayload']>([
      ['getTokenFromPayload'],
      ['getRefreshTokenPairTokenFromPayload'],
    ])(
      "should throw an UnauthorizedException if the token can't be retrieved (method: %s)",
      async (retrievalMethod) => {
        service[retrievalMethod] = jest.fn().mockResolvedValue(null);

        (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
          sub: 'userUuid',
          type: AUTH_TOKEN_TYPES.ACCESS,
          tokenUuid: 'tokenUuid',
          tokenGroupUuid: retrievalMethod === 'getRefreshTokenPairTokenFromPayload' ? 'groupUuid' : undefined,
        });

        await expect(service.validateToken('my-token', AUTH_TOKEN_TYPES.ACCESS)).rejects.toThrow(UnauthorizedException);
        expect(service[retrievalMethod]).toHaveBeenCalledTimes(1);
      },
    );

    it('should throw an UnauthorizedException if the token is expired', async () => {
      const expectedPayload = {
        sub: 'userUuid',
        type: AUTH_TOKEN_TYPES.ACCESS,
        tokenUuid: 'tokenUuid',
      };

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(expectedPayload);

      (service.getTokenFromPayload as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.validateToken('my-token', AUTH_TOKEN_TYPES.ACCESS)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getTokenFromPayload', () => {
    it.each([[AUTH_TOKEN_TYPES.ACCESS], [AUTH_TOKEN_TYPES.REFRESH_PAIR]])(
      'should get a token from the payload (type: %s)',
      async (authTokenType: AuthTokenType) => {
        const expectedPayload = {
          sub: 'userUuid',
          type: authTokenType,
          tokenUuid: 'token-uuid',
        };

        const expectedAuthToken = new AuthToken();

        (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

        const authToken = await service.getTokenFromPayload(expectedPayload, authTokenType);

        expect(authToken).toBe(expectedAuthToken);

        expect(mockAuthTokenRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockAuthTokenRepository.findOne).toHaveBeenCalledWith({
          where: {
            user: { uuid: expectedPayload.sub },
            uuid: expectedPayload.tokenUuid,
            type: authTokenType,
            groupUuid: IsNull(),
          },
          relations: {
            user: true,
          },
        });
      },
    );
  });

  describe('getRefreshTokenPairTokenFromPayload', () => {
    it.each([[AUTH_TOKEN_TYPES.ACCESS], [AUTH_TOKEN_TYPES.REFRESH_PAIR]])(
      'should get a refresh token pair token from the payload (type: %s)',
      async (authTokenType: AuthTokenType) => {
        const expectedAuthTokenUuid = 'tokenUuid';
        const expectedPayload = {
          sub: 'userUuid',
          type: authTokenType,
          tokenUuid: expectedAuthTokenUuid,
          tokenGroupUuid: 'groupUuid',
        };

        const expectedAuthToken = new AuthToken();
        expectedAuthToken.uuid = expectedAuthTokenUuid;

        (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

        const authToken = await service.getRefreshTokenPairTokenFromPayload(expectedPayload);

        expect(authToken).toBe(expectedAuthToken);

        expect(mockAuthTokenRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockAuthTokenRepository.findOne).toHaveBeenCalledWith({
          where: {
            user: { uuid: expectedPayload.sub },
            groupUuid: expectedPayload.tokenGroupUuid,
            type: AUTH_TOKEN_TYPES.REFRESH_PAIR,
          },
          relations: {
            user: true,
          },
        });
      },
    );

    it('should return null if the token is not found', async () => {
      const expectedPayload = {
        sub: 'userUuid',
        type: AUTH_TOKEN_TYPES.REFRESH_PAIR,
        tokenUuid: 'tokenUuid',
        tokenGroupUuid: 'groupUuid',
      };

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(null);

      const authToken = await service.getRefreshTokenPairTokenFromPayload(expectedPayload);

      expect(authToken).toBeNull();
    });

    it('should return null and delete tokens with the same group uuid if the token uuid and the payload tokenUuid dont match', async () => {
      const expectedPayload = {
        sub: 'userUuid',
        type: AUTH_TOKEN_TYPES.REFRESH_PAIR,
        tokenUuid: 'tokenUuid',
        tokenGroupUuid: 'groupUuid',
      };

      const expectedAuthToken = new AuthToken();
      expectedAuthToken.id = 42;
      expectedAuthToken.uuid = 'different tokenUuid';

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

      const authToken = await service.getRefreshTokenPairTokenFromPayload(expectedPayload);

      expect(authToken).toBeNull();
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith(expectedAuthToken.id);
    });

    it("should return null but not delete tokens with the same group uuid if the token uuid and the payload tokenUuid dont match and the payload type isn't REFRESH_PAIR", async () => {
      const expectedPayload = {
        sub: 'userUuid',
        type: AUTH_TOKEN_TYPES.ACCESS,
        tokenUuid: 'tokenUuid',
        tokenGroupUuid: 'groupUuid',
      };

      const expectedAuthToken = new AuthToken();
      expectedAuthToken.id = 42;
      expectedAuthToken.uuid = 'different tokenUuid';

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

      const authToken = await service.getRefreshTokenPairTokenFromPayload(expectedPayload);

      expect(authToken).toBeNull();
      expect(mockAuthTokenRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('buildTokenPair', () => {
    it('should build a token pair', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';
      user.updatedAt = new Date(Date.now() - 1000);

      const expectedTokenUuid = 'tokenUuid';
      const expectedRefreshToken = 'refreshToken';
      const expectedAccessToken = 'accessToken';

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.uuid = expectedTokenUuid;
        return authToken;
      });

      (mockJwtService.signAsync as jest.Mock).mockImplementation(async (payload: Record<string, string>) => {
        if (payload.type === AUTH_TOKEN_TYPES.REFRESH_PAIR) {
          return expectedRefreshToken;
        }
        return expectedAccessToken;
      });

      const tokenPair = await service.buildTokenPair(user);

      expect(tokenPair).toEqual({ refreshToken: expectedRefreshToken, accessToken: expectedAccessToken });

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(1, expect.any(Object), { expiresIn: '42m' });
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(2, expect.any(Object));

      expect(mockAuthTokenRepository.save).toHaveBeenCalledTimes(1);

      const [refreshToken] = (mockAuthTokenRepository.save as jest.Mock).mock.calls[0] as [AuthToken];

      await expect(refreshToken.user).resolves.toBe(user);
      expect(refreshToken.type).toBe(AUTH_TOKEN_TYPES.REFRESH_PAIR);
      expect(refreshToken.groupUuid).toEqual(expect.any(String));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(refreshToken.expiresAt!.getTime() / 1000).toBeCloseTo(
        Date.now() / 1000 + mockAuthConfig.refreshTokenExpirationMinutes * 60,
        1,
      );

      const [refreshTokenPayload, accessTokenPayload] = (mockJwtService.signAsync as jest.Mock).mock.calls.map(
        ([payload]) => payload as Record<string, string>,
      ) as [Record<string, string>, Record<string, string>];

      expect(refreshTokenPayload.sub).toBe(user.uuid);
      expect(refreshTokenPayload.tokenUuid).toBe(expectedTokenUuid);
      expect(refreshTokenPayload.tokenGroupUuid).toBe(refreshToken.groupUuid);
      expect(refreshTokenPayload.type).toBe(AUTH_TOKEN_TYPES.REFRESH_PAIR);

      expect(accessTokenPayload.sub).toBe(user.uuid);
      expect(accessTokenPayload.tokenUuid).toBe(expectedTokenUuid);
      expect(accessTokenPayload.tokenGroupUuid).toBe(refreshToken.groupUuid);
      expect(accessTokenPayload.type).toBe(AUTH_TOKEN_TYPES.ACCESS);
    });

    it('should build a token pair with a groupUuid', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';
      user.updatedAt = new Date(Date.now() - 1000);

      const groupUuid = 'groupUuid';

      (mockJwtService.signAsync as jest.Mock).mockResolvedValue('token');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const tokenPair = await service.buildTokenPair(user, groupUuid);

      const [refreshToken] = (mockAuthTokenRepository.save as jest.Mock).mock.calls[0] as [AuthToken];

      expect(refreshToken.groupUuid).toBe(groupUuid);

      const [refreshTokenPayload, accessTokenPayload] = (mockJwtService.signAsync as jest.Mock).mock.calls.map(
        ([payload]) => payload as Record<string, string>,
      ) as [Record<string, string>, Record<string, string>];

      expect(refreshTokenPayload.tokenGroupUuid).toBe(groupUuid);
      expect(accessTokenPayload.tokenGroupUuid).toBe(groupUuid);
    });
  });

  describe('refreshTokenPair', () => {
    it('should refresh a token pair', async () => {
      const expectedUser = new User();

      const authToken = new AuthToken();
      authToken.id = 42;
      authToken.groupUuid = 'groupUuid';
      authToken.user = Promise.resolve(expectedUser);

      const expectedRefreshToken = 'refreshToken';
      const expectedAccessToken = 'accessToken';

      service.buildTokenPair = jest
        .fn()
        .mockResolvedValue({ refreshToken: expectedRefreshToken, accessToken: expectedAccessToken });

      const tokenPair = await service.refreshTokenPair(authToken);

      expect(tokenPair).toEqual({ refreshToken: expectedRefreshToken, accessToken: expectedAccessToken });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildTokenPair).toHaveBeenCalledWith(expectedUser, authToken.groupUuid);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith(authToken.id);
    });

    it('should throw a BadRequestException if the token has no group uuid', async () => {
      const authToken = new AuthToken();
      authToken.groupUuid = null;

      await expect(service.refreshTokenPair(authToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logoutToken', () => {
    it('should delete the token', async () => {
      const authToken = new AuthToken();
      authToken.id = 42;

      await service.logoutToken(authToken);

      expect(mockAuthTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith(authToken.id);
    });
  });
});
