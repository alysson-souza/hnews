// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserscriptComponent } from './userscript.component';
import { APP_VERSION } from '../../config/version.config';

const TEST_VERSION = '1.0.0-test';

describe('UserscriptComponent', () => {
  let component: UserscriptComponent;
  let fixture: ComponentFixture<UserscriptComponent>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserscriptComponent],
      providers: [{ provide: APP_VERSION, useValue: TEST_VERSION }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate userscript content with the dynamic base URL', () => {
    const content = component.userscriptContent();
    expect(content).toContain('// ==UserScript==');
    expect(content).toContain('// @name         HNews Redirect');
    expect(content).toContain('// @match        https://news.ycombinator.com/*');
    expect(content).toContain(`const BASE_URL = '${component.baseUrl()}'`);
  });

  it('should include the provided version in userscript content', () => {
    const content = component.userscriptContent();
    expect(content).toContain(`// @version      ${TEST_VERSION}`);
  });

  it('should compute base URL from window location', () => {
    const baseUrl = component.baseUrl();
    expect(baseUrl).toBeTruthy();
    expect(typeof baseUrl).toBe('string');
  });

  it('should create a Blob download when install() is called', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    component.install();

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/javascript');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should copy dynamically generated content to clipboard', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await component.copyToClipboard();

    expect(clipboardSpy).toHaveBeenCalledWith(component.userscriptContent());
    expect(component.isCopied()).toBe(true);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(component.isCopied()).toBe(false);
  });

  it('should handle copy failure gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Copy failed'));

    await component.copyToClipboard();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
  });
});
