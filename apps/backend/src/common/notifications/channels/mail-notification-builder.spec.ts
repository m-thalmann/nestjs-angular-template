import { MailNotificationBuilder } from './mail-notification-builder';

class MailNotificationBuilderTestClass extends MailNotificationBuilder {
  getSubject(): string | undefined {
    return this._subject;
  }

  getLines(): Array<string | { actionText: string; actionUrl: string }> {
    return this._lines;
  }
}

describe('MailNotificationBuilder', () => {
  let builder: MailNotificationBuilderTestClass;

  beforeEach(() => {
    builder = new MailNotificationBuilderTestClass();
  });

  describe('line', () => {
    it('should add a line and return the builder instance', () => {
      const result = builder.line('Hello world');

      expect(result).toBe(builder);
      expect(builder.getLines()).toEqual(['Hello world']);
    });
  });

  describe('action', () => {
    it('should add an action and return the builder instance', () => {
      const result = builder.action('Verify email', 'https://example.com/verify');

      expect(result).toBe(builder);
      expect(builder.getLines()).toEqual([
        {
          actionText: 'Verify email',
          actionUrl: 'https://example.com/verify',
        },
      ]);
    });
  });

  describe('subject', () => {
    it('should set the subject and return the builder instance', () => {
      const result = builder.subject('Welcome');

      expect(result).toBe(builder);
      expect(builder.getSubject()).toBe('Welcome');
    });
  });

  describe('getMailOptions', () => {
    it('should throw if no subject was set', () => {
      builder.line('Line without subject');

      expect(() => builder.getMailOptions()).toThrow('Subject is required for mail notifications');
    });

    it('should build mail options with text lines and actions in order', () => {
      builder = builder
        .subject('Welcome')
        .line('Hello Jane,')
        .line('Please confirm your account.')
        .action('Confirm account', 'https://example.com/confirm')
        .line('If you did not request this, you can ignore this email.');

      expect(builder.getMailOptions()).toEqual({
        subject: 'Welcome',
        template: 'mail-notification',
        text: [
          'Hello Jane,',
          'Please confirm your account.',
          'Confirm account: https://example.com/confirm',
          'If you did not request this, you can ignore this email.',
        ].join('\n'),
        context: {
          lines: [
            'Hello Jane,',
            'Please confirm your account.',
            {
              actionText: 'Confirm account',
              actionUrl: 'https://example.com/confirm',
            },
            'If you did not request this, you can ignore this email.',
          ],
        },
      });
    });

    it('should preserve empty content when a subject is provided', () => {
      builder = builder.subject('Empty notification');

      expect(builder.getMailOptions()).toEqual({
        subject: 'Empty notification',
        template: 'mail-notification',
        text: '',
        context: {
          lines: [],
        },
      });
    });
  });
});
