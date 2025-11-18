// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutConfigService } from './keyboard-shortcut-config.service';
import { PwaUpdateService } from './pwa-update.service';

describe('KeyboardShortcutConfigService', () => {
  let service: KeyboardShortcutConfigService;
  let mockPwaUpdateService: jasmine.SpyObj<PwaUpdateService>;

  beforeEach(() => {
    // Create mock PWA update service
    mockPwaUpdateService = jasmine.createSpyObj('PwaUpdateService', [], {
      updateAvailable: jasmine.createSpy().and.returnValue(false),
    });

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutConfigService,
        { provide: PwaUpdateService, useValue: mockPwaUpdateService },
      ],
    });

    service = TestBed.inject(KeyboardShortcutConfigService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getShortcutsForContext', () => {
    it('should return default context shortcuts', () => {
      const shortcuts = service.getShortcutsForContext('default');

      const defaultKeys = shortcuts.filter((s) => s.contexts.includes('default')).map((s) => s.key);

      expect(defaultKeys).toContain('j'); // Next story
      expect(defaultKeys).toContain('k'); // Previous story
      expect(defaultKeys).toContain('h'); // Previous tab
      expect(defaultKeys).toContain('l'); // Next tab
      expect(defaultKeys).toContain('c'); // Open comments
    });

    it('should return sidebar context shortcuts', () => {
      const shortcuts = service.getShortcutsForContext('sidebar');

      const sidebarKeys = shortcuts.filter((s) => s.contexts.includes('sidebar')).map((s) => s.key);

      expect(sidebarKeys).toContain('j'); // Next comment
      expect(sidebarKeys).toContain('k'); // Previous comment
      expect(sidebarKeys).toContain('o'); // Toggle expand
      expect(sidebarKeys).toContain('u'); // Upvote
      expect(sidebarKeys).toContain('r'); // Expand replies
      expect(sidebarKeys).toContain('v'); // View thread
      expect(sidebarKeys).toContain('b'); // Go back
    });

    it('should filter out conditional shortcuts when condition is false', () => {
      // Set updateAvailable to false
      Object.defineProperty(mockPwaUpdateService, 'updateAvailable', {
        value: jasmine.createSpy().and.returnValue(false),
      });

      const shortcuts = service.getShortcutsForContext('global');
      const hasUpdateShortcut = shortcuts.some((s) => s.key === 'R');

      expect(hasUpdateShortcut).toBeFalse();
    });

    it('should include conditional shortcuts when condition is true', () => {
      // Set updateAvailable to true
      Object.defineProperty(mockPwaUpdateService, 'updateAvailable', {
        value: jasmine.createSpy().and.returnValue(true),
      });

      const shortcuts = service.getShortcutsForContext('global');
      const updateShortcut = shortcuts.find((s) => s.key === 'R');

      expect(updateShortcut).toBeDefined();
      expect(updateShortcut?.description).toBe('Apply app update');
    });
  });

  describe('getShortcut', () => {
    it('should return global shortcuts when queried from any context', () => {
      const defaultContext = service.getShortcut('?', 'default');
      const sidebarContext = service.getShortcut('?', 'sidebar');

      expect(defaultContext).toBeDefined();
      expect(sidebarContext).toBeDefined();
      expect(defaultContext?.commandId).toBe('global.showHelp');
      expect(sidebarContext?.commandId).toBe('global.showHelp');
    });

    it('should return context-specific shortcuts', () => {
      const defaultShortcut = service.getShortcut('c', 'default');
      const sidebarShortcut = service.getShortcut('u', 'sidebar');

      expect(defaultShortcut).toBeDefined();
      expect(defaultShortcut?.commandId).toBe('story.openComments');

      expect(sidebarShortcut).toBeDefined();
      expect(sidebarShortcut?.commandId).toBe('sidebar.upvote');
    });

    it('should not return shortcuts from other contexts', () => {
      // 'u' (upvote) is sidebar-only
      const upvoteInDefault = service.getShortcut('u', 'default');
      expect(upvoteInDefault).toBeUndefined();

      // 'h' (previous tab) is default-only
      const tabInSidebar = service.getShortcut('h', 'sidebar');
      expect(tabInSidebar).toBeUndefined();
    });

    it('should handle same key in different contexts', () => {
      const defaultJ = service.getShortcut('j', 'default');
      const sidebarJ = service.getShortcut('j', 'sidebar');

      expect(defaultJ).toBeDefined();
      expect(sidebarJ).toBeDefined();
      expect(defaultJ?.commandId).toBe('story.next');
      expect(sidebarJ?.commandId).toBe('sidebar.nextComment');
    });

    it('should prioritize global shortcuts over context shortcuts', () => {
      // '?' is a global shortcut
      const shortcut = service.getShortcut('?', 'default');

      expect(shortcut).toBeDefined();
      expect(shortcut?.contexts).toContain('global');
    });

    it('should respect conditional shortcuts', () => {
      // When update not available
      Object.defineProperty(mockPwaUpdateService, 'updateAvailable', {
        value: jasmine.createSpy().and.returnValue(false),
      });

      let updateShortcut = service.getShortcut('R', 'global');
      expect(updateShortcut).toBeUndefined();

      // When update available
      Object.defineProperty(mockPwaUpdateService, 'updateAvailable', {
        value: jasmine.createSpy().and.returnValue(true),
      });

      updateShortcut = service.getShortcut('R', 'global');
      expect(updateShortcut).toBeDefined();
    });

    it('should return undefined for non-existent shortcuts', () => {
      const shortcut = service.getShortcut('x', 'default');
      expect(shortcut).toBeUndefined();
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should group shortcuts by category', () => {
      const grouped = service.getShortcutsByCategory('default');

      expect(grouped.has('Navigation')).toBeTrue();
      expect(grouped.has('Story Actions')).toBeTrue();
      expect(grouped.has('General')).toBeTrue();
    });

    it('should include global shortcuts in all contexts', () => {
      const defaultGrouped = service.getShortcutsByCategory('default');
      const sidebarGrouped = service.getShortcutsByCategory('sidebar');

      const hasGeneralCategory = (map: Map<string, unknown>) => map.has('General');

      expect(hasGeneralCategory(defaultGrouped)).toBeTrue();
      expect(hasGeneralCategory(sidebarGrouped)).toBeTrue();
    });

    it('should have different categories for different contexts', () => {
      const defaultGrouped = service.getShortcutsByCategory('default');
      const sidebarGrouped = service.getShortcutsByCategory('sidebar');

      expect(defaultGrouped.has('Story Actions')).toBeTrue();
      expect(sidebarGrouped.has('Story Actions')).toBeFalse();

      expect(sidebarGrouped.has('Comment Actions')).toBeTrue();
      expect(defaultGrouped.has('Comment Actions')).toBeFalse();
    });

    it('should return shortcuts within each category', () => {
      const grouped = service.getShortcutsByCategory('default');
      const navigation = grouped.get('Navigation');

      expect(navigation).toBeDefined();
      expect(navigation!.length).toBeGreaterThan(0);

      const keys = navigation!.map((s) => s.key);
      expect(keys).toContain('j');
      expect(keys).toContain('k');
    });

    it('should not include conditional shortcuts when condition is false', () => {
      Object.defineProperty(mockPwaUpdateService, 'updateAvailable', {
        value: jasmine.createSpy().and.returnValue(false),
      });

      const grouped = service.getShortcutsByCategory('global');
      const general = grouped.get('General');

      const hasUpdateShortcut = general?.some((s) => s.key === 'R');
      expect(hasUpdateShortcut).toBeFalsy();
    });
  });

  describe('getCategories', () => {
    it('should return category names for a context', () => {
      const categories = service.getCategories('default');

      expect(categories).toContain('Navigation');
      expect(categories).toContain('Story Actions');
      expect(categories).toContain('General');
    });

    it('should return different categories for different contexts', () => {
      const defaultCategories = service.getCategories('default');
      const sidebarCategories = service.getCategories('sidebar');

      expect(defaultCategories).toContain('Story Actions');
      expect(sidebarCategories).not.toContain('Story Actions');

      expect(sidebarCategories).toContain('Comment Actions');
      expect(defaultCategories).not.toContain('Comment Actions');
    });

    it('should include General category in all contexts', () => {
      const defaultCategories = service.getCategories('default');
      const sidebarCategories = service.getCategories('sidebar');

      expect(defaultCategories).toContain('General');
      expect(sidebarCategories).toContain('General');
    });
  });

  describe('shortcut properties', () => {
    it('should have all required properties for each shortcut', () => {
      const shortcuts = service.getShortcutsForContext('default');

      shortcuts.forEach((shortcut) => {
        expect(shortcut.key).toBeDefined();
        expect(shortcut.contexts).toBeDefined();
        expect(shortcut.contexts.length).toBeGreaterThan(0);
        expect(shortcut.description).toBeDefined();
        expect(shortcut.category).toBeDefined();
        expect(shortcut.commandId).toBeDefined();
      });
    });

    it('should have valid command IDs', () => {
      const shortcuts = service.getShortcutsForContext('default');

      shortcuts.forEach((shortcut) => {
        expect(typeof shortcut.commandId).toBe('string');
        expect(shortcut.commandId.length).toBeGreaterThan(0);
      });
    });
  });
});
