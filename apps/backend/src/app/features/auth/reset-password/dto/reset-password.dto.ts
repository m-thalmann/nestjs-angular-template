import { ApiProperty } from '@nestjs/swagger';
import { ResetPasswordRequest } from '@shared/api-interfaces';
import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto implements ResetPasswordRequest {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The password reset token',
    example: 'token',
  })
  declare token: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The new password',
    example: 'password',
  })
  declare newPassword: string;
}
