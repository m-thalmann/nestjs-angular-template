/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AuthToken } from '../tokens/auth-token.entity';

export function createMockAuthToken(): AuthToken {
  const authToken = new AuthToken();
  authToken.id = 1;
  authToken.uuid = '00000000-0000-0000-0000-000000000000';
  authToken.userId = 1;
  authToken.version = 1;
  authToken.name = null;
  authToken.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expires in 1 hour
  authToken.createdAt = new Date();

  return authToken;
}
