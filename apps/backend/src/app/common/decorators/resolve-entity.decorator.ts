import { HasPermissionsPipe } from '@backend/permissions';
import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NotFoundException,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { ApiParam } from '@nestjs/swagger';
import { isDefined, isNull, isUndefined } from '@shared/common';
import { DataSource, FindOptionsWhere, getMetadataArgsStorage, ObjectLiteral } from 'typeorm';

export interface ResolveEntityOptions {
  /**
   * The name of the entity property to query by. Defaults to the route param name
   */
  entityKey?: string;
  /**
   * Whether to check permissions for the resolved entity. Defaults to `true`. Set this to `false` if you only want to resolve the entity but not check permissions for it
   */
  checkPermissions?: boolean;
}

interface EntityParamArgs<TEntity extends ObjectLiteral> {
  entityType: Type<TEntity>;
  paramKey: string;
  entityKey: string;
}

interface ResolveEntityParams {
  entityType: Type<ObjectLiteral>;
  entityKey: string;
  paramValue: string;
}

const EntityParamDecorator = createParamDecorator(
  <TEntity extends ObjectLiteral>(
    { entityType, paramKey, entityKey }: EntityParamArgs<TEntity>,
    ctx: ExecutionContext,
  ): ResolveEntityParams => {
    const request = ctx.switchToHttp().getRequest<{ params?: Record<string, string | undefined> }>();
    const value = request.params?.[paramKey];

    if (isUndefined(value)) {
      throw new BadRequestException(`Missing route param: ${paramKey}`);
    }

    return { entityType, entityKey, paramValue: value };
  },
);

@Injectable()
class ResolveEntityPipe<TEntity extends ObjectLiteral> implements PipeTransform<ResolveEntityParams, Promise<TEntity>> {
  constructor(private readonly dataSource: DataSource) {}

  async transform({ entityType, entityKey, paramValue }: ResolveEntityParams): Promise<TEntity> {
    const repository = this.dataSource.getRepository<TEntity>(entityType);
    const where: FindOptionsWhere<unknown> = { [entityKey]: paramValue };
    const entity = await repository.findOneBy(where);

    if (isNull(entity)) {
      throw new NotFoundException();
    }

    return entity;
  }
}

/**
 * Decorator to resolve a TypeORM entity based on a route parameter and inject it into the route handler.
 * The decorator retrieves the entity type from the parameter's type annotation and
 * uses the provided route parameter value to query the database for the corresponding entity.
 * If the entity is found, it is injected into the route handler; otherwise, a `NotFoundException` is thrown.
 * By default, the decorator also checks permissions for the resolved entity using the `HasPermissionsPipe`,
 * but this can be disabled via options.
 *
 * @param paramKey The name of the route parameter to use for resolving the entity
 * @param options Optional settings for the decorator
 * @returns A parameter decorator that resolves the specified entity and injects it into the route handler
 */
export function ResolveEntity(paramKey: string, options?: ResolveEntityOptions): ParameterDecorator {
  const { entityKey = paramKey, checkPermissions = true } = options ?? {};

  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (isUndefined(propertyKey)) {
      return;
    }

    // retrieve the entity type from the parameters signature
    const paramTypes = Reflect.getMetadata(PARAMTYPES_METADATA, target, propertyKey) as Array<unknown> | undefined;
    const entityType = paramTypes?.[parameterIndex] as Type<ObjectLiteral> | undefined;

    if (isUndefined(entityType) || typeof entityType !== 'function') {
      throw new Error(
        `Unable to determine the entity type for parameter at index ${parameterIndex} of ${target.constructor.name} -> ${String(propertyKey)}. Make sure to provide an explicit entity type annotation`,
      );
    }

    const isRegisteredEntity = getMetadataArgsStorage().tables.some((table) => table.target === entityType);

    if (!isRegisteredEntity) {
      throw new Error(
        `The type "${entityType.name}" of parameter at index ${parameterIndex} of ${target.constructor.name} -> ${String(propertyKey)} is not a registered TypeORM entity. Make sure to provide a valid entity type annotation`,
      );
    }

    // apply the entity param decorator to the parameter
    const pipes: Array<Type<PipeTransform>> = [ResolveEntityPipe];

    if (checkPermissions) {
      pipes.push(HasPermissionsPipe);
    }

    const entityParamDecorator = EntityParamDecorator({ entityType, paramKey, entityKey }, ...pipes);

    entityParamDecorator(target, propertyKey, parameterIndex);

    // add openapi parameter decorator
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

    if (isDefined(descriptor)) {
      const apiParamDecorator = ApiParam({ name: paramKey, required: true, type: String });

      apiParamDecorator(target, propertyKey, descriptor);
    }
  };
}
