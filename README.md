# HNews — Hacker News Reader

Alternative frontend for Hacker News built with Angular 20.

Live demo: https://alysson-souza.github.io/hnews/

## Features

- Vote counts and thumbnails
- Open Graph data fetching for link previews
- Top, Best, New, Ask HN, Show HN, and Jobs stories
- Nested comment threads with voting
- User profiles with karma, submissions, and comments
- Search with filters and date ranges
- Caching to reduce API calls
- Responsive layout for desktop, tablet, and mobile
- Vote persistence using localStorage

## Tech Stack

- **Angular 20**: With signals and standalone components
- **Tailwind CSS v4**: Utility-first CSS framework
- **TypeScript 5.8**: Type-safe development
- **RxJS 7.8**: Reactive programming for data streams
- **Hacker News API**: Firebase API for HN data
- **Algolia Search API**: For search functionality

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/alysson-souza/hnews.git
cd hnews

# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200/`

### Build

```bash
# Development build
npm run build

# Production build
npm run build:prod
```

### Common Scripts

```bash
npm start         # Run dev server (http://localhost:4200)
npm run build     # Build for development
npm run build:prod# Build for production with /hnews/ base href
npm test          # Run unit tests (Karma + Jasmine)
npm run lint      # ESLint (Angular + TS)
npm run lint:fix  # ESLint with auto-fix
npm run format    # Prettier write
npm run deploy    # Build and push to gh-pages
```

## Deployment to GitHub Pages

### Automatic Deployment (GitHub Actions)

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings:
   - Go to Settings > Pages
   - Source: Deploy from GitHub Actions
3. Push to main/master branch to trigger deployment

### Manual Deployment

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

This will:

1. Build the app with the correct base href
2. Deploy to the `gh-pages` branch
3. Your app will be available at `https://alysson-souza.github.io/hnews/`

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── story-item/       # Individual story component
│   │   ├── story-list/       # Story list with pagination
│   │   └── comment-thread/   # Recursive comment component
│   ├── pages/
│   │   ├── stories/          # Main stories page
│   │   ├── item/             # Story detail with comments
│   │   ├── user/             # User profile page
│   │   └── search/           # Search page
│   ├── services/
│   │   ├── hackernews.service.ts  # HN API integration
│   │   ├── opengraph.service.ts   # Open Graph data fetching
│   │   ├── cache.service.ts            # LocalStorage TTL cache
│   │   └── cache-manager.service.ts    # Multi-layer cache (memory/IndexedDB/SW)
│   └── app.routes.ts         # Application routing
```

## API Services

### Hacker News Firebase API

- Base URL: `https://hacker-news.firebaseio.com/v0/`
- Used for: Stories, comments, user data

### Algolia HN Search API

- Base URL: `https://hn.algolia.com/api/v1/`
- Used for: Search functionality

### Microlink API

- Base URL: `https://api.microlink.io/`
- Used for: Open Graph data for rich preview cards
- Notes: No API key required in the default configuration

## Caching Strategy

- **Story Lists**: Cached for 5 minutes
- **Individual Items**: Cached for 30 minutes
- **User Profiles**: Cached for 1 hour
- **Open Graph Data**: Cached for 24 hours
- **Vote State**: Persisted indefinitely in localStorage

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License. See `LICENSE` for details.

Copyright (c) 2025 Alysson Souza
