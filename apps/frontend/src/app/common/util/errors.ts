import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { ApiValidationErrors } from '@shared/api-interfaces';
import { getErrorMessage, isDefined, isNotNone, isRecord, isString } from '@shared/common';

export const API_VALIDATION_ERROR = 'API_VALIDATION_ERROR';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status !== 0 && isNotNone(error.error)) {
      if (isRecord(error.error) && 'message' in error.error) {
        const errorData = error.error as { message: unknown };

        if (isString(errorData.message)) {
          return errorData.message;
        }

        if (Array.isArray(errorData.message) && errorData.message.length > 0 && isString(errorData.message[0])) {
          return errorData.message[0];
        }
      }
    }

    if (error.status === HttpStatusCode.GatewayTimeout.valueOf() || error.status === 0) {
      // gateway timeout -> offline

      return 'No server connection.';
    }

    return `An unexpected error has occurred (Code: ${error.status}).`;
  }

  return getErrorMessage(error);
}

export function isApiValidationErrors(errors: unknown): errors is ApiValidationErrors<Record<string, unknown>> {
  if (!isRecord(errors)) {
    return false;
  }

  return Object.values(errors).every(
    (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.every((error) => isString(error)),
  );
}

export function handleApiFormErrors(error: unknown, form: FormGroup): string | undefined {
  if (!(error instanceof HttpErrorResponse) || error.status !== HttpStatusCode.UnprocessableEntity.valueOf()) {
    return getApiErrorMessage(error);
  }

  if (!isRecord(error.error)) {
    return getApiErrorMessage(error);
  }

  const errors = (error.error as { errors: unknown }).errors;

  if (!isApiValidationErrors(errors)) {
    return getApiErrorMessage(error);
  }

  for (const [key, fieldErrors] of Object.entries(errors)) {
    if (form.controls[key] && isDefined(fieldErrors) && fieldErrors.length > 0) {
      form.controls[key].markAsTouched();
      form.controls[key].markAsDirty();
      form.controls[key].setErrors({ [API_VALIDATION_ERROR]: fieldErrors[0] });
    }
  }

  return undefined;
}
