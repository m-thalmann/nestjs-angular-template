import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { UserActionTokenService, UserActionTokenType } from '@backend/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockUser } from '../../user/testing';
import { UserService } from '../../user/user.service';
import { ResetPasswordService } from './reset-password.service';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;

  let mockUserService: Partial<UserService>;
  let mockNotificationService: Partial<NotificationService>;
  const mockAppConfigFrontendUrl = 'http://localhost:3000';
  let mockUserActionTokenService: Partial<UserActionTokenService>;

  beforeEach(async () => {
    mockUserService = {
      findOneByEmail: jest.fn().mockResolvedValue(null),
      patch: jest.fn(),
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
        ResetPasswordService,
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

    service = await module.resolve<ResetPasswordService>(ResetPasswordService);
  });

  describe('resetPassword', () => {
    it('should throw ForbiddenException when user was updated since token was issued', async () => {
      const user = createMockUser();
      user.updatedAt = new Date(Date.now() + 1000); // Set updatedAt to a future time

      (mockUserActionTokenService.useToken as jest.Mock).mockImplementation(
        async (callback: (actionToken: unknown) => Promise<void>) => {
          const actionToken = {
            user,
            data: { userUpdatedAt: Date.now() },
          };
          await callback(actionToken);
        },
      );

      await expect(service.resetPassword('my-token', 'newPassword')).rejects.toThrow(ForbiddenException);

      expect(mockUserActionTokenService.useToken).toHaveBeenCalledWith(expect.any(Function), {
        type: UserActionTokenType.PasswordReset,
        token: 'my-token',
      });
      expect(mockUserService.patch).not.toHaveBeenCalled();
    });

    it('should update password for valid token', async () => {
      const user = createMockUser();

      (mockUserActionTokenService.useToken as jest.Mock).mockImplementation(
        async (callback: (actionToken: unknown) => Promise<void>) => {
          const actionToken = {
            user,
            data: { userUpdatedAt: user.updatedAt.getTime() },
          };
          await callback(actionToken);
        },
      );

      await service.resetPassword('valid-token', 'newPassword');

      expect(mockUserActionTokenService.useToken).toHaveBeenCalledWith(expect.any(Function), {
        type: UserActionTokenType.PasswordReset,
        token: 'valid-token',
      });
      expect(mockUserService.patch).toHaveBeenCalledWith(user, { password: 'newPassword' });
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should do nothing if user is not found', async () => {
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await service.sendResetPasswordEmail('nonexistent@example.com');

      expect(mockUserActionTokenService.createToken).not.toHaveBeenCalled();
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should send reset password notification for existing user', async () => {
      const user = createMockUser();
      user.email = 'user@example.com';
      user.updatedAt = new Date();

      const mockToken = 'generated-token';

      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (mockUserActionTokenService.createToken as jest.Mock).mockResolvedValue(mockToken);

      await service.sendResetPasswordEmail(user.email);

      expect(mockUserActionTokenService.createToken).toHaveBeenCalledWith({
        type: UserActionTokenType.PasswordReset,
        user,
        expirationMinutes: ResetPasswordService.TOKEN_EXPIRATION_MINUTES,
        data: { userUpdatedAt: user.updatedAt.getTime() },
        deleteExistingTokensWithSameTypeForUser: false,
      });
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          options: {
            frontendUrl: mockAppConfigFrontendUrl,
            token: mockToken,
          },
        }),
      );
    });
  });
});
