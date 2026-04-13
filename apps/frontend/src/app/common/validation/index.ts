import { passwordsMatch } from './passwords-match';

export const AppValidators = {
  passwordsMatch,
} as const;

export { PASSWORDS_MISMATCH_ERROR } from './passwords-match';
