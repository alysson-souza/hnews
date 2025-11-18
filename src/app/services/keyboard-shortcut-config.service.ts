// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { PwaUpdateService } from './pwa-update.service';

export type KeyboardContext = 'default' | 'sidebar' | 'global';

export interface KeyboardShortcut {
  key: string;
  contexts: KeyboardContext[];
  description: string;
  category: string;
  commandId: string; // Command ID to execute
  condition?: () => boolean; // Optional condition for availability
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutConfigService {
  private pwaUpdate = inject(PwaUpdateService);

  private shortcuts: KeyboardShortcut[] = [
    // Global shortcuts (available everywhere)
    {
      key: '?',
      contexts: ['global'],
      description: 'Show help',
      category: 'General',
      commandId: 'global.showHelp',
    },
    {
      key: '/',
      contexts: ['global'],
      description: 'Search',
      category: 'General',
      commandId: 'global.search',
    },
    {
      key: 't',
      contexts: ['global'],
      description: 'Toggle theme',
      category: 'General',
      commandId: 'global.toggleTheme',
    },
    {
      key: 'R',
      contexts: ['global'],
      description: 'Apply app update',
      category: 'General',
      commandId: 'global.applyUpdate',
      condition: () => this.pwaUpdate.updateAvailable(),
    },

    // Default context shortcuts (story list, sidebar closed)
    {
      key: 'j',
      contexts: ['default'],
      description: 'Next story',
      category: 'Navigation',
      commandId: 'story.next',
    },
    {
      key: 'k',
      contexts: ['default'],
      description: 'Previous story',
      category: 'Navigation',
      commandId: 'story.previous',
    },
    {
      key: 'h',
      contexts: ['default'],
      description: 'Previous tab',
      category: 'Navigation',
      commandId: 'navigation.previousTab',
    },
    {
      key: 'l',
      contexts: ['default'],
      description: 'Next tab',
      category: 'Navigation',
      commandId: 'navigation.nextTab',
    },
    {
      key: 'o',
      contexts: ['default'],
      description: 'Open story',
      category: 'Story Actions',
      commandId: 'story.open',
    },
    {
      key: 'O',
      contexts: ['default'],
      description: 'Open story in full page',
      category: 'Story Actions',
      commandId: 'story.openFull',
    },
    {
      key: 'c',
      contexts: ['default'],
      description: 'Open comments in sidebar',
      category: 'Story Actions',
      commandId: 'story.openComments',
    },
    {
      key: 'C',
      contexts: ['default'],
      description: 'Open comments page',
      category: 'Story Actions',
      commandId: 'story.openCommentsPage',
    },
    {
      key: 'r',
      contexts: ['default'],
      description: 'Refresh stories',
      category: 'Story Actions',
      commandId: 'story.refresh',
    },
    {
      key: 'Escape',
      contexts: ['default'],
      description: 'Close / Clear / Top',
      category: 'General',
      commandId: 'global.escape',
    },

    // Sidebar context shortcuts (sidebar open)
    {
      key: 'j',
      contexts: ['sidebar'],
      description: 'Next comment',
      category: 'Navigation',
      commandId: 'sidebar.nextComment',
    },
    {
      key: 'k',
      contexts: ['sidebar'],
      description: 'Previous comment',
      category: 'Navigation',
      commandId: 'sidebar.previousComment',
    },
    {
      key: 'o',
      contexts: ['sidebar'],
      description: 'Toggle expand/collapse comment',
      category: 'Comment Actions',
      commandId: 'sidebar.toggleExpand',
    },
    {
      key: 'u',
      contexts: ['sidebar'],
      description: 'Upvote comment',
      category: 'Comment Actions',
      commandId: 'sidebar.upvote',
    },
    {
      key: 'r',
      contexts: ['sidebar'],
      description: 'Expand replies',
      category: 'Comment Actions',
      commandId: 'sidebar.expandReplies',
    },
    {
      key: 'v',
      contexts: ['sidebar'],
      description: 'View comment thread',
      category: 'Comment Actions',
      commandId: 'sidebar.viewThread',
    },
    {
      key: 'b',
      contexts: ['sidebar'],
      description: 'Go back',
      category: 'Navigation',
      commandId: 'sidebar.back',
    },
    {
      key: 'Escape',
      contexts: ['sidebar'],
      description: 'Go back / Close sidebar',
      category: 'General',
      commandId: 'sidebar.backOrClose',
    },
  ];

  /**
   * Get all shortcuts for a specific context
   */
  getShortcutsForContext(context: KeyboardContext): KeyboardShortcut[] {
    return this.shortcuts.filter((shortcut) => {
      // Check if shortcut applies to this context
      if (!shortcut.contexts.includes(context)) {
        return false;
      }

      // Check optional condition
      if (shortcut.condition && !shortcut.condition()) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get a shortcut by key and context
   */
  getShortcut(key: string, context: KeyboardContext): KeyboardShortcut | undefined {
    // First try global shortcuts
    const globalShortcut = this.shortcuts.find(
      (s) => s.key === key && s.contexts.includes('global') && (!s.condition || s.condition()),
    );

    if (globalShortcut) {
      return globalShortcut;
    }

    // Then try context-specific shortcuts
    return this.shortcuts.find(
      (s) => s.key === key && s.contexts.includes(context) && (!s.condition || s.condition()),
    );
  }

  /**
   * Get all shortcuts grouped by category for display in help modal
   */
  getShortcutsByCategory(context: KeyboardContext): Map<string, KeyboardShortcut[]> {
    const shortcuts = [
      ...this.getShortcutsForContext('global'),
      ...this.getShortcutsForContext(context),
    ];

    const grouped = new Map<string, KeyboardShortcut[]>();

    for (const shortcut of shortcuts) {
      const category = shortcut.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(shortcut);
    }

    return grouped;
  }

  /**
   * Get all unique categories
   */
  getCategories(context: KeyboardContext): string[] {
    return Array.from(this.getShortcutsByCategory(context).keys());
  }
}
