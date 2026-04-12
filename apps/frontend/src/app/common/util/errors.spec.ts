import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { getApiErrorMessage, handleApiFormErrors, isApiValidationErrors } from './errors';

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

  describe('isApiValidationErrors', () => {
    it('should return true for valid ApiValidationErrors', () => {
      const errors = {
        field1: ['Error 1', 'Error 2'],
        field2: ['Error 3'],
      };

      expect(isApiValidationErrors(errors)).toBe(true);
    });

    it('should return false for non-object errors', () => {
      expect(isApiValidationErrors('Not an object')).toBe(false);
      expect(isApiValidationErrors(42)).toBe(false);
      expect(isApiValidationErrors(null)).toBe(false);
    });

    it('should return false if any field errors are not arrays', () => {
      const errors = {
        field1: 'Not an array',
        field2: ['Error 3'],
      };

      expect(isApiValidationErrors(errors)).toBe(false);
    });

    it('should return false if any field errors array contains non-string', () => {
      const errors = {
        field1: ['Error 1', 42],
        field2: ['Error 3'],
      };

      expect(isApiValidationErrors(errors)).toBe(false);
    });
  });

  describe('handleApiFormErrors', () => {
    it('should return API error message for non-validation errors', () => {
      const form = new FormGroup({});
      const error = new HttpErrorResponse({
        status: 500,
        error: { message: 'Server error' },
      });

      expect(handleApiFormErrors(error, form)).toBe('Server error');
    });

    it('should return API error message if error body is not an object', () => {
      const form = new FormGroup({});
      const error = new HttpErrorResponse({
        status: 422,
        error: 'Not an object',
      });

      expect(handleApiFormErrors(error, form)).toBe('An unexpected error has occurred (Code: 422).');
    });

    it('should return API error message if error body is null', () => {
      const form = new FormGroup({});
      const error = new HttpErrorResponse({
        status: 422,
        error: null,
      });

      expect(handleApiFormErrors(error, form)).toBe('An unexpected error has occurred (Code: 422).');
    });

    it('should return API error message if errors is not a valid ApiValidationErrors object', () => {
      const form = new FormGroup({});
      const error = new HttpErrorResponse({
        status: 422,
        error: { errors: 'Not a valid object' },
      });

      expect(handleApiFormErrors(error, form)).toBe('An unexpected error has occurred (Code: 422).');
    });

    it('should set form control errors and return undefined for valid ApiValidationErrors', () => {
      const form = new FormGroup({
        field1: new FormGroup({}),
        field2: new FormGroup({}),
        field3: new FormGroup({}),
        field4: new FormGroup({}),
      });

      const error = new HttpErrorResponse({
        status: 422,
        error: {
          errors: {
            field1: ['Error 1'],
            field2: ['Error 3'],
            fieldNotExisting: ['Error 11'],
            field4: [],
          },
        },
      });

      expect(handleApiFormErrors(error, form)).toBeUndefined();
      expect(form.controls.field1.errors).toEqual({ API_VALIDATION_ERROR: 'Error 1' });
      expect(form.controls.field2.errors).toEqual({ API_VALIDATION_ERROR: 'Error 3' });
      expect(form.controls.field3.errors).toEqual(null);
      expect(form.controls.field4.errors).toEqual(null);
    });
  });
});
