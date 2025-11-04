// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

/**
 * Detects the programming language from a code block based on common patterns.
 * Falls back to 'javascript' as default.
 */
function detectLanguage(codeText: string): string {
  const trimmed = codeText.trim().toLowerCase();

  // Bash/Shell shebang patterns (check first to avoid JavaScript comment confusion)
  if (
    trimmed.includes('bin/bash') ||
    trimmed.includes('bin/sh') ||
    trimmed.startsWith('usr/bin/env')
  ) {
    // Double-check it looks like a shebang
    if (trimmed.startsWith('!') || trimmed.startsWith('bin/')) {
      return 'bash';
    }
  }

  // Python patterns
  if (/^(import|from|def|class)\s|^#!.*python|\.py:|if __name__/.test(trimmed)) {
    return 'python';
  }

  // Go patterns
  if (/^(package|import)\s|func\s+\w+\s*\(|:=\s/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(fn|impl|struct|enum|mod|use)\s|->|&&|\.iter/.test(trimmed)) {
    return 'rust';
  }

  // Bash/Shell command patterns
  if (/^(export\s|\$\(|for\s+\w+\s+in|if\s+\[|echo\s|grep\s|sed\s|awk\s)/.test(trimmed)) {
    return 'bash';
  }

  // SQL patterns
  if (/^(select|insert|update|delete|create|alter|drop|from|where)\s/i.test(trimmed)) {
    return 'sql';
  }

  // JSON patterns
  if (/^[{[]/.test(trimmed) && (/["\w]+\s*:\s*/.test(trimmed) || /^\[/.test(trimmed))) {
    return 'json';
  }

  // CSS patterns
  if (/^[.#\w-]+\s*{|:\s*(color|font|margin|padding|border|background)/.test(trimmed)) {
    return 'css';
  }

  // HTML/XML patterns
  if (/^<[!?]?[a-z]/i.test(trimmed)) {
    return 'markup';
  }

  // Default to JavaScript/TypeScript
  return 'javascript';
}

/**
 * Highlights code blocks in HTML using Prism.js.
 * Searches for <pre><code> elements and applies syntax highlighting based on detected language.
 */
export function highlightCodeBlocks(html: string): string {
  if (!html || typeof document === 'undefined') return html || '';

  try {
    const container = document.createElement('div');
    container.innerHTML = html;

    const codeBlocks = Array.from(container.querySelectorAll('pre code')) as HTMLElement[];
    for (const codeBlock of codeBlocks) {
      const code = codeBlock.textContent || '';
      if (!code.trim()) continue;

      // Detect language from code or from class attribute
      let language = 'javascript';
      const classAttr = codeBlock.className || '';
      const classMatch = classAttr.match(/language-(\w+)/);
      if (classMatch) {
        language = classMatch[1];
      } else {
        language = detectLanguage(code);
      }

      // Highlight using Prism
      try {
        const highlighted = Prism.highlight(
          code,
          Prism.languages[language] || Prism.languages['javascript'],
          language,
        );
        codeBlock.innerHTML = highlighted;
        codeBlock.className = `language-${language}`;

        // Mark the parent <pre> as having been highlighted
        const preBlock = codeBlock.parentElement;
        if (preBlock && preBlock.tagName === 'PRE') {
          preBlock.classList.add('prism-highlighted');
        }
      } catch {
        // If highlighting fails, leave the code as-is
        continue;
      }
    }

    return container.innerHTML;
  } catch {
    return html;
  }
}
