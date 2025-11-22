import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { ItemKeyboardNavigationService } from './item-keyboard-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { Router } from '@angular/router';

describe('ItemKeyboardNavigationService', () => {
  let service: ItemKeyboardNavigationService;
  let commandRegistrySpy: MockedObject<CommandRegistryService>;
  let routerSpy: MockedObject<Router>;

  beforeEach(() => {
    const interactionSpy = {
      dispatchAction: vi.fn(),
    };
    const registrySpy = {
      register: vi.fn(),
    };
    const scrollSpy = {
      scrollElementIntoView: vi.fn(),
    };
    const routerSpyObj = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ItemKeyboardNavigationService,
        { provide: SidebarCommentsInteractionService, useValue: interactionSpy },
        { provide: CommandRegistryService, useValue: registrySpy },
        { provide: ScrollService, useValue: scrollSpy },
        { provide: Router, useValue: routerSpyObj },
      ],
    });

    service = TestBed.inject(ItemKeyboardNavigationService);
    commandRegistrySpy = TestBed.inject(
      CommandRegistryService,
    ) as MockedObject<CommandRegistryService>;
    routerSpy = TestBed.inject(Router) as MockedObject<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register item commands', () => {
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.nextComment',
      expect.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.previousComment',
      expect.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.toggleExpand',
      expect.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith('item.upvote', expect.any(Function));
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.expandReplies',
      expect.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.viewThread',
      expect.any(Function),
    );
  });

  it('should navigate to item page when viewing thread', () => {
    service.selectedCommentId.set(123);
    service.viewThreadSelected();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/item', 123]);
  });

  it('should not navigate if no comment selected', () => {
    service.selectedCommentId.set(null);
    service.viewThreadSelected();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
