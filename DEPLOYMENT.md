# HNews Deployment Guide

The CI workflow (`.github/workflows/deploy.yml`) builds, tests, and deploys on every push. Pushing to `main` deploys to both GitHub Pages and Cloudflare Pages.

## GitHub Pages

Automatic via CI on pushes to `main`.

- [`actions/upload-pages-artifact`](https://github.com/actions/upload-pages-artifact)
- [`actions/deploy-pages`](https://github.com/actions/deploy-pages)

## Cloudflare Pages

Automatic via CI on every push (all branches). Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets configured in the repository.

Manual deploy:

```bash
npm run deploy:cf
```

## Manual Build

Build the production bundle; output is in `dist/hnews/browser/`.

```bash
npm run build:prod
```

## Troubleshooting

- 404 on refresh: ensure SPA routing is enabled (serve `index.html` for unknown routes)
- Assets not loading: check that the base href matches your deployment path
- GitHub Actions deploy fails: ensure the workflow has write permissions (if using CI)
- Cloudflare deploy fails: check that secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are set
