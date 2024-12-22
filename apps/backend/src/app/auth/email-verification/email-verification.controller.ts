import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth-decorator';
import { ApiAuth, ApiValidationErrorResponse } from '../../common/decorators/controller';
import { User } from '../../users/user.entity';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth/email-verification')
@ApiAuth()
@ApiTags('Auth')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Verifies the user's email" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  @ApiValidationErrorResponse()
  async verify(@Auth('user') user: User, @Body() body: VerifyEmailDto): Promise<void> {
    await this.emailVerificationService.verifyEmail(user, body.token);
  }

  @Post('resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Re-sends the user's email verification notification" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Email already verified' })
  async resend(@Auth('user') user: User): Promise<void> {
    await this.emailVerificationService.resendVerificationEmail(user);
  }
}
