import { TestBed } from '@angular/core/testing';
import { CACHE_NAMESPACE_VERSION } from '../config/cache.config';
import { CacheKeyBuilderService } from './cache-key.util';

describe('CacheKeyBuilderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: CACHE_NAMESPACE_VERSION, useValue: 'v9' }],
    });
  });

  it('builds stable keys with sorted params', () => {
    const svc = TestBed.inject(CacheKeyBuilderService);
    const a = svc.build('search', { q: 'hn', page: 2, tags: ['story', 'comment'] });
    const b = svc.build('search', { tags: ['story', 'comment'], page: 2, q: 'hn' });
    expect(a).toBe(b);
    expect(a.startsWith('v9:search:')).toBe(true);
  });

  it('provides convenience helpers', () => {
    const svc = TestBed.inject(CacheKeyBuilderService);
    expect(svc.storyListKey('top')).toBe('v9:storyList:{type:top}');
    expect(svc.storyKey(123)).toBe('v9:story:{id:123}');
    expect(svc.userKey('alice')).toBe('v9:user:{id:alice}');
  });
});
