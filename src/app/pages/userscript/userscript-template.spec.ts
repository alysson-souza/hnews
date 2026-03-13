// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { generateUserscript } from './userscript-template';

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

describe('generateUserscript', () => {
  const baseUrl = 'https://example.com/hnews';
  const version = '2.0.0';

  it('should include the provided baseUrl in the generated content', () => {
    const content = generateUserscript(baseUrl, version);
    expect(content).toContain(`const BASE_URL = '${baseUrl}'`);
  });

  it('should include the provided version in @version metadata', () => {
    const content = generateUserscript(baseUrl, version);
    expect(content).toContain(`// @version      ${version}`);
  });

  it('should include userscript metadata block', () => {
    const content = generateUserscript(baseUrl, version);
    expect(content).toContain('// ==UserScript==');
    expect(content).toContain('// ==/UserScript==');
    expect(content).toContain('// @name         HNews Redirect');
    expect(content).toContain('// @match        https://news.ycombinator.com/*');
  });

  it('should redirect /item?id=123 to baseUrl/item/123', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/item?id=123');
    expect(result).toBe(`${baseUrl}/item/123`);
  });

  it('should redirect /news to baseUrl/top', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/news');
    expect(result).toBe(`${baseUrl}/top`);
  });

  it('should redirect /user?id=foo to baseUrl/user/foo', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/user?id=foo');
    expect(result).toBe(`${baseUrl}/user/foo`);
  });

  it('should not redirect unsupported HN documentation URLs', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(
      content,
      'https://news.ycombinator.com/newsguidelines.html#generated',
    );
    expect(result).toBeNull();
  });

  it('should not redirect unsupported HN submit URLs', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/submit');
    expect(result).toBeNull();
  });

  it('should redirect / to baseUrl/top', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/');
    expect(result).toBe(`${baseUrl}/top`);
  });

  it('should redirect /newest to baseUrl/newest', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/newest');
    expect(result).toBe(`${baseUrl}/newest`);
  });

  it('should redirect /best to baseUrl/best', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/best');
    expect(result).toBe(`${baseUrl}/best`);
  });

  it('should redirect /ask to baseUrl/ask', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/ask');
    expect(result).toBe(`${baseUrl}/ask`);
  });

  it('should redirect /show to baseUrl/show', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/show');
    expect(result).toBe(`${baseUrl}/show`);
  });

  it('should redirect /jobs to baseUrl/jobs', () => {
    const content = generateUserscript(baseUrl, version);
    const result = runGeneratedUserscript(content, 'https://news.ycombinator.com/jobs');
    expect(result).toBe(`${baseUrl}/jobs`);
  });
});
