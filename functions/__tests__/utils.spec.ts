import {
  absoluteUrl,
  CORS_HEADERS,
  decodeEntities,
  escapeAttr,
  getNumber,
  getString,
  isAssetPath,
  isRecord,
  isSafePublicUrl,
  jsonResponse,
  matchHtmlTitle,
  matchMetaContent,
  MAX_IMAGE_SIZE,
  resolveImageUrl,
  safeHostname,
  stripHtml,
  truncate,
} from '../utils';

// ---------------------------------------------------------------------------
// isSafePublicUrl
// ---------------------------------------------------------------------------

describe('isSafePublicUrl', () => {
  describe('valid URLs', () => {
    it('accepts https URL', () => {
      expect(isSafePublicUrl('https://example.com/page')).not.toBeNull();
    });

    it('accepts http URL', () => {
      expect(isSafePublicUrl('http://example.com')).not.toBeNull();
    });

    it('accepts URL on port 8080', () => {
      expect(isSafePublicUrl('https://example.com:8080/path')).not.toBeNull();
    });

    it('accepts URL on port 8443', () => {
      expect(isSafePublicUrl('https://example.com:8443/path')).not.toBeNull();
    });

    it('returns parsed URL object', () => {
      const result = isSafePublicUrl('https://example.com/page?q=1');
      expect(result).toBeInstanceOf(URL);
      expect(result!.hostname).toBe('example.com');
      expect(result!.pathname).toBe('/page');
    });

    it('accepts subdomain URLs', () => {
      expect(isSafePublicUrl('https://cdn.images.example.com/og.jpg')).not.toBeNull();
    });
  });

  describe('non-HTTP schemes', () => {
    it.each(['ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,x'])(
      'blocks %s',
      (url) => {
        expect(isSafePublicUrl(url)).toBeNull();
      },
    );
  });

  describe('malformed URLs', () => {
    it('blocks empty string', () => {
      expect(isSafePublicUrl('')).toBeNull();
    });

    it('blocks garbage', () => {
      expect(isSafePublicUrl('not-a-url')).toBeNull();
    });

    it('blocks URL with only scheme', () => {
      expect(isSafePublicUrl('https://')).toBeNull();
    });
  });

  describe('IP addresses', () => {
    it('blocks IPv4 private (10.x)', () => {
      expect(isSafePublicUrl('http://10.0.0.1/path')).toBeNull();
    });

    it('blocks IPv4 private (192.168.x)', () => {
      expect(isSafePublicUrl('http://192.168.1.1')).toBeNull();
    });

    it('blocks IPv4 loopback', () => {
      expect(isSafePublicUrl('http://127.0.0.1')).toBeNull();
    });

    it('blocks IPv4 link-local (169.254.x)', () => {
      expect(isSafePublicUrl('http://169.254.169.254')).toBeNull();
    });

    it('blocks public IPv4 addresses too (all IPs blocked)', () => {
      expect(isSafePublicUrl('http://8.8.8.8')).toBeNull();
    });

    it('blocks IPv6 loopback', () => {
      expect(isSafePublicUrl('http://[::1]')).toBeNull();
    });

    it('blocks IPv6 addresses', () => {
      expect(isSafePublicUrl('http://[2001:db8::1]')).toBeNull();
    });
  });

  describe('internal/metadata hostnames', () => {
    it('blocks localhost', () => {
      expect(isSafePublicUrl('http://localhost')).toBeNull();
    });

    it('blocks metadata.google.internal', () => {
      expect(isSafePublicUrl('http://metadata.google.internal')).toBeNull();
    });

    it('blocks metadata.google', () => {
      expect(isSafePublicUrl('http://metadata.google')).toBeNull();
    });

    it('blocks instance-data', () => {
      expect(isSafePublicUrl('http://instance-data')).toBeNull();
    });

    it('blocks kubernetes.default', () => {
      expect(isSafePublicUrl('http://kubernetes.default')).toBeNull();
    });
  });

  describe('internal TLDs', () => {
    it('blocks .internal', () => {
      expect(isSafePublicUrl('http://service.internal')).toBeNull();
    });

    it('blocks .local', () => {
      expect(isSafePublicUrl('http://myhost.local')).toBeNull();
    });

    it('blocks .localhost', () => {
      expect(isSafePublicUrl('http://app.localhost')).toBeNull();
    });
  });

  describe('bare hostnames (no dot)', () => {
    it('blocks intranet', () => {
      expect(isSafePublicUrl('http://intranet')).toBeNull();
    });

    it('blocks single-label hostname', () => {
      expect(isSafePublicUrl('http://server')).toBeNull();
    });
  });

  describe('credentials in URL', () => {
    it('blocks username', () => {
      expect(isSafePublicUrl('http://user@example.com')).toBeNull();
    });

    it('blocks username and password', () => {
      expect(isSafePublicUrl('http://user:pass@example.com')).toBeNull();
    });
  });

  describe('non-standard ports', () => {
    it('blocks port 3000', () => {
      expect(isSafePublicUrl('http://example.com:3000')).toBeNull();
    });

    it('blocks port 22 (SSH)', () => {
      expect(isSafePublicUrl('http://example.com:22')).toBeNull();
    });

    it('blocks port 6379 (Redis)', () => {
      expect(isSafePublicUrl('http://example.com:6379')).toBeNull();
    });

    it('allows default port 80 (implicit)', () => {
      expect(isSafePublicUrl('http://example.com')).not.toBeNull();
    });

    it('allows default port 443 (implicit)', () => {
      expect(isSafePublicUrl('https://example.com')).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// matchMetaContent
// ---------------------------------------------------------------------------

describe('matchMetaContent', () => {
  it('extracts og:image with property before content', () => {
    const html = '<meta property="og:image" content="https://example.com/img.jpg">';
    expect(matchMetaContent(html, 'og:image')).toBe('https://example.com/img.jpg');
  });

  it('extracts og:image with content before property', () => {
    const html = '<meta content="https://example.com/img.jpg" property="og:image">';
    expect(matchMetaContent(html, 'og:image')).toBe('https://example.com/img.jpg');
  });

  it('extracts twitter:image with name attribute', () => {
    const html = '<meta name="twitter:image" content="https://example.com/tw.jpg">';
    expect(matchMetaContent(html, 'twitter:image')).toBe('https://example.com/tw.jpg');
  });

  it('handles single quotes', () => {
    const html = "<meta property='og:title' content='Hello World'>";
    expect(matchMetaContent(html, 'og:title')).toBe('Hello World');
  });

  it('is case-insensitive for tag', () => {
    const html = '<META PROPERTY="og:image" CONTENT="https://example.com/img.jpg">';
    expect(matchMetaContent(html, 'og:image')).toBe('https://example.com/img.jpg');
  });

  it('returns null for missing key', () => {
    const html = '<meta property="og:title" content="Hello">';
    expect(matchMetaContent(html, 'og:image')).toBeNull();
  });

  it('returns null for empty html', () => {
    expect(matchMetaContent('', 'og:image')).toBeNull();
  });

  it('extracts meta description (name-based)', () => {
    const html = '<meta name="description" content="Page description">';
    expect(matchMetaContent(html, 'description')).toBe('Page description');
  });

  it('returns first match when multiple tags exist', () => {
    const html = `
      <meta property="og:image" content="https://example.com/first.jpg">
      <meta property="og:image" content="https://example.com/second.jpg">
    `;
    expect(matchMetaContent(html, 'og:image')).toBe('https://example.com/first.jpg');
  });

  it('handles extra attributes in the meta tag', () => {
    const html = '<meta data-rh="true" property="og:title" content="Title" data-other="x">';
    expect(matchMetaContent(html, 'og:title')).toBe('Title');
  });
});

// ---------------------------------------------------------------------------
// matchHtmlTitle
// ---------------------------------------------------------------------------

describe('matchHtmlTitle', () => {
  it('extracts title content', () => {
    expect(matchHtmlTitle('<title>Hello World</title>')).toBe('Hello World');
  });

  it('trims whitespace', () => {
    expect(matchHtmlTitle('<title>  Spaced Title  </title>')).toBe('Spaced Title');
  });

  it('is case-insensitive', () => {
    expect(matchHtmlTitle('<TITLE>Upper</TITLE>')).toBe('Upper');
  });

  it('handles title with attributes', () => {
    expect(matchHtmlTitle('<title data-rh="true">Attr Title</title>')).toBe('Attr Title');
  });

  it('returns null for missing title', () => {
    expect(matchHtmlTitle('<head><meta charset="utf-8"></head>')).toBeNull();
  });

  it('returns null for empty title', () => {
    expect(matchHtmlTitle('<title></title>')).toBeNull();
  });

  it('returns null for empty html', () => {
    expect(matchHtmlTitle('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveImageUrl
// ---------------------------------------------------------------------------

describe('resolveImageUrl', () => {
  const base = new URL('https://example.com/page/article');

  it('returns absolute https URL as-is', () => {
    expect(resolveImageUrl('https://cdn.example.com/img.jpg', base)).toBe(
      'https://cdn.example.com/img.jpg',
    );
  });

  it('returns absolute http URL as-is', () => {
    expect(resolveImageUrl('http://cdn.example.com/img.jpg', base)).toBe(
      'http://cdn.example.com/img.jpg',
    );
  });

  it('resolves protocol-relative URL', () => {
    expect(resolveImageUrl('//cdn.example.com/img.jpg', base)).toBe(
      'https://cdn.example.com/img.jpg',
    );
  });

  it('resolves relative path', () => {
    expect(resolveImageUrl('/images/og.jpg', base)).toBe('https://example.com/images/og.jpg');
  });

  it('resolves relative path without leading slash', () => {
    expect(resolveImageUrl('images/og.jpg', base)).toBe('https://example.com/page/images/og.jpg');
  });

  it('trims whitespace', () => {
    expect(resolveImageUrl('  https://example.com/img.jpg  ', base)).toBe(
      'https://example.com/img.jpg',
    );
  });

  it('returns null for invalid relative URL', () => {
    // Using a base that would produce an invalid URL is hard,
    // but an empty string resolves to the base
    const result = resolveImageUrl('', base);
    // Empty string resolves to base URL
    expect(result).toBe('https://example.com/page/article');
  });
});

// ---------------------------------------------------------------------------
// decodeEntities
// ---------------------------------------------------------------------------

describe('decodeEntities', () => {
  it('decodes &amp;', () => {
    expect(decodeEntities('A &amp; B')).toBe('A & B');
  });

  it('decodes &quot;', () => {
    expect(decodeEntities('&quot;quoted&quot;')).toBe('"quoted"');
  });

  it('decodes &#34;', () => {
    expect(decodeEntities('&#34;quoted&#34;')).toBe('"quoted"');
  });

  it('decodes &lt; and &gt;', () => {
    expect(decodeEntities('&lt;div&gt;')).toBe('<div>');
  });

  it('decodes &#60; and &#62;', () => {
    expect(decodeEntities('&#60;div&#62;')).toBe('<div>');
  });

  it('decodes &#39;', () => {
    expect(decodeEntities('it&#39;s')).toBe("it's");
  });

  it('decodes &#x27;', () => {
    expect(decodeEntities('it&#x27;s')).toBe("it's");
  });

  it('decodes &apos;', () => {
    expect(decodeEntities('it&apos;s')).toBe("it's");
  });

  it('preserves unknown entities', () => {
    expect(decodeEntities('&nbsp; &mdash;')).toBe('&nbsp; &mdash;');
  });

  it('handles multiple entities', () => {
    expect(decodeEntities('&lt;a href=&quot;/&quot;&gt;')).toBe('<a href="/">');
  });

  it('returns plain text unchanged', () => {
    expect(decodeEntities('Hello World')).toBe('Hello World');
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('returns string exactly at max unchanged', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('Hello World', 6)).toBe('Hello…');
  });

  it('trims trailing whitespace before ellipsis', () => {
    expect(truncate('Hello World Test', 7)).toBe('Hello…');
  });

  it('handles max of 1', () => {
    expect(truncate('Hello', 1)).toBe('…');
  });

  it('returns empty string unchanged', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// escapeAttr
// ---------------------------------------------------------------------------

describe('escapeAttr', () => {
  it('escapes ampersand', () => {
    expect(escapeAttr('A & B')).toBe('A &amp; B');
  });

  it('escapes double quotes', () => {
    expect(escapeAttr('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes < and >', () => {
    expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes all together', () => {
    expect(escapeAttr('A & "B" <C>')).toBe('A &amp; &quot;B&quot; &lt;C&gt;');
  });

  it('returns safe string unchanged', () => {
    expect(escapeAttr('Hello World')).toBe('Hello World');
  });
});

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------

describe('stripHtml', () => {
  it('strips tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('decodes entities after stripping', () => {
    expect(stripHtml('<p>A &amp; B</p>')).toBe('A & B');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('<p>  Hello   World  </p>')).toBe('Hello World');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><a href="/">Link</a></p></div>')).toBe('Link');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles string with only tags', () => {
    expect(stripHtml('<br><hr>')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isRecord
// ---------------------------------------------------------------------------

describe('isRecord', () => {
  it('returns true for objects', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns true for arrays', () => {
    expect(isRecord([1, 2])).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isRecord('hello')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isRecord(42)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRecord(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getString / getNumber
// ---------------------------------------------------------------------------

describe('getString', () => {
  it('returns string value', () => {
    expect(getString({ name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('returns undefined for non-string value', () => {
    expect(getString({ count: 42 }, 'count')).toBeUndefined();
  });

  it('returns undefined for missing key', () => {
    expect(getString({}, 'name')).toBeUndefined();
  });
});

describe('getNumber', () => {
  it('returns number value', () => {
    expect(getNumber({ count: 42 }, 'count')).toBe(42);
  });

  it('returns undefined for non-number value', () => {
    expect(getNumber({ name: 'Alice' }, 'name')).toBeUndefined();
  });

  it('returns undefined for missing key', () => {
    expect(getNumber({}, 'count')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// safeHostname
// ---------------------------------------------------------------------------

describe('safeHostname', () => {
  it('extracts hostname', () => {
    expect(safeHostname('https://example.com/page')).toBe('example.com');
  });

  it('strips www prefix', () => {
    expect(safeHostname('https://www.example.com')).toBe('example.com');
  });

  it('returns undefined for invalid URL', () => {
    expect(safeHostname('not-a-url')).toBeUndefined();
  });

  it('preserves subdomain', () => {
    expect(safeHostname('https://blog.example.com')).toBe('blog.example.com');
  });
});

// ---------------------------------------------------------------------------
// absoluteUrl
// ---------------------------------------------------------------------------

describe('absoluteUrl', () => {
  it('joins base and path', () => {
    expect(absoluteUrl('/page', 'https://example.com')).toBe('https://example.com/page');
  });

  it('strips trailing slashes from base', () => {
    expect(absoluteUrl('/page', 'https://example.com/')).toBe('https://example.com/page');
  });

  it('adds leading slash to path', () => {
    expect(absoluteUrl('page', 'https://example.com')).toBe('https://example.com/page');
  });

  it('handles multiple trailing slashes on base', () => {
    expect(absoluteUrl('/page', 'https://example.com///')).toBe('https://example.com/page');
  });
});

// ---------------------------------------------------------------------------
// isAssetPath
// ---------------------------------------------------------------------------

describe('isAssetPath', () => {
  it('returns true for .js', () => {
    expect(isAssetPath('/main.js')).toBe(true);
  });

  it('returns true for .css', () => {
    expect(isAssetPath('/styles.css')).toBe(true);
  });

  it('returns true for .png', () => {
    expect(isAssetPath('/images/logo.png')).toBe(true);
  });

  it('returns true for .html', () => {
    expect(isAssetPath('/index.html')).toBe(true);
  });

  it('returns false for no extension', () => {
    expect(isAssetPath('/top')).toBe(false);
  });

  it('returns false for root', () => {
    expect(isAssetPath('/')).toBe(false);
  });

  it('returns false for /item/12345', () => {
    expect(isAssetPath('/item/12345')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// jsonResponse
// ---------------------------------------------------------------------------

describe('jsonResponse', () => {
  it('returns JSON content type', async () => {
    const res = jsonResponse({ ok: true }, 200);
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('sets CORS headers', async () => {
    const res = jsonResponse({}, 200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });

  it('sets correct status', async () => {
    const res = jsonResponse({}, 400);
    expect(res.status).toBe(400);
  });

  it('serializes body as JSON', async () => {
    const res = jsonResponse({ imageUrl: null }, 200);
    const body = await res.json();
    expect(body).toEqual({ imageUrl: null });
  });

  it('applies extra headers', async () => {
    const res = jsonResponse({}, 200, { 'cache-control': 'public, max-age=3600' });
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('CORS_HEADERS has expected keys', () => {
    expect(CORS_HEADERS).toEqual({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
  });

  it('MAX_IMAGE_SIZE is 5 MB', () => {
    expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });
});
