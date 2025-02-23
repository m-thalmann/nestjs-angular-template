import { EnvironmentProviders } from '@angular/core';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { AuraBaseDesignTokens } from '@primeng/themes/aura/base';
import { providePrimeNG } from 'primeng/config';

type PrimaryColor = keyof Omit<Required<Required<AuraBaseDesignTokens>['primitive']>, 'borderRadius'>;

/**
 * @param primary Primary color name from https://primeng.org/theming#colors
 * @returns The theme preset
 */
function getAppTheme(primary: PrimaryColor): unknown {
  return definePreset(Aura, {
    semantic: {
      primary: {
        50: `{${primary}.50}`,
        100: `{${primary}.100}`,
        200: `{${primary}.200}`,
        300: `{${primary}.300}`,
        400: `{${primary}.400}`,
        500: `{${primary}.500}`,
        600: `{${primary}.600}`,
        700: `{${primary}.700}`,
        800: `{${primary}.800}`,
        900: `{${primary}.900}`,
        950: `{${primary}.950}`,
      },
    },
  });
}

export function provideTheme(): EnvironmentProviders {
  return providePrimeNG({ theme: { preset: getAppTheme('blue') } });
}
