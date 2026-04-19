import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthTokenModule } from '../auth/tokens/auth-token.module';
import { UserActionTokenModule } from './user-action-token/user-action-token.module';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthTokenModule, UserActionTokenModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
