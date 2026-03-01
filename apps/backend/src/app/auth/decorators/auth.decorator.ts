import { User } from '@backend/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthToken } from '../../auth/tokens/auth-token.entity';

export const Auth = createParamDecorator((data: 'authToken' | 'user', ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User; authToken?: AuthToken }>();
  return request[data];
});
