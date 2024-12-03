import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PatchUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The new name of the user',
    example: 'Jane Doe',
  })
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    type: 'string',
    format: 'email',
    required: false,
    description: 'The new email of the user',
    example: 'jane.doe@example.com',
  })
  readonly email?: string;

  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    format: 'password',
    required: false,
    description: 'The new password of the user',
    example: 'password',
  })
  readonly password?: string;
}
