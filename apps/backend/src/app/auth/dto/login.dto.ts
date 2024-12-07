import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: "The user's login email",
    example: 'john.doe@example.com',
  })
  readonly email!: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    format: 'password',
    description: "The user's password",
    example: 'password',
  })
  readonly password!: string;
}
