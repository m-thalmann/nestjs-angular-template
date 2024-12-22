import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { RequestPasswordResetEvent } from '../events/request-password-reset.event';
import { ResetPasswordService } from './reset-password.service';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;

  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;
  let mockEventEmitter: Partial<EventEmitter2>;

  beforeEach(async () => {
    mockUsersService = {
      findOneByEmail: jest.fn(),
      patch: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ResetPasswordService>(ResetPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resetPassword', () => {
    it('should throw ForbiddenException for invalid token', async () => {
      service.getUserFromToken = jest.fn().mockRejectedValue(new Error());

      await expect(service.resetPassword('invalid-token', 'newPassword')).rejects.toThrow(ForbiddenException);
    });

    it('should do nothing if user is not found', async () => {
      service.getUserFromToken = jest.fn().mockResolvedValue(null);

      await service.resetPassword('token', 'newPassword');

      expect(mockUsersService.patch).not.toHaveBeenCalled();
    });

    it('should update password for valid token', async () => {
      const user = new User();
      service.getUserFromToken = jest.fn().mockResolvedValue(user);

      await service.resetPassword('valid-token', 'newPassword');

      expect(mockUsersService.patch).toHaveBeenCalledWith(user, { password: 'newPassword' });
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should do nothing if user is not found', async () => {
      (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await service.sendResetPasswordEmail('nonexistent@example.com');

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should emit reset password event for existing user', async () => {
      const user = new User();
      user.email = 'user@example.com';
      user.updatedAt = new Date();

      (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      service.generateResetToken = jest.fn().mockResolvedValue('generated-token');

      await service.sendResetPasswordEmail(user.email);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.generateResetToken).toHaveBeenCalledWith(user.email, user.updatedAt);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        RequestPasswordResetEvent.ID,
        expect.any(RequestPasswordResetEvent),
      );

      const [, sentEvent] = (mockEventEmitter.emit as jest.Mock).mock.calls[0] as [string, RequestPasswordResetEvent];

      expect(sentEvent.email).toBe(user.email);
      expect(sentEvent.token).toBe('generated-token');
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
      (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserFromToken('token');

      expect(result).toBeNull();
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token');
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error if user was updated after token was issued', async () => {
      const user = new User();
      user.updatedAt = new Date();

      const payload = { email: 'test@example.com', userUpdatedAt: user.updatedAt.getTime() - 1000 };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      await expect(service.getUserFromToken('token')).rejects.toThrow();
    });

    it('should return user for valid token with matching timestamp', async () => {
      const user = new User();
      user.updatedAt = new Date();

      const payload = { email: 'test@example.com', userUpdatedAt: user.updatedAt.getTime() };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.getUserFromToken('valid-token');

      expect(result).toBe(user);
    });
  });
});
