import { FormControl, FormGroup } from '@angular/forms';
import { AppValidators, PASSWORDS_MISMATCH_ERROR } from '.';

describe('AppValidators.passwordsMatch', () => {
  it('should return null if the control is not a FormGroup', () => {
    const control = new FormControl('');
    const result = AppValidators.passwordsMatch('password', 'confirmPassword')(control);
    expect(result).toBeNull();
  });

  it.each(['password', 'confirmPassword'] as const)('should return null if %s control is missing', (controlName) => {
    const formGroup = new FormGroup({});

    if (controlName === 'password') {
      formGroup.addControl('confirmPassword', new FormControl(''));
    } else {
      formGroup.addControl('password', new FormControl(''));
    }

    const result = AppValidators.passwordsMatch('password', 'confirmPassword')(formGroup);
    expect(result).toBeNull();
  });

  it.each(['password', 'confirmPassword'] as const)('should return null if %s value is empty', (controlName) => {
    const formGroup = new FormGroup({
      password: new FormControl(controlName === 'password' ? '' : 'validPassword'),
      confirmPassword: new FormControl(controlName === 'confirmPassword' ? '' : 'validPassword'),
    });
    const result = AppValidators.passwordsMatch('password', 'confirmPassword')(formGroup);
    expect(result).toBeNull();
  });

  it('should return null if confirmPassword control already has errors which are which are not passwords mismatch error', () => {
    const formGroup = new FormGroup({
      password: new FormControl('validPassword'),
      confirmPassword: new FormControl('validPassword'),
    });
    formGroup.controls.confirmPassword.setErrors({ someOtherError: true });

    const result = AppValidators.passwordsMatch('password', 'confirmPassword')(formGroup);
    expect(result).toBeNull();
  });

  it('should set passwordsMismatch error on confirmPassword control if passwords do not match', () => {
    const formGroup = new FormGroup({
      password: new FormControl('validPassword'),
      confirmPassword: new FormControl('invalidPassword'),
    });

    AppValidators.passwordsMatch('password', 'confirmPassword')(formGroup);
    expect(formGroup.controls.confirmPassword.errors).toEqual({ [PASSWORDS_MISMATCH_ERROR]: true });
  });

  it('should clear errors on confirmPassword control if passwords match', () => {
    const formGroup = new FormGroup({
      password: new FormControl('validPassword'),
      confirmPassword: new FormControl('validPassword'),
    });
    formGroup.controls.confirmPassword.setErrors({ [PASSWORDS_MISMATCH_ERROR]: true });

    AppValidators.passwordsMatch('password', 'confirmPassword')(formGroup);
    expect(formGroup.controls.confirmPassword.errors).toBeNull();
  });
});
