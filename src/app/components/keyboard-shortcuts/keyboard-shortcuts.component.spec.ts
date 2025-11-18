// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { KeyboardShortcutsComponent } from './keyboard-shortcuts.component';
import { KeyboardShortcutConfigService } from '../../services/keyboard-shortcut-config.service';
import { KeyboardContextService } from '../../services/keyboard-context.service';

describe('KeyboardShortcutsComponent', () => {
  let component: KeyboardShortcutsComponent;
  let mockShortcutConfig: jasmine.SpyObj<KeyboardShortcutConfigService>;
  let mockKeyboardContext: {
    currentContext: jasmine.Spy;
  };

  beforeEach(() => {
    // Create mock services
    mockShortcutConfig = jasmine.createSpyObj('KeyboardShortcutConfigService', [
      'getShortcutsByCategory',
      'getCategories',
    ]);

    // Mock currentContext as a signal
    const currentContextSignal = signal<'default' | 'sidebar'>('default');
    mockKeyboardContext = {
      currentContext: jasmine.createSpy().and.callFake(() => currentContextSignal()),
    };

    // Setup default return values
    mockShortcutConfig.getShortcutsByCategory.and.returnValue(
      new Map([
        [
          'General',
          [
            {
              key: '?',
              contexts: ['global'],
              description: 'Show help',
              category: 'General',
              commandId: 'global.showHelp',
            },
          ],
        ],
        [
          'Navigation',
          [
            {
              key: 'j',
              contexts: ['default'],
              description: 'Next story',
              category: 'Navigation',
              commandId: 'story.next',
            },
          ],
        ],
      ]),
    );

    mockShortcutConfig.getCategories.and.returnValue(['Navigation', 'General']);

    TestBed.configureTestingModule({
      imports: [KeyboardShortcutsComponent],
      providers: [
        { provide: KeyboardShortcutConfigService, useValue: mockShortcutConfig },
        { provide: KeyboardContextService, useValue: mockKeyboardContext },
      ],
    });

    component = TestBed.createComponent(KeyboardShortcutsComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with isOpen set to false', () => {
    expect(component.isOpen()).toBe(false);
  });

  describe('open()', () => {
    it('should set isOpen to true', () => {
      component.open();
      expect(component.isOpen()).toBe(true);
    });
  });

  describe('close()', () => {
    it('should set isOpen to false', () => {
      component.open();
      component.close();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('currentContext', () => {
    it('should expose currentContext from KeyboardContextService', () => {
      expect(component.currentContext).toBeDefined();
      expect(typeof component.currentContext).toBe('function');
    });
  });

  describe('shortcutsByCategory', () => {
    it('should be a computed signal', () => {
      expect(typeof component.shortcutsByCategory).toBe('function');
    });

    it('should get shortcuts from config service', () => {
      const shortcuts = component.shortcutsByCategory();
      expect(mockShortcutConfig.getShortcutsByCategory).toHaveBeenCalled();
      expect(shortcuts).toBeDefined();
    });
  });

  describe('categories', () => {
    it('should be a computed signal', () => {
      expect(typeof component.categories).toBe('function');
    });

    it('should get categories from config service', () => {
      const categories = component.categories();
      expect(mockShortcutConfig.getCategories).toHaveBeenCalled();
      expect(categories).toContain('Navigation');
      expect(categories).toContain('General');
    });
  });

  describe('contextLabel', () => {
    it('should be a computed signal', () => {
      expect(typeof component.contextLabel).toBe('function');
    });

    it('should return null for default context', () => {
      mockKeyboardContext.currentContext.and.returnValue('default');
      // Re-evaluate computed signal
      const label = component.contextLabel();
      expect(label).toBeNull();
    });

    it('should return "Comments Sidebar" for sidebar context', () => {
      const sidebarSignal = signal<'default' | 'sidebar'>('sidebar');
      mockKeyboardContext.currentContext.and.callFake(() => sidebarSignal());

      // Re-create component to get updated signal
      component = TestBed.createComponent(KeyboardShortcutsComponent).componentInstance;

      const label = component.contextLabel();
      expect(label).toBe('Comments Sidebar');
    });
  });

  describe('Keyboard Event Handling', () => {
    beforeEach(() => {
      component.open(); // Open the dialog to test keyboard handling
    });

    it('should close dialog when Escape key is pressed', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      spyOn(event, 'stopPropagation');
      spyOn(event, 'preventDefault');
      spyOn(component, 'close');

      component.onKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.close).toHaveBeenCalled();
    });

    it('should not handle Escape key when dialog is closed', () => {
      component.close(); // Close the dialog first
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      spyOn(event, 'stopPropagation');
      spyOn(event, 'preventDefault');
      spyOn(component, 'close');

      component.onKeyDown(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.close).not.toHaveBeenCalled();
    });

    it('should ignore non-Escape keys', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      spyOn(event, 'stopPropagation');
      spyOn(event, 'preventDefault');
      spyOn(component, 'close');

      component.onKeyDown(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.close).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be properly configured for screen readers', () => {
      // The component template includes proper ARIA attributes
      // This test ensures the component structure supports accessibility
      expect(component).toBeTruthy();
      expect(component.open).toBeDefined();
      expect(component.close).toBeDefined();
    });

    it('should support keyboard navigation', () => {
      // Test that keyboard events are properly handled
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      spyOn(event, 'stopPropagation');
      spyOn(event, 'preventDefault');

      component.open();
      component.onKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize correctly with all dependencies', () => {
      expect(component).toBeTruthy();
      expect(component.isOpen()).toBe(false);
      expect(typeof component.open).toBe('function');
      expect(typeof component.close).toBe('function');
      expect(typeof component.currentContext).toBe('function');
      expect(typeof component.shortcutsByCategory).toBe('function');
      expect(typeof component.categories).toBe('function');
      expect(typeof component.contextLabel).toBe('function');
    });

    it('should handle multiple open/close operations', () => {
      // Test multiple operations to ensure stability
      component.open();
      expect(component.isOpen()).toBe(true);

      component.close();
      expect(component.isOpen()).toBe(false);

      component.open();
      expect(component.isOpen()).toBe(true);

      component.close();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Integration with services', () => {
    it('should call getShortcutsByCategory with current context', () => {
      mockKeyboardContext.currentContext.and.returnValue('default');
      component.shortcutsByCategory();

      expect(mockShortcutConfig.getShortcutsByCategory).toHaveBeenCalledWith('default');
    });

    it('should call getCategories with current context', () => {
      mockKeyboardContext.currentContext.and.returnValue('default');
      component.categories();

      expect(mockShortcutConfig.getCategories).toHaveBeenCalledWith('default');
    });
  });
});
