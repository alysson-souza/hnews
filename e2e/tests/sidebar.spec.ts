import { test, expect } from '../fixtures/pages.fixture';

test.describe('Sidebar Comments Panel', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop-only feature');

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
  });

  test('should open sidebar when clicking comments link', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
    await expect(sidebarPage.commentsPanel).toBeVisible();
  });

  test('should open sidebar via c keyboard shortcut', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    await page.keyboard.press('j');
    await page.waitForTimeout(200);

    await page.keyboard.press('c');
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
  });

  test('should close sidebar with Escape key', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should close sidebar by clicking overlay', async ({ storiesPage, sidebarPage, page }) => {
    // Open sidebar at desktop viewport first
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    // Resize to tablet viewport to reveal the overlay (lg:hidden = hidden above 1024px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    await sidebarPage.overlay.click({ force: true });
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should display story summary in sidebar', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.storySummary).toBeVisible();
  });

  test('should display comments in sidebar', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const threadCount = await sidebarPage.commentThreads.count();
    expect(threadCount).toBeGreaterThan(0);
  });

  test('should display sort dropdown', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.sortDropdown).toBeVisible();
    await expect(sidebarPage.sortDropdown).toHaveValue('default');
  });

  test('should change sort order', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);

    await sidebarPage.sortDropdown.selectOption('newest');
    await page.waitForTimeout(300);

    await expect(sidebarPage.sortDropdown).toHaveValue('newest');
  });

  test('should navigate into thread via View this thread', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).toBeVisible();
  });

  test('should navigate back from thread', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    const initialThreadCount = await sidebarPage.commentThreads.count();

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);
    await expect(sidebarPage.backButton).toBeVisible();

    await sidebarPage.backButton.click();
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).not.toBeVisible();
    const restoredThreadCount = await sidebarPage.commentThreads.count();
    expect(restoredThreadCount).toBe(initialThreadCount);
  });

  test('should navigate back from thread via h key', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for thread navigation');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const viewThreadCount = await sidebarPage.viewThreadButtons.count();
    test.skip(viewThreadCount === 0, 'No view-thread buttons available in sidebar');

    await sidebarPage.viewThreadButtons.first().click();
    await page.waitForTimeout(500);
    await expect(sidebarPage.backButton).toBeVisible();

    await page.keyboard.press('h');
    await page.waitForTimeout(500);

    await expect(sidebarPage.backButton).not.toBeVisible();
  });

  test('should load more comments', async ({ storiesPage, sidebarPage, page }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1500);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 20) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with enough comments for load more');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(1200);

    const loadMoreVisible = await sidebarPage.loadMoreButton.first().isVisible();
    test.skip(!loadMoreVisible, 'No load more button visible in sidebar');

    const initialCount = await sidebarPage.commentThreads.count();

    await sidebarPage.loadMoreButton.first().click();
    await page.waitForTimeout(1200);

    const newCount = await sidebarPage.commentThreads.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});

