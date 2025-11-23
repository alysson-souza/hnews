// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject } from '@angular/core';
import { PwaUpdateService } from './pwa-update.service';

export type KeyboardContext = 'default' | 'sidebar' | 'global' | 'item-page' | 'settings-page';

export interface KeyboardShortcut {
  key: string;
  label?: string; // Optional label for display (e.g. "Shift+C")
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
      description: 'Search stories',
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
      label: 'Shift+r',
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
      description: 'Select next story',
      category: 'Navigation',
      commandId: 'story.next',
    },
    {
      key: 'k',
      contexts: ['default'],
      description: 'Select previous story',
      category: 'Navigation',
      commandId: 'story.previous',
    },
    {
      key: 'h',
      contexts: ['default'],
      description: 'Select previous tab',
      category: 'Navigation',
      commandId: 'navigation.previousTab',
    },
    {
      key: 'l',
      contexts: ['default'],
      description: 'Select next tab',
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
      key: 'a',
      contexts: ['default'],
      description: 'Toggle actions menu',
      category: 'Story Actions',
      commandId: 'story.actions.toggle',
    },
    {
      key: 'O',
      label: 'Shift+o',
      contexts: ['default'],
      description: 'Open story in new tab',
      category: 'Story Actions',
      commandId: 'story.openFull',
    },
    {
      key: 'c',
      contexts: ['default', 'sidebar'],
      description: 'Toggle comments sidebar',
      category: 'Story Actions',
      commandId: 'story.openComments',
    },
    {
      key: 'C',
      label: 'Shift+c',
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
      description: 'Clear selection / Close view',
      category: 'General',
      commandId: 'global.escape',
    },

    // Sidebar context shortcuts (sidebar open)
    {
      key: 'j',
      contexts: ['sidebar'],
      description: 'Select next comment',
      category: 'Navigation',
      commandId: 'sidebar.nextComment',
    },
    {
      key: 'k',
      contexts: ['sidebar'],
      description: 'Select previous comment',
      category: 'Navigation',
      commandId: 'sidebar.previousComment',
    },
    {
      key: 'b',
      contexts: ['sidebar'],
      description: 'Navigate back',
      category: 'Navigation',
      commandId: 'sidebar.back',
    },
    {
      key: 'o',
      contexts: ['sidebar'],
      description: 'Toggle comment collapse',
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
      description: 'Expand comment replies',
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
      key: 'Escape',
      contexts: ['sidebar'],
      description: 'Navigate back / Close sidebar',
      category: 'General',
      commandId: 'sidebar.backOrClose',
    },

    // Item Page context shortcuts
    {
      key: 'j',
      contexts: ['item-page'],
      description: 'Select next comment',
      category: 'Navigation',
      commandId: 'item.nextComment',
    },
    {
      key: 'k',
      contexts: ['item-page'],
      description: 'Select previous comment',
      category: 'Navigation',
      commandId: 'item.previousComment',
    },
    {
      key: 'o',
      contexts: ['item-page'],
      description: 'Toggle comment collapse',
      category: 'Comment Actions',
      commandId: 'item.toggleExpand',
    },
    {
      key: 'u',
      contexts: ['item-page'],
      description: 'Upvote comment',
      category: 'Comment Actions',
      commandId: 'item.upvote',
    },
    {
      key: 'r',
      contexts: ['item-page'],
      description: 'Expand comment replies',
      category: 'Comment Actions',
      commandId: 'item.expandReplies',
    },
    {
      key: 'v',
      contexts: ['item-page'],
      description: 'View comment thread',
      category: 'Comment Actions',
      commandId: 'item.viewThread',
    },
    {
      key: 'Escape',
      contexts: ['item-page'],
      description: 'Navigate back / Clear selection',
      category: 'General',
      commandId: 'global.escape',
    },

    // Settings Page context shortcuts
    {
      key: 'h',
      contexts: ['settings-page'],
      description: 'Select previous tab',
      category: 'Navigation',
      commandId: 'navigation.previousTab',
    },
    {
      key: 'l',
      contexts: ['settings-page'],
      description: 'Select next tab',
      category: 'Navigation',
      commandId: 'navigation.nextTab',
    },
    {
      key: 'j',
      contexts: ['settings-page'],
      description: 'Scroll to next section',
      category: 'Navigation',
      commandId: 'settings.nextSection',
    },
    {
      key: 'k',
      contexts: ['settings-page'],
      description: 'Scroll to previous section',
      category: 'Navigation',
      commandId: 'settings.previousSection',
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
      ...this.getShortcutsForContext(context), // Context specific first (usually Navigation)
      ...this.getShortcutsForContext('global'), // Global last (General)
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
   * Get all unique categories in a specific order
   */
  getCategories(context: KeyboardContext): string[] {
    const categories = Array.from(this.getShortcutsByCategory(context).keys());
    const order = ['Navigation', 'Story Actions', 'Comment Actions', 'General'];

    return categories.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      // If both are in the order list, sort by index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only a is in the list, it comes first
      if (indexA !== -1) {
        return -1;
      }
      // If only b is in the list, it comes first
      if (indexB !== -1) {
        return 1;
      }
      // Otherwise sort alphabetically
      return a.localeCompare(b);
    });
  }
}
