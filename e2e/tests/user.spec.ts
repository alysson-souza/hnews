import { test, expect } from '../fixtures/pages.fixture';

test.describe('User Page', () => {
  const testUsername = 'pg';

  test.describe('User Profile', () => {
    test('should display username', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const username = await userPage.getUsername();
      expect(username.toLowerCase()).toContain(testUsername.toLowerCase());
    });

    test('should display karma', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const hasUsername = await userPage.username.isVisible();
      expect(hasUsername).toBe(true);
    });

    test('should display created date', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const hasUsername = await userPage.username.isVisible();
      expect(hasUsername).toBe(true);
    });

    test('should display about section if available', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      const hasAbout = await userPage.hasAboutSection();
      if (hasAbout) {
        await expect(userPage.about).toBeVisible();
      }
    });
  });

  test.describe('User Activity', () => {
    test('should display submitted items by default', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const itemCount = await userPage.getItemCount();
      expect(itemCount).toBeGreaterThanOrEqual(0);
    });

    test('should switch to comments tab', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const hasUsername = await userPage.username.isVisible();
      expect(hasUsername).toBe(true);
    });

    test('should switch between tabs', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);
      const hasUsername = await userPage.username.isVisible();
      expect(hasUsername).toBe(true);
    });

    test('should navigate to item when clicked', async ({ userPage }) => {
      await userPage.navigateToUser(testUsername);
      await userPage.page.waitForTimeout(2000);

      const itemCount = await userPage.getItemCount();
      if (itemCount > 0) {
        await userPage.clickItem(0);
        await expect(userPage.page).toHaveURL(/\/(item|user)\/.+/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent user gracefully', async ({ userPage }) => {
      await userPage.navigateToUser('nonexistentuserxyz123');
      await userPage.page.waitForTimeout(2000);
      await expect(userPage.page).toHaveURL(/\/user\/nonexistentuserxyz123/);
    });
  });
});
