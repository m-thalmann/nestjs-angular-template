import { getErrorMessage } from './errors';

describe('Errors Util', () => {
  describe('getErrorMessage', () => {
    it('should return the message of an Error object', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return the string if the error is a string', () => {
      const error = 'This is a string error';
      expect(getErrorMessage(error)).toBe('This is a string error');
    });

    it('should return "Unknown error" for non-string and non-Error inputs', () => {
      const error = { message: 'Not an Error instance' };
      expect(getErrorMessage(error)).toBe('Unknown error');
    });
  });
});
