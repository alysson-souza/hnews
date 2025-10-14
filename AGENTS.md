# Repository Guidelines

## Project Structure & Module Organization

- `src/app/components`: Reusable UI (story list/item, comments, shared widgets).
- `src/app/pages`: Route-level features (top/best/newest, item, user, search, settings).
- `src/app/services`: Data and caching services.
- `src/app/config`: API configuration providers.
- `public/`: PWA manifest, icons, static assets.
- Tests live next to code as `*.spec.ts` (e.g., `src/app/app.spec.ts`).

## Build, Test, and Development Commands

- `npm start`: Run dev server at `http://localhost:4200`. You should assume it is already running.
- `npm run build`: Development build (outputs to `dist/hnews`).
- `npm run build:prod`: Production build; pass `--base-href` when needed (e.g., `-- --base-href=/hnews/`).
- `npm test`: Single-run unit tests (Karma + Jasmine), exits cleanly (no coverage).
- `npm run test:watch`: Unit tests in watch mode (Karma + Jasmine).
- `npm run test:coverage`: Single-run tests with coverage output to `coverage/hnews`.
- `npm run test:coverage:watch`: Watch mode with coverage (slower, for targeted work).
- `npm run e2e`: Single-run e2e tests (Playwright), uses list reporter locally and dot reporter on CI.
- `npm run e2e:chromium` / `e2e:firefox` / `e2e:webkit`: Run e2e tests on specific browser.
- `npm run e2e:ui`: Interactive UI mode for e2e tests (watch mode).
- `npm run e2e:headed`: Run e2e tests with visible browser.
- `npm run e2e:debug`: Debug e2e tests with Playwright Inspector.
- `npm run lint` / `npm run lint:fix`: ESLint check/fix.
- `npm run format` / `npm run format:check`: Prettier write/check.
- `npm run deploy`: Deploy to GitHub Pages (via `angular-cli-ghpages`).

## Coding Style & Naming Conventions

- Indentation: 2 spaces; UTF‑8; trim trailing whitespace (`.editorconfig`).
- TypeScript: single quotes; line width ~100 (Prettier).
- Angular selectors: components `app-` (kebab-case), directives `app` (camelCase) per ESLint rules.
- Filenames: `kebab-case` for files; classes use `PascalCase` with suffixes (`FooComponent`, `BarService`).
- Tools: ESLint (angular-eslint), Prettier, Husky + lint-staged on pre-commit.

## Testing Guidelines

- Framework: Karma + Jasmine
- Place tests as `*.spec.ts` beside the unit under test.
- Run `npm test` for a single pass; use `npm run test:watch` in watch mode.
- Coverage: `npm run test:coverage` (single-run) or `npm run test:coverage:watch` (watch mode). Outputs to `coverage/hnews`.
- Prefer shallow tests for components and focused service specs; mock network calls.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `build:`, `test:`, `refactor:`… (see git history).
- PRs: include a concise summary, linked issues (`Fixes #123`), and screenshots for UI changes.
- CI: ensure `npm run lint` and `npm test` pass; verify `npm run build:prod` for critical UI changes.

## Security & Configuration Tips

- Never commit secrets. Copy `.env.example` to `.env` locally.
- For CI/CD and Pages deploys, use repository secrets; workflow infers `--base-href` for forks.
- Node: use `.nvmrc` (Node 22.x). npm 9+ recommended.
