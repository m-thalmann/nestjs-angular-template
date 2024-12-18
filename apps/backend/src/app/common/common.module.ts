import { Global, Module } from '@nestjs/common';
import { UniqueValidator } from './validation/unique.validator';

@Global()
@Module({
  imports: [],
  providers: [UniqueValidator],
  exports: [UniqueValidator],
})
export class CommonModule {}
