import { test, expect } from '../fixtures/pages.fixture';
import { MAIN_STORY_ID, addComment } from '../fixtures/hn-fixture-data';

for (const entry of ['keyboard', 'button']) {
  for (const mode of ['automatic', 'expanded', 'collapsed']) {
    test(`${entry} thread entry preserves ${mode} replies already displayed`, async ({
      page,
      hnDataset,
    }) => {
      const parent = hnDataset.items.get(MAIN_STORY_ID)!.kids![0];
      const reply = hnDataset.items.get(parent)!.kids![0];
      const grandchild = hnDataset.items.get(reply)!.kids![0];
      if (mode !== 'automatic') hnDataset.items.get(MAIN_STORY_ID)!.descendants = 100;
      await page.addInitScript(() =>
        localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true })),
      );
      await page.goto('/top');
      await page.locator('.story-comments').first().click();
      const panel = page
        .locator('.sidebar-comments-panel:not([inert] *)')
        .filter({ visible: true })
        .last();
      const comment = (id: number) => panel.locator(`[role="treeitem"][data-comment-id="${id}"]`);
      await expect(comment(parent)).toBeVisible();
      if (mode !== 'automatic') {
        await comment(parent)
          .getByRole('button', { name: 'Expand comment', exact: true })
          .first()
          .click();
        await expect(comment(reply)).toBeVisible();
        await comment(reply)
          .getByRole('button', { name: 'Expand comment', exact: true })
          .first()
          .click();
      }
      await expect(comment(grandchild)).toBeVisible();
      if (mode === 'collapsed')
        await comment(reply)
          .getByRole('button', { name: 'Collapse comment', exact: true })
          .first()
          .click();
      if (entry === 'keyboard') {
        await page.keyboard.press('j');
        await expect(panel.locator('[aria-selected="true"]')).toHaveAttribute(
          'data-comment-id',
          String(parent),
        );
        await page.keyboard.press('l');
      } else
        await comment(parent)
          .getByRole('button', { name: `View thread for comment ${parent}`, exact: true })
          .click();
      const current = page
        .locator('.sidebar-comments-panel:not([inert] *)')
        .filter({ visible: true })
        .last();
      await expect(current.locator('[role="treeitem"]').first()).toHaveAttribute(
        'data-comment-id',
        String(reply),
      );
      if (mode !== 'collapsed')
        await expect(current.locator(`[data-comment-id="${grandchild}"]`)).toBeVisible();
      else await expect(current.locator(`[data-comment-id="${grandchild}"]`)).toHaveCount(0);
      await expect(
        current.locator(`[role="treeitem"][data-comment-id="${reply}"]`),
      ).toHaveAttribute('aria-expanded', mode === 'collapsed' ? 'false' : 'true');
    });
  }
}
test('thread entry keeps loaded pages bounded and changes stay local to each discussion', async ({
  page,
  hnDataset,
}) => {
  const parent = hnDataset.items.get(MAIN_STORY_ID)!.kids![0];
  const reply = hnDataset.items.get(parent)!.kids![0];
  hnDataset.items.get(MAIN_STORY_ID)!.descendants = 100;
  hnDataset.items.get(reply)!.kids = [];
  for (let i = 0; i < 25; i++)
    addComment(hnDataset, {
      parent: reply,
      storyId: MAIN_STORY_ID,
      text: `<p>Paginated reply ${i}.</p>`,
    });
  await page.addInitScript(() =>
    localStorage.setItem('user.settings.v1', JSON.stringify({ openCommentsInSidebar: true })),
  );
  await page.goto('/top');
  await page.locator('.story-comments').first().click();
  const active = () => page.locator('app-discussion-view[data-active="true"]');
  const comment = (id: number) => active().locator(`[role="treeitem"][data-comment-id="${id}"]`);
  await comment(parent)
    .getByRole('button', { name: 'Expand comment', exact: true })
    .first()
    .click();
  await comment(reply).getByRole('button', { name: 'Expand comment', exact: true }).first().click();
  await expect(comment(reply).locator('[role="treeitem"]')).toHaveCount(10);
  await comment(reply).getByRole('button', { name: 'Load more replies', exact: true }).click();
  await expect(comment(reply).locator('[role="treeitem"]')).toHaveCount(20);
  const rootKey = await active().getAttribute('data-entry-key');
  await comment(parent)
    .getByRole('button', { name: `View thread for comment ${parent}`, exact: true })
    .click();
  await expect(active()).not.toHaveAttribute('data-entry-key', rootKey!);
  await expect(comment(reply).locator('[role="treeitem"]')).toHaveCount(20);
  await expect(
    comment(reply).getByRole('button', { name: 'Load more replies', exact: true }),
  ).toHaveText(/Load 5 more replies/);
  await comment(reply)
    .getByRole('button', { name: 'Collapse comment', exact: true })
    .first()
    .click();
  await expect(comment(reply).locator('[role="treeitem"]')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(active()).toHaveAttribute('data-entry-key', rootKey!);
  await expect(comment(reply)).toHaveAttribute('aria-expanded', 'true');
  await expect(comment(reply).locator('[role="treeitem"]')).toHaveCount(20);
});
