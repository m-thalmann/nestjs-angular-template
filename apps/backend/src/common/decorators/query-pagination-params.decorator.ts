import { PaginationParams } from '@backend/models';
import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_MAX_PAGE_SIZE = 100;

export const PAGINATION_QUERY_PAGE_KEY = 'page';
export const PAGINATION_QUERY_PAGE_SIZE_KEY = 'page-size';

// TODO: automatically set apiquery decorators!
export const QueryPaginationParams = createParamDecorator<undefined, PaginationParams>(
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
