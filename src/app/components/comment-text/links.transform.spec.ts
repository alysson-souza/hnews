import { transformLinksToDomain } from './links.transform';

describe('transformLinksToDomain', () => {
  it('should return empty string for empty input', () => {
    expect(transformLinksToDomain('')).toBe('');
  });

  it('should return original html when no anchors are present', () => {
    const html = '<p>This is a paragraph without links</p>';
    expect(transformLinksToDomain(html)).toBe(html);
  });

  it('should extract domain from simple http urls', () => {
    const html = '<a href="http://example.com">http://example.com</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('>example.com<');
    expect(result).toContain('href="http://example.com"');
  });

  it('should extract domain from https urls', () => {
    const html = '<a href="https://www.github.com/user/repo">https://www.github.com/user/repo</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('>github.com<');
    expect(result).toContain('href="https://www.github.com/user/repo"');
  });

  it('should handle protocol-relative urls', () => {
    const html = '<a href="//example.com/path">Link text</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('>example.com<');
    expect(result).toContain('href="//example.com/path"');
  });

  it('should handle urls without protocol', () => {
    const html = '<a href="example.com/path">Link text</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('>example.com<');
  });

  it('should add ext-link class to anchors', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('ext-link');
  });

  it('should preserve original href in title attribute', () => {
    const html = '<a href="https://example.com/path?query=1">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('title="https://example.com/path?query=1"');
  });

  it('should not override existing title attribute', () => {
    const html = '<a href="https://example.com" title="Existing title">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('title="Existing title"');
  });

  it('should add required rel attributes', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('rel="noopener noreferrer nofollow"');
  });

  it('should preserve existing rel attributes and add missing ones', () => {
    const html = '<a href="https://example.com" rel="noopener">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('rel="noopener noreferrer nofollow"');
  });

  it('should add target="_blank" for external urls', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('target="_blank"');
  });

  it('should not add target="_blank" for anchor links', () => {
    const html = '<a href="#section">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).not.toContain('target="_blank"');
  });

  it('should not add target="_blank" for mailto links', () => {
    const html = '<a href="mailto:test@example.com">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).not.toContain('target="_blank"');
  });

  it('should handle multiple anchors in the same html', () => {
    const html = `
      <p>Check out <a href="https://github.com">GitHub</a> and 
      <a href="https://stackoverflow.com">Stack Overflow</a></p>
    `;
    const result = transformLinksToDomain(html);
    expect(result).toContain('>github.com<');
    expect(result).toContain('>stackoverflow.com<');
    expect(result).toContain('ext-link');
  });

  it('should handle malformed urls gracefully', () => {
    const html = '<a href="not-a-url">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('not-a-url');
  });

  it('should preserve existing styles and add font sizing', () => {
    const html = '<a href="https://example.com" style="color: red;">Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('color: red;');
    expect(result).toContain('font-size:0.75rem');
    expect(result).toContain('line-height:1.15rem');
  });

  it('should handle complex urls with subdomains', () => {
    const html = '<a href="https://news.ycombinator.com/item?id=12345">HN Link</a>';
    const result = transformLinksToDomain(html);
    expect(result).toContain('>news.ycombinator.com<');
  });
});
