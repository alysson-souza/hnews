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
    component.currentPage = 2;
    component.itemsPerPage = 10;
    component.totalCount = 25;

    expect(component.startItem).toBe(11);
    expect(component.endItem).toBe(20);
  });

  it('should show correct visible pages', () => {
    component.currentPage = 5;
    component.totalPages = 10;
    component.maxVisiblePages = 5;

    const visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([3, 4, 5, 6, 7]);
  });

  it('should emit page change when going to next page', () => {
    vi.spyOn(component.pageChange, 'emit');
    component.currentPage = 1;
    component.totalPages = 3;

    component.nextPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should emit page change when going to previous page', () => {
    vi.spyOn(component.pageChange, 'emit');
    component.currentPage = 3;

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
    component.currentPage = 1;
    component.totalPages = 3;
    component.maxVisiblePages = 5;

    let visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([1, 2, 3]);

    // Test when current page is near the end
    component.currentPage = 10;
    component.totalPages = 10;
    component.maxVisiblePages = 5;

    visiblePages = component.visiblePages;
    expect(visiblePages).toEqual([6, 7, 8, 9, 10]);
  });
});
