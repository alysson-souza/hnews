// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { CommentSortService } from './comment-sort.service';

describe('CommentSortService', () => {
  let service: CommentSortService;
  let localStorageSpy: jasmine.SpyObj<Storage>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = window.localStorage;

    localStorageSpy = jasmine.createSpyObj('localStorage', [
      'getItem',
      'setItem',
      'clear',
      'removeItem',
    ]);
    localStorageSpy.getItem.and.returnValue(null);
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should be created', () => {
    service = TestBed.inject(CommentSortService);
    expect(service).toBeTruthy();
  });

  it('should default to "default" sort order', () => {
    localStorageSpy.getItem.and.returnValue(null);
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('default');
  });

  it('should load sort order from localStorage', () => {
    localStorageSpy.getItem.and.returnValue('best');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('best');
  });

  it('should fallback to default for invalid stored values', () => {
    localStorageSpy.getItem.and.returnValue('invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('default');
  });

  it('should accept all valid sort orders', () => {
    ['default', 'best', 'newest', 'oldest'].forEach((order) => {
      localStorageSpy.getItem.and.returnValue(order);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(CommentSortService);
      expect(newService.sortOrder()).toBe(order);
    });
  });

  it('should save sort order to localStorage', () => {
    service = TestBed.inject(CommentSortService);
    service.setSortOrder('newest');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith('hnews_comment_sort', 'newest');
  });

  it('should update signal when sort order changes', () => {
    service = TestBed.inject(CommentSortService);
    service.setSortOrder('oldest');
    expect(service.sortOrder()).toBe('oldest');

    service.setSortOrder('best');
    expect(service.sortOrder()).toBe('best');
  });

  it('should handle localStorage not available', () => {
    // Delete localStorage to simulate unavailable environment
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const newService = new CommentSortService();
    expect(newService.sortOrder()).toBe('default');

    expect(() => newService.setSortOrder('best')).not.toThrow();
  });
});
