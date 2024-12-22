import { ApiResponse } from '@app/shared-types';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiMethodNotAllowedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth-decorator';
import { ApiAuth, ApiValidationErrorResponse } from '../common/decorators/controller';
import { getResponseSchema } from '../common/util/swagger.utils';
import { DetailedUserDto, buildUserDto } from '../users/dto/user.dto';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SuccessfulAuthDto } from './dto/successful-auth.dto';
import { Public } from './guards/auth.guard';
import { SignUpEnabledGuard } from './guards/sign-up-enabled.guard';
import { AuthToken } from './tokens/auth-token.entity';
import { AuthTokenService } from './tokens/auth-token.service';

// TODO: add throttling of requests
// TODO: add captcha verification (optional)
// TODO: 2FA (optional)
// TODO: password reset

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
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiAuth()
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
    description: 'OK',
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
    description: 'OK',
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
  @ApiOperation({ summary: 'Refreshes the access token' })
  @ApiCreatedResponse({
    description: 'OK',
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiAuth({ refreshToken: true })
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
  @ApiNoContentResponse({ description: 'OK' })
  @ApiAuth()
  async logout(@Auth('authToken') authToken: AuthToken): Promise<void> {
    await this.authTokenService.logoutToken(authToken);
  }
}
