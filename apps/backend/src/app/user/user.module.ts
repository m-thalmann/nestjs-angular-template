import { AuthAbility } from '@backend/auth';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthTokenModule } from '../auth/tokens/auth-token.module';
import { userAbilities } from './user.abilities';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthTokenModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {
  constructor() {
    AuthAbility.registerAbilityFactory(userAbilities, User);
  }
}
