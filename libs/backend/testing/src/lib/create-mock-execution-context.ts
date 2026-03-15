import { User } from '@backend/user';
import { ExecutionContext } from '@nestjs/common';

export function createMockExecutionContext(options?: {
  request?: Record<string, unknown>;
  requestQuery?: Record<string, string>;
  requestParams?: Record<string, string>;
  requestUser?: User;
}): ExecutionContext {
  const { request, requestQuery, requestParams, requestUser } = options ?? {};

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        ...request,
        query: requestQuery ?? {},
        params: requestParams ?? {},
        user: requestUser ?? undefined,
      }),
    }),
    getHandler: jest.fn().mockReturnValue('mock-handler'),
    getClass: jest.fn().mockReturnValue('mock-class'),
  } as unknown as ExecutionContext;
}
