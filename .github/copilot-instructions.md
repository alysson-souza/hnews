# Copilot Instructions for hnews

This guide enables AI coding agents to work productively in the `hnews` Angular project. It summarizes essential architecture, workflows, and conventions unique to this codebase.

## Architecture Overview

- **Angular 20, Standalone Components**: UI is built from reusable components in `src/app/components`. Route-level features live in `src/app/pages`.
- **Services**: Data, caching, and device logic are in `src/app/services`. Caching uses memory, IndexedDB, Service Worker, and localStorage.
- **Config & API**: API endpoints and config providers are in `src/app/config`. Integrates Hacker News Firebase and Algolia HN Search.
- **PWA**: Service Worker enabled for offline and background updates. Manifest and icons in `public/`.
- **Testing**: Unit tests use Karma + Jasmine, placed as `*.spec.ts` beside code.

## Developer Workflows

- **Start Dev Server**: `npm start` (http://localhost:4200)
- **Build**: `npm run build` (dev) or `npm run build:prod` (prod, use `--base-href` for subpaths)
- **Test (single-run)**: `npm test`
- **Test (watch)**: `npm run test:watch`
- **Coverage (single-run)**: `npm run test:coverage`
- **Coverage (watch)**: `npm run test:coverage:watch`
- **Lint/Format**: `npm run lint`, `npm run format`
- **Deploy**: `npm run deploy` (GitHub Pages)

## Coding Conventions

- **Indentation**: 2 spaces, UTF-8, trim trailing whitespace (`.editorconfig`)
- **TypeScript**: single quotes, ~100 line width (Prettier)
- **Angular Selectors**: Components use `app-` (kebab-case), directives use `app` (camelCase)
- **Filenames**: `kebab-case` for files, classes use `PascalCase` + suffix (`FooComponent`, `BarService`)
- **Tests**: Place as `*.spec.ts` next to code, prefer shallow component tests and mock network calls
- **Comments (strict policy)**:
  - Do NOT add narration or change-log comments in code (e.g., "moved to X", "refactor", "temporary", "cleanup").
  - Comments must explain intent, assumptions, constraints, non-obvious decisions, and public API contracts.
  - Process notes belong in commit messages, PR descriptions, or docs — not inline in source.

## Patterns & Examples

- **Story/Comment UI**: See `src/app/components/story-list/`, `comment-thread/`, and `comment-text/` for data flow and lazy loading.
- **Keyboard Navigation**: Vim-style shortcuts in `keyboard-shortcuts.component.ts` and related services.
- **Caching**: Multi-layer cache logic in `cache-manager.service.ts` and `cache.service.ts`.
- **Theme & Settings**: Theme toggling in `theme.service.ts`, user settings in `user-settings.service.ts`.

## Commit & PR Process

- Use Conventional Commits (`feat:`, `fix:`, etc.)
- PRs: concise summary, link issues, add screenshots for UI changes
- CI: must pass lint, tests, and build before merge

## Security & Config

- Never commit secrets. Use `.env.example` for local setup.
- Node 22.x required (`.nvmrc`), NPM 11+ recommended

---

For more details, see `AGENTS.md` and `README.md`. Ask for feedback if any section is unclear or missing.

## AI Agent Edit Rules

- Keep diffs minimal and focused; avoid sprinkling explanatory comments about what changed.
- Do not add or preserve narration/change-log comments; remove them when encountered.
- Only introduce comments when they clarify business logic, edge cases, or API usage that isn’t obvious from code.
