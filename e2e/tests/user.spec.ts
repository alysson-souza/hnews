import { test, expect } from '../fixtures/pages.fixture';

test.describe('User Page', () => {
  const testUsername = 'pg';

  test('displays the username in the profile heading', async ({ userPage }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    await expect(userPage.usernameHeading).toContainText(testUsername, { ignoreCase: true });
  });

  test('displays karma and member-since stats', async ({ userPage }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    // pg has positive karma formatted with the decimal pipe (e.g. "123,456")
    const karma = await userPage.statValue('Karma');
    expect(karma.replace(/[,\s]/g, '')).toMatch(/^\d+$/);

    const memberSince = await userPage.statValue('Member Since');
    expect(memberSince.trim()).not.toBe('');
  });

  test('displays the about section', async ({ userPage }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    expect(await userPage.hasAboutSection()).toBe(true);
  });

  test('lists recent activity by default', async ({ userPage }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    await expect(userPage.activityItems.first()).toBeVisible();
  });

  test('filters recent activity to comments only', async ({ userPage }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    await userPage.switchActivityFilter('Comments');

    // The activity header must recompute for the comments filter
    await expect
      .poll(() => userPage.activityFilterLabel(), { timeout: 15_000 })
      .toMatch(/comment/i);

    // Every rendered pill must reflect the comments filter
    const pills = userPage.activityItems.locator('.type-pill');
    const count = await pills.count();
    for (let i = 0; i < count; i++) {
      await expect(pills.nth(i)).toHaveText(/Comment/);
    }
  });

  test('navigates to an item when an activity entry is clicked', async ({ userPage, page }) => {
    await userPage.navigateToUser(testUsername);
    await userPage.waitForProfileLoaded();

    await userPage.clickItem(0);

    await expect(page).toHaveURL(/\/item\/\d+/);
  });

  test('shows an error state for a non-existent user', async ({ userPage }) => {
    await userPage.navigateToUser('nonexistentuserxyz123');

    const errorCard = userPage.page.locator('.error-card');
    await expect(errorCard).toBeVisible({ timeout: 15_000 });
    await expect(errorCard.locator('.error-text')).not.toBeEmpty();
  });
});
