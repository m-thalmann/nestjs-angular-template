import { HttpStatus, UnprocessableEntityException, ValidationError, ValidationPipe } from '@nestjs/common';

function buildValidationException(validationErrors: Array<ValidationError>): UnprocessableEntityException {
  const errors = Object.fromEntries(
    validationErrors.map((error) => {
      const field = error.property;
      const constraints = Object.values(error.constraints ?? {});

      return [
        field,
        constraints.map(
          // transform first letter to uppercase
          (constraint) => constraint.charAt(0).toUpperCase() + constraint.slice(1),
        ),
      ];
    }),
  );

  return new UnprocessableEntityException({
    message: 'Validation failed',
    errors,
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY.valueOf(),
  });
}

export const AppValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: buildValidationException,
});
