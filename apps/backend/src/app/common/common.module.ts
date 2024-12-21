import { Global, Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { UniqueValidator } from './validation/unique.validator';

@Global()
@Module({
  imports: [MailModule],
  providers: [UniqueValidator, MailService],
  exports: [UniqueValidator, MailService],
})
export class CommonModule {}
