import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserActionToken } from './user-action-token.entity';
import { UserActionTokenService } from './user-action-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActionToken])],
  providers: [UserActionTokenService],
  exports: [UserActionTokenService],
})
export class UserActionTokenModule {}