test.describe('Sidebar Comments Panel - mobile swipe dismissal', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only gesture');

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'user.settings.v1',
        JSON.stringify({ openCommentsInSidebar: true }),
      );
    });
  });

  test('should keep the full-width sidebar above the overlay in landscape', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await page.setViewportSize({ width: 797, height: 377 });
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const layout = await page.evaluate(() => {
      const panel = document.querySelector('.sidebar-panel');
      const overlay = document.querySelector('.sidebar-overlay');
      if (!panel || !overlay) {
        return null;
      }

      const panelRect = panel.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const panelStyle = getComputedStyle(panel);
      const overlayStyle = getComputedStyle(overlay);

      return {
        viewportWidth: window.innerWidth,
        panelTop: panelRect.top,
        panelWidth: panelRect.width,
        overlayTop: overlayRect.top,
        panelZIndex: Number.parseInt(panelStyle.zIndex, 10),
        overlayZIndex: Number.parseInt(overlayStyle.zIndex, 10),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout!.panelTop).toBeLessThanOrEqual(1);
    expect(layout!.overlayTop).toBeLessThanOrEqual(1);
    expect(Math.abs(layout!.panelWidth - layout!.viewportWidth)).toBeLessThanOrEqual(1);
    expect(layout!.panelZIndex).toBeGreaterThan(layout!.overlayZIndex);
  });

  test('should close full-width sidebar with a right swipe from the left edge', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const panelBox = await sidebarPage.panel.boundingBox();
    test.skip(!panelBox, 'Sidebar panel was not laid out');

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 170, panelBox!.y + panelBox!.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should close full-width sidebar with a fast right swipe from the left edge', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const panelBox = await sidebarPage.panel.boundingBox();
    test.skip(!panelBox, 'Sidebar panel was not laid out');

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 95, panelBox!.y + panelBox!.height / 2, { steps: 1 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should keep the full-width sidebar open after a short left-edge drag', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const panelBox = await sidebarPage.panel.boundingBox();
    test.skip(!panelBox, 'Sidebar panel was not laid out');

    await page.mouse.move(panelBox!.x + 8, panelBox!.y + panelBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox!.x + 30, panelBox!.y + panelBox!.height / 2, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
  });

  test('should close full-width sidebar with an imperfect diagonal right swipe', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const panelBox = await sidebarPage.panel.boundingBox();
    test.skip(!panelBox, 'Sidebar panel was not laid out');

    const startX = panelBox!.x + 8;
    const startY = panelBox!.y + panelBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 45, startY + 20, { steps: 2 });
    await page.mouse.move(startX + 110, startY - 14, { steps: 3 });
    await page.mouse.move(startX + 205, startY + 36, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isClosed()).toBe(true);
  });

  test('should keep the sidebar open after a mostly vertical edge drag', async ({
    storiesPage,
    sidebarPage,
    page,
  }) => {
    await storiesPage.navigateToTop();
    await page.waitForTimeout(1000);

    const commentLinks = storiesPage.storyItems.locator('.story-comments');
    const linkCount = await commentLinks.count();
    let targetLinkIndex = -1;

    for (let index = 0; index < linkCount; index++) {
      const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
      const countMatch = text.match(/\d+/);
      const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
      if (commentCount > 0) {
        targetLinkIndex = index;
        break;
      }
    }

    test.skip(targetLinkIndex < 0, 'No story with comments available');

    await commentLinks.nth(targetLinkIndex).click();
    await page.waitForTimeout(500);
    expect(await sidebarPage.isOpen()).toBe(true);

    const panelBox = await sidebarPage.panel.boundingBox();
    test.skip(!panelBox, 'Sidebar panel was not laid out');

    const startX = panelBox!.x + 8;
    const startY = panelBox!.y + panelBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 10, startY + 55, { steps: 3 });
    await page.mouse.move(startX + 18, startY + 130, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(await sidebarPage.isOpen()).toBe(true);
  });

  test.describe('Chromium touch input', () => {
    test.skip(
      ({ browserName }) => browserName !== 'chromium',
      'CDP touch events are Chromium-only',
    );

    test('should preserve vertical scrolling during a mostly vertical touch drag from the edge', async ({
      storiesPage,
      sidebarPage,
      page,
    }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(1000);

      const commentLinks = storiesPage.storyItems.locator('.story-comments');
      const linkCount = await commentLinks.count();
      let targetLinkIndex = -1;

      for (let index = 0; index < linkCount; index++) {
        const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
        const countMatch = text.match(/\d+/);
        const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
        if (commentCount > 0) {
          targetLinkIndex = index;
          break;
        }
      }

      test.skip(targetLinkIndex < 0, 'No story with comments available');

      await commentLinks.nth(targetLinkIndex).click();
      await page.waitForTimeout(500);
      expect(await sidebarPage.isOpen()).toBe(true);

      const panelBox = await sidebarPage.panel.boundingBox();
      test.skip(!panelBox, 'Sidebar panel was not laid out');

      const scrollable = await sidebarPage.commentsPanel.evaluate((element) => {
        element.scrollTop = 0;
        return element.scrollHeight > element.clientHeight + 200;
      });
      test.skip(!scrollable, 'Sidebar comments panel is not scrollable enough');

      const client = await page.context().newCDPSession(page);
      const startX = Math.round(panelBox!.x + 8);
      const startY = Math.round(panelBox!.y + panelBox!.height / 2);
      const beforeScrollTop = await sidebarPage.commentsPanel.evaluate(
        (element) => element.scrollTop,
      );

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 10, y: startY - 80, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 18, y: startY - 170, id: 1 }],
      });
      await page.waitForTimeout(100);

      const touchState = await page.evaluate(() => {
        const panel = document.querySelector('.sidebar-panel') as HTMLElement | null;
        const comments = document.querySelector('.sidebar-comments-panel') as HTMLElement | null;
        if (!panel || !comments) {
          return null;
        }

        return {
          panelTranslateX: new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41,
          scrollTop: comments.scrollTop,
        };
      });

      expect(touchState).not.toBeNull();
      expect(touchState!.panelTranslateX).toBe(0);
      expect(touchState!.scrollTop).toBeGreaterThan(beforeScrollTop);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(500);

      expect(await sidebarPage.isOpen()).toBe(true);
    });

    test('should track and close during an imperfect diagonal touch swipe', async ({
      storiesPage,
      sidebarPage,
      page,
    }) => {
      await storiesPage.navigateToTop();
      await page.waitForTimeout(1000);

      const commentLinks = storiesPage.storyItems.locator('.story-comments');
      const linkCount = await commentLinks.count();
      let targetLinkIndex = -1;

      for (let index = 0; index < linkCount; index++) {
        const text = (await commentLinks.nth(index).textContent())?.trim() ?? '';
        const countMatch = text.match(/\d+/);
        const commentCount = countMatch ? Number.parseInt(countMatch[0], 10) : 0;
        if (commentCount > 0) {
          targetLinkIndex = index;
          break;
        }
      }

      test.skip(targetLinkIndex < 0, 'No story with comments available');

      await commentLinks.nth(targetLinkIndex).click();
      await page.waitForTimeout(500);
      expect(await sidebarPage.isOpen()).toBe(true);

      const panelBox = await sidebarPage.panel.boundingBox();
      test.skip(!panelBox, 'Sidebar panel was not laid out');

      const startX = Math.round(panelBox!.x + 8);
      const startY = Math.round(panelBox!.y + panelBox!.height / 2);
      const client = await page.context().newCDPSession(page);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 56, y: startY + 18, id: 1 }],
      });
      await page.waitForTimeout(100);

      const midTransform = await sidebarPage.panel.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        if (transform === 'none') {
          return 0;
        }

        return new DOMMatrixReadOnly(transform).m41;
      });
      expect(midTransform).toBeGreaterThan(24);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 125, y: startY - 12, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 210, y: startY + 34, id: 1 }],
      });
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(500);

      expect(await sidebarPage.isClosed()).toBe(true);
    });
  });
});
