import { ApiAuth, ApiValidationErrorResponse } from '@backend/decorators';
import { User } from '@backend/user';
import { getResponseSchema } from '@backend/util';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@shared/api-interfaces';
import { DetailedUserDto } from '../../user/dto/user.dto';
import { Auth } from '../decorators/auth.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth/email-verification')
@ApiAuth({ emailMustBeVerified: false })
@ApiTags('Auth')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verifies the user's email" })
  @ApiOkResponse({ description: 'OK', schema: getResponseSchema(DetailedUserDto) })
  @ApiForbiddenResponse({ description: 'Invalid token' })
  @ApiValidationErrorResponse()
  async verify(@Auth('user') user: User, @Body() body: VerifyEmailDto): Promise<ApiResponse<DetailedUserDto>> {
    const updatedUser = await this.emailVerificationService.verifyEmail(user, body.token);

    return { data: DetailedUserDto.fromEntity(updatedUser) };
  }

  // TODO: throttle this endpoint to prevent abuse
  @Post('resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Re-sends the user's email verification notification" })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiForbiddenResponse({ description: 'Email already verified' })
  async resend(@Auth('user') user: User): Promise<void> {
    await this.emailVerificationService.resendVerificationEmail(user);
  }
}
