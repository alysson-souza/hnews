// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepliesCounterComponent } from './replies-counter.component';

describe('RepliesCounterComponent', () => {
  let component: RepliesCounterComponent;
  let fixture: ComponentFixture<RepliesCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepliesCounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepliesCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should stop event propagation when expand button is clicked', () => {
    component.count = 5;
    fixture.detectChanges();

    const expandButton = fixture.nativeElement.querySelector('.expand-btn');
    expect(expandButton).toBeTruthy();

    const mockEvent = new MouseEvent('click', { bubbles: true });
    spyOn(mockEvent, 'stopPropagation');
    spyOn(component.expand, 'emit');

    component.onExpandClick(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.expand.emit).toHaveBeenCalled();
  });

  it('should emit expand event when button is clicked', (done) => {
    component.count = 5;
    component.expand.subscribe(() => {
      expect(true).toBe(true);
      done();
    });

    const mockEvent = new MouseEvent('click');
    component.onExpandClick(mockEvent);
  });
});
