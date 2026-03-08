import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NotFoundException,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { DataSource, FindOptionsWhere, ObjectLiteral } from 'typeorm';

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

    if (value === undefined) {
      throw new BadRequestException(`Missing route param: ${paramKey}.`);
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

    if (entity === null) {
      throw new NotFoundException();
    }

    return entity;
  }
}

export function ResolveEntity<TEntity extends ObjectLiteral>(
  entityType: Type<TEntity>,
  paramKey: string,
  options: { entityKey?: string } = {},
  ...pipes: Array<PipeTransform | Type<PipeTransform>>
): ParameterDecorator {
  const { entityKey = paramKey } = options;

  const entityParamDecorator = EntityParamDecorator({ entityType, paramKey, entityKey }, ResolveEntityPipe, ...pipes);
  const apiParamDecorator = ApiParam({ name: paramKey, required: true, type: String });

  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    entityParamDecorator(target, propertyKey, parameterIndex);

    if (propertyKey !== undefined) {
      const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

      if (descriptor !== undefined) {
        apiParamDecorator(target, propertyKey, descriptor);
      }
    }
  };
}
