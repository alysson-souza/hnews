import { test, expect } from '../fixtures/pages.fixture';
import { StoriesPage } from '../page-objects/stories.page';

test.describe('Comment Sort', () => {
  /** Finds a currently active story so the sort assertions have comments to order. */
  async function navigateToActiveItem(
    storiesPage: StoriesPage,
    page: import('@playwright/test').Page,
  ) {
    await storiesPage.navigateToTop();

    const links = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await links.count();
    let href: string | null = null;

    for (let index = 0; index < linkCount; index++) {
      const text = (await links.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      const linkHref = await links.nth(index).getAttribute('href');

      if (commentCount > 20 && linkHref?.includes('/item/')) {
        href = linkHref;
        break;
      }
    }

    if (!href) {
      throw new Error('Fixture data guarantees a story with more than 20 comments in the top feed');
    }
    await page.goto(href);
    await page.waitForLoadState('networkidle');
  }

  test('displays the sort dropdown and defaults to HN order', async ({
    storiesPage,
    itemPage,
    page,
  }) => {
    await navigateToActiveItem(storiesPage, page);

    const sortDropdown = itemPage.page.locator('select[aria-label="Sort comments"]');
    await expect(sortDropdown).toBeVisible();
    await expect(sortDropdown).toHaveValue('default');
  });

  test('reorders comments when switching between oldest and newest', async ({
    storiesPage,
    itemPage,
    page,
  }) => {
    await navigateToActiveItem(storiesPage, page);

    const sortDropdown = itemPage.page.locator('select[aria-label="Sort comments"]');
    await expect(sortDropdown).toBeVisible();

    const commentPermalinks = () =>
      page
        .locator('a[title^="Permalink for comment"]')
        .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href')));

    // Wait for comments to render before asserting on their order
    await page.locator('a[title^="Permalink for comment"]').first().waitFor({ timeout: 15_000 });

    await sortDropdown.selectOption('oldest');
    await expect(sortDropdown).toHaveValue('oldest');
    const oldestOrder = await commentPermalinks();
    expect(oldestOrder.length).toBeGreaterThan(1);

    await sortDropdown.selectOption('newest');
    await expect(sortDropdown).toHaveValue('newest');
    await expect.poll(commentPermalinks, { timeout: 10_000 }).not.toEqual(oldestOrder);
  });
});
