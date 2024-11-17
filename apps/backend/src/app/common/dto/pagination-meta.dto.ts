import { PaginationMeta } from '@app/shared-types';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description: 'Total amount of items',
  })
  total!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Amount of items per page',
  })
  perPage!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Current page number',
  })
  currentPage!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description: 'Last page number',
  })
  lastPage!: number;
}
