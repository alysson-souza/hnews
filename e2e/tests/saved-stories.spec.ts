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

  test('imports a legacy saved stories file and exports a unified backup', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.removeItem('hn_user_tags'));
    await page.reload();

    const backupSection = page.getByRole('region', { name: 'Backup and Restore' });
    await expect(backupSection.getByRole('button', { name: 'Export backup' })).toBeDisabled();

    const legacyJson = JSON.stringify({
      schema: 'hnews.savedStories',
      version: 1,
      exportedAt: Date.now(),
      stories: [{ id: 8863, savedAt: Date.now() }],
    });

    await backupSection.locator('input[type="file"]').setInputFiles({
      name: 'saved.json',
      mimeType: 'application/json',
      buffer: Buffer.from(legacyJson),
    });

    await expect(
      backupSection.getByText('Imported. Stories: 1 new, 0 updated, 0 skipped'),
    ).toBeVisible();
    await expect(backupSection.getByRole('button', { name: 'Export backup' })).toBeEnabled();

    await page.goto('/saved');
    await expect(page.locator('app-story-item')).toHaveCount(1);

    await page.goto('/settings');
    const downloadPromise = page.waitForEvent('download');
    await backupSection.getByRole('button', { name: 'Export backup' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^hnews-backup-\d+\.json$/);
  });

  test('imports a legacy user tags file from the backup section', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.removeItem('hn_user_tags'));
    await page.reload();

    const backupSection = page.getByRole('region', { name: 'Backup and Restore' });
    const legacyTags = JSON.stringify([
      { username: 'dang', tag: 'HN Moderator', createdAt: 1, updatedAt: 2 },
    ]);

    await backupSection.locator('input[type="file"]').setInputFiles({
      name: 'tags.json',
      mimeType: 'application/json',
      buffer: Buffer.from(legacyTags),
    });

    await expect(
      backupSection.getByText('Imported. Tags: 1 new, 0 updated, 0 skipped'),
    ).toBeVisible();

    const tagsSection = page.getByRole('region', { name: 'User Tags Management' });
    await expect(tagsSection.getByText('HN Moderator')).toBeVisible();
  });
});
