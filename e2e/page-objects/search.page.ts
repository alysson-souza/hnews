import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly resultsHeader: Locator;
  readonly typeSelect: Locator;
  readonly sortSelect: Locator;
  readonly dateRangeSelect: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[aria-label="Search Hacker News content"]');
    this.searchButton = page.locator(
      'app-page-container button[type="submit"][aria-label="Submit Search"]',
    );
    this.searchResults = page.locator('article.activity-item');
    this.resultsHeader = page.locator('app-result-list').getByText(/results for|No results for/);
    this.typeSelect = page.getByRole('combobox', { name: 'Filter by type' });
    this.sortSelect = page.getByRole('combobox', { name: 'Sort by' });
    this.dateRangeSelect = page.getByRole('combobox', { name: 'Date range' });
    this.loadMoreButton = page.getByRole('button', { name: 'Load More' });
  }

  async navigateToSearch() {
    await this.navigate('/search');
    await this.searchInput.waitFor({ state: 'visible' });
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.resultsHeader.waitFor({ timeout: 15_000 });
  }

  private waitForSearchResponse() {
    return this.page.waitForResponse((response) =>
      response.url().includes('hn.algolia.com/api/v1/search'),
    );
  }

  async selectSort(value: 'relevance' | 'date' | 'points' | 'comments') {
    const responsePromise = this.waitForSearchResponse();
    await this.sortSelect.selectOption(value);
    await responsePromise;
  }

  async selectDateRange(value: 'all' | '24h' | 'week' | 'month' | 'year') {
    const responsePromise = this.waitForSearchResponse();
    await this.dateRangeSelect.selectOption(value);
    await responsePromise;
  }

  async clickLoadMore() {
    const responsePromise = this.waitForSearchResponse();
    await this.loadMoreButton.click();
    await responsePromise;
  }

  resultPills(): Locator {
    return this.searchResults.locator('.type-pill');
  }

  /** Parses the numeric result count out of the "Found N results for ..." header. */
  async getResultsCount(): Promise<number | null> {
    const text = await this.resultsHeader.textContent({ timeout: 5_000 }).catch(() => null);
    if (!text) return null;
    const match = text.match(/Found\s+([\d,]+)\s+results/i);
    return match ? Number(match[1].replace(/,/g, '')) : null;
  }

  /** Returns each visible result's HN item id, in display order, by reading its `/item/:id` link. */
  async getResultItemIds(): Promise<number[]> {
    const count = await this.searchResults.count();
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const href = await this.searchResults
        .nth(i)
        .locator('a[href^="/item/"]')
        .first()
        .getAttribute('href');
      const match = href?.match(/\/item\/(\d+)/);
      if (match) ids.push(Number(match[1]));
    }
    return ids;
  }
}
