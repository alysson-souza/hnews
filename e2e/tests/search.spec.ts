import { test, expect } from '../fixtures/pages.fixture';

test.describe('Search Page', () => {
  test.beforeEach(async ({ searchPage }) => {
    await searchPage.navigateToSearch();
  });

  test('shows the empty prompt before a query is entered', async ({ searchPage }) => {
    await expect(searchPage.page.getByText('Enter a search term to get started')).toBeVisible();
  });

  test('finds results for a query', async ({ searchPage }) => {
    await searchPage.searchFor('angular');

    await expect(searchPage.resultsHeader).toContainText(/results for/i);
    await expect(searchPage.searchResults.first()).toBeVisible();
  });

  test('shows a no-results state for gibberish queries', async ({ searchPage }) => {
    await searchPage.searchFor('qqqqqzzzzzunlikelyqueryyyyy12345');

    await expect(searchPage.resultsHeader).toContainText(/No results for/i);
    await expect(searchPage.searchResults).toHaveCount(0);
  });

  test('filters results to comments by type', async ({ searchPage }) => {
    await searchPage.searchFor('javascript');

    await searchPage.typeSelect.selectOption('comment');

    const pills = searchPage.resultPills();
    await expect(pills.first()).toBeVisible({ timeout: 15_000 });
    const count = await pills.count();
    for (let i = 0; i < count; i++) {
      await expect(pills.nth(i)).toHaveText(/Comment/);
    }
  });

  test('narrows results with a date-range filter', async ({ searchPage }) => {
    await searchPage.searchFor('startup');

    const allTimeCount = await searchPage.getResultsCount();
    expect(allTimeCount).not.toBeNull();

    await searchPage.selectDateRange('24h');

    // A settled 24h count must be strictly lower than the all-time count; polling on the
    // parsed number (rather than raw header text) means a transient loading render, which
    // has no matching count, can't satisfy the assertion.
    await expect
      .poll(async () => searchPage.getResultsCount(), { timeout: 15_000 })
      .toBeLessThan(allTimeCount!);
  });

  test('sorting by date reorders results by recency', async ({ searchPage }) => {
    await searchPage.searchFor('the');
    await searchPage.selectSort('date');

    await expect(searchPage.searchResults.first()).toBeVisible();
    const ids = await searchPage.getResultItemIds();

    expect(ids.length).toBeGreaterThan(1);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBeLessThanOrEqual(ids[i - 1]);
    }
  });

  test('loads more results when clicking Load More', async ({ searchPage }) => {
    await searchPage.searchFor('the');

    await expect(searchPage.loadMoreButton).toBeVisible();
    const initialCount = await searchPage.searchResults.count();

    await searchPage.clickLoadMore();

    await expect
      .poll(async () => searchPage.searchResults.count(), { timeout: 15_000 })
      .toBeGreaterThan(initialCount);
  });

  test('navigates to an item from a result', async ({ searchPage, page }) => {
    await searchPage.searchFor('ask hn');

    const result = searchPage.searchResults.first();
    const resultTitle = (await result.getByRole('heading').textContent())?.trim();
    expect(resultTitle).toBeTruthy();

    const commentLink = result
      .getByRole('link', { name: /comments?|View thread|View Story/ })
      .first();
    await commentLink.click();

    await expect(page).toHaveURL(/\/item\/\d+/);
    await expect(page.locator('#submission-title .story-title')).toContainText(resultTitle!);
    await expect(page.getByText('Item not found')).not.toBeVisible();
  });
});
