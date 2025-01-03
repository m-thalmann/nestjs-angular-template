import { PAGINATION_QUERY_PARAMS, PaginationMeta, PaginationParams } from '@app/shared-types';

export const DEFAULT_PER_PAGE = 20;

export interface PaginationOptions extends Required<PaginationParams> {
  offset: number;
}

export function calculateLastPage(totalAmount: number, pageSize: number): number {
  return Math.ceil(totalAmount / pageSize);
}

export function buildPaginationOptions(queryParams: Record<string, string>): PaginationOptions {
  const page = parseInt(queryParams[PAGINATION_QUERY_PARAMS.PAGE] ?? '1', 10);
  const perPage = parseInt(queryParams[PAGINATION_QUERY_PARAMS.PER_PAGE] ?? DEFAULT_PER_PAGE.toString(), 10);

  const offset = (page - 1) * perPage;

  return { page, perPage, offset };
}

export function buildPaginationMeta(paginationOptions: PaginationOptions, totalAmount: number): PaginationMeta {
  return {
    total: totalAmount,
    perPage: paginationOptions.perPage,
    currentPage: paginationOptions.page,
    lastPage: calculateLastPage(totalAmount, paginationOptions.perPage),
  };
}
