import { applyDecorators } from '@nestjs/common';
import { ApiUnprocessableEntityResponse } from '@nestjs/swagger';

// TODO: improve validation to have one key in errors per invalid field -> https://github.com/m-thalmann/nestjs-angular-template/commit/7cea2c29db4ccd0b99b4617c29ed11b0c0f37c04#diff-8b372b8f01ac08d16a31b5f6b8c8fa1cd24ca7ac1df645c31790ffa4da167ec0R30
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
