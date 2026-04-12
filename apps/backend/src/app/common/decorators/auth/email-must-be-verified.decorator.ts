import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

export const EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY = 'requiresVerifiedEmail';
/**
 * **Note:** You can also use the `ApiAuth` decorator instead
 */
export function EmailMustBeVerified(mustBeVerified: boolean = true): ReturnType<typeof applyDecorators> {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    SetMetadata(EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY, mustBeVerified),
  ];

  if (mustBeVerified) {
    decorators.push(ApiExtension('x-email-must-be-verified', true));
  }

  return applyDecorators(...decorators);
}
