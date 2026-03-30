import { PaginationParams } from '@backend/models';
import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PAGINATION_QUERY_PAGE_KEY, PAGINATION_QUERY_PAGE_SIZE_KEY } from '@shared/api-interfaces';
import { FastifyRequest } from 'fastify';

export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_MAX_PAGE_SIZE = 100;

const QueryPaginationParamsDecorator = createParamDecorator<undefined, PaginationParams>(
  (data: undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    const queryParams = request.query as Record<string, string>;

    const pageParam = queryParams[PAGINATION_QUERY_PAGE_KEY];
    const pageSizeParam = queryParams[PAGINATION_QUERY_PAGE_SIZE_KEY];

    const page = pageParam === undefined ? 1 : parseInt(pageParam, 10);
    const pageSize = pageSizeParam === undefined ? PAGINATION_DEFAULT_PAGE_SIZE : parseInt(pageSizeParam, 10);

    if (isNaN(page) || page < 1) {
      throw new BadRequestException(`Invalid ${PAGINATION_QUERY_PAGE_KEY} parameter`);
    }

    if (isNaN(pageSize) || pageSize < 1) {
      throw new BadRequestException(`Invalid ${PAGINATION_QUERY_PAGE_SIZE_KEY} parameter`);
    }

    if (pageSize > PAGINATION_MAX_PAGE_SIZE) {
      throw new BadRequestException(
        `${PAGINATION_QUERY_PAGE_SIZE_KEY} parameter cannot exceed ${PAGINATION_MAX_PAGE_SIZE}`,
      );
    }

    return { page, pageSize, offset: (page - 1) * pageSize };
  },
);

export function QueryPaginationParams(): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (propertyKey === undefined) {
      return;
    }

    const decorator = QueryPaginationParamsDecorator();

    decorator(target, propertyKey, parameterIndex);

    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

    if (descriptor !== undefined) {
      const queryPageDecorator = ApiQuery({
        name: PAGINATION_QUERY_PAGE_KEY,
        schema: { type: 'integer', minimum: 1 },
        required: false,
        description: 'Page of the paginated items (starts with 1)',
      });
      const queryPageSizeDecorator = ApiQuery({
        name: PAGINATION_QUERY_PAGE_SIZE_KEY,
        schema: { type: 'integer', minimum: 1, maximum: PAGINATION_MAX_PAGE_SIZE },
        required: false,
        description: 'Amount of items per page',
      });

      queryPageDecorator(target, propertyKey, descriptor);
      queryPageSizeDecorator(target, propertyKey, descriptor);
    }
  };
}
