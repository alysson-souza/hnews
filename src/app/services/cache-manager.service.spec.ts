import { TestBed } from '@angular/core/testing';
import { CacheManagerService } from './cache-manager.service';
import { IndexedDBService } from './indexed-db.service';
import { CacheService } from './cache.service';

class IndexedDBServiceStub {
  get = jasmine.createSpy('get').and.returnValue(Promise.resolve(null));
  set = jasmine.createSpy('set').and.returnValue(Promise.resolve());
  clearAll = jasmine.createSpy('clearAll').and.returnValue(Promise.resolve());
  getStoryList = jasmine.createSpy('getStoryList').and.returnValue(Promise.resolve([]));
  setStoryList = jasmine.createSpy('setStoryList').and.returnValue(Promise.resolve());
  getStory = jasmine.createSpy('getStory').and.returnValue(Promise.resolve(null));
  setStory = jasmine.createSpy('setStory').and.returnValue(Promise.resolve());
  getUserProfile = jasmine.createSpy('getUserProfile').and.returnValue(Promise.resolve(null));
  setUserProfile = jasmine.createSpy('setUserProfile').and.returnValue(Promise.resolve());
  delete = jasmine.createSpy('delete').and.returnValue(Promise.resolve());
  count = jasmine.createSpy('count').and.returnValue(Promise.resolve(0));
  getStories = jasmine
    .createSpy('getStories')
    .and.returnValue(Promise.resolve(new Map<number, unknown>()));
  migrateFromLocalStorage = jasmine
    .createSpy('migrateFromLocalStorage')
    .and.returnValue(Promise.resolve());
}

class CacheServiceStub {
  get = jasmine.createSpy('get').and.returnValue(null);
  set = jasmine.createSpy('set');
  clear = jasmine.createSpy('clear');
}

describe('CacheManagerService (SWR)', () => {
  let service: CacheManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CacheManagerService,
        { provide: IndexedDBService, useClass: IndexedDBServiceStub },
        { provide: CacheService, useClass: CacheServiceStub },
      ],
    });
    service = TestBed.inject(CacheManagerService);
  });

  it('returns fresh cached value and triggers background refresh', async () => {
    // Arrange: first call returns cached value
    const key = 'foo';
    await service.set('storyList', key, [1, 2, 3]);

    // Act: call getWithSWR with a fetcher that would resolve to a different array
    const freshPromise = Promise.resolve([4, 5, 6]);
    const fetcher = () => freshPromise;
    const result = await service.getWithSWR<number[]>('storyList', key, fetcher);

    // Assert initial result is cached
    expect(result).toEqual([1, 2, 3]);

    // Wait for background refresh to complete
    await freshPromise;

    // Now the stored value should be the fresh one
    const updated = await service.get<number[]>('storyList', key);
    expect(updated).toEqual([4, 5, 6]);
  });

  it('emits updates for a key when set is called', (done) => {
    const key = 'bar';
    const updates$ = service.getUpdates<number[]>('storyList', key);
    const values: number[][] = [];

    const sub = updates$.subscribe((v) => {
      values.push(v);
      if (values.length === 2) {
        expect(values[0]).toEqual([1]);
        expect(values[1]).toEqual([1, 2]);
        sub.unsubscribe();
        done();
      }
    });

    service.set('storyList', key, [1]).then(() => service.set('storyList', key, [1, 2]));
  });
});
