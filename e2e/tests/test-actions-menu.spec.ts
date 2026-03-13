import { test, expect } from '../fixtures/pages.fixture';

test.describe('Story Actions Menu - Keyboard Interaction', () => {
  test.beforeEach(async ({ storiesPage }) => {
    await storiesPage.navigateToTop();
  });

  test('should open menu and focus first item when clicking the button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();

    // First menu item should have focus
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should open menu and focus first item when pressing Enter on button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.focus();

    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should open menu and focus first item when pressing Space on button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.focus();

    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focusedRole).toBe('menuitem');
  });

  test('should navigate menu items with ArrowDown and ArrowUp after opening', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    // First item should be focused
    const firstItemText = await page.evaluate(() => document.activeElement?.textContent?.trim());

    // ArrowDown to second item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const secondItemText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(secondItemText).not.toBe(firstItemText);

    // ArrowUp back to first item
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const backToFirst = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(backToFirst).toBe(firstItemText);
  });

  test('should close menu with Escape and return focus to button', async ({ page }) => {
    const actionsBtn = page.locator('button.story-actions-btn').first();
    await actionsBtn.click();
    await page.waitForTimeout(300);

    const menu = page.locator('[data-testid="story-actions-menu"]').first();
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await expect(menu).not.toBeVisible();

    // Focus should return to the actions button
    const focusedClass = await page.evaluate(() => document.activeElement?.className);
    expect(focusedClass).toContain('story-actions-btn');
  });
});
