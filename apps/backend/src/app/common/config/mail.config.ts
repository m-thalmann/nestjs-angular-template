import { registerAs } from '@nestjs/config';
import { isUndefined } from '@shared/common';

interface BaseMailConfig {
  type: 'log' | 'smtp';
  fromAddress: string;
  fromName: string;
}

interface LogMailConfig extends BaseMailConfig {
  type: 'log';
}

interface SmtpMailConfig extends BaseMailConfig {
  type: 'smtp';
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}

export type MailConfig = LogMailConfig | SmtpMailConfig;

export const mailConfigDefinition = registerAs<MailConfig>('mail', () => {
  const type = process.env.MAIL_TYPE ?? 'smtp';

  const fromAddress = process.env.MAIL_FROM_ADDRESS;
  const fromName = process.env.MAIL_FROM_NAME;

  if (isUndefined(fromAddress) || isUndefined(fromName)) {
    throw new Error('Invalid mail configuration: fromAddress and fromName are required');
  }

  if (type === 'log') {
    return {
      type,
      fromAddress,
      fromName,
    };
  }

  if (type !== 'smtp') {
    throw new Error(`Invalid mail configuration: unknown type ${type}`);
  }

  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT ?? '0', 10);
  const username = process.env.MAIL_USERNAME;
  const password = process.env.MAIL_PASSWORD;
  const secure = process.env.MAIL_SECURE === 'true';

  if (isUndefined(host) || isNaN(port) || isUndefined(username) || isUndefined(password)) {
    throw new Error('Invalid mail configuration');
  }

  return {
    type,
    host,
    port,
    username,
    password,
    secure,
    fromAddress,
    fromName,
  };
});
