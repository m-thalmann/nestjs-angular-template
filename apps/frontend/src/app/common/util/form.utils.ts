import { AbstractControl, FormGroup } from '@angular/forms';
import { HttpValidationErrorResponse, isApiValidationResponse } from './error.utils';

/**
 * Adds the validation errors from the given validation error response to the given form.
 * @param validationErrorResponse
 * @param form
 * @param fieldsMap A map that maps the field names in the error response to the field names in the form
 * @returns Whether any validation errors were added to the form or not
 */
export function addValidationErrorsToForm(
  validationErrorResponse: HttpValidationErrorResponse,
  form: FormGroup,
  fieldsMap?: Record<string, string>,
): boolean {
  let foundError = false;

  const validationErrors = validationErrorResponse.error.errors;

  Object.entries(validationErrors).forEach(([controlName, errors]) => {
    const formControlName = fieldsMap?.[controlName] ?? controlName;

    const formControl = form.get(formControlName);

    if (formControl) {
      foundError = true;

      formControl.setErrors({
        serverError: errors[0],
      });
    }
  });

  return foundError;
}

/**
 * Handles any error that might have been thrown by submitting the given form and returns an error message if any should be shown.
 * @param error
 * @param form
 * @param fieldsMap A map that maps the field names in the error response to the field names in the form
 * @returns The error message that should be shown to the user or undefined if no error message should be shown
 */
export function handleApiErrorsForForm(
  error: unknown,
  form: FormGroup,
  fieldsMap?: Record<string, string>,
): string | undefined {
  if (isApiValidationResponse(error)) {
    const validationErrorAdded = addValidationErrorsToForm(error, form, fieldsMap);

    if (!validationErrorAdded) {
      return error.error.message;
    }

    return undefined;
  }

  // TODO: needs more handling

  return undefined;
}

export function markAllFormControlsAsDirty(ctrl: AbstractControl): void {
  ctrl.markAsDirty({ onlySelf: true });
  const controls: Array<AbstractControl> =
    ctrl instanceof FormGroup ? Object.values(ctrl.controls) : ctrl instanceof FormArray ? ctrl.controls : [];
  controls.forEach((subCtrl) => recursiveMarkAsDirty(subCtrl));
}
