/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { convertDateToUnixTimestamp } from '../../common/util';
import { User } from '../user.entity';

export class UserDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the user',
    example: '1b888700-2a6c-42cd-b8ea-4d2485735d0a',
  })
  uuid!: string;

  @ApiProperty({
    type: 'string',
    description: 'The name of the user',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email!: string;
}

export class DetailedUserDto extends UserDto {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether the user is an admin or not',
  })
  isAdmin!: boolean;

  @ApiProperty({
    type: 'boolean',
    description: 'Whether the user has verified their email or not',
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    type: 'integer',
    description: 'The unix timestamp when the user was created',
    example: 1733255679,
  })
  createdAt!: number;

  @ApiProperty({
    type: 'integer',
    description: 'The unix timestamp when the user was last updated',
    example: 1733255679,
  })
  updatedAt!: number;
}

export function buildUserDto(user: User, withDetails?: false): UserDto;
export function buildUserDto(user: User, withDetails: true): DetailedUserDto;
export function buildUserDto(user: User, withDetails: boolean): DetailedUserDto | UserDto;
export function buildUserDto(user: User, withDetails: boolean = false): DetailedUserDto | UserDto {
  const dto: UserDto = {
    uuid: user.uuid,
    name: user.name,
    email: user.email,
  };

  if (!withDetails) {
    return dto;
  }

  const detailedUser: DetailedUserDto = {
    ...dto,
    isAdmin: user.isAdmin,
    isEmailVerified: user.isEmailVerified(),
    createdAt: convertDateToUnixTimestamp(user.createdAt),
    updatedAt: convertDateToUnixTimestamp(user.updatedAt),
  };

  return detailedUser;
}
