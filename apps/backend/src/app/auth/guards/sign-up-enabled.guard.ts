import { CanActivate, Inject, Injectable, MethodNotAllowedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfigDefinition } from '../../common/config';

@Injectable()
export class SignUpEnabledGuard implements CanActivate {
  constructor(
    @Inject(appConfigDefinition.KEY)
    private readonly appConfig: ConfigType<typeof appConfigDefinition>,
  ) {}

  canActivate(): boolean {
    if (this.appConfig.signUpEnabled) {
      return true;
    }

    throw new MethodNotAllowedException('Sign up is disabled');
  }
}
