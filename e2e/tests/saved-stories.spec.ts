import { test, expect } from '../fixtures/pages.fixture';

test.describe('Saved stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/top');
    await page.evaluate(() => localStorage.removeItem('hn_saved_stories_v1'));
  });

  test('saves a story from top, shows it on saved, and unsaves it', async ({ page }) => {
    await page.goto('/top');
    const firstStory = page.locator('app-story-item').first();
    await expect(firstStory).toBeVisible({ timeout: 10000 });

    await firstStory.getByRole('button', { name: /^Save / }).click();
    await expect(firstStory.getByRole('button', { name: /^Remove saved story / })).toHaveText(
      'Saved',
    );

    await page.goto('/saved');
    await expect(page).toHaveURL(/\/saved/);
    await expect(page.locator('app-story-item')).toHaveCount(1);

    await page
      .locator('app-story-item')
      .first()
      .getByRole('button', { name: /^Remove saved story / })
      .click();
    await expect(page.getByText('No saved stories')).toBeVisible();
  });

  test('imports and exports saved stories from settings', async ({ page }) => {
    await page.goto('/settings');
    const savedSection = page.getByRole('region', { name: 'Saved Stories Management' });
    await expect(savedSection.getByRole('button', { name: 'Export saved stories' })).toBeDisabled();

    const importJson = JSON.stringify({
      schema: 'hnews.savedStories',
      version: 1,
      exportedAt: Date.now(),
      stories: [{ id: 8863, savedAt: Date.now() }],
    });

    await savedSection.locator('input[type="file"]').setInputFiles({
      name: 'saved.json',
      mimeType: 'application/json',
      buffer: Buffer.from(importJson),
    });

    await expect(
      savedSection.getByText('Saved stories imported: 1 new, 0 updated, 0 skipped'),
    ).toBeVisible();
    await expect(savedSection.getByRole('button', { name: 'Export saved stories' })).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await savedSection.getByRole('button', { name: 'Export saved stories' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^hnews-saved-stories-\d+\.json$/);
  });
});
