import { Test, TestingModule } from '@nestjs/testing';
import { DetailedUserDto } from '../../user/dto/user.dto';
import { createMockUser } from '../../user/testing';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationController', () => {
  let app: TestingModule;
  let controller: EmailVerificationController;

  let mockEmailVerificationService: Partial<EmailVerificationService>;

  beforeAll(async () => {
    mockEmailVerificationService = {
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
    };

    app = await Test.createTestingModule({
      controllers: [EmailVerificationController],
      providers: [{ provide: EmailVerificationService, useValue: mockEmailVerificationService }],
    }).compile();

    controller = app.get<EmailVerificationController>(EmailVerificationController);
  });

  describe('verify', () => {
    it('should call emailVerificationService.verifyEmail with correct parameters and return updated user', async () => {
      const user = createMockUser();
      const token = 'test-token';
      const mockUpdatedUser = createMockUser({ emailVerified: true });

      (mockEmailVerificationService.verifyEmail as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await controller.verify(user, { token });

      expect(mockEmailVerificationService.verifyEmail).toHaveBeenCalledWith(user, token);
      expect(result).toEqual({
        data: DetailedUserDto.fromEntity(mockUpdatedUser),
      });
    });
  });

  describe('resend', () => {
    it('should call emailVerificationService.resendVerificationEmail with correct parameters', async () => {
      const user = createMockUser();

      await controller.resend(user);

      expect(mockEmailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(user);
    });
  });
});
