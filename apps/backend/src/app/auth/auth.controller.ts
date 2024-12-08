import { ApiResponse } from '@app/shared-types';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiMethodNotAllowedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiValidationErrorResponse } from '../common/decorators';
import { getResponseSchema } from '../common/util';
import { buildUserDto } from '../users';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SuccessfulAuthDto } from './dto/successful-auth.dto';
import { Public } from './guards/auth.guard';
import { SignUpEnabledGuard } from './guards/sign-up-enabled.guard';

// TODO: add throttling of requests
// TODO: add captcha verification (optional)

@Controller('auth')
@ApiTags('Auth')
@ApiExtraModels(SuccessfulAuthDto)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Performs a login for the user' })
  @ApiOkResponse({
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiValidationErrorResponse()
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<SuccessfulAuthDto>> {
    const user = await this.authService.loginUser(loginDto.email, loginDto.password);

    const { accessToken, refreshToken } = await this.authTokenService.buildTokenPair(user);

    return {
      data: {
        user: buildUserDto(user, true),
        accessToken,
        refreshToken,
      },
    };
  }

  @Post('sign-up')
  @Public()
  @UseGuards(SignUpEnabledGuard)
  @ApiOperation({ summary: 'Creates an account for a new user' })
  @ApiCreatedResponse({
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiValidationErrorResponse()
  @ApiMethodNotAllowedResponse({
    description: 'Sign up is disabled',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<ApiResponse<SuccessfulAuthDto>> {
    const user = await this.authService.signUpUser(signUpDto);

    const { accessToken, refreshToken } = await this.authTokenService.buildTokenPair(user);

    return {
      data: {
        user: buildUserDto(user, true),
        accessToken,
        refreshToken,
      },
    };
  }
}
