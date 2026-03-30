import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const REFRESH_TOKEN_AUTH_DECORATOR_KEY = 'useRefreshTokenAuth';
/**
 * **Note:** You can also use the `ApiAuth` decorator instead
 */
export const RefreshTokenAuth: (mustBeRefreshToken?: boolean) => CustomDecorator = (
  mustBeRefreshToken: boolean = true,
) => SetMetadata(REFRESH_TOKEN_AUTH_DECORATOR_KEY, mustBeRefreshToken);
