import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { SidebarThreadNavigationService } from './sidebar-thread-navigation.service';
describe('thread navigation', () => {
  it('stores the keyboard opening intent on the new history entry', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const store = TestBed.inject(SidebarService);
    const navigation = TestBed.inject(SidebarThreadNavigationService);
    store.open(1);
    navigation.pushThread(2, { selectFirstVisibleOnOpen: true });
    expect(store.currentEntry()?.state.selectFirst).toBe(true);
    navigation.goBack();
    expect(store.currentItemId()).toBe(1);
    navigation.closeSidebar();
    expect(store.entries()).toEqual([]);
  });
  it('does not restart opening actions when the current discussion is pushed again', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const store = TestBed.inject(SidebarService);
    const navigation = TestBed.inject(SidebarThreadNavigationService);
    store.open(1);
    const entry = store.currentEntry()!;
    navigation.pushThread(1, { selectFirstVisibleOnOpen: true });
    expect(store.currentEntry()).toBe(entry);
    expect(entry.state.selectFirst).toBe(false);
    expect(entry.state.scrollFirst).not.toBe(true);
  });
});
