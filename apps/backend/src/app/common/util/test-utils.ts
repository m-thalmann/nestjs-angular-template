import { Request } from 'express';

export function createMockRequest(options: { query: Record<string, unknown> }): Request {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { query: options.query } as Request;
}
