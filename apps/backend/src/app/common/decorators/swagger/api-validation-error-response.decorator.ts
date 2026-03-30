import { applyDecorators } from '@nestjs/common';
import { ApiUnprocessableEntityResponse } from '@nestjs/swagger';

export function ApiValidationErrorResponse(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiUnprocessableEntityResponse({
      description: 'Validation error',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The error message', example: 'Validation failed' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            description: 'The validation error messages',
            example: { name: ['Name should not be empty'], email: ['Email must be an email'] },
          },
          statusCode: { type: 'integer', description: 'The HTTP status code', example: 422 },
        },
        required: ['message', 'errors', 'statusCode'],
      },
    }),
  );
}
