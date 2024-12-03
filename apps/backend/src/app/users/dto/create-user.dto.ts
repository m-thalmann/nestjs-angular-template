import { IsEmail, IsNotEmpty } from 'class-validator';
import { IsUnique } from '../../common/validation';
import { UserEntity } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  readonly name!: string;

  @IsEmail()
  @IsUnique(UserEntity, { entityDisplayName: 'User' })
  readonly email!: string;

  @IsNotEmpty()
  readonly password!: string;
}
