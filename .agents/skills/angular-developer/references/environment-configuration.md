# Environment configuration

## Configuration strategies

Angular supports two main configuration strategies:

- **Build-time configuration** using environment files
- **Runtime configuration** by loading values at application startup

Choose the approach based on your deployment requirements.

---

## Build-time configuration

Environment files define configuration values that are replaced at build time.

> **Security note:** Environment files are bundled into the client-side application.
> They are visible to anyone who can load the page.
> Never store sensitive information like API keys, secrets, or credentials in environment files.
> These values can be easily accessed by users.

Generate environment files using the CLI:

```bash
ng generate environments
```

This creates environment-specific files such as:

```ts
// environment.ts
export const environment = {
  apiUrl: 'https://api.example.com',
};
```

```ts
// environment.development.ts
export const environment = {
  apiUrl: 'http://localhost:3000',
};
```

Import the environment where needed:

```ts
import { environment } from '../environments/environment';

const apiUrl = environment.apiUrl;
```

The Angular CLI replaces the appropriate file based on the build configuration.

If you need a development-mode check, use `isDevMode()` from `@angular/core` instead of relying on a manually maintained `production` flag.

> Changes to environment files require rebuilding the application.

---

## Runtime configuration (advanced)

In some scenarios, applications need to load configuration at runtime instead of build time.

This allows the same build artifact to be deployed across multiple environments without rebuilding.

A common approach is to load a JSON configuration file during application initialization. Place the
file in the workspace's configured asset tree — in Angular CLI workspaces that is `public/` by
default, so `public/assets/config.json` is served at `/assets/config.json`. (Older workspaces that
still map `src/assets` in `angular.json` can keep using that path.)

### Example

`public/assets/config.json`:

```json
{
  "apiUrl": "https://api.example.com"
}
```

Load the configuration before the application starts. The `Service` decorator below requires Angular
v22 or later; on earlier versions use `@Injectable({ providedIn: 'root' })` instead.

```ts
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

interface AppConfig {
  apiUrl: string;
}

@Service()
export class AppConfigService {
  private config!: AppConfig;

  private readonly http = inject(HttpClient);

  loadConfig() {
    return this.http.get<AppConfig>('/assets/config.json').pipe(
      tap((data) => {
        this.config = data;
      }),
    );
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }
}
```

Register the loader during application bootstrap:

```ts
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const config = inject(AppConfigService);
      return config.loadConfig();
    }),
  ],
};
```

`provideAppInitializer()` returns `EnvironmentProviders`; it only runs when that value is registered
in `ApplicationConfig.providers` (or the `providers` passed to `bootstrapApplication()`).

This ensures configuration is available before the application renders.

> Runtime configuration is an advanced pattern and is not required for most applications.

---

## Choosing a strategy

| Criteria               | Build-time | Runtime      |
| ---------------------- | ---------- | ------------ |
| Change without rebuild | No         | Yes          |
| Startup performance    | Faster     | Slight delay |
| Complexity             | Low        | Moderate     |
| Deployment flexibility | Limited    | High         |

Use build-time configuration for most applications, and runtime configuration when you need to
deploy the same build across multiple environments.
