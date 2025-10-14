# HNews — Hacker News Reader

Alternative frontend for Hacker News built with Angular 20.

Live demo: https://alysson-souza.github.io/hnews/

## Features

- Story feeds: Top, Best, Newest, Ask HN, Show HN, Jobs
- Auto-refresh: Story rankings update every 5 minutes (tab visibility aware)
- Comments: Nested threads, lazy loading, auto-collapse for large threads
- Voting UX: Local upvote state for comments (persisted in localStorage)
- User profiles: Karma, member since, recent submissions with paging
- Search: Algolia-powered with type, sort, and date range filters
- Sidebar: Slide-over comments viewer for quick exploration
- Theming: Light/Dark/Auto with one-click toggle and persistence
- Vim-style keyboard navigation: hjkl navigation, vim-like shortcuts
- Keyboard shortcuts: Full keyboard navigation with help dialog
- Caching: Multi-layer cache (memory, IndexedDB, Service Worker, localStorage)
- Two-phase loading: Cached display first, fresh data updates in background
- PWA-ready: Angular Service Worker enabled in production builds
- Responsive UI: Optimized for desktop, tablet, and mobile
- HN-compatible routes (e.g., `/item?id=123`, `/user?id=pg`)

## Keyboard Shortcuts

- `j` / `k` - Navigate through stories
- `h` / `l` - Switch between tabs (Top, Best, New, etc.)
- `o` - Open selected story
- `c` - Open comments sidebar
- `/` - Focus search
- `t` - Toggle theme
- `r` - Refresh stories
- `?` - Show keyboard shortcuts help
- `Esc` - Close overlays / go back / scroll to top

## Tech Stack

- Angular 20 (standalone components, signals)
- Tailwind CSS v4 (with @tailwind/postcss)
- TypeScript 5.8, RxJS 7.8
- Angular Service Worker (PWA)
- ESLint (angular-eslint), Prettier, Husky + lint-staged
- APIs: Hacker News Firebase, Algolia HN Search
- Testing: Jasmine + Karma (unit), Playwright (e2e)

## Getting Started

### Prerequisites

- Node.js 22+ (LTS recommended; `.nvmrc` provided)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/alysson-souza/hnews.git
cd hnews

# Install dependencies
npm install

# Start the dev server
npm start
```

App runs at `http://localhost:4200`.

## Deployment

See `DEPLOYMENT.md` for deployment options.

## Contributing

See `CONTRIBUTING.md` for development scripts, testing, and code style.

## License

MIT — see `LICENSE`.

© 2025 Alysson Souza
