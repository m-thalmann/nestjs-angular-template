import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  fromAddress: string;
  fromName: string;
}

export const mailConfigDefinition = registerAs<MailConfig>('mail', () => {
  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT ?? '0', 10);
  const username = process.env.MAIL_USERNAME;
  const password = process.env.MAIL_PASSWORD;
  const secure = process.env.MAIL_SECURE === 'true';
  const fromAddress = process.env.MAIL_FROM_ADDRESS;
  const fromName = process.env.MAIL_FROM_NAME;

  if (
    host === undefined ||
    isNaN(port) ||
    username === undefined ||
    password === undefined ||
    fromAddress === undefined ||
    fromName === undefined
  ) {
    throw new Error('Invalid mail configuration');
  }

  return {
    host,
    port,
    username,
    password,
    secure,
    fromAddress,
    fromName,
  };
});
