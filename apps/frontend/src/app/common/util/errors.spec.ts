import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { getApiErrorMessage } from './errors';

describe('Errors Util', () => {
  describe('getApiErrorMessage', () => {
    it('should return the message string from error body', () => {
      const error = new HttpErrorResponse({
        status: 400,
        error: { message: 'Bad request' },
      });

      expect(getApiErrorMessage(error)).toBe('Bad request');
    });

    it('should return the first message from an array error body', () => {
      const error = new HttpErrorResponse({
        status: 422,
        error: { message: ['Field is required', 'Field is too short'] },
      });

      expect(getApiErrorMessage(error)).toBe('Field is required');
    });

    it('should return unexpected error with status code when no message is present', () => {
      const error = new HttpErrorResponse({
        status: 422,
        error: {},
      });

      expect(getApiErrorMessage(error)).toBe('An unexpected error has occurred (Code: 422).');
    });

    it('should return unexpected error with status code when message is neither string nor string array', () => {
      const error = new HttpErrorResponse({
        status: 422,
        error: { message: 42 },
      });

      expect(getApiErrorMessage(error)).toBe('An unexpected error has occurred (Code: 422).');
    });

    it('should return "No server connection." for gateway timeout', () => {
      const error = new HttpErrorResponse({
        status: HttpStatusCode.GatewayTimeout,
        error: undefined,
      });

      expect(getApiErrorMessage(error)).toBe('No server connection.');
    });

    it('should return "No server connection." for status 0', () => {
      const error = new HttpErrorResponse({
        status: 0,
      });

      expect(getApiErrorMessage(error)).toBe('No server connection.');
    });

    it('should return unexpected error with status code when no error body', () => {
      const error = new HttpErrorResponse({
        status: 500,
        error: undefined,
      });

      expect(getApiErrorMessage(error)).toBe('An unexpected error has occurred (Code: 500).');
    });

    it('should delegate to getErrorMessage for non-HttpErrorResponse errors', () => {
      expect(getApiErrorMessage(new Error('Something broke'))).toBe('Something broke');
    });

    it('should return "Unknown error" for unknown error types', () => {
      expect(getApiErrorMessage(42)).toBe('Unknown error');
    });
  });
});
