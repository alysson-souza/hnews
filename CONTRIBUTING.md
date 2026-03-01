# Contributing to HNews

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 9+

Optional

- nvm: `nvm use` to match the project Node version

## Setup

```bash
# Clone and install
git clone https://github.com/alysson-souza/hnews.git
cd hnews
npm install

# Start dev server
npm start  # http://localhost:4200
```

## Scripts

```bash
npm start              # Run dev server (http://localhost:4200)
npm run watch          # Watch mode build
npm run build          # Build (development)
npm run build:prod     # Build (production)
npm test               # Unit tests (Vitest)
npm run test:functions # Functions tests (Vitest)
npm run lint           # ESLint (fails on warnings)
npm run lint:fix       # ESLint with autofix (fails on warnings)
npm run format         # Prettier write
npm run format:check   # Prettier check only
npm run e2e            # Playwright e2e tests
npm run e2e:ui         # Interactive e2e UI mode
npm run deploy:cf      # Deploy to Cloudflare Pages
```

## Testing

- Unit tests: `npm test` (Vitest via Angular)
- Functions tests: `npm run test:functions`
- E2E tests: `npm run e2e` (Playwright — requires `npx playwright install` first)
- Coverage: `npm run test:coverage` (outputs to `coverage/hnews`)
- Prefer focused service specs and shallow component tests; mock network calls

## Code Style

- TypeScript: single quotes; ~100 char line width (Prettier)
- Indentation: 2 spaces; UTF‑8; trim trailing whitespace (see `.editorconfig`)
- Angular selectors: components `app-` (kebab-case); directives `app` (camelCase)
- Filenames: kebab-case; classes `PascalCase` with suffixes (`FooComponent`, `BarService`)
- Tools: ESLint (angular-eslint) and Prettier run locally + via Husky/lint-staged

## Project Structure

- `src/app/components`: Reusable UI (story list/item, comments, shared widgets)
- `src/app/pages`: Route-level features (top/best/newest, item, user, search, settings)
- `src/app/services`: Data fetching, caching, navigation services
- `src/app/stores`: Signal-based state management
- `src/app/data`: API clients (Algolia, HN API, LibreRedirect)
- `src/app/models`: TypeScript interfaces
- `src/app/pipes`: Angular pipes (relative time)
- `src/app/config`: Configuration providers (cache config)
- `e2e/`: Playwright tests, page objects, and fixtures
- `functions/`: Cloudflare Pages functions
- `public/`: PWA manifest, icons, static assets
- Tests live next to code as `*.spec.ts`

## Commits & PRs

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `build:`, `test:`
- PRs: include a concise summary, linked issues (e.g., `Fixes #123`), and screenshots for UI changes
- CI expectations: `npm run lint` and `npm test` should pass; verify `npm run build:prod` for impactful UI changes
