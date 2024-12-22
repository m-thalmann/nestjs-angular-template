import { Address, ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import { ModuleRef } from '@nestjs/core';
import { MailService } from './mail.service';

export abstract class BaseMessage<TInputContext = Record<string, unknown>> {
  protected _to: Array<Address | string> = [];
  protected _cc: Array<Address | string> = [];
  protected _bcc: Array<Address | string> = [];

  constructor(
    private readonly mailService: MailService,
    protected readonly moduleRef: ModuleRef,
  ) {}

  abstract context(context: TInputContext): this;

  abstract getSubject(): Promise<string> | string;
  abstract getTemplate(): Promise<string> | string;
  abstract getContext(): Promise<Record<string, unknown>> | Record<string, unknown>;

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

  async getMailOptions(): Promise<ISendMailOptions> {
    const [subject, template, context] = await Promise.all([this.getSubject(), this.getTemplate(), this.getContext()]);

    const options: ISendMailOptions = {
      to: this.getTo(),
      cc: this.getCc(),
      bcc: this.getBcc(),
      subject,
      template,
      context: { subject, ...context },
    };

    return options;
  }

  async send(): Promise<boolean> {
    return await this.mailService.sendMail(this).then(() => true);
  }
}
