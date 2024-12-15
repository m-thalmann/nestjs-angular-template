import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthAbility } from '../../auth';
import { User } from '../../users';

export const AuthorizeAbility = createParamDecorator((data: void, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User }>();

  return AuthAbility.createForUser(request.user);
});
