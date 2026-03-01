import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationController } from './email-verification/email-verification.controller';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { AuthGuard } from './guards/auth.guard';
import { ResetPasswordController } from './reset-password/reset-password.controller';
import { ResetPasswordService } from './reset-password/reset-password.service';
import { AuthTokenModule } from './tokens/auth-token.module';

@Module({
  imports: [AuthTokenModule, UserModule],
  controllers: [AuthController, ResetPasswordController, EmailVerificationController],
  providers: [
    AuthService,
    ResetPasswordService,
    EmailVerificationService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [],
})
export class AuthModule {}
