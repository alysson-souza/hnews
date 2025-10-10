// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RepliesCounterComponent } from './replies-counter.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

describe('RepliesCounterComponent', () => {
  let component: RepliesCounterComponent;
  let fixture: ComponentFixture<RepliesCounterComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSidebarService: jasmine.SpyObj<SidebarService>;
  let mockDeviceService: jasmine.SpyObj<DeviceService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSidebarService = jasmine.createSpyObj('SidebarService', ['openSidebarWithSlideAnimation']);
    mockDeviceService = jasmine.createSpyObj('DeviceService', ['isMobile']);

    await TestBed.configureTestingModule({
      imports: [RepliesCounterComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: DeviceService, useValue: mockDeviceService },
      ],
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

  it('should stop event propagation when view thread button is clicked', () => {
    component.commentId = 123;
    mockDeviceService.isMobile.and.returnValue(false);
    fixture.detectChanges();

    const mockEvent = new MouseEvent('click', { bubbles: true });
    spyOn(mockEvent, 'stopPropagation');

    component.viewThreadInSidebar(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockSidebarService.openSidebarWithSlideAnimation).toHaveBeenCalledWith(123);
  });

  it('should navigate on mobile when view thread button is clicked', () => {
    component.commentId = 123;
    mockDeviceService.isMobile.and.returnValue(true);

    const mockEvent = new MouseEvent('click');
    component.viewThreadInSidebar(mockEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/item', 123]);
  });
});
