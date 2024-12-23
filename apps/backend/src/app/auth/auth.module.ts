import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthListener } from './auth.listener';
import { AuthService } from './auth.service';
import { EmailVerificationController } from './email-verification/email-verification.controller';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { AuthGuard } from './guards/auth.guard';
import { ResetPasswordController } from './reset-password/reset-password.controller';
import { ResetPasswordService } from './reset-password/reset-password.service';
import { AuthTokenModule } from './tokens/auth-token.module';

@Module({
  imports: [AuthTokenModule, UsersModule],
  providers: [
    AuthService,
    ResetPasswordService,
    EmailVerificationService,
    AuthListener,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService, EmailVerificationService],
  controllers: [AuthController, EmailVerificationController, ResetPasswordController],
})
export class AuthModule {}
