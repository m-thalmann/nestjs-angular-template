import { HasPermissionsPipe } from '@backend/permissions';
import { createMockExecutionContext, executeParamDecorator } from '@backend/testing';
import { User } from '@backend/user';
import { BadRequestException, NotFoundException, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { createMockUser } from '../../app/user/testing';
import { ResolveEntity, ResolveEntityOptions } from './resolve-entity.decorator';

describe('ResolveEntity', () => {
  let moduleRef: ModuleRef;

  async function executeDecorator<TEntity>(options: {
    entity: Type<TEntity>;
    paramName: string;
    paramValue: string | undefined;
    options?: ResolveEntityOptions;
  }): Promise<TEntity> {
    const { entity, paramName, paramValue, options: resolveEntityOptions } = options;

    const requestParams: Record<string, string> = {};

    if (paramValue !== undefined) {
      requestParams[paramName] = paramValue;
    }

    const mockExecutionContext = createMockExecutionContext({ requestParams });

    const decorator =
      resolveEntityOptions === undefined ? ResolveEntity(paramName) : ResolveEntity(paramName, resolveEntityOptions);

    return await executeParamDecorator(decorator, {
      executionContext: mockExecutionContext,
      paramType: entity,
      moduleRef,
    });
  }

  let mockDataSource: Partial<DataSource>;
  let mockDataSourceFindOneBy: jest.Mock;

  let mockHasPermissionsPipe: Partial<HasPermissionsPipe<unknown>>;

  beforeEach(async () => {
    mockDataSourceFindOneBy = jest.fn();
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOneBy: mockDataSourceFindOneBy,
      }),
    };

    mockHasPermissionsPipe = {
      transform: jest.fn().mockImplementation((entity: unknown) => entity),
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: HasPermissionsPipe,
          useValue: mockHasPermissionsPipe,
        },
      ],
    }).compile();

    moduleRef = module.get(ModuleRef);
  });

  it('should return the entity when found', async () => {
    const mockEntity = createMockUser();
    mockDataSourceFindOneBy.mockResolvedValue(mockEntity);

    const result = await executeDecorator({
      entity: User,
      paramName: 'id',
      paramValue: 'some-id',
    });

    expect(result).toEqual(mockEntity);
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(User);
    expect(mockDataSourceFindOneBy).toHaveBeenCalledWith({ id: 'some-id' });
  });

  it('should throw NotFoundException when entity is not found', async () => {
    mockDataSourceFindOneBy.mockResolvedValue(null);

    await expect(
      executeDecorator({
        entity: User,
        paramName: 'id',
        paramValue: 'some-id',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should use provided entityKey from options for finding the entity', async () => {
    const mockEntity = createMockUser();
    mockDataSourceFindOneBy.mockResolvedValue(mockEntity);

    const result = await executeDecorator({
      entity: User,
      paramName: 'userId',
      paramValue: 'some-id',
      options: { entityKey: 'id' },
    });

    expect(result).toEqual(mockEntity);
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(User);
    expect(mockDataSourceFindOneBy).toHaveBeenCalledWith({ id: 'some-id' });
  });

  it('should throw BadRequestException when route param is missing', async () => {
    await expect(
      executeDecorator({
        entity: User,
        paramName: 'id',
        paramValue: undefined,
      }),
    ).rejects.toThrow(new BadRequestException('Missing route param: id'));
  });

  it('should throw error when entity type cannot be determined', async () => {
    await expect(
      executeDecorator({
        entity: 'string' as unknown as Type<unknown>,
        paramName: 'id',
        paramValue: 'some-id',
      }),
    ).rejects.toThrow(
      'Unable to determine the entity type for parameter at index 0 of TestClass -> testMethod. Make sure to provide an explicit entity type annotation',
    );
  });

  it('should throw error when entity type is not a registered TypeORM entity', async () => {
    class NotAnEntity {}

    await expect(
      executeDecorator({
        entity: NotAnEntity,
        paramName: 'id',
        paramValue: 'some-id',
      }),
    ).rejects.toThrow(
      'The type "NotAnEntity" of parameter at index 0 of TestClass -> testMethod is not a registered TypeORM entity. Make sure to provide a valid entity type annotation',
    );
  });

  it('should check permissions per default', async () => {
    const mockEntity = createMockUser();
    mockDataSourceFindOneBy.mockResolvedValue(mockEntity);

    const result = await executeDecorator({
      entity: User,
      paramName: 'id',
      paramValue: 'some-id',
    });

    expect(result).toEqual(mockEntity);
    expect(mockHasPermissionsPipe.transform).toHaveBeenCalledWith(mockEntity, expect.anything());
  });

  it('should not check permissions when checkPermissions option is false', async () => {
    const mockEntity = createMockUser();
    mockDataSourceFindOneBy.mockResolvedValue(mockEntity);

    const result = await executeDecorator({
      entity: User,
      paramName: 'id',
      paramValue: 'some-id',
      options: { checkPermissions: false },
    });

    expect(result).toEqual(mockEntity);
    expect(mockHasPermissionsPipe.transform).not.toHaveBeenCalled();
  });
});
