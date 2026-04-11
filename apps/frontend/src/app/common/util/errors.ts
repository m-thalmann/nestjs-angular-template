import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { getErrorMessage } from '@shared/common';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status !== 0 && error.error !== null && error.error !== undefined) {
      if ('message' in error.error) {
        const errorData = error.error as { message: unknown };

        if (typeof errorData.message === 'string') {
          return errorData.message;
        }

        if (
          Array.isArray(errorData.message) &&
          errorData.message.length > 0 &&
          typeof errorData.message[0] === 'string'
        ) {
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
