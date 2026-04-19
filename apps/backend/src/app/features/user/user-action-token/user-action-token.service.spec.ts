import { appConfigDefinition } from '@backend/config';
import { UserActionToken, UserActionTokenService, UserActionTokenType } from '@backend/user';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { FindOperator, FindOptionsWhere, Repository } from 'typeorm';
import { createMockUser } from '../testing';

class UserActionTokenServiceTestClass extends UserActionTokenService {
  override hashToken(token: string): string {
    return super.hashToken(token);
  }

  override generateToken(): string {
    return super.generateToken();
  }
}

describe('UserActionTokenService', () => {
  let service: UserActionTokenServiceTestClass;

  let mockUserActionTokenRepository: Partial<Repository<UserActionToken>>;
  let mockAppConfig: Partial<ConfigType<typeof appConfigDefinition>>;

  beforeEach(async () => {
    mockUserActionTokenRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    };

    mockAppConfig = {
      secret: 'test-secret',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActionTokenServiceTestClass,
        {
          provide: getRepositoryToken(UserActionToken),
          useValue: mockUserActionTokenRepository,
        },
        {
          provide: appConfigDefinition.KEY,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    service = await module.resolve<UserActionTokenServiceTestClass>(UserActionTokenServiceTestClass);
  });

  describe('createToken', () => {
    it('should create a token and save it to the repository', async () => {
      const user = createMockUser();
      const mockToken = 'plain-text-token';
      const mockHashedToken = 'hashed-token';

      service.generateToken = jest.fn().mockReturnValue(mockToken);
      service.hashToken = jest.fn().mockReturnValue(mockHashedToken);

      const token = await service.createToken({
        type: UserActionTokenType.EmailVerification,
        user,
        expirationMinutes: 60,
        data: { some: 'data' },
      });

      expect(token).toEqual(mockToken);
      expect(service.generateToken).toHaveBeenCalled();
      expect(service.hashToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserActionTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockHashedToken,
          type: UserActionTokenType.EmailVerification,
          userId: user.id,
          data: { some: 'data' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresAt: expect.any(Date),
        }),
      );
      expect(mockUserActionTokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete existing tokens of the same type for the user if deleteExistingTokensWithSameTypeForUser is true', async () => {
      const user = createMockUser();
      const resolveSave$ = new ReplaySubject<void>(1);

      (mockUserActionTokenRepository.save as jest.Mock).mockImplementation(
        async () => await firstValueFrom(resolveSave$),
      );

      const createTokenPromise = service.createToken({
        type: UserActionTokenType.PasswordReset,
        user,
        expirationMinutes: 30,
        deleteExistingTokensWithSameTypeForUser: true,
      });

      // delete before save is called
      expect(mockUserActionTokenRepository.delete).toHaveBeenCalledWith({
        userId: user.id,
        type: UserActionTokenType.PasswordReset,
      });

      // cleanup
      resolveSave$.next();
      await createTokenPromise;
    });
  });

  describe('findToken', () => {
    it('should return the token entity if a valid token is found', async () => {
      const mockTokenEntity = new UserActionToken();
      mockTokenEntity.token = 'hashed-token';
      mockTokenEntity.type = UserActionTokenType.EmailVerification;
      mockTokenEntity.userId = 1;
      mockTokenEntity.data = { some: 'data' };
      mockTokenEntity.expiresAt = new Date(Date.now() + 1000 * 60); // expires in 1 minute

      service.hashToken = jest.fn().mockReturnValue('hashed-token');
      (mockUserActionTokenRepository.findOne as jest.Mock).mockResolvedValue(mockTokenEntity);

      const result = await service.findToken({
        type: UserActionTokenType.EmailVerification,
        token: 'plain-text-token',
      });

      expect(service.hashToken).toHaveBeenCalledWith('plain-text-token');
      expect(mockUserActionTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          token: 'hashed-token',
          type: UserActionTokenType.EmailVerification,
        },
      });
      expect(result).toEqual(mockTokenEntity);
    });

    it('should return null if no token is found', async () => {
      service.hashToken = jest.fn().mockReturnValue('hashed-token');
      (mockUserActionTokenRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findToken({
        type: UserActionTokenType.EmailVerification,
        token: 'plain-text-token',
      });

      expect(result).toBeNull();
    });

    it('should return null if the token is expired', async () => {
      const mockTokenEntity = new UserActionToken();
      mockTokenEntity.token = 'hashed-token';
      mockTokenEntity.type = UserActionTokenType.EmailVerification;
      mockTokenEntity.userId = 1;
      mockTokenEntity.data = { some: 'data' };
      mockTokenEntity.expiresAt = new Date(Date.now() - 1000); // expired 1 second ago

      service.hashToken = jest.fn().mockReturnValue('hashed-token');
      (mockUserActionTokenRepository.findOne as jest.Mock).mockResolvedValue(mockTokenEntity);

      const result = await service.findToken({
        type: UserActionTokenType.EmailVerification,
        token: 'plain-text-token',
      });

      expect(result).toBeNull();
    });
  });

  describe('useToken', () => {
    it('should execute the callback and delete the token', async () => {
      const mockTokenEntity = new UserActionToken();
      mockTokenEntity.token = 'hashed-token';
      mockTokenEntity.type = UserActionTokenType.PasswordReset;
      mockTokenEntity.userId = 1;
      mockTokenEntity.data = { some: 'data' };
      mockTokenEntity.expiresAt = new Date(Date.now() + 1000 * 60); // expires in 1 minute

      service.findToken = jest.fn().mockResolvedValue(mockTokenEntity);
      service.deleteToken = jest.fn().mockResolvedValue(undefined);

      const callback = jest.fn().mockResolvedValue('callback result');

      const result = await service.useToken(callback, {
        type: UserActionTokenType.PasswordReset,
        token: 'plain-text-token',
      });

      expect(service.findToken).toHaveBeenCalledWith({
        type: UserActionTokenType.PasswordReset,
        token: 'plain-text-token',
      });
      expect(callback).toHaveBeenCalledWith(mockTokenEntity);
      expect(service.deleteToken).toHaveBeenCalledWith('plain-text-token');
      expect(result).toEqual('callback result');
    });

    it('should throw a ForbiddenException if the token is invalid', async () => {
      service.findToken = jest.fn().mockResolvedValue(null);
      service.deleteToken = jest.fn().mockResolvedValue(undefined);

      const callback = jest.fn();

      await expect(
        service.useToken(callback, {
          type: UserActionTokenType.EmailVerification,
          token: 'invalid-token',
        }),
      ).rejects.toThrow('Invalid token');

      expect(service.findToken).toHaveBeenCalledWith({
        type: UserActionTokenType.EmailVerification,
        token: 'invalid-token',
      });
      expect(callback).not.toHaveBeenCalled();
      expect(service.deleteToken).not.toHaveBeenCalled();
    });

    it('should not delete the token if callback throws an error', async () => {
      const mockTokenEntity = new UserActionToken();
      mockTokenEntity.token = 'hashed-token';
      mockTokenEntity.type = UserActionTokenType.PasswordReset;
      mockTokenEntity.userId = 1;
      mockTokenEntity.data = { some: 'data' };
      mockTokenEntity.expiresAt = new Date(Date.now() + 1000 * 60); // expires in 1 minute

      service.findToken = jest.fn().mockResolvedValue(mockTokenEntity);
      service.deleteToken = jest.fn().mockResolvedValue(undefined);

      const callback = jest.fn().mockRejectedValue(new Error('Callback error'));

      await expect(
        service.useToken(callback, {
          type: UserActionTokenType.PasswordReset,
          token: 'plain-text-token',
        }),
      ).rejects.toThrow('Callback error');

      expect(service.findToken).toHaveBeenCalledWith({
        type: UserActionTokenType.PasswordReset,
        token: 'plain-text-token',
      });
      expect(callback).toHaveBeenCalledWith(mockTokenEntity);
      expect(service.deleteToken).not.toHaveBeenCalled();
    });
  });

  describe('purgeExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      (mockUserActionTokenRepository.delete as jest.Mock).mockResolvedValue({ affected: 42 });

      await service.purgeExpiredTokens();

      expect(mockUserActionTokenRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockUserActionTokenRepository.delete).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresAt: expect.anything(),
      });

      const [findOptions] = (mockUserActionTokenRepository.delete as jest.Mock).mock.calls[0] as [
        FindOptionsWhere<UserActionToken>,
      ];

      const expiresAtFilter = findOptions.expiresAt as FindOperator<Date>;

      expect(expiresAtFilter.type).toBe('lessThanOrEqual');
      // 10000 so that the seconds are rounded to the nearest 10 seconds
      expect(expiresAtFilter.value.getTime() / 10000).toBeCloseTo(Date.now() / 10000, 1);
    });
  });

  describe('hashToken', () => {
    it('should hash the token', () => {
      const token = 'test-token';

      const hashedToken = service.hashToken(token);

      expect(hashedToken).toBeDefined();
      expect(hashedToken).not.toEqual(token);
    });

    it('should produce the same hash for the same token', () => {
      const token = 'consistent-token';

      const firstHash = service.hashToken(token);
      const secondHash = service.hashToken(token);

      expect(firstHash).toEqual(secondHash);
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = 'token-one';
      const token2 = 'token-two';

      const hash1 = service.hashToken(token1);
      const hash2 = service.hashToken(token2);

      expect(hash1).not.toEqual(hash2);
    });

    it('should produce different hashes for different app secret', () => {
      const token = 'same-token';

      const firstHash = service.hashToken(token);

      // change app secret
      mockAppConfig.secret = 'different-secret';

      const secondHash = service.hashToken(token);

      expect(firstHash).not.toEqual(secondHash);
    });
  });

  describe('generateToken', () => {
    it('should generate a token', () => {
      const token = service.generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      expect(token1).not.toEqual(token2);
    });
  });
});
