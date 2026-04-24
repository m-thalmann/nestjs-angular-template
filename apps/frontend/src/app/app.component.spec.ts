import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  let mockMessageService: Partial<MessageService>;

  beforeEach(async () => {
    mockMessageService = {};

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: MessageService, useValue: mockMessageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeDefined();
  });
});
