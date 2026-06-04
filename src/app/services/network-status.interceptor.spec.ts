// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NetworkStatusInterceptor } from './network-status.interceptor';
import { NetworkStateService } from './network-state.service';

class NetworkStateServiceStub {
  noteRequestSuccess = vi.fn();
  noteRequestFailure = vi.fn();
}

describe('NetworkStatusInterceptor', () => {
  let interceptor: NetworkStatusInterceptor;
  let network: NetworkStateServiceStub;

  beforeEach(() => {
    network = new NetworkStateServiceStub();

    TestBed.configureTestingModule({
      providers: [NetworkStatusInterceptor, { provide: NetworkStateService, useValue: network }],
    });

    interceptor = TestBed.inject(NetworkStatusInterceptor);
  });

  it('marks online after successful Hacker News API responses', () => {
    const req = new HttpRequest('GET', 'https://hacker-news.firebaseio.com/v0/topstories.json');
    const handler: HttpHandler = {
      handle: () => of(new HttpResponse({ status: 200 })),
    };

    interceptor.intercept(req, handler).subscribe();

    expect(network.noteRequestSuccess).toHaveBeenCalledOnce();
  });

  it('marks online after successful Algolia API responses', () => {
    const req = new HttpRequest('GET', 'https://hn.algolia.com/api/v1/search?query=angular');
    const handler: HttpHandler = {
      handle: () => of(new HttpResponse({ status: 200 })),
    };

    interceptor.intercept(req, handler).subscribe();

    expect(network.noteRequestSuccess).toHaveBeenCalledOnce();
  });

  it('ignores same-origin successes that may come from the service worker cache', () => {
    const req = new HttpRequest('GET', 'version.json');
    const handler: HttpHandler = {
      handle: () => of(new HttpResponse({ status: 200 })),
    };

    interceptor.intercept(req, handler).subscribe();

    expect(network.noteRequestSuccess).not.toHaveBeenCalled();
  });

  it('marks offline after remote data API connectivity failures', () => {
    const error = new HttpErrorResponse({ status: 0 });
    const req = new HttpRequest('GET', 'https://hn.algolia.com/api/v1/search?query=angular');
    const handler: HttpHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(req, handler).subscribe({ error: () => undefined });

    expect(network.noteRequestFailure).toHaveBeenCalledWith(error);
  });

  it('ignores same-origin failures for network state', () => {
    const req = new HttpRequest('GET', 'version.json');
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 0 })),
    };

    interceptor.intercept(req, handler).subscribe({ error: () => undefined });

    expect(network.noteRequestFailure).not.toHaveBeenCalled();
  });
});
