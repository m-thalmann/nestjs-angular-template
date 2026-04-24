import { ApiValidationErrorResponse, Public } from '@backend/decorators';
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RESET_PASSWORD_VALIDATE_TOKEN_QUERY_KEY } from '@shared/api-interfaces';
import { isUndefined } from '@shared/common';
import { AuthController } from '../auth.controller';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { ResetPasswordService } from './reset-password.service';

@Controller('auth/reset-password')
@Public()
@ApiTags('Auth')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Get('validate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: AuthController.REQUESTS_PER_MINUTE } })
  @ApiOperation({ summary: 'Validates the reset password token' })
  @ApiQuery({
    name: RESET_PASSWORD_VALIDATE_TOKEN_QUERY_KEY,
    schema: { type: 'string' },
    required: true,
    description: 'The reset password token to validate',
  })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  async validateToken(@Query(RESET_PASSWORD_VALIDATE_TOKEN_QUERY_KEY) token: string | undefined): Promise<void> {
    if (isUndefined(token)) {
      throw new BadRequestException('Token is required');
    }

    await this.resetPasswordService.validateToken(token);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: AuthController.REQUESTS_PER_MINUTE } })
  @ApiOperation({ summary: "Resets the user's password" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  @ApiValidationErrorResponse()
  async verify(@Body() body: ResetPasswordDto): Promise<void> {
    await this.resetPasswordService.resetPassword(body.token, body.newPassword);
  }

  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: AuthController.REQUESTS_PER_MINUTE } })
  @ApiOperation({ summary: 'Requests a password reset email' })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Email already verified' })
  @ApiValidationErrorResponse()
  async resend(@Body() body: SendResetPasswordDto): Promise<void> {
    await this.resetPasswordService.sendResetPasswordEmail(body.email);
  }
}
