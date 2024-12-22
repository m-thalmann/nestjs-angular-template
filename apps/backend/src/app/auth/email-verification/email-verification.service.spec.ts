import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../common/mail/mail.service';
import { EmailVerificationMessage } from '../../common/mail/messages/email-verification.message';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { EmailVerificationService } from './email-verification.service';

function createMockUser(emailVerified: boolean): User {
  const user = new User();

  if (emailVerified) {
    user.emailVerifiedAt = new Date();
  }

  return user;
}

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;
  let mockMailService: Partial<MailService>;

  let mockMailBuilder: Partial<EmailVerificationMessage>;

  beforeEach(async () => {
    mockUsersService = {
      markEmailAsVerified: jest.fn(),
    };

    mockJwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    };

    mockMailBuilder = {
      context: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockMailService = {
      build: jest.fn().mockReturnValue(mockMailBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyEmail', () => {
    it('should do nothing if email is already verified', async () => {
      const user = createMockUser(true);

      const validateVerificationTokenSpy = jest.spyOn(service, 'validateVerificationToken');

      await service.verifyEmail(user, 'token');

      expect(validateVerificationTokenSpy).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for invalid token', async () => {
      const user = createMockUser(false);

      service.validateVerificationToken = jest.fn().mockResolvedValue(false);

      await expect(service.verifyEmail(user, 'token')).rejects.toThrow(ForbiddenException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.validateVerificationToken).toHaveBeenCalledWith(user, 'token');
    });

    it('should mark email as verified for valid token', async () => {
      const user = createMockUser(false);

      service.validateVerificationToken = jest.fn().mockResolvedValue(true);

      await service.verifyEmail(user, 'token');

      expect(mockUsersService.markEmailAsVerified).toHaveBeenCalledWith(user);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should throw ForbiddenException if email is already verified', async () => {
      const user = createMockUser(true);

      await expect(service.resendVerificationEmail(user)).rejects.toThrow(ForbiddenException);
    });

    it('should send verification email if email is not verified', async () => {
      const user = createMockUser(false);
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt.getTime() + 1);

      await service.resendVerificationEmail(user);

      expect(mockMailService.build).toHaveBeenCalledWith(EmailVerificationMessage);

      expect(mockMailBuilder.context).toHaveBeenCalledWith({ user, isNewUser: false });
      expect(mockMailBuilder.to).toHaveBeenCalledWith(user.email);
      expect(mockMailBuilder.send).toHaveBeenCalled();
    });

    it('should set isNewUser to true if user was just created', async () => {
      const user = createMockUser(false);
      user.createdAt = new Date();
      user.updatedAt = new Date(user.createdAt);

      await service.resendVerificationEmail(user);

      expect(mockMailBuilder.context).toHaveBeenCalledWith({ user, isNewUser: true });
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate token with correct payload and expiration', async () => {
      const user = createMockUser(false);

      await service.generateVerificationToken(user);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.uuid, email: user.email },
        { expiresIn: `${EmailVerificationService.TOKEN_EXPIRATION_MINUTES}m` },
      );
    });
  });

  describe('validateVerificationToken', () => {
    it('should return false for invalid token', async () => {
      const user = createMockUser(false);

      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());

      const result = await service.validateVerificationToken(user, 'invalid-token');

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token');
    });

    it('should return false if payload does not match user', async () => {
      const user = createMockUser(false);
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
      const user = createMockUser(false);
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
