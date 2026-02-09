// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import type { HLJSApi } from 'highlight.js';

/** Supported languages for auto-detection */
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'bash',
  'sql',
  'json',
  'css',
  'xml',
  'cpp',
  'java',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'csharp',
  'shell',
  'scala',
  'elixir',
  'haskell',
  'lua',
  'perl',
  'r',
];

/** Minimum relevance score threshold for auto-detection.
 * Below this threshold, code is treated as plaintext to avoid false positives. */
const RELEVANCE_THRESHOLD = 3;

/** Cached hljs instance, loaded lazily on first use. */
let hljsInstance: HLJSApi | null = null;
let hljsLoadPromise: Promise<HLJSApi> | null = null;

/**
 * Lazily loads highlight.js core and registers all supported languages.
 * Returns a cached instance on subsequent calls.
 */
async function getHljs(): Promise<HLJSApi> {
  if (hljsInstance) return hljsInstance;
  if (hljsLoadPromise) return hljsLoadPromise;

  hljsLoadPromise = (async () => {
    const [
      { default: hljs },
      { default: javascript },
      { default: typescript },
      { default: python },
      { default: go },
      { default: rust },
      { default: bash },
      { default: sql },
      { default: json },
      { default: css },
      { default: xml },
      { default: cpp },
      { default: java },
      { default: ruby },
      { default: php },
      { default: swift },
      { default: kotlin },
      { default: csharp },
      { default: shell },
      { default: scala },
      { default: elixir },
      { default: haskell },
      { default: lua },
      { default: perl },
      { default: r },
      { default: plaintext },
    ] = await Promise.all([
      import('highlight.js/lib/core'),
      import('highlight.js/lib/languages/javascript'),
      import('highlight.js/lib/languages/typescript'),
      import('highlight.js/lib/languages/python'),
      import('highlight.js/lib/languages/go'),
      import('highlight.js/lib/languages/rust'),
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/sql'),
      import('highlight.js/lib/languages/json'),
      import('highlight.js/lib/languages/css'),
      import('highlight.js/lib/languages/xml'),
      import('highlight.js/lib/languages/cpp'),
      import('highlight.js/lib/languages/java'),
      import('highlight.js/lib/languages/ruby'),
      import('highlight.js/lib/languages/php'),
      import('highlight.js/lib/languages/swift'),
      import('highlight.js/lib/languages/kotlin'),
      import('highlight.js/lib/languages/csharp'),
      import('highlight.js/lib/languages/shell'),
      import('highlight.js/lib/languages/scala'),
      import('highlight.js/lib/languages/elixir'),
      import('highlight.js/lib/languages/haskell'),
      import('highlight.js/lib/languages/lua'),
      import('highlight.js/lib/languages/perl'),
      import('highlight.js/lib/languages/r'),
      import('highlight.js/lib/languages/plaintext'),
    ]);

    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('go', go);
    hljs.registerLanguage('rust', rust);
    hljs.registerLanguage('bash', bash);
    hljs.registerLanguage('sql', sql);
    hljs.registerLanguage('json', json);
    hljs.registerLanguage('css', css);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('cpp', cpp);
    hljs.registerLanguage('java', java);
    hljs.registerLanguage('ruby', ruby);
    hljs.registerLanguage('php', php);
    hljs.registerLanguage('swift', swift);
    hljs.registerLanguage('kotlin', kotlin);
    hljs.registerLanguage('csharp', csharp);
    hljs.registerLanguage('shell', shell);
    hljs.registerLanguage('scala', scala);
    hljs.registerLanguage('elixir', elixir);
    hljs.registerLanguage('haskell', haskell);
    hljs.registerLanguage('lua', lua);
    hljs.registerLanguage('perl', perl);
    hljs.registerLanguage('r', r);
    hljs.registerLanguage('plaintext', plaintext);

    hljsInstance = hljs;
    return hljs;
  })();

  return hljsLoadPromise;
}

/**
 * Strips common leading whitespace from code lines, using the first line's indentation as the baseline.
 * This fixes issues where the entire code block is indented because of how it was formatted in the comment.
 */
function stripCommonIndentation(code: string): string {
  if (!code) return code;
  const lines = code.split('\n');

  // Find the indentation of the first non-empty line
  let baseIndent = '';
  for (const line of lines) {
    if (line.trim()) {
      const match = line.match(/^(\s+)/);
      if (match) {
        baseIndent = match[1];
      }
      break;
    }
  }

  if (!baseIndent) return code;

  return lines
    .map((line) => {
      if (line.startsWith(baseIndent)) {
        return line.substring(baseIndent.length);
      }
      return line;
    })
    .join('\n');
}

/**
 * Highlights code blocks in HTML using highlight.js with automatic language detection.
 * Searches for <pre><code> elements and applies syntax highlighting.
 * Falls back to plaintext if detection confidence is too low.
 *
 * Lazily loads highlight.js and language grammars on first invocation.
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html || typeof document === 'undefined') return html || '';

  try {
    const container = document.createElement('div');
    container.innerHTML = html;

    const codeBlocks = Array.from(container.querySelectorAll('pre code')) as HTMLElement[];
    if (codeBlocks.length === 0) return html;

    const hljs = await getHljs();

    for (const codeBlock of codeBlocks) {
      const rawCode = codeBlock.textContent || '';
      if (!rawCode.trim()) continue;

      const code = stripCommonIndentation(rawCode);

      let language: string;
      let highlighted: string;

      // Check for explicit language class
      const classAttr = codeBlock.className || '';
      const classMatch = classAttr.match(/language-(\w+)/);

      if (classMatch) {
        // Use explicit language specification
        language = classMatch[1];
        try {
          const result = hljs.highlight(code, { language, ignoreIllegals: true });
          highlighted = result.value;
        } catch {
          // If language is not recognized or highlighting fails, use plaintext
          highlighted = hljs.highlight(code, { language: 'plaintext' }).value;
          language = 'plaintext';
        }
      } else {
        // Auto-detect language with subset restriction
        try {
          const result = hljs.highlightAuto(code, SUPPORTED_LANGUAGES);

          // Only apply highlighting if confidence is above threshold
          if (result.relevance >= RELEVANCE_THRESHOLD) {
            language = result.language || 'plaintext';
            highlighted = result.value;
          } else {
            // Low confidence: treat as plaintext
            language = 'plaintext';
            highlighted = hljs.highlight(code, { language: 'plaintext' }).value;
          }
        } catch {
          // Fallback to plaintext on any error
          language = 'plaintext';
          highlighted = hljs.highlight(code, { language: 'plaintext' }).value;
        }
      }

      // Update the code block with highlighted content
      codeBlock.innerHTML = highlighted;
      codeBlock.className = `language-${language}`;

      // Mark the parent <pre> as having been highlighted
      const preBlock = codeBlock.parentElement;
      if (preBlock && preBlock.tagName === 'PRE') {
        preBlock.classList.add('hljs-highlighted');
      }
    }

    return container.innerHTML;
  } catch {
    return html;
  }
}
