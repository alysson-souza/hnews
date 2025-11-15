// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

const BLOCK_LIKE_TAGS = new Set([
  'P',
  'DIV',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'LI',
  'PRE',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TD',
  'TH',
  'SECTION',
  'ARTICLE',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'FIGURE',
  'HR',
]);

const isBlockElement = (node: Node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  return BLOCK_LIKE_TAGS.has((node as HTMLElement).tagName);
};

const hasVisibleContent = (el: HTMLElement) => (el.textContent ?? '').trim().length > 0;

const collectInlineQuoteRun = (
  doc: Document,
  nodes: Node[],
  startIndex: number,
): { paragraph: HTMLParagraphElement; consumed: number } => {
  const paragraph = doc.createElement('p');
  let consumed = 0;

  for (let idx = startIndex; idx < nodes.length; idx++) {
    const current = nodes[idx];

    if (consumed > 0 && isBlockElement(current)) {
      break;
    }

    paragraph.appendChild(current.cloneNode(true));
    consumed++;
  }

  return { paragraph, consumed };
};

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
    for (let idx = 0; idx < children.length; ) {
      const node = children[idx];

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
            if (hasVisibleContent(cloned)) {
              currentBQ.appendChild(cloned);
            }
          } else {
            const p = doc.createElement('p');
            p.appendChild(cloned);
            if (hasVisibleContent(p)) {
              currentBQ.appendChild(p);
            }
          }
          idx++;
          continue;
        }

        // Non-quote element
        flushBQ();
        container.appendChild(node.cloneNode(true));
        idx++;
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const raw = node.nodeValue || '';
        if (raw.trim().length === 0) {
          // ignore pure whitespace between blocks
          idx++;
          continue;
        }
        const startsQuote = raw.trimStart().startsWith('>');
        if (startsQuote) {
          const { paragraph, consumed } = collectInlineQuoteRun(doc, children, idx);
          removeLeadingQuoteMarker(paragraph);
          if (hasVisibleContent(paragraph)) {
            if (!currentBQ) currentBQ = doc.createElement('blockquote');
            currentBQ.appendChild(paragraph);
          }
          idx += consumed;
          continue;
        } else {
          const p = doc.createElement('p');
          p.textContent = raw;
          flushBQ();
          container.appendChild(p);
          idx++;
          continue;
        }
      }

      // Any other node types: close blockquote and pass through
      flushBQ();
      container.appendChild(node.cloneNode(true));
      idx++;
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
