import { Address, ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

export abstract class BaseMessage {
  protected _to: Array<Address | string> = [];
  protected _cc: Array<Address | string> = [];
  protected _bcc: Array<Address | string> = [];

  abstract getSubject(): string;
  abstract getTemplate(): string;
  abstract getContext(): Record<string, unknown>;

  to(...addresses: Array<Address | string>): this {
    this._to.push(...addresses);
    return this;
  }

  cc(...addresses: Array<Address | string>): this {
    this._cc.push(...addresses);
    return this;
  }

  bcc(...addresses: Array<Address | string>): this {
    this._bcc.push(...addresses);
    return this;
  }

  getTo(): Array<Address | string> | undefined {
    return this._to.length > 0 ? this._to : undefined;
  }

  getCc(): Array<Address | string> | undefined {
    return this._cc.length > 0 ? this._cc : undefined;
  }

  getBcc(): Array<Address | string> | undefined {
    return this._bcc.length > 0 ? this._bcc : undefined;
  }

  getMailOptions(): ISendMailOptions {
    const options: ISendMailOptions = {
      to: this.getTo(),
      cc: this.getCc(),
      bcc: this.getBcc(),
      subject: this.getSubject(),
      template: this.getTemplate(),
      context: { subject: this.getSubject(), ...this.getContext() },
    };

    return options;
  }
}
