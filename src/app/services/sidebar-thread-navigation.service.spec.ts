import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SidebarService } from './sidebar.service';
import { SidebarThreadNavigationService } from './sidebar-thread-navigation.service';

describe('SidebarThreadNavigationService', () => {
  let service: SidebarThreadNavigationService;
  let mockSidebarService: MockedObject<SidebarService>;
  let currentItemId: ReturnType<typeof signal<number | null>>;

  beforeEach(() => {
    currentItemId = signal<number | null>(100);
    mockSidebarService = {
      currentItemId,
      canGoBack: vi.fn().mockReturnValue(true),
      openSidebarWithSlideAnimation: vi.fn(),
      goBack: vi.fn(),
      closeSidebar: vi.fn(),
    } as unknown as MockedObject<SidebarService>;

    TestBed.configureTestingModule({
      providers: [
        SidebarThreadNavigationService,
        { provide: SidebarService, useValue: mockSidebarService },
      ],
    });

    service = TestBed.inject(SidebarThreadNavigationService);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should restore sidebar scroll position when going back', async () => {
    vi.useFakeTimers();

    let restoredSelection: number | null = null;
    service.registerSelectionCallbacks({
      captureSelectedCommentId: () => 42,
      restoreSelectedCommentId: (commentId) => {
        restoredSelection = commentId;
      },
      selectFirstVisibleComment: vi.fn(),
    });

    const container = document.createElement('div');
    container.className = 'sidebar-comments-panel';
    container.scrollTop = 280;
    document.body.appendChild(container);

    service.pushThread(200);
    container.scrollTop = 0;

    const goBackPromise = service.goBack();
    vi.advanceTimersByTime(350);
    await goBackPromise;

    expect(mockSidebarService.goBack).toHaveBeenCalled();
    expect(container.scrollTop).toBe(280);
    expect(restoredSelection).toBe(42);
  });
});
