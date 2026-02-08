import { PaginationMetaDto } from './pagination-meta.dto';

export interface ApiResponseDto<T> {
  data: T;
}

export interface ApiResponseWithPaginationDto<T> extends ApiResponseDto<T> {
  meta: PaginationMetaDto;
}
