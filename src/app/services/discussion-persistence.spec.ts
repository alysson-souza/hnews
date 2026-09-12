import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommentStateService } from './comment-state.service';

describe('discussion persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  function view() {
    return Injector.create({
      providers: [CommentStateService],
      parent: TestBed.inject(Injector),
    }).get(CommentStateService);
  }
  it('copies displayed reply pages without turning automatic expansion into a saved preference', () => {
    const parent = view();
    let displayed = { collapsed: false, repliesExpanded: true, loadedPages: 2 };
    const release = parent.registerRenderedState(11, () => displayed);
    const child = view();
    child.restore(parent.snapshot());
    expect(child.getLoadedPages(11)).toBe(2);
    expect(child.areRepliesExpanded(11)).toBe(true);

    displayed = { collapsed: true, repliesExpanded: true, loadedPages: 3 };
    release();
    expect(parent.snapshot().get(11)?.collapsed).toBe(true);
    expect(parent.snapshot().get(11)?.loadedPages).toBe(3);
    expect(child.isCollapsed(11)).toBe(false);
    expect(child.getLoadedPages(11)).toBe(2);
    expect(view().getState(11)).toBeUndefined();
    expect(localStorage.getItem('hn_comment_state.v1')).toBeNull();
  });
  it('keeps edits from two retained views when a discussion is reopened', () => {
    const parent = view(),
      child = view();
    parent.setCollapsed(11, true);
    child.setCollapsed(22, true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reopened = view();
    expect(reopened.isCollapsed(11)).toBe(true);
    expect(reopened.isCollapsed(22)).toBe(true);
  });
  it('merges only the changed fields when views contain the same comment', () => {
    const parent = view(),
      child = view();
    parent.setCollapsed(11, true);
    child.setLoadedPages(11, 3);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reopened = view();
    expect(reopened.isCollapsed(11)).toBe(true);
    expect(reopened.getLoadedPages(11)).toBe(3);
  });
  it('keeps per-view state independent while persisting bulk actions', () => {
    const parent = view(),
      child = view();
    parent.setCollapsedMany([11, 12], true);
    expect(child.isCollapsed(11)).toBe(false);
    child.setCollapsedMany([22], true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reopened = view();
    expect(reopened.isCollapsed(11)).toBe(true);
    expect(reopened.isCollapsed(12)).toBe(true);
    expect(reopened.isCollapsed(22)).toBe(true);
  });
});
