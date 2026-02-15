import { ApiProperty } from '@nestjs/swagger';
import { DetailedUserDto } from '../../user/dto/user.dto';

export class SuccessfulAuthDto {
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
