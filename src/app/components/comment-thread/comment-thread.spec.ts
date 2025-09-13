// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CacheManagerService } from '../../services/cache-manager.service';

import { CommentThread } from './comment-thread';

class MockCacheManagerService {
  get() {
    return Promise.resolve(undefined);
  }
  set() {
    return Promise.resolve();
  }
}

describe('CommentThread', () => {
  let component: CommentThread;
  let fixture: ComponentFixture<CommentThread>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentThread],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: CacheManagerService, useClass: MockCacheManagerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentThread);
    component = fixture.componentInstance;

    // Provide required inputs
    component.commentId = 123;
    component.depth = 0;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
