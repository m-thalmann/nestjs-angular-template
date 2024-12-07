import { ApiResponse } from '@app/shared-types';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiValidationErrorResponse, Public } from '../common/decorators';
import { getResponseSchema } from '../common/util';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SuccessfulLoginDto } from './dto/successful-login.dto';

@Controller('auth')
@ApiExtraModels(SuccessfulLoginDto)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Performs a login for the user' })
  @ApiOkResponse({
    schema: getResponseSchema(SuccessfulLoginDto),
  })
  @ApiValidationErrorResponse()
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<SuccessfulLoginDto>> {
    const user = await this.authService.loginUser(loginDto.email, loginDto.password);

    const { accessToken, refreshToken } = await this.authService.buildTokenPair(user);

    return {
      data: {
        user: this.usersService.buildDto(user, true),
        accessToken,
        refreshToken,
      },
    };
  }
}
