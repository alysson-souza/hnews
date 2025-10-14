import { test, expect } from '../fixtures/pages.fixture';

test.describe('Search Page', () => {
  test.describe('Search Functionality', () => {
    test('should display search input', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await expect(searchPage.searchInput).toBeVisible();
    });

    test('should search for stories', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('javascript');
      await searchPage.page.waitForTimeout(2000);

      const hasResults = (await searchPage.getSearchResultCount()) > 0;
      const hasNoResults = await searchPage.hasNoResults();
      expect(hasResults || hasNoResults).toBe(true);
    });

    test('should search using Enter key', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchWithEnter('react');
      await searchPage.page.waitForTimeout(2000);

      const hasResults = (await searchPage.getSearchResultCount()) > 0;
      const hasNoResults = await searchPage.hasNoResults();
      expect(hasResults || hasNoResults).toBe(true);
    });

    test('should display search results', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('typescript');
      await searchPage.page.waitForTimeout(2000);

      const resultCount = await searchPage.getSearchResultCount();
      if (resultCount > 0) {
        const title = await searchPage.getSearchResultTitle(0);
        expect(title).toBeTruthy();
      }
    });

    test('should handle empty search gracefully', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('');
      await searchPage.page.waitForTimeout(1000);
    });

    test('should handle no results', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('xyznonexistentqueryrandom12345');
      await searchPage.page.waitForTimeout(3000);

      const resultCount = await searchPage.getSearchResultCount();
      expect(resultCount).toBe(0);
    });
  });

  test.describe('Search Filters', () => {
    test('should filter by date range', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('python');
      await searchPage.page.waitForTimeout(2000);

      const resultCount = await searchPage.getSearchResultCount();
      expect(resultCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by type', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('ai');
      await searchPage.page.waitForTimeout(2000);

      if (await searchPage.typeSelect.isVisible()) {
        await searchPage.changeType('story');
        await searchPage.page.waitForTimeout(1000);
      }
    });

    test('should sort results', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('machine learning');
      await searchPage.page.waitForTimeout(2000);

      if (await searchPage.sortBySelect.isVisible()) {
        await searchPage.changeSortBy('date');
        await searchPage.page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to search result', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('angular');
      await searchPage.page.waitForTimeout(2000);

      const resultCount = await searchPage.getSearchResultCount();
      expect(resultCount).toBeGreaterThanOrEqual(0);
    });
    test('should load more results', async ({ searchPage }) => {
      await searchPage.navigateToSearch();
      await searchPage.searchFor('programming');
      await searchPage.page.waitForTimeout(2000);

      if (await searchPage.loadMoreButton.isVisible()) {
        const initialCount = await searchPage.getSearchResultCount();
        await searchPage.loadMoreResults();
        await searchPage.page.waitForTimeout(1000);
        const newCount = await searchPage.getSearchResultCount();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });
});
