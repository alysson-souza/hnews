// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable } from '@angular/core';
import { HNItem } from '@models/hn';

@Injectable({
  providedIn: 'root',
})
export class StoryArchiveService {
  private readonly archiveOrigin = 'https://web.archive.org';

  getArchiveUrl(story: Pick<HNItem, 'url'> | null | undefined): string | null {
    const storyUrl = story?.url?.trim();
    if (!storyUrl) {
      return null;
    }

    try {
      const normalizedUrl = new URL(storyUrl);
      if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
        return null;
      }
      normalizedUrl.hash = '';

      const archiveUrl = new URL(this.archiveOrigin);
      archiveUrl.pathname = `/web/*/${normalizedUrl.toString()}`;
      return archiveUrl.toString();
    } catch {
      return null;
    }
  }
}
