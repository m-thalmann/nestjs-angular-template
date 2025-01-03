import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseMessage } from './base.message';
import { MailService } from './mail.service';

class TestMessage extends BaseMessage<void> {
  readonly _mailService: MailService;
  readonly _moduleRef: ModuleRef;

  constructor(mailService: MailService, moduleRef: ModuleRef) {
    super(mailService, moduleRef);

    this._mailService = mailService;
    this._moduleRef = moduleRef;
  }

  override context(): this {
    throw new Error('Method not implemented.');
  }
  override getSubject(): Promise<string> | string {
    throw new Error('Method not implemented.');
  }
  override getTemplate(): Promise<string> | string {
    throw new Error('Method not implemented.');
  }
  override getContext(): Promise<Record<string, unknown>> | Record<string, unknown> {
    throw new Error('Method not implemented.');
  }
}

describe('MailService', () => {
  let service: MailService;

  let moduleRef: ModuleRef;
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

    service = module.get<MailService>(MailService);
    moduleRef = module.get<ModuleRef>(ModuleRef);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('build', () => {
    it('should create a new message instance', () => {
      const result = service.build(TestMessage);

      expect(result).toBeInstanceOf(TestMessage);
      expect(result._mailService).toBe(service);
      expect(result._moduleRef).toBe(moduleRef);
    });
  });

  describe('sendMail', () => {
    it('should send mail', async () => {
      const mockMailOptions = { to: 'test@mail.com', subject: 'Test' };

      // @ts-expect-error type mismatch
      const mockMessage: BaseMessage<unknown> = {
        getMailOptions: jest.fn().mockResolvedValue(mockMailOptions),
      };

      (mockMailerService.sendMail as jest.Mock).mockResolvedValue({});

      const result = await service.sendMail(mockMessage);

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockMailOptions);
    });

    it('should return false on error', async () => {
      const mockMailOptions = { to: 'test@mail.com', subject: 'Test' };

      const mockErrorContext = 'Test';
      const mockErrorMessage = 'Test error';

      // @ts-expect-error type mismatch
      const mockMessage: BaseMessage<unknown> = {
        getMailOptions: jest.fn().mockResolvedValue(mockMailOptions),
        getErrorContext: jest.fn().mockReturnValue(mockErrorContext),
      };

      (mockMailerService.sendMail as jest.Mock).mockRejectedValue(new Error(mockErrorMessage));

      const result = await service.sendMail(mockMessage);

      expect(result).toBe(false);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mockMailOptions);

      expect(mockMessage.getErrorContext).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error sending email (${mockErrorContext}): ${mockErrorMessage}`,
        undefined,
        expect.anything(),
      );
    });
  });
});
