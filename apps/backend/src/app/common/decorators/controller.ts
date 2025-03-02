import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { EmailMustBeVerified, RefreshTokenAuth } from '../../auth/guards/auth.guard';

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
          message: { type: 'string', description: 'The error description message', example: 'Validation failed' },
          errors: {
            description:
              'All found errors with the key being the field of the error and the value the list of errors encountered',
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { description: 'The error message', type: 'string', example: 'Email should not be empty' },
            },
          },
          statusCode: { type: 'integer', description: 'The HTTP status code', example: 422 },
        },
        required: ['message', 'errors', 'statusCode'],
      },
    }),
  );
}

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
