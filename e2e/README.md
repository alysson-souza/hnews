# E2E Tests

This directory contains end-to-end tests for the hnews application using Playwright.

## Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm run e2e

# Run tests with UI mode
npm run e2e:ui

# Run tests in debug mode
npm run e2e:debug
```

## Structure

- **`fixtures/`**: Custom Playwright fixtures providing page object instances
- **`page-objects/`**: Page object models for each page/feature
- **`tests/`**: Test specifications organized by feature

## Page Objects

- `base.page.ts`: Base page with navigation helpers
- `stories.page.ts`: Story list pages (top, new, best, etc.)
- `item.page.ts`: Story detail and comments page
- `user.page.ts`: User profile page
- `search.page.ts`: Search functionality
- `settings.page.ts`: Settings and preferences
- `sidebar.page.ts`: Comments sidebar panel
- `userscript.page.ts`: Userscript installation page

## Test Files

- `sidebar.spec.ts`: Comments sidebar (open/close, scroll lock, threads, mobile swipe dismissal)
- `cloudflare-pages-offline.spec.ts`: Offline behavior on Cloudflare Pages
- `item.spec.ts`: Story details, comments, and thread navigation
- `keyboard-story-context.spec.ts`: Keyboard shortcuts on story lists
- `keyboard-item-context.spec.ts`: Keyboard shortcuts on item/comment pages
- `test-actions-menu.spec.ts`: Story actions menu (mouse, keyboard, mobile layout)
- `visited-and-filter.spec.ts`: Visited-story markers, Top 50% filter, HN-compat deep links
- `stories.spec.ts`: Story list navigation, pagination, and responsive layout
- `settings.spec.ts`: Settings page (theme, privacy redirects, cache, layout)
- `search.spec.ts`: Search and filters
- `keyboard.spec.ts`: Core keyboard shortcuts and theme toggle
- `saved-stories.spec.ts`: Saved stories page
- `user.spec.ts`: User profiles and activity
- `comment-sort.spec.ts`: Comment sort order on item pages
- `userscript.spec.ts`: Userscript installation page

## Documentation

Behavioral specs the tests verify against live in `docs/` (for example
[comment-navigation](../docs/comment-navigation.md) for the J/K/L/H sidebar and
comment shortcuts).

## Quick Commands

```bash
npm run e2e              # Run all tests (headless)
npm run e2e:ui           # Interactive UI mode
npm run e2e:headed       # See browser while testing
npm run e2e:debug        # Step-by-step debugging
npm run e2e:chromium     # Test on Chromium only
npm run e2e:firefox      # Test on Firefox only
npm run e2e:webkit       # Test on WebKit only
npm run e2e:mobile       # Test on mobile browsers
npm run e2e:gh           # Test the GitHub Pages/Angular dev server on port 4200
npm run e2e:live         # Live API contract checks (see below) - not part of the suite
npm run e2e:report       # View HTML report
npm run e2e:codegen      # Generate tests against Cloudflare Pages dev on port 8788
npm run e2e:codegen:gh   # Generate tests against GitHub Pages dev on port 4200
```

The suite runs against `ng serve` on port 4200. `wrangler pages dev` intermittently
404s the app shell under parallel load, which fails a different test each run; CI
moved off it for the same reason. Pages behaviour is still covered, because
`cloudflare-pages-offline.spec.ts` serves the production bundle from its own server.
To run against wrangler anyway, set `PLAYWRIGHT_BASE_URL=http://localhost:8788`.

## Test Data

Specs get deterministic Hacker News data: `e2e/fixtures/pages.fixture.ts` installs
route interception for every Firebase HN and Algolia request, served from the
dataset in `e2e/fixtures/hn-fixture-data.ts`. No test in `e2e/tests/` depends on
live data, so none of them skip themselves when the real feed changes. Add or
adjust scenario data with the `addStory` / `addComment` / `addUser` helpers.

The one deliberate exception is `npm run e2e:live` (`e2e/live/`), which calls the
real APIs to catch upstream response-shape drift the fixtures would otherwise hide.
It is excluded from the normal suite and meant to run on a schedule.
