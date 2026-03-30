import { User } from '@backend/user';
import { IsUnique } from '@backend/validation';
import { ApiProperty } from '@nestjs/swagger';
import { SignUp } from '@shared/api-interfaces';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignUpDto implements SignUp {
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
}
