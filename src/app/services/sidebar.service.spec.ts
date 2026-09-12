import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SidebarService } from './sidebar.service';
describe('sidebar route lifecycle', () => {
  it('ends even a backed-out session when a route starts navigating', () => {
    const events = new Subject();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events } }] });
    const store = TestBed.inject(SidebarService);
    store.open(1);
    store.back();
    events.next(new NavigationStart(1, '/newest'));
    expect(store.entries()).toEqual([]);
    expect(store.canGoForward()).toBe(false);
  });
});
