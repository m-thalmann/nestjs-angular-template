import {
  isDefined,
  isEmptyString,
  isNone,
  isNotNone,
  isNotNull,
  isNull,
  isRecord,
  isString,
  isUndefined,
} from './typeguards';

describe('Typeguards', () => {
  describe('isDefined', () => {
    it('should return true for a defined value', () => {
      expect(isDefined('value')).toBe(true);
    });

    it('should return true for null', () => {
      expect(isDefined(null)).toBe(true);
    });

    it('should return true for 0 and false', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isUndefined', () => {
    it('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isUndefined(null)).toBe(false);
    });

    it('should return false for a defined value', () => {
      expect(isUndefined('value')).toBe(false);
      expect(isUndefined(0)).toBe(false);
    });
  });

  describe('isNull', () => {
    it('should return true for null', () => {
      expect(isNull(null)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isNull(undefined)).toBe(false);
    });

    it('should return false for a non-null value', () => {
      expect(isNull('value')).toBe(false);
      expect(isNull(0)).toBe(false);
    });
  });

  describe('isNotNull', () => {
    it('should return true for a non-null value', () => {
      expect(isNotNull('value')).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNotNull(undefined)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isNotNull(null)).toBe(false);
    });
  });

  describe('isNone', () => {
    it('should return true for null', () => {
      expect(isNone(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNone(undefined)).toBe(true);
    });

    it('should return false for a defined non-null value', () => {
      expect(isNone('value')).toBe(false);
      expect(isNone(0)).toBe(false);
      expect(isNone(false)).toBe(false);
    });
  });

  describe('isNotNone', () => {
    it('should return true for a defined non-null value', () => {
      expect(isNotNone('value')).toBe(true);
      expect(isNotNone(0)).toBe(true);
      expect(isNotNone(false)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isNotNone(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotNone(undefined)).toBe(false);
    });
  });

  describe('isRecord', () => {
    it('should return true for a plain object', () => {
      expect(isRecord({ key: 'value' })).toBe(true);
    });

    it('should return true for an empty object', () => {
      expect(isRecord({})).toBe(true);
    });

    it('should return false for an array', () => {
      expect(isRecord([])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('should return false for a primitive', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(42)).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for a string', () => {
      expect(isString('hello')).toBe(true);
    });

    it('should return true for an empty string', () => {
      expect(isString('')).toBe(true);
    });

    it('should return false for a number', () => {
      expect(isString(42)).toBe(false);
    });

    it('should return false for null and undefined', () => {
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isEmptyString', () => {
    it('should return true for an empty string', () => {
      expect(isEmptyString('')).toBe(true);
    });

    it('should return false for a non-empty string', () => {
      expect(isEmptyString('hello')).toBe(false);
      expect(isEmptyString(' ')).toBe(false);
    });

    it('should return false for a non-string value', () => {
      expect(isEmptyString(null)).toBe(false);
      expect(isEmptyString(undefined)).toBe(false);
      expect(isEmptyString(0)).toBe(false);
    });
  });
});
