import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  imports: [],
  providers: [ConfigService],
  exports: [ConfigService],
})
@Global()
export class ConfigModule {}
