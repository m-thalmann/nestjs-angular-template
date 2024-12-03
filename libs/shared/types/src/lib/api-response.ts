import { PaginationMeta } from './pagination';

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedApiResponse<T> {
  data: T;
  meta: PaginationMeta;
}
