import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { PatchAuthUserDto } from './patch-auth-user.dto';

export class PatchUserDto extends PatchAuthUserDto {
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    type: 'boolean',
    required: false,
    description: 'Whether the user is an admin or not',
  })
  readonly isAdmin?: boolean;
}
