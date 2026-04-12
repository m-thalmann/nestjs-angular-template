import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, contentChild, input, TemplateRef } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { API_VALIDATION_ERROR } from '@frontend/util';
import { isDefined, isNull } from '@shared/common';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-form-field',
  imports: [NgTemplateOutlet, Message],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  protected static FIELD_ID_SEQUENCE = 0;

  readonly id = `form-field-${FormFieldComponent.FIELD_ID_SEQUENCE++}`;

  readonly label = input.required<string>();
  readonly control = input<AbstractControl>();

  readonly inputTemplate = contentChild<TemplateRef<unknown>>('input');

  getControlErrorMessage(errors: ValidationErrors | null): string | null {
    if (isNull(errors)) {
      return null;
    }

    if (isDefined(errors['required'])) {
      return 'This field is required';
    }

    if (isDefined(errors['email'])) {
      return 'Please enter a valid email address';
    }

    if (isDefined(errors[API_VALIDATION_ERROR])) {
      return errors[API_VALIDATION_ERROR] as string;
    }

    return 'Invalid field';
  }
}
