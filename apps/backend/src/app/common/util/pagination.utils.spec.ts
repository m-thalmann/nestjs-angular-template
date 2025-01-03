/* eslint-disable @typescript-eslint/no-magic-numbers */
import { PAGINATION_QUERY_PARAMS } from '@app/shared-types';
import { buildPaginationMeta, buildPaginationOptions, calculateLastPage, DEFAULT_PER_PAGE } from './pagination.utils';

describe('Pagination utils', () => {
  describe('calculateLastPage', () => {
    it('should calculate last page correctly', () => {
      const totalAmount = 100;
      const perPage = 20;

      const result = calculateLastPage(totalAmount, perPage);

      expect(result).toBe(5);
    });

    it('should calculate last page correctly when total amount is not divisible by per page', () => {
      const totalAmount = 105;
      const perPage = 20;

      const result = calculateLastPage(totalAmount, perPage);

      expect(result).toBe(6);
    });
  });

  describe('buildPaginationOptions', () => {
    it('should return page and per page from query', () => {
      const query = { [PAGINATION_QUERY_PARAMS.PAGE]: '2', [PAGINATION_QUERY_PARAMS.PER_PAGE]: '10' };

      const result = buildPaginationOptions(query);

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
    });

    it('should return default page if not defined', () => {
      const query = { [PAGINATION_QUERY_PARAMS.PER_PAGE]: '10' };

      const result = buildPaginationOptions(query);

      expect(result.page).toBe(1);
    });

    it('should return default per page if not defined', () => {
      const query = { [PAGINATION_QUERY_PARAMS.PAGE]: '1' };

      const result = buildPaginationOptions(query);

      expect(result.perPage).toBe(DEFAULT_PER_PAGE);
    });

    it('should return offset based on page and per page', () => {
      const query = { [PAGINATION_QUERY_PARAMS.PAGE]: '2', [PAGINATION_QUERY_PARAMS.PER_PAGE]: '10' };

      const result = buildPaginationOptions(query);

      expect(result.offset).toBe(10);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build pagination meta correctly', () => {
      const paginationOptions = { page: 2, perPage: 10, offset: 10 };
      const totalAmount = 100;

      const result = buildPaginationMeta(paginationOptions, totalAmount);

      expect(result.total).toBe(totalAmount);
      expect(result.perPage).toBe(10);
      expect(result.currentPage).toBe(2);
      expect(result.lastPage).toBe(10);
    });
  });
});
