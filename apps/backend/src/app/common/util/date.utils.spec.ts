import { convertDateToUnixTimestamp, getDateAfterMinutes } from './date.utils';

describe('DateUtils', () => {
  describe('convertDateToUnixTimestamp', () => {
    it('should convert a date to a unix timestamp', () => {
      const date = new Date('2021-01-01T00:00:00Z');
      const expectedTimestamp = 1609459200;

      const result = convertDateToUnixTimestamp(date);

      expect(result).toBe(expectedTimestamp);
    });
  });

  describe('getDateAfterMinutes', () => {
    it('should return a date after the given minutes', () => {
      const minutes = 5;
      const expectedDate = new Date();
      expectedDate.setMinutes(expectedDate.getMinutes() + minutes);

      const result = getDateAfterMinutes(minutes);

      expect(result.getTime() / 1000).toBeCloseTo(expectedDate.getTime() / 1000, 1);
    });
  });
});
