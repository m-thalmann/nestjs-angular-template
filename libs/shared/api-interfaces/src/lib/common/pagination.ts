export const PAGINATION_QUERY_PAGE_KEY = 'page';
export const PAGINATION_QUERY_PAGE_SIZE_KEY = 'page-size';

export interface PaginationMeta {
  total: number;
  pageSize: number;
  currentPage: number;
  lastPage: number;
}
