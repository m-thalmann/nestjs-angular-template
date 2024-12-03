import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource, EntitySchema, FindOptionsWhere, ObjectLiteral, ObjectType } from 'typeorm';

type EntityClassType<E> = EntitySchema<E> | ObjectType<E> | string;

interface UniqueValidationOptions<E> {
  /**
   * The database column to check. Defaults to the property name
   */
  column?: keyof E;
  /**
   * The display name of the property to use in the error message. Defaults to the property name
   */
  displayName?: string;
  /**
   * The display name of the entity to use in the error message. Default to the name property or 'Entity' if not available
   */
  entityDisplayName?: string;
}

interface UniqueValidationArguments<E> extends ValidationArguments {
  constraints: [EntityClassType<E>, UniqueValidationOptions<E> | undefined];
}

@ValidatorConstraint({ name: 'unique', async: true })
@Injectable()
export class UniqueValidator implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate<E>(value: string, args: UniqueValidationArguments<E>): Promise<boolean> {
    const [EntityClass, options] = args.constraints;

    const property = options?.column ?? args.property;

    const findOptions: { where: FindOptionsWhere<ObjectLiteral> } = {
      where: {
        [property]: value,
      },
    };

    const amountRows = await this.dataSource.getRepository(EntityClass).count(findOptions);

    return amountRows <= 0;
  }

  defaultMessage<E>(args: UniqueValidationArguments<E>): string {
    const [EntityClass, options] = args.constraints;

    const propertyName = options?.displayName ?? options?.column ?? args.property;
    let entityName = options?.entityDisplayName;

    if (entityName === undefined) {
      if (typeof EntityClass === 'object' && 'name' in EntityClass && typeof EntityClass.name === 'string') {
        entityName = EntityClass.name;
      } else {
        entityName = 'Entity';
      }
    }

    return `${entityName} with the same ${propertyName.toString()} already exists`;
  }

  async validateProperty<E>(
    args: Pick<UniqueValidationOptions<E>, 'displayName' | 'entityDisplayName'> & {
      entityClass: EntityClassType<E>;
      column: keyof E;
      value: string;
    },
  ): Promise<void> {
    const { entityClass, column, value, displayName, entityDisplayName } = args;

    const validationArgs: UniqueValidationArguments<E> = {
      constraints: [entityClass, { column, displayName, entityDisplayName }],
      property: column as string,
      value,
      object: {},
      targetName: '',
    };

    const isValid = await this.validate(value, validationArgs);

    if (isValid) {
      return;
    }

    throw new UnprocessableEntityException([this.defaultMessage(validationArgs)]);
  }
}

export function IsUnique<E>(
  entity: UniqueValidationArguments<E>['constraints'][0],
  args?: UniqueValidationArguments<E>['constraints'][1],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUnique',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, args],
      validator: UniqueValidator,
    });
  };
}
