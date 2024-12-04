import { UnprocessableEntityException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  EntityClassType,
  UniqueValidationArguments,
  UniqueValidationOptions,
  UniqueValidator,
} from './unique.validator';

function buildMockValidationArguments<E>(
  entityClass: EntityClassType<E>,
  options: UniqueValidationOptions<E>,
  property: string,
  value: string,
): UniqueValidationArguments<E> {
  return {
    constraints: [entityClass, options],
    property,
    object: {},
    targetName: 'targetName',
    value,
  };
}

describe('UniqueValidator', () => {
  let validator: UniqueValidator;

  let mockGetRepository: jest.Mock;
  let mockRepositoryCount: jest.Mock;

  beforeEach(() => {
    mockRepositoryCount = jest.fn();
    mockGetRepository = jest.fn(() => ({
      count: mockRepositoryCount,
    }));

    // @ts-expect-error type mismatch
    const mockDataSource: DataSource = {
      getRepository: mockGetRepository,
    };

    validator = new UniqueValidator(mockDataSource);
  });

  describe('validate', () => {
    it('should return true if the amount of rows is less than or equal to 0', async () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';

      mockRepositoryCount.mockResolvedValue(0);

      const args = buildMockValidationArguments(entityName, {}, propertyName, value);

      const result = await validator.validate(value, args);

      expect(result).toBe(true);
      expect(mockGetRepository).toHaveBeenCalledWith(entityName);
      expect(mockRepositoryCount).toHaveBeenCalledWith({
        where: {
          [propertyName]: value,
        },
      });
    });

    it('should return false if the amount of rows is greater than 0', async () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';

      mockRepositoryCount.mockResolvedValue(1);

      const args = buildMockValidationArguments(entityName, {}, propertyName, value);

      const result = await validator.validate(value, args);

      expect(result).toBe(false);
    });

    it('should use the column option if provided', async () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';
      const column = 'column';

      mockRepositoryCount.mockResolvedValue(0);

      const args = buildMockValidationArguments(entityName, { column }, propertyName, value);

      await validator.validate(value, args);

      expect(mockRepositoryCount).toHaveBeenCalledWith({
        where: {
          [column]: value,
        },
      });
    });
  });

  describe('defaultMessage', () => {
    it('should return a default message', () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';

      const args = buildMockValidationArguments(entityName, {}, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`${entityName} with the same ${propertyName} already exists`);
    });

    it('should use the displayName option if provided', () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';
      const displayName = 'displayName';

      const args = buildMockValidationArguments(entityName, { displayName, column: 'something' }, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`${entityName} with the same ${displayName} already exists`);
    });

    it('should use the column option if provided', () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';
      const column = 'column';

      const args = buildMockValidationArguments(entityName, { column }, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`${entityName} with the same ${column} already exists`);
    });

    it('should use the entityDisplayName option if provided', () => {
      const propertyName = 'property';
      const entityName = 'Entity';
      const value = 'value';
      const entityDisplayName = 'entityDisplayName';

      const args = buildMockValidationArguments(entityName, { entityDisplayName }, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`${entityDisplayName} with the same ${propertyName.toString()} already exists`);
    });

    it('should use the entity name property if the entityDisplayName option is not provided', () => {
      const propertyName = 'property';
      const entity = { name: 'My Entity' };
      const value = 'value';

      // @ts-expect-error type mismatch
      const args = buildMockValidationArguments(entity, {}, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`${entity.name} with the same ${propertyName.toString()} already exists`);
    });

    it('should use "Entity" as the entity name if the entity is an object without a name property', () => {
      const propertyName = 'property';
      const value = 'value';

      // @ts-expect-error type mismatch
      const args = buildMockValidationArguments({}, {}, propertyName, value);

      const result = validator.defaultMessage(args);

      expect(result).toBe(`Entity with the same ${propertyName.toString()} already exists`);
    });
  });

  describe('validateProperty', () => {
    it('should call validate and return if the value is valid', async () => {
      validator.validate = jest.fn().mockResolvedValue(true);

      const entityClass = 'Entity';
      const column = 'column';
      const value = 'value';

      const options = { displayName: 'displayName', entityDisplayName: 'entityDisplayName' };

      await validator.validateProperty({ entityClass, column, value, ...options });

      const [validateCallValue, validateCallArgs] = (validator.validate as jest.Mock).mock.calls[0] as Parameters<
        typeof validator.validate
      >;

      expect(validateCallValue).toBe(value);
      expect(validateCallArgs.constraints).toEqual([entityClass, { ...options, column }]);
      expect(validateCallArgs.property).toBe(column);
    });

    it('should throw an UnprocessableEntityException if the value is invalid', async () => {
      const expectedMessage = 'expectedMessage';

      validator.validate = jest.fn().mockResolvedValue(false);
      validator.defaultMessage = jest.fn().mockReturnValue(expectedMessage);

      const entityClass = 'Entity';
      const column = 'column';
      const value = 'value';

      const options = { displayName: 'displayName', entityDisplayName: 'entityDisplayName' };

      try {
        await validator.validateProperty({ entityClass, column, value, ...options });
        fail('Expected an exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);

        const unprocessableEntityException = error as UnprocessableEntityException;
        expect((unprocessableEntityException.getResponse() as { message: Array<string> }).message).toEqual([
          expectedMessage,
        ]);
      }

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(validator.defaultMessage).toHaveBeenCalled();

      const [defaultMessageCallArgs] = (validator.defaultMessage as jest.Mock).mock.calls[0] as Parameters<
        typeof validator.defaultMessage
      >;

      expect(defaultMessageCallArgs.constraints).toEqual([entityClass, { ...options, column }]);
      expect(defaultMessageCallArgs.property).toBe(column);
    });
  });
});
