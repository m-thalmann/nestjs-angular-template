import { applyDecorators } from '@nestjs/common';
import { ApiUnprocessableEntityResponse } from '@nestjs/swagger';

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
