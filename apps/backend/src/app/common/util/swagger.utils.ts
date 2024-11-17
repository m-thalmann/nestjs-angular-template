import { applyDecorators } from '@nestjs/common';
import { ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { PaginationMetaDto } from '../dto/pagination-meta.dto';

export function getResponseSchema(
  // eslint-disable-next-line @typescript-eslint/ban-types
  dto: Function | string,
  options?: { isArray?: boolean; hasPagination?: boolean; nullable?: boolean; description?: string; example?: unknown },
): SchemaObject {
  let schema = undefined;

  if (typeof dto === 'string') {
    schema = { type: dto, nullable: options?.nullable, description: options?.description, example: options?.example };
  } else if (options?.nullable) {
    schema = {
      nullable: true,
      allOf: [{ $ref: getSchemaPath(dto) }],
      description: options.description,
      example: options.example,
    };
  } else {
    schema = { $ref: getSchemaPath(dto), description: options?.description, example: options?.example };
  }

  const dataSchema = options?.isArray ? { type: 'array', items: schema } : schema;

  const properties: SchemaObject['properties'] = {
    data: dataSchema,
  };

  const required = ['data'];

  if (options?.hasPagination) {
    properties.meta = {
      $ref: getSchemaPath(PaginationMetaDto),
    };
    required.push('meta');
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

export function ApiPaginationQueryParams(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      schema: { type: 'integer', minimum: 1 },
      required: false,
      description: 'Page of the paginated items (starts with 1)',
    }),
    ApiQuery({
      name: 'per-page',
      schema: { type: 'integer', minimum: 1 },
      required: false,
      description: 'Amount of items per page',
    }),
  );
}
