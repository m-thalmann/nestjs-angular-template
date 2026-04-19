import { HasPermissionsGuard } from '@backend/permissions';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserActionTokenModule } from '../user/user-action-token/user-action-token.module';
import { UserModule } from '../user/user.module';
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
  imports: [AuthTokenModule, UserModule, UserActionTokenModule],
  controllers: [AuthController, ResetPasswordController, EmailVerificationController],
  providers: [
    AuthService,
    ResetPasswordService,
    EmailVerificationService,

    AuthListener,

    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // make sure its provided after AuthGuard, so that it runs after the user is authenticated
    {
      provide: APP_GUARD,
      useClass: HasPermissionsGuard,
    },
  ],
  exports: [],
})
export class AuthModule {}
