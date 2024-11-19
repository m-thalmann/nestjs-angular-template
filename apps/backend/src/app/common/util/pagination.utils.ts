import { PaginationMeta } from '@app/shared-types';

export const DEFAULT_PER_PAGE = 20;

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
}

export function calculateLastPage(totalAmount: number, pageSize: number): number {
  return Math.ceil(totalAmount / pageSize);
}

export function buildPaginationParams(queryParams: Record<string, string>): PaginationParams {
  const page = queryParams.page === undefined ? 1 : parseInt(queryParams.page, 10);
  const perPage = queryParams['per-page'] === undefined ? DEFAULT_PER_PAGE : parseInt(queryParams['per-page'], 10);

  const offset = (page - 1) * perPage;

  return { page, perPage, offset };
}

export function buildPaginationMeta(paginationParams: PaginationParams, totalAmount: number): PaginationMeta {
  return {
    total: totalAmount,
    perPage: paginationParams.perPage,
    currentPage: paginationParams.page,
    lastPage: calculateLastPage(totalAmount, paginationParams.perPage),
  };
}
