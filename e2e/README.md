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

- `base.page.ts`: Base page with common methods
- `stories.page.ts`: Story list pages (top, new, best, etc.)
- `item.page.ts`: Story detail and comments page
- `user.page.ts`: User profile page
- `search.page.ts`: Search functionality
- `settings.page.ts`: Settings and preferences

## Test Files

- `stories.spec.ts`: Story list navigation and loading
- `item.spec.ts`: Story details and comments
- `user.spec.ts`: User profiles and activity
- `search.spec.ts`: Search and filters
- `settings.spec.ts`: Settings and theme
- `keyboard.spec.ts`: Keyboard shortcuts

## Documentation

See [E2E.md](../E2E.md) for comprehensive documentation including:

- Installation and setup
- Running tests
- Writing tests
- Debugging
- CI/CD integration
- Best practices

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
npm run e2e:report       # View HTML report
npm run e2e:codegen      # Generate tests with Playwright
```
