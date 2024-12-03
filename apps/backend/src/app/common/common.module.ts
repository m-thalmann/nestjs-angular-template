import { Global, Module } from '@nestjs/common';
import { UniqueValidator } from './validation';

@Global()
@Module({
  imports: [],
  providers: [UniqueValidator],
  exports: [UniqueValidator],
})
export class CommonModule {}
