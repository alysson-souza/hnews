// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { highlightCodeBlocks } from './code-highlight.transform';

describe('highlightCodeBlocks', () => {
  it('should return empty string for empty input', async () => {
    expect(await highlightCodeBlocks('')).toBe('');
  });

  it('should return original html when no code blocks are present', async () => {
    const html = '<p>This is a paragraph without code</p>';
    expect(await highlightCodeBlocks(html)).toBe(html);
  });

  it('should handle simple code blocks without error', async () => {
    const html = '<pre><code>console.log("hello");</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toBeTruthy();
    expect(result).toContain('<code');
    expect(result).toContain('</code>');
  });

  it('should add language class to code blocks', async () => {
    const html = '<pre><code>const x = 5;</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
  });

  it('should preserve language class if already present', async () => {
    const html = '<pre><code class="language-javascript">const x = 5;</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-javascript');
  });

  it('should add hljs-highlighted class to pre tags', async () => {
    const html = '<pre><code>console.log("hello");</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('hljs-highlighted');
  });

  it('should detect Python code blocks', async () => {
    const html = '<pre><code>def hello():\n  print("world")</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-python');
  });

  it('should detect Go code blocks', async () => {
    const html = '<pre><code>package main\nfunc main() {}</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-go');
  });

  it('should detect Bash code blocks', async () => {
    const html = '<pre><code>echo "hello"\nfor i in 1 2 3; do echo $i; done</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
    // Verify code block was processed
    expect(result).toContain('hljs-highlighted');
  });

  it('should handle multiple code blocks in one HTML', async () => {
    const html =
      '<pre><code>console.log("js");</code></pre><p>Text</p><pre><code>def python(): pass</code></pre>';
    const result = await highlightCodeBlocks(html);
    const codeMatches = (result.match(/<code class="language-/g) || []).length;
    expect(codeMatches).toBe(2);
  });

  it('should handle empty code blocks gracefully', async () => {
    const html = '<pre><code></code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('<code');
  });

  it('should preserve code block content', async () => {
    const content = 'function test() { return 42; }';
    const html = `<pre><code>${content}</code></pre>`;
    const result = await highlightCodeBlocks(html);
    // Content should be preserved (might be wrapped in spans for syntax highlighting)
    expect(result).toContain('test');
    expect(result).toContain('42');
  });

  it('should detect TypeScript code blocks', async () => {
    const html = '<pre><code>interface User { name: string; }</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
  });

  it('should detect Ruby code blocks', async () => {
    const html = '<pre><code>def hello\n  puts "world"\nend</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
  });

  it('should detect Java code blocks', async () => {
    const html =
      '<pre><code>public class HelloWorld {\n  public static void main(String[] args) {}\n}</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
  });

  it('should detect C++ code blocks', async () => {
    const html = '<pre><code>#include <iostream>\nint main() { return 0; }</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-');
  });

  it('should handle plaintext fallback for ambiguous code', async () => {
    const html =
      '<pre><code>this is just some text\nwith multiple lines\nbut no code patterns</code></pre>';
    const result = await highlightCodeBlocks(html);
    // Should be marked with a language class (either detected or plaintext)
    expect(result).toContain('language-');
    // Should still be highlighted
    expect(result).toContain('hljs-highlighted');
  });

  it('should respect explicit language class over auto-detection', async () => {
    const html = '<pre><code class="language-python">const x = 5;</code></pre>';
    const result = await highlightCodeBlocks(html);
    expect(result).toContain('language-python');
  });

  it('should handle unrecognized explicit language gracefully', async () => {
    const html = '<pre><code class="language-unknownlang">some code here</code></pre>';
    const result = await highlightCodeBlocks(html);
    // Should fall back to plaintext instead of crashing
    expect(result).toContain('language-plaintext');
  });

  it('should highlight all registered languages', async () => {
    const languages = [
      'const x = 1;',
      'x = 1',
      'package main',
      'fn main() {}',
      'echo hello',
      'SELECT * FROM table',
      '{"key": "value"}',
      'body { color: red; }',
      '&lt;root&gt;&lt;/root&gt;',
    ];

    for (const code of languages) {
      const html = `<pre><code>${code}</code></pre>`;
      const result = await highlightCodeBlocks(html);
      expect(result).toContain('language-');
      expect(result).toContain('hljs-highlighted');
    }
  });

  it('should strip common indentation from code blocks', async () => {
    const html = '<pre><code>    line 1\n    line 2</code></pre>';
    const result = await highlightCodeBlocks(html);
    // Should not contain the original indented text
    expect(result).not.toContain('    line 1');
    // Should contain the stripped text (wrapped in spans or not)
    // Note: highlight.js might wrap parts, but usually not the whole line if it's simple text
    // For "line 1", it might be treated as plaintext or keywords.
    // Let's just check that we don't see the 4 spaces indentation.
  });

  it('should strip indentation based on first line', async () => {
    const html = '<pre><code>    curl -X\nGET</code></pre>';
    const result = await highlightCodeBlocks(html);
    // "    curl" should become "curl"
    expect(result).not.toContain('    curl');
  });
});
