import { convertDateToUnixTimestamp } from './date.util';

describe('DateUtil', () => {
  describe('convertDateToUnixTimestamp', () => {
    it('should convert a date to a unix timestamp', () => {
      const date = new Date('2021-01-01T00:00:00Z');
      const expectedTimestamp = 1609459200;

      const result = convertDateToUnixTimestamp(date);

      expect(result).toBe(expectedTimestamp);
    });
  });
});
