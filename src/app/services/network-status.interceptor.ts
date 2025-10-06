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

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // Any successful response indicates connectivity is OK
          this.network.noteRequestSuccess();
        }
      }),
      catchError((error: unknown) => {
        // Mark offline only for connectivity-like errors
        if (error instanceof HttpErrorResponse) {
          this.network.noteRequestFailure(error);
        }
        return throwError(() => error);
      }),
    );
  }
}
