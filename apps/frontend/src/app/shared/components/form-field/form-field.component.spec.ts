import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_VALIDATION_ERROR } from '@frontend/util';
import { FormFieldComponent } from './form-field.component';

const MOCK_LABEL = 'Test Label';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('label', MOCK_LABEL);

    fixture.detectChanges();
  });

  describe('getControlErrorMessage', () => {
    it('should return null if errors is null', () => {
      expect(component.getControlErrorMessage(null)).toBeNull();
    });

    it('should return required error message', () => {
      expect(component.getControlErrorMessage({ required: true })).toBe('This field is required');
    });

    it('should return email error message', () => {
      expect(component.getControlErrorMessage({ email: true })).toBe('Please enter a valid email address');
    });

    it('should return API validation error message', () => {
      const apiErrorMessage = 'API validation error';
      expect(component.getControlErrorMessage({ [API_VALIDATION_ERROR]: apiErrorMessage })).toBe(apiErrorMessage);
    });

    it('should return generic invalid field message for unknown errors', () => {
      expect(component.getControlErrorMessage({ unknownError: true })).toBe('Invalid field');
    });
  });
});
