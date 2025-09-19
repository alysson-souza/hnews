# HNews Deployment Guide

## Quick Deploy (GitHub Pages)

Pushing to `main`/`master` deploys to GitHub Pages using the included workflow. Alternatively, run:

```bash
pnpm run deploy
```

## Manual Build

Build the production bundle; output is in `dist/hnews/browser/`.

```bash
pnpm run build:prod
```

## Troubleshooting

- 404 on refresh: ensure SPA routing is enabled (serve `index.html` for unknown routes)
- Assets not loading: check that the base href matches your deployment path
- GitHub Actions deploy fails: ensure the workflow has write permissions (if using CI)
