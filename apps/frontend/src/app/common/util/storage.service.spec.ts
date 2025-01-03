import { StorageService } from './storage.service';

class StorageServiceTestClass extends StorageService {
  static getPrefix(): string {
    return StorageService.PREFIX;
  }

  static override generateKey(key: string): string {
    return super.generateKey(key);
  }
}

describe('StorageService', () => {
  let service: StorageServiceTestClass;

  let mockStorage: Partial<Storage>;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    service = new StorageServiceTestClass(mockStorage as Storage);
  });

  describe('get', () => {
    it('should return the default value if the key does not exist', () => {
      const key = 'key';
      const defaultValue = 'default';

      (mockStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = service.get(key, defaultValue);

      expect(result).toBe(defaultValue);
      expect(mockStorage.getItem).toHaveBeenCalledWith(StorageServiceTestClass.generateKey(key));
    });

    it('should return the value for the key', () => {
      const key = 'key';
      const value = 'value';

      (mockStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(value));

      const result = service.get(key);

      expect(result).toBe(value);
    });

    it('should return the default value if the value cannot be parsed', () => {
      const key = 'key';
      const defaultValue = 'default';

      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid');

      const result = service.get(key, defaultValue);

      expect(result).toBe(defaultValue);
    });
  });

  describe('set', () => {
    it('should set the value for the key', () => {
      const key = 'key';
      const value = 'value';

      service.set(key, value);

      expect(mockStorage.setItem).toHaveBeenCalledWith(StorageServiceTestClass.generateKey(key), JSON.stringify(value));
    });
  });

  describe('remove', () => {
    it('should remove the value for the key', () => {
      const key = 'key';

      service.remove(key);

      expect(mockStorage.removeItem).toHaveBeenCalledWith(StorageServiceTestClass.generateKey(key));
    });
  });

  describe('generateKey', () => {
    it('should generate the key', () => {
      const key = 'key';

      const result = StorageServiceTestClass.generateKey(key);

      expect(result).toBe(`${StorageServiceTestClass.getPrefix()}${key}`);
    });
  });
});
