import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { SidebarKeyboardNavigationService } from './sidebar-keyboard-navigation.service';

describe('discussion history', () => {
  let store: SidebarService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    store = TestBed.inject(SidebarService);
  });
  it('backs out to the page and reopens with forward', () => {
    store.open(1);
    store.back();
    expect(store.isOpen()).toBe(false);
    expect(store.canGoForward()).toBe(true);
    store.back();
    store.forward();
    expect(store.currentItemId()).toBe(1);
    store.forward();
    expect(store.currentItemId()).toBe(1);
  });
  it('branches and close ends the session immediately', () => {
    store.open(1);
    store.push(2);
    store.back();
    store.push(3);
    expect(store.entries().map((e) => e.itemId)).toEqual([1, 3]);
    expect(store.canGoForward()).toBe(false);
    store.close();
    expect(store.entries()).toEqual([]);
    store.forward();
    expect(store.currentItemId()).toBeNull();
  });
  it('preserves independent reading state and bounds rendered neighbors', () => {
    store.open(1);
    const first = store.entries()[0];
    first.state.scrollTop = 320;
    first.state.selectedCommentId.set(11);
    store.push(2);
    store.push(3);
    store.push(4);
    expect(store.visibleEntries().length).toBeLessThanOrEqual(3);
    store.back();
    store.back();
    store.back();
    expect(store.entries()[store.position()].state.scrollTop).toBe(320);
    expect(store.entries()[store.position()].state.selectedCommentId()).toBe(11);
  });
  it('keeps keyboard selection with each entry across Back and Forward', () => {
    const keyboard = TestBed.inject(SidebarKeyboardNavigationService);
    store.open(1);
    keyboard.selectedCommentId.set(101);
    store.push(2);
    keyboard.selectedCommentId.set(201);
    store.back();
    expect(keyboard.selectedCommentId()).toBe(101);
    store.forward();
    expect(keyboard.selectedCommentId()).toBe(201);
    store.close();
    expect(keyboard.selectedCommentId()).toBeNull();
  });
});
