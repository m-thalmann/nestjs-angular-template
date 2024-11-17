import { PaginationMeta } from '@app/shared-types';
import { Request } from 'express';

export const DEFAULT_PER_PAGE = 20;

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
}

export function calculateLastPage(totalAmount: number, pageSize: number): number {
  return Math.ceil(totalAmount / pageSize);
}

export function buildPaginationParams(req: Request): PaginationParams {
  const page = req.query.page === undefined ? 1 : parseInt(req.query.page as string, 10);
  const perPage =
    req.query['per-page'] === undefined ? DEFAULT_PER_PAGE : parseInt(req.query['per-page'] as string, 10);

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
