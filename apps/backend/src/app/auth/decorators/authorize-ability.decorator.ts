import { User } from '@backend/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthAbility } from '../../auth/abilities/auth-ability';

export const AuthorizeAbility = createParamDecorator((data: undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User }>();

  return AuthAbility.createForUser(request.user);
});
