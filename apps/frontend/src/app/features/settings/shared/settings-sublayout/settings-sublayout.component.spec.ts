import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsSublayoutComponent } from './settings-sublayout.component';

describe('SettingsSublayoutComponent', () => {
  let component: SettingsSublayoutComponent;
  let fixture: ComponentFixture<SettingsSublayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSublayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsSublayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('settingsItems', () => {
    it('should contain the expected settings menu items', () => {
      expect(component.settingsItems).toEqual([
        {
          separator: true,
        },
        {
          label: 'Profile',
          routerLink: '/settings/profile',
          icon: 'pi pi-user-edit',
        },
      ]);
    });
  });
});
