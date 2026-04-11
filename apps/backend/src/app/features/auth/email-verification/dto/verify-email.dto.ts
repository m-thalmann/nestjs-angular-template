import { ApiProperty } from '@nestjs/swagger';
import { VerifyEmailRequest } from '@shared/api-interfaces';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto implements VerifyEmailRequest {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The email verification token',
    example: 'token',
  })
  declare token: string;
}
