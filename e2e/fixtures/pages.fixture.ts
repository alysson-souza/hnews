import { test as base } from '@playwright/test';
import { StoriesPage } from '../page-objects/stories.page';
import { ItemPage } from '../page-objects/item.page';
import { UserPage } from '../page-objects/user.page';
import { SearchPage } from '../page-objects/search.page';
import { SettingsPage } from '../page-objects/settings.page';
import { SidebarPage } from '../page-objects/sidebar.page';
import { UserscriptPage } from '../page-objects/userscript.page';
import { createDefaultDataset, type HNDataset } from './hn-fixture-data';
import { installHNRoutes } from './hn-routes';

type PageFixtures = {
  storiesPage: StoriesPage;
  itemPage: ItemPage;
  userPage: UserPage;
  searchPage: SearchPage;
  settingsPage: SettingsPage;
  sidebarPage: SidebarPage;
  userscriptPage: UserscriptPage;
  /**
   * The deterministic Hacker News fixture dataset backing this test's network
   * mocks. Mutate it (via helpers in `hn-fixture-data.ts`) before navigating
   * to add or change stories/comments/users for a specific scenario.
   */
  hnDataset: HNDataset;
  /**
   * Auto-used: installs route interception for every Firebase HN + Algolia HN
   * Search request, backed by `hnDataset`. No test using this fixture file
   * hits the live HN APIs.
   */
  hnRoutes: void;
};

export const test = base.extend<PageFixtures>({
  // Playwright resolves a fixture's dependencies by parsing this destructuring
  // pattern, so the empty pattern is required and cannot be a named parameter.
  // eslint-disable-next-line no-empty-pattern
  hnDataset: async ({}, use) => {
    await use(createDefaultDataset());
  },
  hnRoutes: [
    async ({ context, hnDataset }, use) => {
      await installHNRoutes(context, hnDataset);
      await use();
    },
    { auto: true },
  ],
  storiesPage: async ({ page }, use) => {
    const storiesPage = new StoriesPage(page);
    await use(storiesPage);
  },
  itemPage: async ({ page }, use) => {
    const itemPage = new ItemPage(page);
    await use(itemPage);
  },
  userPage: async ({ page }, use) => {
    const userPage = new UserPage(page);
    await use(userPage);
  },
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await use(searchPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },
  sidebarPage: async ({ page }, use) => {
    const sidebarPage = new SidebarPage(page);
    await use(sidebarPage);
  },
  userscriptPage: async ({ page }, use) => {
    const userscriptPage = new UserscriptPage(page);
    await use(userscriptPage);
  },
});

export { expect } from '@playwright/test';
