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
