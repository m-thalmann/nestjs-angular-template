/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable max-classes-per-file */
import { Logger, LoggerType } from './logger';

describe('Logger', () => {
  describe('write', () => {
    it.each(Object.values(LoggerType))('should call console.%s with the correct scope and message', (type) => {
      const logger = new Logger('test');
      const consoleSpy = jest.spyOn(console, type).mockImplementation(() => {
        /* STUB */
      });

      logger.write(type, 'message');

      expect(consoleSpy).toHaveBeenCalledWith('%c test ', expect.any(String), 'message');

      consoleSpy.mockRestore();
    });
  });

  describe.each(Object.values(LoggerType))('%s', (type) => {
    it(`should call write with type ${type} and the correct message`, () => {
      const logger = new Logger('test');
      const writeMock = jest.fn();

      logger.write = writeMock;

      logger[type]('my message');

      expect(writeMock).toHaveBeenCalledWith(type, 'my message');
    });
  });

  describe('create', () => {
    it('should create a logger with the module name as scope', () => {
      class TestModule {}
      const logger = Logger.create(TestModule);
      expect(logger.scope).toBe('TestModule');
    });

    it('should remove leading underscore from module name', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class _TestModule {}
      const logger = Logger.create(_TestModule);
      expect(logger.scope).toBe('TestModule');
    });
  });
});
