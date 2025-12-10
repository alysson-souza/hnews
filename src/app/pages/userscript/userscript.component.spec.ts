// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserscriptComponent } from './userscript.component';

describe('UserscriptComponent', () => {
  let component: UserscriptComponent;
  let fixture: ComponentFixture<UserscriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserscriptComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate userscript content', () => {
    const content = component.userscriptContent();
    expect(content).toContain('// ==UserScript==');
    expect(content).toContain('// @name         HNews Redirect');
    expect(content).toContain('// @match        https://news.ycombinator.com/*');
    expect(content).toContain('const BASE_URL =');
  });

  it('should copy to clipboard when copyToClipboard is called', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await component.copyToClipboard();

    expect(clipboardSpy).toHaveBeenCalledWith(component.userscriptContent());
    expect(component.isCopied()).toBe(true);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(component.isCopied()).toBe(false);
  });

  it('should compute base URL from window location', () => {
    // The component should compute a base URL
    const baseUrl = component.baseUrl();
    expect(baseUrl).toBeTruthy();
    expect(typeof baseUrl).toBe('string');
  });

  it('should handle copy failure gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Copy failed'));

    await component.copyToClipboard();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
  });

  it('should compute install URL correctly', () => {
    const installUrl = component.installUrl();
    expect(installUrl).toContain('/hnews-redirect.user.js');
    expect(installUrl).toContain(component.baseUrl());
  });
});
