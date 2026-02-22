import { ApiAuth, ApiValidationErrorResponse, Public } from '@backend/decorators';
import { ApiResponseDto } from '@backend/models';
import { getResponseSchema } from '@backend/util';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiMethodNotAllowedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DetailedUserDto } from '../user/dto/user.dto';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SuccessfulAuthDto } from './dto/successful-auth.dto';
import { SignUpEnabledGuard } from './guards/sign-up-enabled.guard';
import { AuthToken } from './tokens/auth-token.entity';
import { AuthTokenService } from './tokens/auth-token.service';

@Controller('auth')
@ApiTags('Auth')
@ApiExtraModels(SuccessfulAuthDto)
export class AuthController {
  // protected static readonly REQUESTS_PER_MINUTE: number = 5;

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
  async getAuthenticatedUser(@Auth('user') user: User): Promise<ApiResponseDto<DetailedUserDto>> {
    return {
      data: DetailedUserDto.fromEntity(user),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  // @Throttle({ default: { limit: AuthController.REQUESTS_PER_MINUTE } })
  @ApiOperation({ summary: 'Performs a login for the user' })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiValidationErrorResponse()
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<SuccessfulAuthDto>> {
    const user = await this.authService.loginUser(loginDto.email, loginDto.password);

    const { accessToken, refreshToken } = await this.authTokenService.createAndBuildTokenPair(user);

    return {
      data: {
        user: DetailedUserDto.fromEntity(user),
        accessToken,
        refreshToken,
      },
    };
  }

  @Post('sign-up')
  @Public()
  @UseGuards(SignUpEnabledGuard)
  // @Throttle({ default: { limit: AuthController.REQUESTS_PER_MINUTE } })
  @ApiOperation({ summary: 'Creates an account for a new user' })
  @ApiCreatedResponse({
    description: 'OK',
    schema: getResponseSchema(SuccessfulAuthDto),
  })
  @ApiValidationErrorResponse()
  @ApiMethodNotAllowedResponse({
    description: 'Sign up is disabled',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<ApiResponseDto<SuccessfulAuthDto>> {
    const user = await this.authService.signUpUser(signUpDto);

    const { accessToken, refreshToken } = await this.authTokenService.createAndBuildTokenPair(user);

    return {
      data: {
        user: DetailedUserDto.fromEntity(user),
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
  ): Promise<ApiResponseDto<SuccessfulAuthDto>> {
    const { accessToken, refreshToken } = await this.authTokenService.refreshTokenPair(authToken);

    return {
      data: {
        user: DetailedUserDto.fromEntity(user),
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
