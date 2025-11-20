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
  let commandRegistrySpy: jasmine.SpyObj<CommandRegistryService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const interactionSpy = jasmine.createSpyObj('SidebarCommentsInteractionService', [
      'dispatchAction',
    ]);
    const registrySpy = jasmine.createSpyObj('CommandRegistryService', ['register']);
    const scrollSpy = jasmine.createSpyObj('ScrollService', ['scrollElementIntoView']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

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
    ) as jasmine.SpyObj<CommandRegistryService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register item commands', () => {
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.nextComment',
      jasmine.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.previousComment',
      jasmine.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.toggleExpand',
      jasmine.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith('item.upvote', jasmine.any(Function));
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.expandReplies',
      jasmine.any(Function),
    );
    expect(commandRegistrySpy.register).toHaveBeenCalledWith(
      'item.viewThread',
      jasmine.any(Function),
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
