import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthToken } from '../../auth/tokens/auth-token.entity';
import { User } from '../../users';

export const Auth = createParamDecorator((data: 'authToken' | 'user', ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User; authToken?: AuthToken }>();
  return request[data];
});
