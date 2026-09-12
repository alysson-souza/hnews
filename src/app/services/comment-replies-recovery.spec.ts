import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CacheManagerService } from './cache-manager.service';
import { CommentRepliesLoaderService } from './comment-replies-loader.service';

describe('reply recovery through HTTP', () => {
  let loader: CommentRepliesLoaderService;
  let http: HttpTestingController;
  beforeEach(() => {
    const cache = new Map();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CommentRepliesLoaderService,
        {
          provide: CacheManagerService,
          useValue: {
            get: async (_scope: string, key: string) => cache.get(key) ?? null,
            set: async (_scope: string, key: string, value: unknown) => {
              cache.set(key, value);
            },
          },
        },
      ],
    });
    loader = TestBed.inject(CommentRepliesLoaderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('retries a partially failed page without skipping or duplicating replies', async () => {
    loader.configureKids([1, 2]);
    const success = vi.fn();
    loader.loadFirstPage(success);
    await Promise.resolve();
    http
      .expectOne('https://hacker-news.firebaseio.com/v0/item/1.json')
      .flush({ id: 1, type: 'comment', time: 1 });
    http
      .expectOne('https://hacker-news.firebaseio.com/v0/item/2.json')
      .error(new ProgressEvent('error'));
    await vi.waitFor(() => expect(loader.error()).toBe(true));
    expect(loader.repliesLoaded()).toBe(false);
    expect(loader.replies()).toEqual([]);
    expect(success).not.toHaveBeenCalled();
    loader.loadFirstPage(success);
    expect(loader.error()).toBe(false);
    await Promise.resolve();
    http.expectNone('https://hacker-news.firebaseio.com/v0/item/1.json');
    http
      .expectOne('https://hacker-news.firebaseio.com/v0/item/2.json')
      .flush({ id: 2, type: 'comment', time: 1 });
    await vi.waitFor(() => expect(loader.repliesLoaded()).toBe(true));
    expect(loader.replies().map((item) => item.id)).toEqual([1, 2]);
    expect(success).toHaveBeenCalledOnce();
  });

  it('accepts missing and deleted replies as a successful empty page', async () => {
    loader.configureKids([1, 2]);
    loader.loadFirstPage();
    await Promise.resolve();
    http.expectOne('https://hacker-news.firebaseio.com/v0/item/1.json').flush(null);
    http
      .expectOne('https://hacker-news.firebaseio.com/v0/item/2.json')
      .flush({ id: 2, type: 'comment', time: 1, deleted: true });
    await vi.waitFor(() => expect(loader.repliesLoaded()).toBe(true));
    expect(loader.error()).toBe(false);
    expect(loader.replies()).toEqual([]);
  });
});
