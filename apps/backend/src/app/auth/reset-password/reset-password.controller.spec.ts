import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordController } from './reset-password.controller';
import { ResetPasswordService } from './reset-password.service';

describe('ResetPasswordController', () => {
  let app: TestingModule;
  let controller: ResetPasswordController;

  let mockResetPasswordService: Partial<ResetPasswordService>;

  beforeAll(async () => {
    mockResetPasswordService = {
      resetPassword: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
    };

    app = await Test.createTestingModule({
      controllers: [ResetPasswordController],
      providers: [
        {
          provide: ResetPasswordService,
          useValue: mockResetPasswordService,
        },
      ],
    }).compile();

    controller = app.get<ResetPasswordController>(ResetPasswordController);
  });

  describe('verify', () => {
    it('should call resetPassword on the service with the correct parameters', async () => {
      const dto = { token: 'token', newPassword: 'newPassword' };

      await controller.verify(dto);

      expect(mockResetPasswordService.resetPassword).toHaveBeenCalledWith(dto.token, dto.newPassword);
    });
  });

  describe('resend', () => {
    it('should call sendResetPasswordEmail on the service with the correct parameters', async () => {
      const dto = { email: 'john@example.com' };

      await controller.resend(dto);

      expect(mockResetPasswordService.sendResetPasswordEmail).toHaveBeenCalledWith(dto.email);
    });
  });
});
