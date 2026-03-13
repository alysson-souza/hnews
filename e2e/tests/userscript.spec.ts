import { test, expect } from '../fixtures/pages.fixture';

test.describe('Userscript Page', () => {
  test('should display userscript page', async ({ userscriptPage }) => {
    await userscriptPage.navigateToUserscript();
    await expect(userscriptPage.heading).toBeVisible();
  });

  test('should display installation instructions', async ({ userscriptPage }) => {
    await userscriptPage.navigateToUserscript();
    await expect(userscriptPage.installationHeading).toBeVisible();
    const items = userscriptPage.instructionsList.locator('.instruction-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display syntax-highlighted code block', async ({ userscriptPage }) => {
    await userscriptPage.navigateToUserscript();
    await expect(userscriptPage.codeBlock).toBeVisible();
    const text = await userscriptPage.codeBlock.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should copy userscript to clipboard', async ({ userscriptPage, page }) => {
    await userscriptPage.navigateToUserscript();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await userscriptPage.copyButton.click();
    await page.waitForTimeout(500);
    await expect(userscriptPage.copyButton).toContainText('Copied!');
  });

  test('should display install button', async ({ userscriptPage }) => {
    await userscriptPage.navigateToUserscript();
    await expect(userscriptPage.installButton).toBeVisible();
    await expect(userscriptPage.installButton).toContainText('Install Script');
  });
});
