import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SendResetPasswordDto {
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'The email of the user to reset the password for',
    example: 'user@example.com',
  })
  readonly email!: string;
}
