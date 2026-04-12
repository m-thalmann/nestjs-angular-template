import { isString } from '../types/typeguards';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isString(error)) {
    return error;
  }

  return 'Unknown error';
}
