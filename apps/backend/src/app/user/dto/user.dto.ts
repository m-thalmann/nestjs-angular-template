/* eslint-disable max-classes-per-file */
import { convertDateToUnixTimestamp } from '@backend/util';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the user',
    example: '1b888700-2a6c-42cd-b8ea-4d2485735d0a',
  })
  declare uuid: string;

  @ApiProperty({
    type: 'string',
    description: 'The name of the user',
    example: 'John Doe',
  })
  declare name: string;

  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  declare email: string;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.uuid = user.uuid;
    dto.name = user.name;
    dto.email = user.email;
    return dto;
  }
}

export class DetailedUserDto extends UserDto {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether the user is an admin or not',
  })
  declare isAdmin: boolean;

  @ApiProperty({
    type: 'boolean',
    description: 'Whether the user has verified their email or not',
  })
  declare isEmailVerified: boolean;

  @ApiProperty({
    type: 'integer',
    description: 'The unix timestamp when the user was created',
    example: 1733255679,
  })
  declare createdAt: number;

  @ApiProperty({
    type: 'integer',
    description: 'The unix timestamp when the user was last updated',
    example: 1733255679,
  })
  declare updatedAt: number;

  static override fromEntity(user: User): DetailedUserDto {
    const dto = new DetailedUserDto();
    dto.uuid = user.uuid;
    dto.name = user.name;
    dto.email = user.email;
    dto.isAdmin = user.isAdmin;
    dto.isEmailVerified = user.isEmailVerified;
    dto.createdAt = convertDateToUnixTimestamp(user.createdAt);
    dto.updatedAt = convertDateToUnixTimestamp(user.updatedAt);
    return dto;
  }
}
