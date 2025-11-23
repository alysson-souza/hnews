import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly sortBySelect: Locator;
  readonly dateRangeSelect: Locator;
  readonly typeSelect: Locator;
  readonly noResults: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[aria-label="Search Hacker News content"]');
    this.searchButton = page.locator(
      'app-page-container button[type="submit"][aria-label="Submit Search"]',
    );
    this.searchResults = page.locator('article.activity-item');
    this.sortBySelect = page.locator('select[name="sortBy"], [aria-label*="Sort"]');
    this.dateRangeSelect = page.locator('select[name="dateRange"], [aria-label*="Date"]');
    this.typeSelect = page.locator('select[name="type"], [aria-label*="Type"]');
    this.noResults = page.locator(':text("No results for")');
    this.loadMoreButton = page.locator('button:has-text("Load More")');
  }

  async navigateToSearch() {
    await this.navigate('/search');
    await this.waitForNetworkIdle();
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForNetworkIdle();
  }

  async searchWithEnter(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForNetworkIdle();
  }

  async getSearchResultCount(): Promise<number> {
    try {
      await this.searchResults.first().waitFor({ timeout: 5000 });
      return await this.searchResults.count();
    } catch {
      return 0;
    }
  }

  async hasNoResults(): Promise<boolean> {
    return await this.noResults.isVisible();
  }

  async clickSearchResult(index: number) {
    const resultLink = this.searchResults.nth(index).locator('a').first();
    await resultLink.click();
  }

  async getSearchResultTitle(index: number): Promise<string> {
    const title = this.searchResults.nth(index).locator('.title, h3');
    return (await title.textContent()) ?? '';
  }

  async changeSortBy(value: string) {
    await this.sortBySelect.selectOption(value);
    await this.waitForNetworkIdle();
  }

  async changeDateRange(value: string) {
    await this.dateRangeSelect.selectOption(value);
    await this.waitForNetworkIdle();
  }

  async changeType(value: string) {
    await this.typeSelect.selectOption(value);
    await this.waitForNetworkIdle();
  }

  async loadMoreResults() {
    if (await this.loadMoreButton.isVisible()) {
      await this.loadMoreButton.click();
      await this.waitForNetworkIdle();
    }
  }
}
