/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

export class User {
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

export class UserWithTimestamps extends User {
  @ApiProperty({
    type: 'integer',
    nullable: true,
    description: 'The unix timestamp when the user was created',
    example: 1733255679,
  })
  emailVerifiedAt!: number | null;

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
