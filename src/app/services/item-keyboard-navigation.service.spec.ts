import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ItemKeyboardNavigationService } from './item-keyboard-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';

describe('ItemKeyboardNavigationService', () => {
  let service: ItemKeyboardNavigationService;
  let commandRegistrySpy: MockedObject<CommandRegistryService>;
  let routerSpy: MockedObject<Router>;
  let locationSpy: MockedObject<Location>;
  let routerEventsSubject: Subject<NavigationEnd>;

  beforeEach(() => {
    routerEventsSubject = new Subject<NavigationEnd>();

    const interactionSpy = {
      dispatchAction: vi.fn(),
    };
    const registrySpy = {
      register: vi.fn(),
    };
    const scrollSpy = {
      scrollElementIntoView: vi.fn().mockResolvedValue(undefined),
    };
    const routerSpyObj = {
      navigate: vi.fn(),
      url: '/item/123',
      events: routerEventsSubject.asObservable(),
    };
    const locationSpyObj = {
      back: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ItemKeyboardNavigationService,
        { provide: SidebarCommentsInteractionService, useValue: interactionSpy },
        { provide: CommandRegistryService, useValue: registrySpy },
        { provide: ScrollService, useValue: scrollSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: Location, useValue: locationSpyObj },
      ],
    });

    service = TestBed.inject(ItemKeyboardNavigationService);
    commandRegistrySpy = TestBed.inject(
      CommandRegistryService,
    ) as MockedObject<CommandRegistryService>;
    routerSpy = TestBed.inject(Router) as MockedObject<Router>;
    locationSpy = TestBed.inject(Location) as MockedObject<Location>;
  });

  afterEach(() => {
    service.ngOnDestroy();
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
    expect(commandRegistrySpy.register).toHaveBeenCalledWith('item.back', expect.any(Function));
  });

  it('should save state and navigate to item page when viewing thread', () => {
    service.selectedCommentId.set(456);
    service.viewThreadSelected();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/item', 456]);
  });

  it('should not navigate if no comment selected', () => {
    service.selectedCommentId.set(null);
    service.viewThreadSelected();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  describe('goBack', () => {
    it('should call location.back() to navigate back in browser history', () => {
      service.goBack();
      expect(locationSpy.back).toHaveBeenCalled();
    });
  });
});
