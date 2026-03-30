import { ApiProperty } from '@nestjs/swagger';
import { VerifyEmail } from '@shared/api-interfaces';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto implements VerifyEmail {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The email verification token',
    example: 'token',
  })
  declare token: string;
}
