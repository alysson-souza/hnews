// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { StoryArchiveService } from './story-archive.service';

describe('StoryArchiveService', () => {
  let service: StoryArchiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoryArchiveService);
  });

  it('should build a Wayback lookup URL for external stories', () => {
    expect(service.getArchiveUrl({ url: 'https://example.com/article' })).toBe(
      'https://web.archive.org/web/*/https://example.com/article',
    );
  });

  it('should drop fragments and preserve query strings in the archive URL', () => {
    expect(
      service.getArchiveUrl({
        url: 'https://example.com/article?ref=hnews&utm_source=test#section-2',
      }),
    ).toBe('https://web.archive.org/web/*/https://example.com/article%3Fref=hnews&utm_source=test');
  });

  it('should return null for stories without an external URL', () => {
    expect(service.getArchiveUrl({})).toBeNull();
  });

  it('should return null for invalid URLs', () => {
    expect(service.getArchiveUrl({ url: 'not-a-url' })).toBeNull();
  });

  it('should return null for non-http URLs', () => {
    expect(service.getArchiveUrl({ url: 'javascript:alert(1)' })).toBeNull();
  });
});
