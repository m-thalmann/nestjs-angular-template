/* eslint-disable @typescript-eslint/no-magic-numbers */
import { UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { authConfigDefinition } from '../common/config';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthToken } from './auth-token.entity';
import { AuthService } from './auth.service';
import { AUTH_TOKEN_TYPES } from './dto/auth-token-type.dto';
import { SignUpDto } from './dto/sign-up.dto';

class AuthServiceTestClass extends AuthService {
  override async buildTokenPair(
    user: User,
    groupUuid?: string,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    return await super.buildTokenPair(user, groupUuid);
  }
}

describe('AuthService', () => {
  let service: AuthServiceTestClass;

  let mockAuthTokenRepository: Partial<Repository<AuthToken>>;
  let mockUserService: Partial<UsersService>;
  let mockAuthConfig: ConfigType<typeof authConfigDefinition>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockAuthTokenRepository = {
      save: jest.fn(),
    };

    mockUserService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    };

    mockAuthConfig = {
      accessTokenExpirationMinutes: 5,
      refreshTokenExpirationMinutes: 42,
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthServiceTestClass,
        {
          provide: getRepositoryToken(AuthToken),
          useValue: mockAuthTokenRepository,
        },
        {
          provide: authConfigDefinition.KEY,
          useValue: mockAuthConfig,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthServiceTestClass>(AuthServiceTestClass);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw an UnauthorizedException if the user does not exist', async () => {
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.loginUser('test@mail.org', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const password = await argon2.hash('password');
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue({ password });

      await expect(service.loginUser('test@mail.org', 'wrongPassword')).rejects.toThrow(UnauthorizedException);
    });

    it('should return the user if it exists and the password is correct', async () => {
      const plainPassword = 'password';
      const password = await argon2.hash(plainPassword);
      const user = { password };

      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.loginUser('test@mail.org', plainPassword);

      expect(result).toEqual(user);
    });
  });

  describe('signUpUser', () => {
    it('should create a new user', async () => {
      const signUpDto: SignUpDto = {
        name: 'New User',
        email: 'new@user.org',
        password: 'password',
      };

      const expectedUser = new User();

      (mockUserService.create as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.signUpUser(signUpDto);

      expect(result).toBe(expectedUser);

      expect(mockUserService.create).toHaveBeenCalledWith({ ...signUpDto, isAdmin: false });
    });
  });

  describe('buildTokenPair', () => {
    it('should build a token pair', async () => {
      const user = new User();
      user.uuid = '9a27f908-cd69-4e2f-9e4e-9a1c5ca8c82a';
      user.updatedAt = new Date(Date.now() - 1000);

      const expectedUserId = 444;
      const expectedRefreshToken = 'refreshToken';
      const expectedAccessToken = 'accessToken';

      (mockAuthTokenRepository.save as jest.Mock).mockImplementation(async (authToken: AuthToken) => {
        authToken.id = expectedUserId;
        return authToken;
      });

      (mockJwtService.signAsync as jest.Mock).mockImplementation(async (payload: Record<string, string>) => {
        if (payload.type === 'refresh') {
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

      expect(refreshToken.user).toBe(user);
      expect(refreshToken.type).toBe(AUTH_TOKEN_TYPES.REFRESH);
      expect(refreshToken.token).toHaveLength(64);
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
      expect(refreshTokenPayload.tokenGroupUuid).toBe(refreshToken.groupUuid);
      expect(refreshTokenPayload.updatedAt).toBe(user.updatedAt);
      expect(refreshTokenPayload.type).toBe('refresh');

      expect(accessTokenPayload.sub).toBe(user.uuid);
      expect(accessTokenPayload.tokenGroupUuid).toBe(refreshToken.groupUuid);
      expect(accessTokenPayload.updatedAt).toBe(user.updatedAt);
      expect(accessTokenPayload.type).toBe('access');
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
});
