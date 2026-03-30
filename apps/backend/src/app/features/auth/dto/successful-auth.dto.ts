import { ApiProperty } from '@nestjs/swagger';
import { SuccessfulAuth } from '@shared/api-interfaces';
import { DetailedUserDto } from '../../user/dto/user.dto';

export class SuccessfulAuthDto implements SuccessfulAuth {
  @ApiProperty()
  declare user: DetailedUserDto;

  @ApiProperty({
    type: 'string',
    description: 'The access token',
  })
  declare accessToken: string;

  @ApiProperty({
    type: 'string',
    description: 'The refresh token',
  })
  declare refreshToken: string;
}
