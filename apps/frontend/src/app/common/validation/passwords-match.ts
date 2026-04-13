import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { isEmptyString, isNone } from '@shared/common';

export const PASSWORDS_MISMATCH_ERROR = 'passwordsMismatch';

export function passwordsMatch(passwordControlName: string, confirmPasswordControlName: string): ValidatorFn {
  return (control: AbstractControl) => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const passwordControl = control.controls[passwordControlName];
    const confirmPasswordControl = control.controls[confirmPasswordControlName];

    if (
      isNone(passwordControl) ||
      isNone(confirmPasswordControl) ||
      isEmptyString(passwordControl.value) ||
      isEmptyString(confirmPasswordControl.value)
    ) {
      return null;
    }

    if (confirmPasswordControl.errors && isNone(confirmPasswordControl.errors[PASSWORDS_MISMATCH_ERROR])) {
      return null;
    }

    if (passwordControl.value === confirmPasswordControl.value) {
      confirmPasswordControl.setErrors(null);
    } else {
      confirmPasswordControl.setErrors({ [PASSWORDS_MISMATCH_ERROR]: true });
    }

    return null;
  };
}
