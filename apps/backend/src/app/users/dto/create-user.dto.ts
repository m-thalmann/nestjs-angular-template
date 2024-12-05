import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';
import { IsUnique } from '../../common/validation';
import { User } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The name of the new user',
    example: 'Jane Doe',
  })
  readonly name!: string;

  @IsEmail()
  @IsUnique(User, { entityDisplayName: 'User' })
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email of the new user',
    example: 'jane.doe@example.com',
  })
  readonly email!: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    format: 'password',
    description: 'The password of the new user',
    example: 'password',
  })
  readonly password!: string;

  @IsBoolean()
  @ApiProperty({
    type: 'boolean',
    description: 'Whether the new user is an admin or not',
  })
  readonly isAdmin!: boolean;
}
