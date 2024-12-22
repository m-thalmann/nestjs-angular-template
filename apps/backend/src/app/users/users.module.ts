import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAbility } from '../auth/abilities/auth-ability';
import { userAbilities } from './user.abilities';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersListener } from './users.listener';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersListener],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {
  constructor() {
    AuthAbility.registerAbilityFactory(userAbilities, User);
  }
}
