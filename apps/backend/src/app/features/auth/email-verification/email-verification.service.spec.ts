import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { UserActionTokenService, UserActionTokenType } from '@backend/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockUser } from '../../user/testing';
import { UserService } from '../../user/user.service';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  let mockUserService: Partial<UserService>;
  let mockNotificationService: Partial<NotificationService>;
  const mockAppConfigFrontendUrl = 'http://localhost:3000';
  let mockUserActionTokenService: Partial<UserActionTokenService>;

  beforeEach(async () => {
    mockUserService = {
      markEmailAsVerified: jest.fn(),
    };

    mockNotificationService = {
      send: jest.fn(),
    };

    mockUserActionTokenService = {
      createToken: jest.fn(),
      useToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: appConfigDefinition.KEY,
          useValue: { frontendUrl: mockAppConfigFrontendUrl },
        },
        {
          provide: UserActionTokenService,
          useValue: mockUserActionTokenService,
        },
      ],
    }).compile();

    service = await module.resolve<EmailVerificationService>(EmailVerificationService);
  });

  describe('verifyEmail', () => {
    it('should do nothing if email is already verified', async () => {
      const user = createMockUser({ emailVerified: true });

      const result = await service.verifyEmail(user, 'token');

      expect(mockUserActionTokenService.useToken).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it('should throw ForbiddenException for token with another email', async () => {
      const user = createMockUser({ emailVerified: false });

      (mockUserActionTokenService.useToken as jest.Mock).mockImplementation(
        async (callback: (actionToken: unknown) => Promise<void>) =>
          await callback({ data: { email: 'another-email@example.com' } }),
      );

      await expect(service.verifyEmail(user, 'my-token')).rejects.toThrow(ForbiddenException);
      expect(mockUserActionTokenService.useToken).toHaveBeenCalledWith(expect.any(Function), {
        type: UserActionTokenType.EmailVerification,
        token: 'my-token',
      });
    });

    it('should mark email as verified for valid token', async () => {
      const user = createMockUser({ emailVerified: false });

      (mockUserActionTokenService.useToken as jest.Mock).mockImplementation(
        async (callback: (actionToken: unknown) => Promise<void>) => await callback({ data: { email: user.email } }),
      );
      (mockUserService.markEmailAsVerified as jest.Mock).mockResolvedValue({ isEmailVerified: true });

      const result = await service.verifyEmail(user, 'token');

      expect(mockUserService.markEmailAsVerified).toHaveBeenCalledWith(user);
      expect(result).toEqual({ isEmailVerified: true });
    });
  });

  describe('sendVerificationEmail', () => {
    it.each([true, false])('should send verification email with isNewUser[=%s]', async (isNewUser) => {
      const user = createMockUser({ emailVerified: false });
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt.getTime() + 1);

      const mockToken = 'verification-token';

      (mockUserActionTokenService.createToken as jest.Mock).mockResolvedValue(mockToken);

      await service.sendVerificationEmail(user, isNewUser);

      expect(mockUserActionTokenService.createToken).toHaveBeenCalledWith({
        type: UserActionTokenType.EmailVerification,
        user,
        expirationMinutes: EmailVerificationService.TOKEN_EXPIRATION_MINUTES,
        data: { email: user.email },
        deleteExistingTokensWithSameTypeForUser: true,
      });
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          options: {
            isNewUser,
            token: mockToken,
            frontendUrl: mockAppConfigFrontendUrl,
          },
        }),
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should throw ForbiddenException if email is already verified', async () => {
      const user = createMockUser({ emailVerified: true });

      await expect(service.resendVerificationEmail(user)).rejects.toThrow(ForbiddenException);
    });

    it('should send verification email if email is not verified', async () => {
      const user = createMockUser({ emailVerified: false });
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt.getTime() + 1);

      service.sendVerificationEmail = jest.fn().mockResolvedValue(undefined);

      await service.resendVerificationEmail(user);

      expect(service.sendVerificationEmail).toHaveBeenCalledWith(user, false);
    });

    it('should set isNewUser to true if user was just created', async () => {
      const user = createMockUser({ emailVerified: false });
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt);

      service.sendVerificationEmail = jest.fn().mockResolvedValue(undefined);

      await service.resendVerificationEmail(user);

      expect(service.sendVerificationEmail).toHaveBeenCalledWith(user, true);
    });
  });
});
