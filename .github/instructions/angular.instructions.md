---
applyTo: '**/*.ts, **/*.html, **/*.css'
---

# Angular Development Instructions

Instructions for generating high-quality Angular applications with TypeScript, using Angular Signals for state management, adhering to Angular best practices.

## Project Context

- Use latest Angular version (Angular 21+) with standalone components.
- Use TypeScript for type safety.
- Use Angular CLI for project setup and scaffolding.
- Follow [Angular Style Guide](https://angular.dev/style-guide).

## Development Standards

### Architecture

- Use **standalone components** for all UI elements.
- Organize code by feature domains for scalability.
- Implement lazy loading for route-level features.
- Use Angular's built-in dependency injection system effectively (`inject()` function).
- Structure components with a clear separation of concerns (smart vs. presentational components).

### TypeScript

- Enable strict mode in `tsconfig.json`.
- Define clear interfaces and types for components, services, and models.
- Use type guards and union types for robust type checking.
- Implement proper error handling with RxJS operators (e.g., `catchError`).
- Use typed forms (`FormGroup`, `FormControl`) for reactive forms.

### Component Design

- Use `input()`, `output()`, `viewChild()`, `contentChild()` signal-based functions instead of decorators.
- Leverage `ChangeDetectionStrategy.OnPush` for performance.
- Keep templates clean; move logic to component classes or services.
- Use Angular control flow syntax (`@if`, `@for`, `@switch`) instead of `*ngIf`/`*ngFor`.

### State Management

- Use **Angular Signals** for reactive state management.
- Leverage `signal()`, `computed()`, and `effect()`.
- Use writable signals for mutable state and computed signals for derived state.
- Handle loading and error states with signals.
- Use `AsyncPipe` or `toSignal` when interoperating with RxJS observables.

### Data Fetching

- Use `HttpClient` for API calls.
- Use `inject()` for dependency injection.
- Implement caching strategies (e.g., `shareReplay` or custom cache services).
- Store API response data in signals for reactive updates.

### Styling

- Use Tailwind CSS (via `src/styles.css`) for styling.
- Use `@apply` for complex composite styles in component CSS files.
- Support Dark Mode via `.dark` class.

### Testing & Quality

- Write unit tests for all new features and bug fixes using Vitest.
- Use `TestBed` with mocked dependencies and mock HTTP requests.
- Test signal-based state updates.
- Write E2E tests with Playwright.
- Ensure code passes all tests (`npm test`).
- Verify code quality with linter (`npm run lint`).
- Format code before committing (`npm run format`).

### Performance

- Optimize change detection with `OnPush`.
- Use lazy loading for routes.
- Use `@for` with `track` for efficient list rendering.

## Implementation Process

1. Plan project structure and feature domains.
2. Define TypeScript interfaces/models.
3. Scaffold components/services.
4. Implement data services with signal-based state.
5. Build reusable components with signal inputs/outputs.
6. Add reactive forms and validation.
7. Apply styling with Tailwind.
8. Implement lazy-loaded routes.
9. Add error handling and loading states.
10. Write tests.
