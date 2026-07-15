// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AppHeaderComponent } from '@components/layout/header/header.component';

@Component({
  imports: [AppShellComponent],
  template: `
    <app-shell
      [routerUrl]="routerUrl"
      [searchQuery]="searchQuery"
      [mobileMenuOpen]="mobileMenuOpen"
      [showMobileSearch]="showMobileSearch"
      [refreshStatus]="refreshStatus"
      [canRefresh]="canRefresh"
      [commitShaShort]="commitShaShort"
      [commitUrl]="commitUrl"
      (searchSubmit)="onSearchSubmit()"
    >
      <div shellMain class="test-content">Projected Content</div>
    </app-shell>
  `,
})
class AppShellHostComponent {
  showBanner = false;
  routerUrl = '/top';
  searchQuery = '';
  mobileMenuOpen = false;
  showMobileSearch = false;
  refreshStatus: 'idle' | 'loading' | 'refreshing' = 'idle';
  canRefresh = false;
  commitShaShort = 'abc1234';
  commitUrl = 'https://example.com';

  searchTriggered = false;

  onSearchSubmit(): void {
    this.searchTriggered = true;
  }
}

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellHostComponent>;
  let host: AppShellHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects main content', () => {
    const content = fixture.nativeElement.querySelector('.test-content');
    expect(content).toBeTruthy();
    expect(content.textContent?.trim()).toBe('Projected Content');
  });
  it('re-emits search submissions from the header', () => {
    const headerDebug = fixture.debugElement.query(By.directive(AppHeaderComponent));
    const header = headerDebug.componentInstance as AppHeaderComponent;

    header.searchSubmit.emit();

    expect(host.searchTriggered).toBe(true);
  });
});
