import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthAbility } from '../../auth/abilities/auth-ability';
import { User } from '../../users/user.entity';

export const AuthorizeAbility = createParamDecorator((data: void, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User }>();

  return AuthAbility.createForUser(request.user);
});
