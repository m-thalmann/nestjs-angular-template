import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users';
import { AuthToken } from '../tokens/auth-token.entity';

export const Auth = createParamDecorator((data: 'authToken' | 'user', ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User; authToken?: AuthToken }>();
  return request[data];
});
