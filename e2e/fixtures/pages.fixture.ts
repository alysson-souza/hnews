import { test as base } from '@playwright/test';
import { StoriesPage } from '../page-objects/stories.page';
import { ItemPage } from '../page-objects/item.page';
import { UserPage } from '../page-objects/user.page';
import { SearchPage } from '../page-objects/search.page';
import { SettingsPage } from '../page-objects/settings.page';
import { SidebarPage } from '../page-objects/sidebar.page';
import { UserscriptPage } from '../page-objects/userscript.page';

type PageFixtures = {
  storiesPage: StoriesPage;
  itemPage: ItemPage;
  userPage: UserPage;
  searchPage: SearchPage;
  settingsPage: SettingsPage;
  sidebarPage: SidebarPage;
  userscriptPage: UserscriptPage;
};

export const test = base.extend<PageFixtures>({
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
