import { MailService } from '@backend/mail';
import { Test } from '@nestjs/testing';
import { MailNotificationBuilder } from './mail-notification-builder';
import { MailNotificationChannelService } from './mail-notification-channel.service';

describe('MailNotificationChannelService', () => {
  let service: MailNotificationChannelService;

  let mockMailService: Partial<MailService>;

  beforeEach(async () => {
    mockMailService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [MailNotificationChannelService, { provide: MailService, useValue: mockMailService }],
    }).compile();

    service = module.get<MailNotificationChannelService>(MailNotificationChannelService);
  });

  describe('send', () => {
    it('should call mailService.sendMail with correct options', async () => {
      const recipient = { email: 'test@example.com', name: 'Test' };
      const subject = 'Test Subject';
      const body = 'Test Body';

      const builder = new MailNotificationBuilder().subject(subject).line(body);

      await service.send(recipient, builder);

      expect(mockMailService.sendMail).toHaveBeenCalledWith({
        ...builder.getMailOptions(),
        to: recipient.email,
      });
    });
  });
});
