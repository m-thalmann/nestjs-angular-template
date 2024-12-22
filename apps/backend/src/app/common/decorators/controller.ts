import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { RefreshTokenAuth } from '../../auth/guards/auth.guard';

export function ApiPaginationQueryParams(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      schema: { type: 'integer', minimum: 1 },
      required: false,
      description: 'Page of the paginated items (starts with 1)',
    }),
    ApiQuery({
      name: 'per-page',
      schema: { type: 'integer', minimum: 1 },
      required: false,
      description: 'Amount of items per page',
    }),
  );
}

export function ApiValidationErrorResponse(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiUnprocessableEntityResponse({
      description: 'Validation error',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'array',
            items: { type: 'string' },
            description: 'The validation error messages',
            example: ['name should not be empty', 'email must be an email'],
          },
          error: { type: 'string', description: 'The HTTP status message', example: 'Unprocessable Entity' },
          statusCode: { type: 'integer', description: 'The HTTP status code', example: 422 },
        },
        required: ['message', 'error', 'statusCode'],
      },
    }),
  );
}

export function ApiAuth(options?: { refreshToken: boolean }): ReturnType<typeof applyDecorators> {
  const refreshToken = options?.refreshToken ?? false;

  const decorators = [
    ApiBearerAuth(refreshToken ? 'AccessToken' : 'RefreshToken'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  ];

  if (refreshToken) {
    decorators.push(RefreshTokenAuth());
  }

  return applyDecorators(...decorators);
}
