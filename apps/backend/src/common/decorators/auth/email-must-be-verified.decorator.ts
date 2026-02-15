import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY = 'requiresVerifiedEmail';
/**
 * **Note:** You can also use the `ApiAuth` decorator instead
 */
export const EmailMustBeVerified: (mustBeVerified?: boolean) => CustomDecorator = (mustBeVerified: boolean = true) =>
  SetMetadata(EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY, mustBeVerified);
