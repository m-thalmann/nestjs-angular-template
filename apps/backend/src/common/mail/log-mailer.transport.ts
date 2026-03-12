import { Logger } from '@nestjs/common';
import { Transport } from 'nodemailer';

export const LogMailerTransport: Transport<unknown> = {
  name: 'Log Mailer',
  version: '1.0.0',

  // eslint-disable-next-line @typescript-eslint/typedef
  send(mail, callback) {
    const input = mail.message.createReadStream();
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();

    const from = envelope.from;
    const to = envelope.to.join(', ');
    const subject = mail.data.subject;

    const textMessage = (mail.data.text ?? '') as string;

    const formattedTextMessage = textMessage
      .split('\n')
      .map((line) => ` > ${line}`)
      .join('\n');

    Logger.debug(
      `Sending email from ${from} to ${to} with subject "${subject}":\n${formattedTextMessage}`,
      'LogMailerTransport',
    );

    input.on('end', () => {
      callback(null, {
        envelope,
        messageId,
      });
    });
  },
};
