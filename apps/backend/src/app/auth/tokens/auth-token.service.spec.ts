/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator, FindOptionsWhere, Repository } from 'typeorm';
import { authConfigDefinition } from '../../common/config/auth.config';
import { User } from '../../users/user.entity';
import { AuthToken } from './auth-token.entity';
import { AuthTokenService } from './auth-token.service';
class AuthTokenServiceTestClass extends AuthTokenService {
  override async buildJwtTokenPair(
    ...params: Parameters<AuthTokenService['buildJwtTokenPair']>
  ): ReturnType<AuthTokenService['buildJwtTokenPair']> {
    return await super.buildJwtTokenPair(...params);
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
      merge: jest.fn(),
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
    it('should throw an UnauthorizedException if the token is invalid', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());

      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the token is not a refresh token but a refresh token is expected', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'userUuid',
        token: 'tokenUuid',
      });

      await expect(service.validateToken('my-token', { expectRefreshToken: true })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if the token is a refresh token but a refresh token is not expected', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'userUuid',
        token: 'tokenUuid',
        isRefreshToken: true,
      });

      await expect(service.validateToken('my-token', { expectRefreshToken: false })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if the token does not exist', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
      });

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.validateToken('my-token')).rejects.toThrow(UnauthorizedException);

      expect(mockAuthTokenRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { uuid: userUuid },
          uuid: tokenUuid,
        },
        relations: {
          user: true,
        },
      });
    });

    it('should throw an UnauthorizedException if the token version does not match', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        version: 2,
      });

      const authToken = new AuthToken();
      authToken.version = 1;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(authToken);

      await expect(service.validateToken('my-token')).rejects.toThrow(UnauthorizedException);

      expect(mockAuthTokenRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { uuid: userUuid },
          uuid: tokenUuid,
        },
        relations: {
          user: true,
        },
      });
    });

    it('should throw an UnauthorizedException and delete the token if the version does not match and the token is a refresh token', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        version: 2,
        isRefreshToken: true,
      });

      const authToken = new AuthToken();
      authToken.id = 42;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(authToken);

      await expect(service.validateToken('my-token', { expectRefreshToken: true })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockAuthTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith(authToken.id);
    });

    it('should throw an UnauthorizedException if the token is expired', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        version: 1,
      });

      const authToken = new AuthToken();
      authToken.expiresAt = new Date(Date.now() - 1000);
      authToken.version = 1;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(authToken);

      await expect(service.validateToken('my-token')).rejects.toThrow(UnauthorizedException);

      expect(mockAuthTokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should validate a token and return the user and token', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        version: 1,
      });

      const expectedUser = new User();
      expectedUser.uuid = userUuid;

      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);
      expectedAuthToken.uuid = tokenUuid;
      expectedAuthToken.version = 1;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

      const { user, authToken } = await service.validateToken('my-token');

      expect(user).toBe(expectedUser);
      expect(authToken).toBe(expectedAuthToken);
    });

    it('should validate a refresh token and return the user and token', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        isRefreshToken: true,
        version: 1,
      });

      const expectedUser = new User();
      expectedUser.uuid = userUuid;

      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);
      expectedAuthToken.uuid = tokenUuid;
      expectedAuthToken.version = 1;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

      const { user, authToken } = await service.validateToken('my-token', { expectRefreshToken: true });

      expect(user).toBe(expectedUser);
      expect(authToken).toBe(expectedAuthToken);
    });

    it('should validate a token with a expiresAt and return the user and token', async () => {
      const userUuid = 'userUuid';
      const tokenUuid = 'tokenUuid';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: userUuid,
        token: tokenUuid,
        version: 1,
      });

      const expectedUser = new User();
      expectedUser.uuid = userUuid;

      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);
      expectedAuthToken.uuid = tokenUuid;
      expectedAuthToken.version = 1;
      expectedAuthToken.expiresAt = new Date(Date.now() + 1000);
      expectedAuthToken.uuid = tokenUuid;

      (mockAuthTokenRepository.findOne as jest.Mock).mockResolvedValue(expectedAuthToken);

      const { user, authToken } = await service.validateToken('my-token');

      expect(user).toBe(expectedUser);
      expect(authToken).toBe(expectedAuthToken);
    });
  });

  describe('createAuthToken', () => {
    it('should create an auth token', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const expectedTokenUuid = 'tokenUuid';

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.uuid = expectedTokenUuid;
        return authToken;
      });

      const authToken = await service.createAuthToken(user);

      expect(authToken.uuid).toBe(expectedTokenUuid);
      expect(authToken.user).resolves.toBe(user);
      expect(authToken.version).toBe(1);
      expect(authToken.expiresAt).toBeNull();
    });

    it('should create an auth token with a version', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const expectedTokenUuid = 'tokenUuid';
      const expectedVersion = 2;

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.uuid = expectedTokenUuid;
        return authToken;
      });

      const authToken = await service.createAuthToken(user, { version: expectedVersion });

      expect(authToken.uuid).toBe(expectedTokenUuid);
      expect(authToken.user).resolves.toBe(user);
      expect(authToken.version).toBe(expectedVersion);
      expect(authToken.name).toBeNull();
      expect(authToken.expiresAt).toBeNull();
    });

    it('should create an auth token with an expiration date', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const expectedTokenUuid = 'tokenUuid';
      const expectedExpirationMinutes = 42;

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.uuid = expectedTokenUuid;
        return authToken;
      });

      const authToken = await service.createAuthToken(user, { expirationMinutes: expectedExpirationMinutes });

      expect(authToken.uuid).toBe(expectedTokenUuid);
      expect(authToken.expiresAt).toEqual(expect.any(Date));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(authToken.expiresAt!.getTime() / 1000).toBeCloseTo(Date.now() / 1000 + expectedExpirationMinutes * 60, 1);
    });

    it('should create an auth token with a name', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const expectedTokenUuid = 'tokenUuid';
      const expectedName = 'tokenName';

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.uuid = expectedTokenUuid;
        return authToken;
      });

      const authToken = await service.createAuthToken(user, { name: expectedName });

      expect(authToken.uuid).toBe(expectedTokenUuid);
      expect(authToken.name).toBe(expectedName);
    });
  });

  describe('buildJwtToken', () => {
    it('should build a JWT token', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const authToken = new AuthToken();
      authToken.user = Promise.resolve(user);
      authToken.uuid = 'tokenUuid';
      authToken.version = 1;

      const expectedToken = 'token';

      (mockJwtService.signAsync as jest.Mock).mockResolvedValue(expectedToken);

      const token = await service.buildJwtToken(authToken);

      expect(token).toBe(expectedToken);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.uuid,
          token: authToken.uuid,
          version: authToken.version,
        },
        {},
      );
    });

    it('should build a JWT token with an expiration date', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const authToken = new AuthToken();
      authToken.user = Promise.resolve(user);
      authToken.uuid = 'tokenUuid';
      authToken.version = 1;

      const expectedToken = 'token';

      (mockJwtService.signAsync as jest.Mock).mockResolvedValue(expectedToken);

      const token = await service.buildJwtToken(authToken, { expirationMinutes: 42 });

      expect(token).toBe(expectedToken);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.uuid,
          token: authToken.uuid,
          version: authToken.version,
        },
        { expiresIn: '42m' },
      );
    });

    it('should build a JWT token with a refresh token flag', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const authToken = new AuthToken();
      authToken.user = Promise.resolve(user);
      authToken.uuid = 'tokenUuid';
      authToken.version = 1;

      const expectedToken = 'token';

      (mockJwtService.signAsync as jest.Mock).mockResolvedValue(expectedToken);

      const token = await service.buildJwtToken(authToken, { isRefreshToken: true });

      expect(token).toBe(expectedToken);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.uuid,
          token: authToken.uuid,
          version: authToken.version,
          isRefreshToken: true,
        },
        {},
      );
    });
  });

  describe('buildJwtTokenPair', () => {
    it('should build a JWT token pair', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';

      const authToken = new AuthToken();
      authToken.user = Promise.resolve(user);
      authToken.uuid = 'tokenUuid';
      authToken.version = 1;

      const expectedRefreshToken = 'refreshToken';
      const expectedAccessToken = 'accessToken';

      service.buildJwtToken = jest
        .fn()
        .mockResolvedValueOnce(expectedRefreshToken)
        .mockResolvedValueOnce(expectedAccessToken);

      const tokenPair = await service.buildJwtTokenPair(authToken);

      expect(tokenPair).toEqual({ refreshToken: expectedRefreshToken, accessToken: expectedAccessToken });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtToken).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtToken).toHaveBeenNthCalledWith(1, authToken, {
        isRefreshToken: true,
        expirationMinutes: mockAuthConfig.refreshTokenExpirationMinutes,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtToken).toHaveBeenNthCalledWith(2, authToken);
    });
  });

  describe('createAndBuildTokenPair', () => {
    it('should create and build a token pair', async () => {
      const user = new User();

      const expectedAuthToken = new AuthToken();

      const expectedTokenPair = { refreshToken: 'refreshToken', accessToken: 'accessToken' };

      service.createAuthToken = jest.fn().mockResolvedValue(expectedAuthToken);
      service.buildJwtTokenPair = jest.fn().mockResolvedValue(expectedTokenPair);

      const { refreshToken, accessToken, authToken } = await service.createAndBuildTokenPair(user);

      expect(refreshToken).toBe(expectedTokenPair.refreshToken);
      expect(accessToken).toBe(expectedTokenPair.accessToken);
      expect(authToken).toBe(expectedAuthToken);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createAuthToken).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createAuthToken).toHaveBeenCalledWith(user, {
        expirationMinutes: mockAuthConfig.refreshTokenExpirationMinutes,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtTokenPair).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtTokenPair).toHaveBeenCalledWith(expectedAuthToken);
    });
  });

  describe('refreshTokenPair', () => {
    it('should refresh a token pair', async () => {
      const authToken = new AuthToken();
      authToken.version = 1;

      const expectedUpdatedToken = new AuthToken();
      expectedUpdatedToken.version = 2;

      const expectedTokenPair = { refreshToken: 'refreshToken', accessToken: 'accessToken' };

      service.buildJwtTokenPair = jest.fn().mockResolvedValue(expectedTokenPair);

      (mockAuthTokenRepository.merge as jest.Mock).mockReturnValue(expectedUpdatedToken);
      (mockAuthTokenRepository.save as jest.Mock).mockResolvedValue(expectedUpdatedToken);

      const { refreshToken, accessToken, authToken: updatedToken } = await service.refreshTokenPair(authToken);

      expect(refreshToken).toBe(expectedTokenPair.refreshToken);
      expect(accessToken).toBe(expectedTokenPair.accessToken);
      expect(updatedToken).toBe(expectedUpdatedToken);

      expect(mockAuthTokenRepository.merge).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.merge).toHaveBeenCalledWith(authToken, {
        version: authToken.version + 1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresAt: expect.any(Date),
      });

      const [, { expiresAt }] = (mockAuthTokenRepository.merge as jest.Mock).mock.calls[0] as [
        AuthToken,
        { expiresAt: Date },
      ];

      expect(expiresAt.getTime() / 1000).toBeCloseTo(
        Date.now() / 1000 + mockAuthConfig.refreshTokenExpirationMinutes * 60,
        1,
      );

      expect(mockAuthTokenRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.save).toHaveBeenCalledWith(expectedUpdatedToken);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtTokenPair).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.buildJwtTokenPair).toHaveBeenCalledWith(expectedUpdatedToken);
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

  describe('deleteAllForUser', () => {
    it('should delete all tokens for a user', async () => {
      const user = new User();
      user.id = 42;

      await service.deleteAllForUser(user);

      expect(mockAuthTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith({
        userId: user.id,
      });
    });
  });

  describe('purgeExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      (mockAuthTokenRepository.delete as jest.Mock).mockResolvedValue({ affected: 42 });

      await service.purgeExpiredTokens();

      expect(mockAuthTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockAuthTokenRepository.delete).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresAt: expect.anything(),
      });

      const [findOptions] = (mockAuthTokenRepository.delete as jest.Mock).mock.calls[0] as [
        FindOptionsWhere<AuthToken>,
      ];

      const expiresAtFilter = findOptions.expiresAt as FindOperator<Date>;

      expect(expiresAtFilter.type).toBe('lessThanOrEqual');
      // 10000 so that the seconds are rounded to the nearest 10 seconds
      expect(expiresAtFilter.value.getTime() / 10000).toBeCloseTo(Date.now() / 10000, 1);
    });
  });
});
