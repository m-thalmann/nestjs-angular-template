import { PaginationMeta } from './pagination';

export interface ApiResponse<T> {
  data: T;
}

export interface ApiResponseWithPagination<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export interface ApiValidationErrorResponse {
  message: string;
  errors: Record<string, Array<string>>;
  statusCode: number;
}
