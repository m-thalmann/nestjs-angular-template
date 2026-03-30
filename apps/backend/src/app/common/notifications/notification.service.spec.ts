import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { MailNotificationChannelService } from './channels/mail-notification-channel.service';
import { NotificationService } from './notification.service';

class NotificationServiceTestClass extends NotificationService {
  getChannels(): NotificationService['channels'] {
    return this.channels;
  }
}

describe('NotificationService', () => {
  let service: NotificationServiceTestClass;

  let mockModuleRef: Partial<ModuleRef>;
  let mockMailChannelService: Partial<MailNotificationChannelService>;

  beforeEach(async () => {
    mockMailChannelService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockModuleRef = {
      get: jest.fn().mockImplementation((token) => {
        if (token === MailNotificationChannelService) {
          return mockMailChannelService;
        }

        throw new Error(`Unknown provider: ${token}`);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        NotificationServiceTestClass,
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
    }).compile();

    service = await module.resolve<NotificationServiceTestClass>(NotificationServiceTestClass);
  });

  it('should initialize channels on module init', () => {
    expect(mockModuleRef.get).not.toHaveBeenCalled();
    service.onModuleInit();
    expect(mockModuleRef.get).toHaveBeenCalledWith(MailNotificationChannelService);
    expect(service.getChannels()).toHaveProperty('mail', mockMailChannelService);
  });

  describe('send', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should send notification via defined channels', async () => {
      const recipient = { email: 'test@example.com', name: 'Test' };
      const notification = {
        mail: jest.fn().mockResolvedValue({ subject: 'Test', text: 'This is a test' }),
      };

      await service.send(recipient, notification);

      expect(notification.mail).toHaveBeenCalledWith(recipient);
      expect(mockMailChannelService.send).toHaveBeenCalledWith(recipient, { subject: 'Test', text: 'This is a test' });
    });

    it('should skip channels that are not defined on the notification', async () => {
      const recipient = { email: 'test@example.com', name: 'Test' };
      const notification = {};

      await service.send(recipient, notification);

      expect(mockMailChannelService.send).not.toHaveBeenCalled();
    });
  });
});
