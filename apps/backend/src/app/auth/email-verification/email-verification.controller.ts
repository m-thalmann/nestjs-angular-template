import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth-decorator';
import { ApiAuth } from '../../common/decorators/controller';
import { User } from '../../users/user.entity';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth/email-verification')
@ApiAuth()
@ApiTags('Auth')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('verify/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Verifies the user's email" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  async verify(@Auth('user') user: User, @Param('token') token: string): Promise<void> {
    await this.emailVerificationService.verifyEmail(user, token);
  }

  @Post('resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Re-sends the user' email verification notification" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Email already verified' })
  async resend(@Auth('user') user: User): Promise<void> {
    await this.emailVerificationService.resendVerificationEmail(user);
  }
}
