import { ApiProperty } from '@nestjs/swagger';
import { SendResetPassword } from '@shared/api-interfaces';
import { IsNotEmpty } from 'class-validator';

export class SendResetPasswordDto implements SendResetPassword {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The email of the user to reset the password for',
    example: 'user@example.com',
  })
  declare email: string;
}
