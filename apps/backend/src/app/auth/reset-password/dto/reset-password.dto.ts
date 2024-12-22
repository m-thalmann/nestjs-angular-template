import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The password reset token',
    example: 'token',
  })
  readonly token!: string;

  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The new password',
    example: 'password',
  })
  readonly newPassword!: string;
}
