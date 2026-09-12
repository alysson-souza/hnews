import { test, expect } from '../fixtures/pages.fixture';
import { addItem, addComment } from '../fixtures/hn-fixture-data';

for (const failedPage of ['first', 'next'] as const) {
  test(`retries the ${failedPage} reply page after a connection failure without refreshing`, async ({
    page,
    hnDataset,
  }) => {
    const story = addItem(hnDataset, {
      id: 990001,
      type: 'story',
      title: 'Reply recovery',
      by: 'author',
      time: 1,
      descendants: 50,
      kids: [],
    });
    const parent = addComment(hnDataset, {
      parent: story.id,
      storyId: story.id,
      text: 'Parent comment',
    });
    const replies = Array.from({ length: 12 }, (_, index) =>
      addComment(hnDataset, {
        parent: parent.id,
        storyId: story.id,
        text: `Reply number ${index + 1}`,
      }),
    );
    // Exercise lazy Firebase loading rather than pre-caching replies through Algolia.
    await page.route('**/api/v1/items/**', (route) => route.abort());
    await page.goto(`/item/${story.id}`);
    const expand = page.getByRole('button', { name: 'Expand 12 Replies', exact: true });
    await expect(expand).toBeVisible();
    if (failedPage === 'next') {
      await expand.click();
      await expect(page.getByText('Reply number 10', { exact: true })).toBeVisible();
    }
    const failedReply = replies[failedPage === 'first' ? 0 : 10];
    let failing = true;
    let attempts = 0;
    await page.route(`**/item/${failedReply.id}.json`, async (route) => {
      attempts++;
      if (failing) await route.abort('internetdisconnected');
      else await route.fallback();
    });
    const load =
      failedPage === 'first'
        ? expand
        : page.getByRole('button', { name: 'Load more replies', exact: true });
    await load.click();
    await expect(page.getByRole('alert')).toContainText("Couldn't load replies.");
    await expect(load).toBeEnabled();
    if (failedPage === 'next') {
      await expect(page.getByText('Reply number 1', { exact: true })).toBeVisible();
    }
    failing = false;
    const retry = page.getByRole('button', { name: 'Try again', exact: true });
    if (failedPage === 'next') {
      await retry.focus();
      await page.keyboard.press('Enter');
    } else {
      await retry.click();
    }
    await expect(page.getByText(failedReply.text!, { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
    await expect(page.getByText('Reply number 1', { exact: true })).toHaveCount(1);
  });
}

for (const mode of ['restoration', 'auto-expansion'] as const) {
  for (const failedPage of [0, 1]) {
    test(`resumes ${mode} after page ${failedPage} fails`, async ({ page, hnDataset }) => {
      const story = addItem(hnDataset, {
        id: 990002,
        type: 'story',
        title: 'Multi-page recovery',
        by: 'author',
        time: 1,
        descendants: mode === 'restoration' ? 50 : 26,
        kids: [],
      });
      const parent = addComment(hnDataset, { parent: story.id, storyId: story.id, text: 'Parent' });
      const replies = Array.from({ length: 25 }, (_, i) =>
        addComment(hnDataset, {
          parent: parent.id,
          storyId: story.id,
          text: `Restored reply ${i + 1}`,
        }),
      );
      if (mode === 'restoration') {
        await page.addInitScript(
          (id) =>
            localStorage.setItem(
              'hn_comment_state.v1',
              JSON.stringify({
                [id]: {
                  collapsed: false,
                  repliesExpanded: true,
                  loadedPages: 3,
                  lastAccessed: Date.now(),
                },
              }),
            ),
          parent.id,
        );
      }
      await page.route('**/api/v1/items/**', (route) => route.abort());
      let failing = true;
      await page.route(`**/item/${replies[failedPage * 10].id}.json`, async (route) => {
        if (failing) await route.abort('internetdisconnected');
        else await route.fallback();
      });
      await page.goto(`/item/${story.id}`);
      // Let initial cache updates settle before reconnecting and retrying.
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('alert')).toContainText("Couldn't load replies.");
      failing = false;
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await expect(page.getByText('Restored reply 25', { exact: true })).toBeVisible();
      await expect(page.getByText('Restored reply 1', { exact: true })).toHaveCount(1);
      await expect(page.getByRole('alert')).toHaveCount(0);
      if (mode === 'restoration') {
        expect(
          await page.evaluate(
            (id) => JSON.parse(localStorage.getItem('hn_comment_state.v1')!)[id].loadedPages,
            parent.id,
          ),
        ).toBe(3);
      }
    });
  }
}
