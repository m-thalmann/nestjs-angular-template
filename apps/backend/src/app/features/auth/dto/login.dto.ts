import { ApiProperty } from '@nestjs/swagger';
import { Login } from '@shared/api-interfaces';
import { IsNotEmpty } from 'class-validator';

export class LoginDto implements Login {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: "The user's login email",
    example: 'jane.doe@example.com',
  })
  declare email: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    format: 'password',
    description: "The user's password",
    example: 'password',
  })
  declare password: string;
}
