// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarCommentsHeaderComponent } from './sidebar-comments-header.component';
import { By } from '@angular/platform-browser';

describe('SidebarCommentsHeaderComponent', () => {
  let component: SidebarCommentsHeaderComponent;
  let fixture: ComponentFixture<SidebarCommentsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarCommentsHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarCommentsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit dismiss event when close button is clicked', () => {
    vi.spyOn(component.dismiss, 'emit');

    const closeBtn = fixture.debugElement.query(By.css('.close-btn'));
    closeBtn.nativeElement.click();

    expect(component.dismiss.emit).toHaveBeenCalled();
  });

  it('should render header with title', () => {
    const title = fixture.debugElement.query(By.css('.title'));
    expect(title.nativeElement.textContent.trim()).toBe('Comments');
  });

  it('should render close button', () => {
    const closeBtn = fixture.debugElement.query(By.css('.close-btn'));
    expect(closeBtn).toBeTruthy();
  });
});
