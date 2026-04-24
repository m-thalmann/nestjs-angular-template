import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayoutCardComponent } from './auth-layout-card.component';

describe('AuthLayoutCardComponent', () => {
  let component: AuthLayoutCardComponent;
  let fixture: ComponentFixture<AuthLayoutCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('cardTitle', 'Test Title');
    fixture.componentRef.setInput('cardSubtitle', 'Test Subtitle');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });
});
