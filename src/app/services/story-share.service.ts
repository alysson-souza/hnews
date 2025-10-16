// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal, computed } from '@angular/core';
import { HNItem } from '../models/hn';

@Injectable({
  providedIn: 'root',
})
export class StoryShareService {
  private copiedStory = signal(false);
  private copiedComments = signal(false);

  canUseWebShare = computed(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'share' in window.navigator && typeof window.navigator.share === 'function';
  });

  getStoryActionText = computed(() => {
    if (this.copiedStory()) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Story' : 'Copy Story Link';
  });

  getCommentsActionText = computed(() => {
    if (this.copiedComments()) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Comments' : 'Copy Comments Link';
  });

  isCopiedStory = computed(() => this.copiedStory());
  isCopiedComments = computed(() => this.copiedComments());

  private canShare(data: ShareData): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const nav = window.navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (typeof nav.canShare === 'function') {
      return nav.canShare(data);
    }
    return true;
  }

  async shareStory(story: HNItem): Promise<void> {
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    const shareData = {
      title: story.title,
      url: url,
    };

    // Try Web Share API first
    if (typeof window !== 'undefined' && window.navigator.share && this.canShare(shareData)) {
      try {
        await window.navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    await this.copyToClipboard(url);
    this.copiedStory.set(true);
    this.copiedComments.set(false);
    window.setTimeout(() => {
      this.copiedStory.set(false);
    }, 1500);
  }

  async shareComments(story: HNItem): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const url = `${window.location.origin}/item/${story.id}`;
    const shareData = {
      title: `${story.title} - Comments`,
      text: `Discussion on HNews`,
      url: url,
    };

    // Try Web Share API first
    if (window.navigator.share && this.canShare(shareData)) {
      try {
        await window.navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    await this.copyToClipboard(url);
    this.copiedComments.set(true);
    this.copiedStory.set(false);
    window.setTimeout(() => {
      this.copiedComments.set(false);
    }, 1500);
  }

  private async copyToClipboard(text: string): Promise<void> {
    if (typeof window === 'undefined' || !window.navigator.clipboard) {
      console.error('Clipboard API not available');
      return;
    }

    try {
      await window.navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  resetCopyStates(): void {
    this.copiedStory.set(false);
    this.copiedComments.set(false);
  }
}
