import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }

  return 'An unexpected error has occurred.';
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status !== 0 && error.error !== undefined) {
      const errorData = error.error as { message: Array<string> | string };

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return typeof errorData.message === 'string' ? errorData.message : errorData.message[0]!;
    }

    if (error.status === HttpStatusCode.GatewayTimeout.valueOf() || error.status === 0) {
      // gateway timeout -> offline

      return 'No server connection.';
    }

    return `An unexpected error has occurred (Code: ${error.status}).`;
  }

  return getErrorMessage(error);
}
