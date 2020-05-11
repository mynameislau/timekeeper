import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerMessagesComponent } from './timer-messages.component';

describe('TimerMessagesComponent', () => {
  let component: TimerMessagesComponent;
  let fixture: ComponentFixture<TimerMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimerMessagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimerMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
