import { appConfigDefinition } from '@backend/config';
import { NotificationService } from '@backend/notifications';
import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockUser } from '../../user/testing';
import { UserService } from '../../user/user.service';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  let mockUserService: Partial<UserService>;
  let mockJwtService: Partial<JwtService>;
  let mockNotificationService: Partial<NotificationService>;
  const mockAppConfigFrontendUrl = 'http://localhost:3000';

  beforeEach(async () => {
    mockUserService = {
      markEmailAsVerified: jest.fn(),
    };

    mockJwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    };

    mockNotificationService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
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

    service = await module.resolve<EmailVerificationService>(EmailVerificationService);
  });

  describe('verifyEmail', () => {
    it('should do nothing if email is already verified', async () => {
      const user = createMockUser({ emailVerified: true });

      const validateVerificationTokenSpy = jest.spyOn(service, 'validateVerificationToken');

      await service.verifyEmail(user, 'token');

      expect(validateVerificationTokenSpy).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for invalid token', async () => {
      const user = createMockUser({ emailVerified: false });

      service.validateVerificationToken = jest.fn().mockResolvedValue(false);

      await expect(service.verifyEmail(user, 'token')).rejects.toThrow(ForbiddenException);
      expect(service.validateVerificationToken).toHaveBeenCalledWith(user, 'token');
    });

    it('should mark email as verified for valid token', async () => {
      const user = createMockUser({ emailVerified: false });

      service.validateVerificationToken = jest.fn().mockResolvedValue(true);

      await service.verifyEmail(user, 'token');

      expect(mockUserService.markEmailAsVerified).toHaveBeenCalledWith(user);
    });
  });

  describe('sendVerificationEmail', () => {
    it.each([true, false])('should send verification email with isNewUser (%s)', async (isNewUser) => {
      const user = createMockUser({ emailVerified: false });
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt.getTime() + 1);

      const mockToken = 'verification-token';

      service.generateVerificationToken = jest.fn().mockResolvedValue(mockToken);

      await service.sendVerificationEmail(user, isNewUser);

      expect(service.generateVerificationToken).toHaveBeenCalledWith(user);
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

  describe('generateVerificationToken', () => {
    it('should generate token with correct payload and expiration', async () => {
      const user = createMockUser({ emailVerified: false });

      await service.generateVerificationToken(user);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.uuid, email: user.email },
        { expiresIn: `${EmailVerificationService.TOKEN_EXPIRATION_MINUTES}m` },
      );
    });
  });

  describe('validateVerificationToken', () => {
    it('should return false for invalid token', async () => {
      const user = createMockUser({ emailVerified: false });

      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());

      const result = await service.validateVerificationToken(user, 'invalid-token');

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token');
    });

    it('should return false if payload does not match user', async () => {
      const user = createMockUser({ emailVerified: false });
      user.uuid = 'user-uuid';
      user.email = 'user@example.com';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'different-uuid',
        email: 'different@example.com',
      });

      const result = await service.validateVerificationToken(user, 'token');

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token');
    });

    it('should return true for valid token with matching payload', async () => {
      const user = createMockUser({ emailVerified: false });
      user.uuid = 'user-uuid';
      user.email = 'user@example.com';

      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: user.uuid,
        email: user.email,
      });

      const result = await service.validateVerificationToken(user, 'valid-token');

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });
  });
});
