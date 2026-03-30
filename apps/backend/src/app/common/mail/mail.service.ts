import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { isNativeError } from 'util/types';

@Injectable()
export class MailService {
  private readonly logger: Logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(mailOptions: ISendMailOptions): Promise<boolean> {
    try {
      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = isNativeError(error) ? error.message : String(error);

      this.logger.error(`Error sending email (${MailService.getErrorContext(mailOptions)}): ${errorMessage}`);

      return false;
    }

    return true;
  }

  protected static getErrorContext(mailOptions: ISendMailOptions): string {
    return JSON.stringify({
      subject: mailOptions.subject,
      to: mailOptions.to,
      cc: mailOptions.cc,
      bcc: mailOptions.bcc,
    });
  }
}
