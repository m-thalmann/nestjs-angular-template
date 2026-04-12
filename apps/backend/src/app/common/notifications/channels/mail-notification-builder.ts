import { ISendMailOptions } from '@nestjs-modules/mailer';
import { isString } from '@shared/common';

interface ActionLine {
  actionText: string;
  actionUrl: string;
}

type MessageLine = ActionLine | string;

export class MailNotificationBuilder {
  protected _subject: string | undefined = undefined;
  protected readonly _lines: Array<MessageLine> = [];

  line(message: string): this {
    this._lines.push(message);
    return this;
  }

  action(actionText: string, actionUrl: string): this {
    this._lines.push({ actionText, actionUrl });
    return this;
  }

  subject(subject: string): this {
    this._subject = subject;
    return this;
  }

  getMailOptions(): ISendMailOptions {
    if (!this._subject) {
      throw new Error('Subject is required for mail notifications');
    }

    return {
      subject: this._subject,
      template: 'mail-notification',
      text: this._lines.map((line) => (isString(line) ? line : `${line.actionText}: ${line.actionUrl}`)).join('\n'),
      context: {
        lines: this._lines,
      },
    };
  }
}
