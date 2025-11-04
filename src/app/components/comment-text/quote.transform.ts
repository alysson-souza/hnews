// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

// Transforms HTML where lines beginning with ">" represent quotes.
// Groups consecutive quoted lines into <blockquote> and removes the leading marker.
export function transformQuotesHtml(inputHtml: string): string {
  if (!inputHtml) return '';

  // Fast path: if no potential quote markers, skip parsing entirely
  const hasQuoteMarkers =
    /<p[^>]*>\s*(?:&gt;|>)/i.test(inputHtml) ||
    /^\s*(?:&gt;|>)/.test(inputHtml) ||
    /<[^>]+>\s*(?:&gt;|>)/.test(inputHtml);
  if (!hasQuoteMarkers) {
    return inputHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(inputHtml, 'text/html');
    const body = doc.body;

    const container = doc.createElement('div');
    let currentBQ: HTMLElement | null = null;

    const flushBQ = () => {
      if (currentBQ) {
        container.appendChild(currentBQ);
        currentBQ = null;
      }
    };

    const removeLeadingQuoteMarker = (el: Element) => {
      const stripInNode = (node: Node): boolean => {
        // Process node and return true if ANY marker was found at this level
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue ?? '';
          // Match both plain > and HTML-encoded &gt;
          const m = text.match(/^(\s*)(?:&gt;|>)(\s?)([\s\S]*)/);
          if (m) {
            // keep original leading whitespace (m[1]) and the rest (m[3])
            node.nodeValue = `${m[1]}${m[3]}`;
            return true;
          }
          return false;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const children = Array.from(node.childNodes);
          let foundAny = false;
          for (const child of children) {
            // Process all children, don't stop after first match
            const stripped = stripInNode(child);
            if (stripped) foundAny = true;
          }
          return foundAny;
        }
        return false;
      };
      stripInNode(el);
    };

    const children = Array.from(body.childNodes);
    for (const node of children) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const isQuote = element.textContent?.trimStart().startsWith('>');

        if (isQuote) {
          const cloned = element.cloneNode(true) as HTMLElement;
          if (!currentBQ) currentBQ = doc.createElement('blockquote');

          // Remove the leading quote marker from the cloned element
          removeLeadingQuoteMarker(cloned);

          // Wrap non-paragraph elements in <p> tags for proper blockquote structure
          if (element.tagName === 'P') {
            currentBQ.appendChild(cloned);
          } else {
            const p = doc.createElement('p');
            p.appendChild(cloned);
            currentBQ.appendChild(p);
          }
          continue;
        }

        // Non-quote element
        flushBQ();
        container.appendChild(node.cloneNode(true));
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const raw = node.nodeValue || '';
        if (raw.trim().length === 0) {
          // ignore pure whitespace between blocks
          continue;
        }
        const startsQuote = raw.trimStart().startsWith('>');
        const p = doc.createElement('p');
        p.textContent = raw;
        if (startsQuote) {
          removeLeadingQuoteMarker(p);
          if (!currentBQ) currentBQ = doc.createElement('blockquote');
          currentBQ.appendChild(p);
        } else {
          flushBQ();
          container.appendChild(p);
        }
        continue;
      }

      // Any other node types: close blockquote and pass through
      flushBQ();
      container.appendChild(node.cloneNode(true));
    }

    // Flush at end
    flushBQ();

    const result = container.innerHTML;
    // If nothing changed, return original to avoid churn
    return result && result !== inputHtml ? result : inputHtml;
  } catch {
    // On any parsing error, fall back to original html
    return inputHtml;
  }
}
