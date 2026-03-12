// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserscriptComponent } from './userscript.component';

const MOCK_SCRIPT = `// ==UserScript==
// @name         HNews Redirect
// @namespace    https://github.com/alysson-souza/hnews
// @version      1.2.0
// @description  Automatically redirect Hacker News to HNews alternative frontend
// @author       Alysson Souza
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const BASE_URL = 'http://localhost:4200';
    window.location.replace(BASE_URL);
})();`;

function runGeneratedUserscript(script: string, href: string): string | null {
  const replace = vi.fn();
  const mockWindow = {
    location: {
      href,
      replace,
    },
  };

  const execute = new Function('window', script);
  execute(mockWindow);

  return replace.mock.calls[0]?.[0] ?? null;
}

describe('UserscriptComponent', () => {
  let component: UserscriptComponent;
  let fixture: ComponentFixture<UserscriptComponent>;

  beforeEach(async () => {
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_SCRIPT),
    } as unknown as Response);

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

  it('should populate userscript content from fetched file', async () => {
    await fixture.whenStable();

    const content = component.userscriptContent();
    expect(content).toContain('// ==UserScript==');
    expect(content).toContain('// @name         HNews Redirect');
    expect(content).toContain('// @match        https://news.ycombinator.com/*');
    expect(content).toContain('const BASE_URL =');
  });

  it('should clear loading state after fetch completes', async () => {
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });

  it('should copy to clipboard when copyToClipboard is called', async () => {
    await fixture.whenStable();

    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await component.copyToClipboard();

    expect(clipboardSpy).toHaveBeenCalledWith(component.userscriptContent());
    expect(component.isCopied()).toBe(true);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(component.isCopied()).toBe(false);
  });

  it('should compute base URL from window location', () => {
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

  it('should fetch the install URL', () => {
    expect(global.fetch).toHaveBeenCalledWith(component.installUrl());
  });
});

describe('generated userscript file', () => {
  async function readGeneratedUserscript(): Promise<string> {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    return readFileSync(join(process.cwd(), 'public/hnews-redirect.user.js'), 'utf8');
  }

  it('should not use placeholder version 0.0.0', async () => {
    const content = await readGeneratedUserscript();
    expect(content).not.toContain('@version      0.0.0');
  });

  it('should redirect supported HN item URLs to HNews item routes', async () => {
    const content = await readGeneratedUserscript();

    const redirectedUrl = runGeneratedUserscript(
      content,
      'https://news.ycombinator.com/item?id=12345',
    );

    expect(redirectedUrl).toBe('https://alysson-souza.github.io/hnews/item/12345');
  });

  it('should redirect supported HN list URLs to HNews list routes', async () => {
    const content = await readGeneratedUserscript();

    const redirectedUrl = runGeneratedUserscript(content, 'https://news.ycombinator.com/news');

    expect(redirectedUrl).toBe('https://alysson-souza.github.io/hnews/top');
  });

  it('should not redirect unsupported HN documentation URLs', async () => {
    const content = await readGeneratedUserscript();

    const redirectedUrl = runGeneratedUserscript(
      content,
      'https://news.ycombinator.com/newsguidelines.html#generated',
    );

    expect(redirectedUrl).toBeNull();
  });

  it('should not redirect unsupported HN submit URLs', async () => {
    const content = await readGeneratedUserscript();

    const redirectedUrl = runGeneratedUserscript(content, 'https://news.ycombinator.com/submit');

    expect(redirectedUrl).toBeNull();
  });
});
