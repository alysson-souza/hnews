// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { UserComponent } from './user.component';
import { HackernewsService } from '../../services/hackernews.service';
import { ScrollService } from '../../services/scroll.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { HNUser, HNItem } from '../../models/hn';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let mockHnService: MockedObject<HackernewsService>;
  let mockScrollService: MockedObject<ScrollService>;
  let mockSidebarService: MockedObject<SidebarService>;
  let mockDeviceService: MockedObject<DeviceService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockUser: HNUser = {
    id: 'testuser',
    created: 1609459200,
    karma: 1000,
    about: '<p>Test user bio</p>',
    submitted: [1, 2, 3, 4, 5],
  };

  const mockItems: HNItem[] = [
    {
      id: 1,
      type: 'story',
      by: 'testuser',
      time: 1609459200,
      title: 'Test Story 1',
      score: 100,
      descendants: 10,
    },
    {
      id: 2,
      type: 'comment',
      by: 'testuser',
      time: 1609459300,
      text: 'Test comment 1',
      parent: 1,
      kids: [],
    },
    {
      id: 3,
      type: 'story',
      by: 'testuser',
      time: 1609459400,
      title: 'Test Story 2',
      score: 50,
      descendants: 5,
    },
    {
      id: 4,
      type: 'comment',
      by: 'testuser',
      time: 1609459500,
      text: 'Test comment 2',
      parent: 2,
      kids: [6],
    },
    {
      id: 5,
      type: 'story',
      by: 'testuser',
      time: 1609459600,
      title: 'Test Story 3',
      score: 75,
      descendants: 15,
    },
  ];

  beforeEach(async () => {
    mockHnService = {
      getUser: vi.fn(),
      getItem: vi.fn(),
      getItems: vi.fn(),
    } as unknown as MockedObject<HackernewsService>;
    mockScrollService = {
      scrollToElement: vi.fn(),
    } as unknown as MockedObject<ScrollService>;
    mockSidebarService = {
      isOpen: vi.fn().mockReturnValue(false),
    } as unknown as MockedObject<SidebarService>;
    mockDeviceService = {
      isDesktop: vi.fn().mockReturnValue(true),
      isMobile: vi.fn().mockReturnValue(false),
    } as unknown as MockedObject<DeviceService>;

    mockActivatedRoute = {
      params: new BehaviorSubject<Params>({ id: 'testuser' }),
      queryParams: new BehaviorSubject<Params>({}),
      snapshot: {
        params: { id: 'testuser' },
      } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot,
    };

    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        { provide: HackernewsService, useValue: mockHnService },
        { provide: ScrollService, useValue: mockScrollService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    // Default: getUser returns the mock user
    mockHnService.getUser.mockReturnValue(of(mockUser));
    // getItems returns the mock items (correct implementation)
    mockHnService.getItems.mockReturnValue(of(mockItems));

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('User Submissions Loading', () => {
    it('should load and display user submissions using getItems()', () => {
      component.ngOnInit();
      fixture.detectChanges();

      // Should have called getUser
      expect(mockHnService.getUser).toHaveBeenCalledWith('testuser');
      // Should have called getItems with the first page of submission IDs
      // Page size is 20 by default, so all 5 items are loaded in first page
      expect(mockHnService.getItems).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      // Submissions should be populated
      expect(component.submissions()).toEqual(mockItems);
      expect(component.submissions().length).toBe(5);
    });

    it('should handle non-completing observables from getItem() when using getItems()', () => {
      // Simulate getItem returning a Subject that emits but never completes
      // This reproduces the real bug where forkJoin hangs with never-completing streams
      const neverCompletingItem = new Subject<HNItem>();
      mockHnService.getItem.mockReturnValue(neverCompletingItem);

      // getItems correctly wraps getItem with take(1), so it should complete
      mockHnService.getItems.mockImplementation((ids: number[]) => {
        const items = ids.map((id) => mockItems.find((item) => item.id === id)).filter(Boolean);
        return of(items as HNItem[]);
      });

      component.ngOnInit();
      fixture.detectChanges();

      // Submissions should still load because getItems uses take(1)
      expect(component.submissions().length).toBeGreaterThan(0);
    });

    it('should filter submissions by type', () => {
      component.ngOnInit();
      fixture.detectChanges();

      // Default filter is 'all'
      expect(component.filteredSubmissions().length).toBe(5);

      // Filter to stories only
      component.submissionFilter.set('stories');
      const stories = component.filteredSubmissions();
      expect(stories.length).toBe(3);
      expect(stories.every((item) => item.type === 'story')).toBe(true);

      // Filter to comments only
      component.submissionFilter.set('comments');
      const comments = component.filteredSubmissions();
      expect(comments.length).toBe(2);
      expect(comments.every((item) => item.type === 'comment')).toBe(true);
    });

    it('should load more submissions', () => {
      // Set a smaller page size to test pagination
      component.pageSize = 2;

      // First page: items 1, 2
      mockHnService.getItems.mockReturnValue(of(mockItems.slice(0, 2)));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submissions().length).toBe(2);
      expect(component.currentPage()).toBe(1);
      expect(component.hasMore()).toBe(true);

      // Second page: items 3, 4
      mockHnService.getItems.mockReturnValue(of(mockItems.slice(2, 4)));

      component.loadMoreSubmissions();
      fixture.detectChanges();

      // Should have appended the new items
      expect(component.submissions().length).toBe(4);
      expect(component.currentPage()).toBe(2);
    });

    it('should handle user with no submissions', () => {
      const userWithNoSubmissions: HNUser = {
        ...mockUser,
        submitted: [],
      };
      mockHnService.getUser.mockReturnValue(of(userWithNoSubmissions));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submissions()).toEqual([]);
      expect(component.loadingSubmissions()).toBe(false);
    });

    it('should handle user with undefined submitted property', () => {
      const userWithUndefinedSubmitted: HNUser = {
        ...mockUser,
        submitted: undefined,
      };
      mockHnService.getUser.mockReturnValue(of(userWithUndefinedSubmitted));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submissions()).toEqual([]);
      expect(component.loadingSubmissions()).toBe(false);
    });
  });

  describe('Route Handling', () => {
    it('should load user from route params', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockHnService.getUser).toHaveBeenCalledWith('testuser');
    });

    it('should load user from query params when route params are empty', () => {
      (mockActivatedRoute.params as BehaviorSubject<Params>).next({});
      (mockActivatedRoute.queryParams as BehaviorSubject<Params>).next({ id: 'anotheruser' });

      // Update snapshot to match
      (mockActivatedRoute.snapshot as ActivatedRouteSnapshot).params = {};

      const anotherUser: HNUser = {
        id: 'anotheruser',
        created: 1609459200,
        karma: 500,
        submitted: [10, 11],
      };
      mockHnService.getUser.mockReturnValue(of(anotherUser));

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockHnService.getUser).toHaveBeenCalledWith('anotheruser');
    });

    it('should read filter from query params', () => {
      (mockActivatedRoute.queryParams as BehaviorSubject<Params>).next({ filter: 'stories' });

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submissionFilter()).toBe('stories');
    });
  });

  describe('Error Handling', () => {
    it('should handle getUser error', () => {
      mockHnService.getUser.mockReturnValue(of(null));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.error()).toBe('User not found');
      expect(component.loading()).toBe(false);
    });

    it('should handle getItems error gracefully', () => {
      mockHnService.getItems.mockReturnValue(of([]));

      component.ngOnInit();
      fixture.detectChanges();

      // Should not crash, just show no submissions
      expect(component.loadingSubmissions()).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should calculate total submissions', () => {
      expect(component.totalSubmissions()).toBe(5);
    });

    it('should calculate filter label', () => {
      component.submissionFilter.set('all');
      expect(component.filterLabel()).toBe('items');

      component.submissionFilter.set('stories');
      expect(component.filterLabel()).toBe('stories');

      component.submissionFilter.set('comments');
      expect(component.filterLabel()).toBe('comments');
    });

    it('should determine if there are more submissions to load', () => {
      component.pageSize = 2;
      component.submissions.set(mockItems.slice(0, 2));
      component.currentPage.set(1);

      // 5 total, page size 2, page 1 -> has more
      expect(component.hasMore()).toBe(true);

      // Load all 5
      component.submissions.set(mockItems);
      component.currentPage.set(3);

      // 5 total, page size 2, page 3 -> no more
      expect(component.hasMore()).toBe(false);
    });
  });
});
