import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavItemComponent } from './nav-item.component';

describe('NavItemComponent', () => {
  let component: NavItemComponent;
  let fixture: ComponentFixture<NavItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavItemComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('link', '/test');
    fixture.componentRef.setInput('label', 'Test');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });
});
