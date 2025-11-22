// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentSortDropdownComponent } from './comment-sort-dropdown.component';

describe('CommentSortDropdownComponent', () => {
  let component: CommentSortDropdownComponent;
  let fixture: ComponentFixture<CommentSortDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentSortDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentSortDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all sort options', () => {
    const select = fixture.nativeElement.querySelector('select');
    const options = select.querySelectorAll('option');

    expect(options.length).toBe(4);
    expect(options[0].value).toBe('default');
    expect(options[0].textContent).toContain('Default');
    expect(options[1].value).toBe('best');
    expect(options[1].textContent).toContain('Best');
    expect(options[2].value).toBe('newest');
    expect(options[2].textContent).toContain('Newest');
    expect(options[3].value).toBe('oldest');
    expect(options[3].textContent).toContain('Oldest');
  });

  it('should display current sort order as selected', () => {
    component.sortOrder = 'best';
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('best');
  });

  it('should emit sortChange when selection changes', () => {
    vi.spyOn(component.sortChange, 'emit');
    const select = fixture.nativeElement.querySelector('select');

    select.value = 'newest';
    select.dispatchEvent(new Event('change'));

    expect(component.sortChange.emit).toHaveBeenCalledWith('newest');
  });

  it('should emit correct value for each option', () => {
    vi.spyOn(component.sortChange, 'emit');
    const select = fixture.nativeElement.querySelector('select');

    (['default', 'best', 'newest', 'oldest'] as const).forEach((value) => {
      select.value = value;
      select.dispatchEvent(new Event('change'));
      expect(component.sortChange.emit).toHaveBeenCalledWith(value);
    });
  });

  it('should disable dropdown when loading', () => {
    component.loading = true;
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select');
    expect(select.disabled).toBe(true);
  });

  it('should enable dropdown when not loading', () => {
    component.loading = false;
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select');
    expect(select.disabled).toBe(false);
  });

  it('should show loading spinner when loading', () => {
    component.loading = true;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should hide loading spinner when not loading', () => {
    component.loading = false;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinner).toBeFalsy();
  });

  it('should have proper aria-label', () => {
    const select = fixture.nativeElement.querySelector('select');
    expect(select.getAttribute('aria-label')).toBe('Sort comments');
  });

  it('should be keyboard navigable', () => {
    const select = fixture.nativeElement.querySelector('select');
    expect(select.tagName.toLowerCase()).toBe('select');
    expect(select.disabled).toBe(false);
  });
});
