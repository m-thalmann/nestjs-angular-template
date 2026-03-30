import { ApiProperty } from '@nestjs/swagger';
import { PatchUserManaged, Role, ROLES } from '@shared/api-interfaces';
import { IsEnum, IsOptional } from 'class-validator';
import { PatchAuthUserDto } from './patch-auth-user.dto';

export class PatchUserDto extends PatchAuthUserDto implements PatchUserManaged {
  @IsOptional()
  @IsEnum(Role)
  @ApiProperty({
    type: 'string',
    enum: ROLES,
    required: false,
    description: 'The role of the user',
  })
  declare role?: Role;
}
