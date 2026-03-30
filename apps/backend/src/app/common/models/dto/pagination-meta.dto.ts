import { ApiProperty } from '@nestjs/swagger';
import { PaginationParams } from '../types/pagination';

export class PaginationMetaDto {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description: 'Total amount of items',
  })
  declare total: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Amount of items per page',
  })
  declare pageSize: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Current page number',
  })
  declare currentPage: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description: 'Last page number',
  })
  declare lastPage: number;

  static build(paginationParams: PaginationParams, total: number): PaginationMetaDto {
    const { pageSize, page } = paginationParams;

    const paginationMeta = new PaginationMetaDto();
    paginationMeta.total = total;
    paginationMeta.pageSize = pageSize;
    paginationMeta.currentPage = page;
    paginationMeta.lastPage = Math.ceil(total / pageSize);

    return paginationMeta;
  }
}
