import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EmailMustBeVerified } from '../auth/email-must-be-verified.decorator';
import { RefreshTokenAuth } from '../auth/refresh-token-auth.decorator';

export function ApiAuth(options?: {
  refreshToken?: boolean;
  emailMustBeVerified?: boolean;
}): ReturnType<typeof applyDecorators> {
  const refreshToken = options?.refreshToken ?? false;
  const emailMustBeVerified = options?.emailMustBeVerified ?? false;

  const decorators = [
    ApiBearerAuth(refreshToken ? 'RefreshToken' : 'AccessToken'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  ];

  if (refreshToken) {
    decorators.push(RefreshTokenAuth());
  }

  if (emailMustBeVerified) {
    decorators.push(EmailMustBeVerified());
  }

  return applyDecorators(...decorators);
}
