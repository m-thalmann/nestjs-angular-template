import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationErrorResponse } from '../../common/decorators/controller';
import { Public } from '../guards/auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { ResetPasswordService } from './reset-password.service';

@Controller('auth/reset-password')
@Public()
@ApiTags('Auth')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Resets the user's password" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  @ApiValidationErrorResponse()
  async verify(@Body() body: ResetPasswordDto): Promise<void> {
    await this.resetPasswordService.resetPassword(body.token, body.newPassword);
  }

  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Requests a password reset email' })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Email already verified' })
  @ApiValidationErrorResponse()
  async resend(@Body() body: SendResetPasswordDto): Promise<void> {
    await this.resetPasswordService.sendResetPasswordEmail(body.email);
  }
}
