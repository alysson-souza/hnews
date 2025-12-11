# Cloudflare Pages setup for HNews

This repo can deploy to Cloudflare Pages via GitHub Actions. The Cloudflare deploy is optional and will be skipped when Cloudflare secrets are not configured (useful for forks).

## 1. Create or choose a Pages project

1. Log into Cloudflare and open **Workers & Pages → Pages**.
2. Create a new project (or use an existing one).
3. Name it something stable, e.g. `hnews`.
4. Set **Production branch** to `main`.

Git integration is optional. If you want GitHub Actions to be the only deployer (recommended for this workflow):

1. In the Pages project, go to **Settings → Builds & deployments**.
2. Disable:
   - **Builds for production branches**
   - **Builds for non‑production branches**
3. Alternatively, go to **Settings → Integrations** and disconnect the GitHub repository.

This prevents double‑deployments (Cloudflare building on its own and GitHub Actions deploying again).

## 2. Find your Account ID

You can get the account ID from the dashboard URL or via Wrangler:

```sh
npx wrangler whoami
```

Copy the **Account ID** shown.

## 3. Create an API token

1. Cloudflare dashboard → your avatar → **My Profile**.
2. **API Tokens** → **Create Token** → **Create Custom Token**.
3. Fill the form like this:
   - **Token name**: e.g. `hnews-gh-actions`.
   - **Permissions**:
     - First dropdown: **Account**
     - Second dropdown: **Cloudflare Pages** (it appears as a standalone product in the list)
     - Third dropdown: **Edit**
   - You do _not_ need zone/DNS, Workers, or other permissions for this workflow.
4. **Account Resources**:
   - **Include → Specific account →** select your Cloudflare account.
   - If you only have one account, **All accounts** also works, but specific is tighter.
5. Leave **Client IP Address Filtering** empty.
6. Leave **TTL** empty (no expiry) unless you want to rotate regularly.
7. Create the token and copy it (you won’t be able to see it again).

## 4. Add secrets/variables in GitHub

In GitHub: repo → **Settings → Secrets and variables → Actions**.

**Repository secrets**

- `CLOUDFLARE_API_TOKEN`: the token created above.
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.

**Repository variable (optional)**

- `CLOUDFLARE_PAGES_PROJECT_NAME`: your Pages project name. If not set, the workflow defaults to `hnews`.

## 5. How deploys work

Workflow file: `.github/workflows/deploy.yml`.

- Push to `main`:
  - Deploys to GitHub Pages.
  - Deploys to Cloudflare Pages production (`branch: main`).
- Push to any other branch in this repo:
  - Deploys a Cloudflare preview for that branch.
- If Cloudflare secrets are missing:
  - Cloudflare build/upload/deploy steps are skipped.

## Troubleshooting

- **Project not found (404)**: `CLOUDFLARE_PAGES_PROJECT_NAME` does not match the Pages project name exactly.
- **Authentication error (403)**: token is missing, revoked, or lacks `Cloudflare Pages: Edit` permission.
