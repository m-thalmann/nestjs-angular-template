import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockUser } from '../../user/testing';
import { UserService } from '../../user/user.service';
import { ResetPasswordService } from './reset-password.service';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;

  let mockUserService: Partial<UserService>;
  let mockJwtService: Partial<JwtService>;
  let mockNotificationService: Partial<NotificationService>;
  const mockAppConfigFrontendUrl = 'http://localhost:3000';

  beforeEach(async () => {
    mockUserService = {
      findOneByEmail: jest.fn(),
      patch: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    mockNotificationService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: appConfigDefinition.KEY,
          useValue: { frontendUrl: mockAppConfigFrontendUrl },
        },
      ],
    }).compile();

    service = await module.resolve<ResetPasswordService>(ResetPasswordService);
  });

  describe('resetPassword', () => {
    it('should throw ForbiddenException for invalid token', async () => {
      service.getUserFromToken = jest.fn().mockRejectedValue(new Error());

      await expect(service.resetPassword('invalid-token', 'newPassword')).rejects.toThrow(ForbiddenException);
    });

    it('should do nothing if user is not found', async () => {
      service.getUserFromToken = jest.fn().mockResolvedValue(null);

      await service.resetPassword('token', 'newPassword');

      expect(mockUserService.patch).not.toHaveBeenCalled();
    });

    it('should update password for valid token', async () => {
      const user = createMockUser();
      service.getUserFromToken = jest.fn().mockResolvedValue(user);

      await service.resetPassword('valid-token', 'newPassword');

      expect(mockUserService.patch).toHaveBeenCalledWith(user, { password: 'newPassword' });
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should do nothing if user is not found', async () => {
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await service.sendResetPasswordEmail('nonexistent@example.com');

      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should send reset password notification for existing user', async () => {
      const user = createMockUser();
      user.email = 'user@example.com';
      user.updatedAt = new Date();

      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      service.generateResetToken = jest.fn().mockResolvedValue('generated-token');

      await service.sendResetPasswordEmail(user.email);

      expect(service.generateResetToken).toHaveBeenCalledWith(user.email, user.updatedAt);
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          options: {
            frontendUrl: mockAppConfigFrontendUrl,
            token: 'generated-token',
          },
        }),
      );
    });
  });

  describe('generateResetToken', () => {
    it('should generate token with correct payload and expiration', async () => {
      const email = 'test@example.com';
      const updatedAt = new Date();

      await service.generateResetToken(email, updatedAt);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { email, userUpdatedAt: updatedAt.getTime() },
        { expiresIn: `${ResetPasswordService.TOKEN_EXPIRATION_MINUTES}m` },
      );
    });
  });

  describe('getUserFromToken', () => {
    it('should return null if user not found', async () => {
      const payload = { email: 'test@example.com', userUpdatedAt: Date.now() };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserFromToken('token');

      expect(result).toBeNull();
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token');
      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error if user was updated after token was issued', async () => {
      const user = createMockUser();
      user.updatedAt = new Date();

      const payload = { email: 'test@example.com', userUpdatedAt: user.updatedAt.getTime() - 1000 };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      await expect(service.getUserFromToken('token')).rejects.toThrow();
    });

    it('should return user for valid token with matching timestamp', async () => {
      const user = createMockUser();
      user.updatedAt = new Date();

      const payload = { email: 'test@example.com', userUpdatedAt: user.updatedAt.getTime() };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.getUserFromToken('valid-token');

      expect(result).toBe(user);
    });
  });
});
