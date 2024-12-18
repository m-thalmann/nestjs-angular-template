import { MethodNotAllowedException } from '@nestjs/common';
import { AppConfig } from '../../common/config/app.config';
import { SignUpEnabledGuard } from './sign-up-enabled.guard';

function buildMockAppConfig(signUpEnabled: boolean): AppConfig {
  return {
    signUpEnabled,
    basePath: '',
    port: 0,
    secret: '',
  };
}

describe('SignUpEnabledGuard', () => {
  it('should be defined', () => {
    expect(new SignUpEnabledGuard(buildMockAppConfig(false))).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if sign up is enabled', () => {
      const guard = new SignUpEnabledGuard(buildMockAppConfig(true));

      expect(guard.canActivate()).toBe(true);
    });

    it('should throw MethodNotAllowedException if sign up is disabled', () => {
      const guard = new SignUpEnabledGuard(buildMockAppConfig(false));

      expect(() => guard.canActivate()).toThrow(MethodNotAllowedException);
    });
  });
});
