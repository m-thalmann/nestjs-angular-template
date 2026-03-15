import { PaginationParams } from '@backend/models';
import { createMockExecutionContext, executeParamDecorator } from '@backend/testing';
import { BadRequestException } from '@nestjs/common';
import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
  QueryPaginationParams,
} from './query-pagination-params.decorator';

describe('QueryPaginationParams', () => {
  const executeDecorator = executeParamDecorator<PaginationParams>;

  it('should return default pagination params when no query parameters are provided', async () => {
    const mockContext = createMockExecutionContext({ requestQuery: {} });

    const result = await executeDecorator(QueryPaginationParams(), {
      executionContext: mockContext,
    });

    expect(result).toEqual({ page: 1, pageSize: PAGINATION_DEFAULT_PAGE_SIZE, offset: 0 });
  });

  it('should return correct pagination params when valid query parameters are provided', async () => {
    const mockContext = createMockExecutionContext({ requestQuery: { page: '2', 'page-size': '10' } });

    const result = await executeDecorator(QueryPaginationParams(), {
      executionContext: mockContext,
    });

    expect(result).toEqual({ page: 2, pageSize: 10, offset: 10 });
  });

  it.each(['0', 'abc'])('should throw BadRequestException for invalid page parameter (%s)', async (pageParam) => {
    const mockContext = createMockExecutionContext({ requestQuery: { page: pageParam } });

    await expect(executeDecorator(QueryPaginationParams(), { executionContext: mockContext })).rejects.toThrow(
      new BadRequestException('Invalid page parameter'),
    );
  });

  it.each(['0', 'abc'])(
    'should throw BadRequestException for invalid page-size parameter (%s)',
    async (pageSizeParam) => {
      const mockContext = createMockExecutionContext({ requestQuery: { 'page-size': pageSizeParam } });

      await expect(executeDecorator(QueryPaginationParams(), { executionContext: mockContext })).rejects.toThrow(
        new BadRequestException('Invalid page-size parameter'),
      );
    },
  );

  it('should throw BadRequestException when page-size exceeds maximum', async () => {
    const mockContext = createMockExecutionContext({
      requestQuery: { 'page-size': (PAGINATION_MAX_PAGE_SIZE + 1).toString() },
    });

    await expect(executeDecorator(QueryPaginationParams(), { executionContext: mockContext })).rejects.toThrow(
      new BadRequestException(`page-size parameter cannot exceed ${PAGINATION_MAX_PAGE_SIZE}`),
    );
  });
});
