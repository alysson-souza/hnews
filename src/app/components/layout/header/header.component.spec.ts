// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppHeaderComponent } from './header.component';

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let component: AppHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    component.routerUrl = '/top';
  });

  it('re-emits search submit from the desktop form', () => {
    const searchSpy = jasmine.createSpy('search');
    component.searchSubmit.subscribe(searchSpy);

    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form[role="search"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(searchSpy).toHaveBeenCalled();
  });

  it('shows the mobile search when requested', () => {
    component.showMobileSearch = true;
    fixture.detectChanges();

    const mobileSearch = fixture.nativeElement.querySelector('app-header-mobile-search');
    expect(mobileSearch).toBeTruthy();
  });

  it('shows the mobile menu and emits close events from menu links', () => {
    const closeSpy = jasmine.createSpy('close');
    component.mobileMenuOpen = true;
    component.closeMenuRequested.subscribe(closeSpy);

    fixture.detectChanges();

    const mobileNav = fixture.nativeElement.querySelector('app-header-mobile-nav');
    expect(mobileNav).toBeTruthy();

    const firstLink = mobileNav.querySelector('a');
    (firstLink as HTMLAnchorElement).click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('emits toggle events from mobile controls', () => {
    const menuToggleSpy = jasmine.createSpy('menuToggle');
    const searchToggleSpy = jasmine.createSpy('searchToggle');
    component.menuToggleRequested.subscribe(menuToggleSpy);
    component.searchToggleRequested.subscribe(searchToggleSpy);

    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[aria-label]');
    const searchButton = Array.from(buttons).find(
      (btn): btn is HTMLButtonElement =>
        btn instanceof HTMLButtonElement && btn.getAttribute('aria-label') === 'Toggle Search',
    )!;
    const menuButton = Array.from(buttons).find(
      (btn): btn is HTMLButtonElement =>
        btn instanceof HTMLButtonElement && btn.getAttribute('aria-label') === 'Toggle Menu',
    )!;

    searchButton.click();
    menuButton.click();

    expect(searchToggleSpy).toHaveBeenCalled();
    expect(menuToggleSpy).toHaveBeenCalled();
  });
});
