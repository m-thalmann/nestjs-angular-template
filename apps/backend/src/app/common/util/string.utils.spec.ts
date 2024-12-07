import { generateRandomString } from './string.utils';

describe('String utils', () => {
  describe('generateRandomString', () => {
    it('should generate a random string', () => {
      const length = 10;

      const result = generateRandomString(length);

      expect(result).toHaveLength(length);
    });
  });
});
