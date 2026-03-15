import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import {
  PAGINATION_MAX_PAGE_SIZE,
  PAGINATION_QUERY_PAGE_KEY,
  PAGINATION_QUERY_PAGE_SIZE_KEY,
} from '../query-pagination-params.decorator';

export function ApiPaginationQueryParams(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiQuery({
      name: PAGINATION_QUERY_PAGE_KEY,
      schema: { type: 'integer', minimum: 1 },
      required: false,
      description: 'Page of the paginated items (starts with 1)',
    }),
    ApiQuery({
      name: PAGINATION_QUERY_PAGE_SIZE_KEY,
      schema: { type: 'integer', minimum: 1, maximum: PAGINATION_MAX_PAGE_SIZE },
      required: false,
      description: 'Amount of items per page',
    }),
  );
}
