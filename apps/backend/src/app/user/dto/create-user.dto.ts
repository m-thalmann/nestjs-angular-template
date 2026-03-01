import { IsUnique } from '@backend/validation';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';
import { User } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The name of the new user',
    example: 'Jane Doe',
  })
  declare name: string;

  @IsEmail()
  @IsUnique(User, { entityDisplayName: 'User' })
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email of the new user',
    example: 'jane.doe@example.com',
  })
  declare email: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    format: 'password',
    description: 'The password of the new user',
    example: 'password',
  })
  declare password: string;

  @IsBoolean()
  @ApiProperty({
    type: 'boolean',
    description: 'Whether the new user is an admin or not',
  })
  declare isAdmin: boolean;
}
