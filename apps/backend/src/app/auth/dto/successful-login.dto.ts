import { ApiProperty } from '@nestjs/swagger';
import { DetailedUserDto } from '../../users/dto/user.dto';

export class SuccessfulLoginDto {
  @ApiProperty()
  readonly user!: DetailedUserDto;

  @ApiProperty({
    type: 'string',
    description: 'The access token',
  })
  readonly accessToken!: string;

  @ApiProperty({
    type: 'string',
    description: 'The refresh token',
  })
  readonly refreshToken!: string;
}
