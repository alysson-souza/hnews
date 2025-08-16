# HNews Deployment Guide

## Quick Start

### For GitHub Pages

```bash
git add .
git commit -m "Your changes"
git push origin main

# Manual deployment (if not using GitHub Actions)
npm run deploy
```

The GitHub Actions workflow automatically handles deployment on push to main/master.

### For Root Domains (example.com)

```bash
npm run build:prod    # Builds with base href /
# Upload dist/hnews/browser/ to your server
```

### For Custom Paths (example.com/myapp/)

```bash
npm run build:prod -- --base-href=/myapp/
# Upload dist/hnews/browser/ to your server
```

## How It Works

### Automatic Base HREF Handling

- **GitHub Actions**: Automatically detects repository name and sets correct base href
- **Original repo**: Uses `/hnews/`
- **Forked repos**: Uses `/<fork-name>/`
- **Manual deployment**: Specify with `--base-href` flag during build

### What Happens During Deploy

1. **GitHub Actions** (automatic on push to main/master):
   - Detects if original repo or fork
   - Builds with correct base href
   - Deploys to gh-pages branch
2. **Manual deploy** (`npm run deploy`):
   - Builds the app first
   - Uses angular-cli-ghpages to deploy to gh-pages branch

## Git Workflow

### Standard Process

```bash
# 1. Development
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add feature"
git push origin feature/new-feature

# 2. Merge (via PR or direct)
git checkout main
git merge feature/new-feature
git push origin main
# GitHub Actions automatically deploys to GitHub Pages

# 3. Manual deployment (if needed)
npm run deploy
```

## Hosting Options

### GitHub Pages

- **Original repo**: Deploys to `https://alysson-souza.github.io/hnews/`
- **Forks**: Deploys to `https://username.github.io/fork-name/`
- **Automatic**: GitHub Actions handles deployment on push to main/master

### Netlify/Vercel

```bash
# Build command: npm run build:prod
# Publish directory: dist/hnews/browser
```

### Traditional Web Servers

```bash
npm run build:prod
# Upload dist/hnews/browser/ contents to document root
```

### Custom Subdirectories

```bash
# For hosting at example.com/myapp/
npm run build:prod -- --base-href=/myapp/
# Upload dist/hnews/browser/ to /myapp/ directory
```

## Server Configuration

For SPA routing, configure your server to serve `index.html` for all routes:

### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Apache (.htaccess)

```apache
RewriteEngine On
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
RewriteRule ^ - [L]
RewriteRule ^ /index.html [L]
```

## Troubleshooting

- **404 on refresh**: Configure server for SPA routing (see Server Configuration above)
- **Assets not loading**: Check that base href matches deployment path
- **Deployment fails**: Ensure GitHub Actions has write permissions to repository
- **Fork deployment issues**: Verify repository name matches expected base href
