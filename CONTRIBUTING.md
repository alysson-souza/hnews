# Contributing to HNews

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 9+

Optional

- nvm: `nvm use` to match the project Node version

## Setup

```bash
# Clone and install
git clone https://github.com/alysson-souza/hnews.git
cd hnews
pnpm install

# Start dev server
pnpm start  # http://localhost:4200
```

## Scripts

```bash
pnpm start            # Run dev server (http://localhost:4200)
pnpm run watch        # Watch mode build
pnpm run build        # Build (development)
pnpm run build:prod   # Build (production)
pnpm test             # Unit tests (Vitest)
pnpm run lint         # ESLint
pnpm run lint:fix     # ESLint with autofix
pnpm run format       # Prettier write
pnpm run format:check # Prettier check only
pnpm run deploy       # Deploy to GitHub Pages (gh-pages)
pnpm run deploy:ci    # CI-friendly deploy
```

## Testing

- Run tests: `pnpm test`
- Coverage: `pnpm run test:coverage` (outputs to `coverage/hnews`)
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
- `src/app/services`: Data and caching services
- `src/app/config`: API configuration providers
- `public/`: PWA manifest, icons, static assets
- Tests live next to code as `*.spec.ts`

## Commits & PRs

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `build:`, `test:`
- PRs: include a concise summary, linked issues (e.g., `Fixes #123`), and screenshots for UI changes
- CI expectations: `pnpm run lint` and `pnpm test` should pass; verify `pnpm run build:prod` for impactful UI changes
