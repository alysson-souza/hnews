import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('should strip <script> tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should strip event handler attributes', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('should strip <img> tags but keep text content', () => {
    const input = '<p>Before</p><img src="x" onerror="alert(1)"><p>After</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('Before');
    expect(result).toContain('After');
  });

  it('should strip <iframe> tags', () => {
    const input = '<p>Text</p><iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('Text');
  });

  it('should strip javascript: URLs from links', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('Click');
  });

  it('should preserve <em> tags (used by Algolia highlights)', () => {
    const input = '<em>highlighted</em> text';
    const result = sanitizeHtml(input);
    expect(result).toContain('<em>highlighted</em>');
  });

  it('should preserve <b> and <strong> tags', () => {
    const input = '<b>bold</b> and <strong>strong</strong>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<strong>strong</strong>');
  });

  it('should preserve <a> tags with href attribute', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<a href="https://example.com">Link</a>');
  });

  it('should keep text content from stripped tags', () => {
    const input = '<div>Some <span>nested</span> content</div>';
    const result = sanitizeHtml(input);
    expect(result).toContain('Some');
    expect(result).toContain('nested');
    expect(result).toContain('content');
  });

  it('should strip data: URLs from links', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:');
  });
});
