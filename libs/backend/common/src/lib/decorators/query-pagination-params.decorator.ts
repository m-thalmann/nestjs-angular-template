import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PaginationParams } from '../types/pagination';

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'per-page';

export const QueryPaginationParams = createParamDecorator<undefined, PaginationParams>(
  (data: undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    const queryParams = request.query as Record<string, string>;

    const pageParam = queryParams[PAGE_KEY];
    const perPageParam = queryParams[PER_PAGE_KEY];

    const page = pageParam === undefined ? 1 : parseInt(pageParam, 10);
    const perPage = perPageParam === undefined ? DEFAULT_PER_PAGE : parseInt(perPageParam, 10);

    if (isNaN(page) || page < 1) {
      throw new BadRequestException('Invalid page parameter');
    }

    if (isNaN(perPage) || perPage < 1) {
      throw new BadRequestException('Invalid per-page parameter');
    }

    if (perPage > MAX_PER_PAGE) {
      throw new BadRequestException(`per-page parameter cannot exceed ${MAX_PER_PAGE}`);
    }

    return { page, perPage, offset: (page - 1) * perPage };
  },
);
