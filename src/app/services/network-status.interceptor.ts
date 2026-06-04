// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { NetworkStateService } from './network-state.service';

@Injectable()
export class NetworkStatusInterceptor implements HttpInterceptor {
  private readonly network = inject(NetworkStateService);
  private readonly connectivitySignalOrigins = [
    'https://hacker-news.firebaseio.com/',
    'https://hn.algolia.com/',
  ];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && this.isConnectivitySignal(req.url)) {
          // Only remote data APIs prove network connectivity. Same-origin responses may be
          // served by the Angular service worker while the browser is actually offline.
          this.network.noteRequestSuccess();
        }
      }),
      catchError((error: unknown) => {
        // Mark offline only for connectivity-like errors from remote data APIs.
        if (error instanceof HttpErrorResponse && this.isConnectivitySignal(req.url)) {
          this.network.noteRequestFailure(error);
        }
        return throwError(() => error);
      }),
    );
  }

  private isConnectivitySignal(url: string): boolean {
    return this.connectivitySignalOrigins.some((origin) => url.startsWith(origin));
  }
}
