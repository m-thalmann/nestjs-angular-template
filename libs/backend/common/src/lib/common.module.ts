import { Module } from '@nestjs/common';
import { ConfigService } from './config/config.service';

@Module({
  imports: [],
  providers: [ConfigService],
  exports: [],
})
export class CommonModule {}
