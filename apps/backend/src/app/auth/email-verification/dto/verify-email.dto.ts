import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The email verification token',
    example: 'token',
  })
  readonly token!: string;
}
