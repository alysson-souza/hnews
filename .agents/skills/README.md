# Vendored agent skills

The skills in this directory are **vendored third-party code**. Do not hand-edit them
casually: `angular-developer` is synced from [angular/skills](https://github.com/angular/skills)
via the `skills` CLI, and `skills-lock.json` in the repo root records its upstream source.

To update:

```bash
npx skills update angular-developer -p -y
```

## Formatting

`.agents/skills` is excluded from `oxfmt` (see `ignorePatterns` in `.oxfmtrc.json`) so that
vendored files stay byte-identical to upstream. This keeps `skills update` diffs limited to
real upstream changes instead of whole-tree whitespace churn. Do not reformat these files.

## Local patches to `angular-developer`

The vendored copy carries local fixes for upstream bugs. **A `skills update` will silently
revert them**, so re-apply anything still unfixed upstream after syncing. Each was verified
against Angular v22 / `@schematics/angular` 22.0.6.

| File | Local change |
| :--- | :--- |
| `SKILL.md` | States samples target v22+; `Service` needs v22 (`@Injectable` earlier). |
| `references/http-client.md` | Gates providerless `HttpClient` and the fetch default on v22; documents `provideHttpClient()` / `withFetch()` for v21 and earlier; gives the `httpResource` example `@Component` metadata (upstream's plain class throws NG0203 and never registers its input). |
| `references/environment-configuration.md` | Uses the CLI's default `public/` asset tree; moves the filename label out of the JSON block so it parses; requests `assets/config.json` relatively so it honors `<base href>`; registers `provideAppInitializer()` in `ApplicationConfig.providers` (upstream discarded the returned `EnvironmentProviders`); adds `provideHttpClient()`; notes the `Service` decorator needs v22. |
| `references/mcp.md` | Uses the registered underscore tool names (`devserver_start`, `devserver_stop`, `devserver_wait_for_build`). |
| `references/di-fundamentals.md` | Gives `@Component` its required metadata object. |
| `references/naming-conventions.md` | Names model files after their identifier (`.model.ts` is an existing-project convention, not a modern default); drops the class suffix from the suffixless service example; documents that pipes keep their type suffix (`ng generate pipe` defaults to a `-` separator, producing `format-date-pipe.ts` / `FormatDatePipe`). |
| `references/pipes.md` | Labels the sample `kebab-case-pipe.ts` to match generated output. |

`playwright-cli` is vendored from a separate source and has no lock entry.
