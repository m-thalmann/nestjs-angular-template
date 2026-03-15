import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  let mockMailerService: Partial<MailerService>;
  let mockLogger: Logger;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn(),
    };

    // @ts-expect-error type mismatch
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    })
      .setLogger(mockLogger)
      .compile();

    service = await module.resolve<MailService>(MailService);
  });

  describe('sendMail', () => {
    it('should send mail', async () => {
      const mockMailOptions = { to: 'test@mail.com', subject: 'Test' };

      (mockMailerService.sendMail as jest.Mock).mockResolvedValue({});

      const result = await service.sendMail(mockMailOptions);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockMailOptions);
    });

    it('should return false on error', async () => {
      const mockMailOptions = { to: 'test@mail.com', subject: 'Test' };

      const expectedErrorContext = JSON.stringify({
        subject: mockMailOptions.subject,
        to: mockMailOptions.to,
      });
      const mockErrorMessage = 'Failed to send email';

      (mockMailerService.sendMail as jest.Mock).mockRejectedValue(new Error(mockErrorMessage));

      const result = await service.sendMail(mockMailOptions);

      expect(result).toBe(false);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockMailOptions);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error sending email (${expectedErrorContext}): ${mockErrorMessage}`,
        undefined,
        expect.anything(),
      );
    });
  });
});
