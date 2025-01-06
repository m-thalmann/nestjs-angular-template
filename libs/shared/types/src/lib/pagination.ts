export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface PaginationParams {
  page: number;
  perPage?: number;
}

export const PAGINATION_QUERY_PARAMS = {
  PAGE: 'page',
  PER_PAGE: 'per-page',
} as const;
