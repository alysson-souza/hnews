// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate start and end items correctly', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('itemsPerPage', 10);
    fixture.componentRef.setInput('totalCount', 25);

    expect(component.startItem).toBe(11);
    expect(component.endItem).toBe(20);
  });

  it('should show correct visible pages', () => {
    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.componentRef.setInput('maxVisiblePages', 5);

    const visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([3, 4, 5, 6, 7]);
  });

  it('should emit page change when going to next page', () => {
    vi.spyOn(component.pageChange, 'emit');
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);

    component.nextPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should emit page change when going to previous page', () => {
    vi.spyOn(component.pageChange, 'emit');
    fixture.componentRef.setInput('currentPage', 3);

    component.previousPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should emit items per page change when selection changes', () => {
    vi.spyOn(component.itemsPerPageChange, 'emit');
    const event = { target: { value: '25' } } as unknown as Event;

    component.onItemsPerPageChange(event);

    expect(component.itemsPerPageChange.emit).toHaveBeenCalledWith(25);
  });

  it('should handle edge cases for visible pages', () => {
    // Test when current page is near the start
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('maxVisiblePages', 5);

    let visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([1, 2, 3]);

    // Test when current page is near the end
    fixture.componentRef.setInput('currentPage', 10);
    fixture.componentRef.setInput('totalPages', 10);
    fixture.componentRef.setInput('maxVisiblePages', 5);

    visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([6, 7, 8, 9, 10]);
  });
});
