import { ApiResponse } from '@app/shared-types';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiMethodNotAllowedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiValidationErrorResponse, Auth } from '../common/decorators';
import { getResponseSchema } from '../common/util';
import { buildUserDto, DetailedUserDto, User } from '../users';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SuccessfulAuthDto } from './dto/successful-auth.dto';
import { Public, RefreshTokenAuth } from './guards/auth.guard';
import { SignUpEnabledGuard } from './guards/sign-up-enabled.guard';
import { AuthToken } from './tokens/auth-token.entity';
import { AuthTokenService } from './tokens/auth-token.service';

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

  @Get()
  @ApiOperation({ summary: 'Returns the current authenticated user' })
  @ApiOkResponse({
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiBearerAuth('AccessToken')
  async getAuthenticatedUser(@Auth('user') user: User): Promise<ApiResponse<DetailedUserDto>> {
    return {
      data: buildUserDto(user, true),
    };
  }

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

    const { accessToken, refreshToken } = await this.authTokenService.createAndBuildTokenPair(user);

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

    const { accessToken, refreshToken } = await this.authTokenService.createAndBuildTokenPair(user);

    return {
      data: {
        user: buildUserDto(user, true),
        accessToken,
        refreshToken,
      },
    };
  }

  @Post('refresh')
  @RefreshTokenAuth()
  @ApiOperation({ summary: 'Refreshes the access token' })
  @ApiCreatedResponse({
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiBearerAuth('RefreshToken')
  async refreshToken(
    @Auth('user') user: User,
    @Auth('authToken') authToken: AuthToken,
  ): Promise<ApiResponse<SuccessfulAuthDto>> {
    const { accessToken, refreshToken } = await this.authTokenService.refreshTokenPair(authToken);

    return {
      data: {
        user: buildUserDto(user, true),
        accessToken,
        refreshToken,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logs out the user' })
  @ApiNoContentResponse()
  @ApiBearerAuth('AccessToken')
  async logout(@Auth('authToken') authToken: AuthToken): Promise<void> {
    await this.authTokenService.logoutToken(authToken);
  }
}
