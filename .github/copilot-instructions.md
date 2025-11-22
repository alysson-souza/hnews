# Copilot Instructions for hnews

Concise rules and context to help AI agents work effectively in this Angular 21 app.

## Architecture and entry points

- **Framework:** Angular 21 (standalone components, no NgModules).
- **Routing:** Defined in `src/app/app.routes.ts`, provided in `src/app/app.config.ts`.
- **PWA:** Assets in `public/`; Service Worker config in `ngsw-config.json`.

## State Management (Signals)

- Use `signal()`, `computed()`, and `effect()` within Injectable "Store" services (e.g., `StoryListStore`).
- Stores manage their own state (loading, data, error) and expose read-only signals to components.
- Components inject stores and bind signals directly to the template.

## Data flow and caching

- **Service:** `HackernewsService` orchestrates API calls.
- **Caching:** `CacheManagerService` implements stale-while-revalidate.
  - **Layers:** Memory → IndexedDB (primary) → localStorage (fallback).
  - **Pattern:** `getWithSWR()` returns cached data immediately, then updates from network.
- **Persistence:** `IndexedDBService` manages schema (`stories`, `users`, `apiCache`).

## Keyboard Navigation (Core Feature)

- **Architecture:** Centralized command registry pattern.
  - `CommandRegistryService`: Maps string commands (e.g., 'story.next') to callbacks.
  - `KeyboardNavigationService`: Handles global shortcuts (j/k for stories).
  - `BaseCommentNavigationService`: Abstract base for comment threads.
- **Conventions:**
  - Use `[role="treeitem"]` for navigable comment threads.
  - Use class `.load-more-btn` for "Load More" buttons to enable J/K triggering.
  - Implement `registerCommands()` in navigation services.

## UI patterns

- **Styling:** Tailwind CSS v4 (global in `src/styles.css`).
  - Use `@apply` in component styles for complex composites.
  - Dark mode via `.dark` class (handled by `ThemeService`).
- **Components:**
  - Prefix selectors with `app-`.
  - Use `changeDetection: ChangeDetectionStrategy.OnPush` (default in Angular 19+).
- **Comments:**
  - Recursive `CommentThread` component.
  - Lazy loading via `CommentRepliesLoaderService`.
  - "Two-phase loading": Render cached -> fetch fresh.

## Conventions and edit rules

- **Comments:** No narration. Explain _why_, not _what_.
- **Imports:** Use absolute paths or relative for siblings.

## Code pointers

- **Store:** `src/app/stores/story-list.store.ts` (Signal-based state).
- **Nav:** `src/app/services/base-comment-navigation.service.ts` (J/K logic).
- **Data:** `src/app/services/hackernews.service.ts` (API + Cache).
- **UI:** `src/app/components/story-list/story-list.ts`, `src/app/components/comment-thread/comment-thread.ts`.
