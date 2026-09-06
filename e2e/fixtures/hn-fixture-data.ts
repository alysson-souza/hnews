// SPDX-License-Identifier: MIT
// Deterministic Hacker News fixture data for the e2e suite.
//
// This is the single source of truth for e2e network mocking: every story,
// comment and user the suite renders lives in an `HNDataset`, and both the
// Firebase-shaped and Algolia-shaped API responses (see hn-routes.ts) are
// derived from the same records so they can never disagree with each other.
//
// Types are intentionally self-contained (not imported from `src/app/models`)
// so this fixture has no build-time coupling to the app's path aliases.

export type HNItemType = 'job' | 'story' | 'comment' | 'poll' | 'pollopt';

export interface HNItem {
  id: number;
  deleted?: boolean;
  type: HNItemType;
  by?: string;
  time: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  storyId?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

export interface AlgoliaHitRaw {
  objectID: string;
  title?: string;
  url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  created_at_i?: number;
  story_text?: string | null;
  comment_text?: string | null;
  story_id?: number | null;
  story_title?: string | null;
  story_url?: string | null;
  parent_id?: number | null;
  _tags?: string[];
}

export type StoryType = 'top' | 'best' | 'new' | 'ask' | 'show' | 'job';

export interface HNDataset {
  items: Map<number, HNItem>;
  users: Map<string, HNUser>;
  storyLists: Record<StoryType, number[]>;
  searchPool: AlgoliaHitRaw[];
  /** Auto-increment cursor for `addComment` IDs. Scoped to this dataset, not
   *  module-global, so every test gets its own deterministic ID sequence
   *  regardless of how many other tests ran earlier in the same worker. */
  nextAutoId: number;
}

function allocId(dataset: HNDataset): number {
  dataset.nextAutoId += 1;
  return dataset.nextAutoId;
}

export function addItem(dataset: HNDataset, item: HNItem): HNItem {
  dataset.items.set(item.id, item);
  return item;
}

export function addUser(dataset: HNDataset, user: HNUser): HNUser {
  dataset.users.set(user.id, user);
  return user;
}

/** Adds a comment to the dataset and wires it into its parent's `kids`. */
export function addComment(
  dataset: HNDataset,
  overrides: Partial<HNItem> & { parent: number; storyId: number },
): HNItem {
  const id = overrides.id ?? allocId(dataset);
  // Each comment gets a distinct, monotonically increasing default timestamp
  // (oldest-created first) so "sort by oldest/newest" has something real to
  // reorder, unless the caller supplies its own `time`.
  const comment: HNItem = {
    id,
    type: 'comment',
    by: 'fixture_commenter',
    time: Math.floor(Date.now() / 1000) - 3600 + dataset.items.size * 5,
    text: `<p>Fixture comment ${id}.</p>`,
    ...overrides,
  };
  addItem(dataset, comment);

  const parent = dataset.items.get(overrides.parent);
  if (parent) {
    parent.kids = [...(parent.kids ?? []), id];
  }
  return comment;
}

export function addStory(dataset: HNDataset, overrides: Partial<HNItem> & { id: number }): HNItem {
  const story: HNItem = {
    type: 'story',
    by: 'fixture_author',
    time: Math.floor(Date.now() / 1000) - 7200,
    title: `Fixture story ${overrides.id}`,
    url: `https://example.com/fixture-${overrides.id}`,
    score: 10,
    descendants: 0,
    kids: [],
    ...overrides,
  };
  return addItem(dataset, story);
}

/** Recomputes `descendants` for every story in the dataset from its live `kids` tree. */
function countDescendants(dataset: HNDataset, id: number): number {
  const item = dataset.items.get(id);
  if (!item?.kids?.length) return 0;
  return item.kids.reduce((sum, kidId) => sum + 1 + countDescendants(dataset, kidId), 0);
}

function recomputeDescendants(dataset: HNDataset): void {
  for (const item of dataset.items.values()) {
    if (item.type === 'story' || item.type === 'job') {
      item.descendants = countDescendants(dataset, item.id);
    }
  }
}

// Fixed IDs the target specs (item, keyboard-item-context, test-actions-menu) rely
// on to reliably locate specific fixture shapes (a threaded comment, a leaf comment,
// a story with many comments) without guesswork.
export const MAIN_STORY_ID = 9_100_000;
export const MAIN_STORY_TITLE = 'Fixture Mega Thread With Deeply Nested Replies';
export const LEAF_COMMENT_TEXT_MARKER = 'leaf-comment';
export const THREADED_COMMENT_TEXT_MARKER = 'threaded-comment';

function buildMainStory(dataset: HNDataset): void {
  addStory(dataset, {
    id: MAIN_STORY_ID,
    by: 'fixture_author',
    title: MAIN_STORY_TITLE,
    url: 'https://example.com/fixture-mega-thread',
    score: 555,
    time: Math.floor(Date.now() / 1000) - 3600 * 5,
  });

  // C1: threaded top-level comment with two replies, one of which has its own
  // reply (so the thread is at least three levels deep).
  const c1 = addComment(dataset, {
    parent: MAIN_STORY_ID,
    storyId: MAIN_STORY_ID,
    text: `<p>Fixture ${THREADED_COMMENT_TEXT_MARKER} C1 - has replies.</p>`,
  });
  const r1 = addComment(dataset, {
    parent: c1.id,
    storyId: MAIN_STORY_ID,
    text: '<p>Fixture reply R1 - has a nested reply.</p>',
  });
  addComment(dataset, {
    parent: c1.id,
    storyId: MAIN_STORY_ID,
    text: `<p>Fixture reply R2 - a ${LEAF_COMMENT_TEXT_MARKER}.</p>`,
  });
  addComment(dataset, {
    parent: r1.id,
    storyId: MAIN_STORY_ID,
    text: `<p>Fixture reply R1A - a ${LEAF_COMMENT_TEXT_MARKER}, three levels deep.</p>`,
  });

  // C2: a plain leaf top-level comment.
  addComment(dataset, {
    parent: MAIN_STORY_ID,
    storyId: MAIN_STORY_ID,
    text: `<p>Fixture comment C2 - a ${LEAF_COMMENT_TEXT_MARKER}.</p>`,
  });

  // C3: a top-level comment with 20 direct replies, so the story has enough
  // total comments to clear any ">20 comments" threshold and enough rendered
  // height to make the item page scrollable. Every 4th reply gets its own
  // (leaf) child, so threaded ("View this thread") comments are spread across
  // the whole scroll range rather than clustered only near the top.
  const c3 = addComment(dataset, {
    parent: MAIN_STORY_ID,
    storyId: MAIN_STORY_ID,
    text: `<p>Fixture ${THREADED_COMMENT_TEXT_MARKER} C3 - has many replies.</p>`,
  });
  for (let i = 1; i <= 20; i++) {
    const isBranch = i % 4 === 0;
    const d = addComment(dataset, {
      parent: c3.id,
      storyId: MAIN_STORY_ID,
      by: `fixture_commenter_${i}`,
      text: isBranch
        ? `<p>Fixture ${THREADED_COMMENT_TEXT_MARKER} D${i} under C3 - has a reply.</p>`
        : `<p>Fixture bulk reply D${i} under C3 - a ${LEAF_COMMENT_TEXT_MARKER}.</p>`,
    });
    if (isBranch) {
      addComment(dataset, {
        parent: d.id,
        storyId: MAIN_STORY_ID,
        text: `<p>Fixture grandchild reply under D${i} - a ${LEAF_COMMENT_TEXT_MARKER}.</p>`,
      });
    }
  }
}

// A dedicated story (kept separate from MAIN_STORY_ID so it never disturbs
// the exact tree shape item.spec.ts / keyboard-item-context.spec.ts rely on)
// with more top-level comments than the sidebar's initial page size (10) AND
// more than its "small thread" descendants threshold (40, below which the
// sidebar shows every top-level comment unpaginated regardless of count) —
// guaranteeing its "Load more" control always has something to do and that
// the sidebar panel has enough rendered height to be reliably scrollable.
export const MANY_TOP_LEVEL_COMMENTS_STORY_ID = 9_150_000;
export const MANY_TOP_LEVEL_COMMENTS_STORY_TITLE = 'Fixture Story With Many Top-Level Comments';
const MANY_TOP_LEVEL_COMMENTS_COUNT = 45;

function buildManyTopLevelCommentsStory(dataset: HNDataset): void {
  addStory(dataset, {
    id: MANY_TOP_LEVEL_COMMENTS_STORY_ID,
    by: 'fixture_author',
    title: MANY_TOP_LEVEL_COMMENTS_STORY_TITLE,
    url: 'https://example.com/fixture-many-top-level-comments',
    score: 42,
    time: Math.floor(Date.now() / 1000) - 3600 * 4,
  });

  for (let i = 1; i <= MANY_TOP_LEVEL_COMMENTS_COUNT; i++) {
    addComment(dataset, {
      parent: MANY_TOP_LEVEL_COMMENTS_STORY_ID,
      storyId: MANY_TOP_LEVEL_COMMENTS_STORY_ID,
      text: `<p>Fixture top-level comment C${i} - a ${LEAF_COMMENT_TEXT_MARKER}, one of many to force pagination.</p>`,
    });
  }
}

// More than two pages worth (at the app's default pageSize of 30), so
// "Load More"/pagination scenarios across the suite have somewhere to go.
const FILLER_STORY_COUNT = 65;

function buildFillerStories(dataset: HNDataset): void {
  const commentCounts = [0, 1, 2, 3, 5, 0, 1, 4];
  const fillerIds: number[] = [];

  for (let i = 0; i < FILLER_STORY_COUNT; i++) {
    const id = 9_200_000 + i;
    fillerIds.push(id);
    addStory(dataset, {
      id,
      by: `filler_author_${i % 5}`,
      title: `Filler story number ${i + 1} about the daily web`,
      url: `https://example.com/filler-${i}`,
      score: 20 + i,
      time: Math.floor(Date.now() / 1000) - i * 600,
    });

    const count = commentCounts[i % commentCounts.length];
    for (let c = 0; c < count; c++) {
      addComment(dataset, {
        parent: id,
        storyId: id,
        text: `<p>Filler comment ${c} on story ${id}.</p>`,
      });
    }
  }

  // Kept within the story list's first page (pageSize 30) alongside
  // MAIN_STORY_ID so tests can find it without paging through the list.
  dataset.storyLists.top = [MAIN_STORY_ID, MANY_TOP_LEVEL_COMMENTS_STORY_ID, ...fillerIds];
  dataset.storyLists.best = [...fillerIds].reverse().concat(MAIN_STORY_ID);
  dataset.storyLists.new = [...fillerIds];
  dataset.storyLists.ask = fillerIds.slice(0, 10);
  dataset.storyLists.show = fillerIds.slice(10, 20);
  dataset.storyLists.job = fillerIds.slice(20, 30);
}

function buildUsers(dataset: HNDataset): void {
  addUser(dataset, {
    id: 'pg',
    created: Math.floor(Date.now() / 1000) - 365 * 24 * 3600 * 15,
    karma: 155_960,
    about: 'Bug fixer.',
    submitted: [MAIN_STORY_ID, ...(dataset.items.get(MAIN_STORY_ID)?.kids ?? [])],
  });

  addUser(dataset, {
    id: 'fixture_author',
    created: Math.floor(Date.now() / 1000) - 365 * 24 * 3600 * 5,
    karma: 4200,
    about: 'Fixture author used across the e2e suite.',
    submitted: [MAIN_STORY_ID],
  });
}

function buildSearchPool(): AlgoliaHitRaw[] {
  const now = Math.floor(Date.now() / 1000);

  const storyTitles = [
    'Show HN: An Angular app for reading the web',
    'The state of the web platform',
    'Why the fediverse matters for the future of the internet',
    'Ask HN: How do you structure a startup engineering team',
    'A deep dive into the JavaScript event loop',
    'Startup lessons learned the hard way',
    'The history of Unix, part one',
    'Rust versus the old guard of systems languages',
    'The best way to learn to read code',
    'Ask HN: What did the best interview question you were asked',
  ];

  // Extra filler stories, all matching the broad query "the", so pagination
  // ("Load More") has more than one HITS_PER_PAGE-sized page to page through.
  const fillerStoryTitles = Array.from(
    { length: 15 },
    (_, i) => `Filler search result ${i} covering the wider history of the web`,
  );

  const allStoryTitles = [...storyTitles, ...fillerStoryTitles];

  const commentTexts = [
    'I think the JavaScript ecosystem moved past this years ago.',
    'This is exactly the kind of startup advice the industry needs.',
    'The comment section here is more insightful than the article.',
    'Not sure the framework choice matters as much as the team.',
  ];

  interface StoryEvent {
    kind: 'story';
    storyIndex: number;
    title: string;
    time: number;
  }
  interface CommentEvent {
    kind: 'comment';
    commentIndex: number;
    text: string;
    time: number;
  }

  const storyEvents: StoryEvent[] = allStoryTitles.map((title, storyIndex) => ({
    kind: 'story',
    storyIndex,
    title,
    time: now - storyIndex * 3600 * 20,
  }));

  // Shifted by a second off the story timestamps so no comment ever lands on
  // the exact same instant as a story (a tie would make id order and
  // date-sort order disagree once ids are assigned from the timeline below).
  const commentEvents: CommentEvent[] = commentTexts.map((text, commentIndex) => ({
    kind: 'comment',
    commentIndex,
    text,
    time: now - commentIndex * 3600 * 5 - 1,
  }));

  // Assign ids in ascending order of creation time (oldest first), exactly as
  // real HN object IDs behave, so that regardless of which hits a query
  // happens to match, sorting by date and sorting by id always agree.
  const BASE_ID = 9_300_000;
  const timeline = [...storyEvents, ...commentEvents].sort((a, b) => a.time - b.time);
  const storyIdByIndex = new Map<number, number>();
  const commentIdByIndex = new Map<number, number>();
  timeline.forEach((event, position) => {
    const id = BASE_ID + position;
    if (event.kind === 'story') {
      storyIdByIndex.set(event.storyIndex, id);
    } else {
      commentIdByIndex.set(event.commentIndex, id);
    }
  });

  const hits: AlgoliaHitRaw[] = [];

  storyEvents.forEach((event) => {
    const id = storyIdByIndex.get(event.storyIndex)!;
    hits.push({
      objectID: String(id),
      title: event.title,
      url: `https://example.com/search-story-${event.storyIndex}`,
      author: `search_author_${event.storyIndex % 4}`,
      points: 50 + event.storyIndex,
      num_comments: event.storyIndex * 2,
      created_at_i: event.time,
      created_at: new Date(event.time * 1000).toISOString(),
      story_id: id,
      _tags: ['story', `author_search_author_${event.storyIndex % 4}`],
    });
  });

  commentEvents.forEach((event) => {
    const storyIndex = event.commentIndex % storyTitles.length;
    const storyId = storyIdByIndex.get(storyIndex)!;
    hits.push({
      objectID: String(commentIdByIndex.get(event.commentIndex)),
      comment_text: event.text,
      author: `search_commenter_${event.commentIndex}`,
      points: 5 + event.commentIndex,
      created_at_i: event.time,
      created_at: new Date(event.time * 1000).toISOString(),
      story_id: storyId,
      story_title: storyTitles[storyIndex],
      parent_id: storyId,
      _tags: ['comment', `author_search_commenter_${event.commentIndex}`],
    });
  });

  return hits;
}

/** Builds a fresh, self-consistent dataset for a single test run. */
export function createDefaultDataset(): HNDataset {
  const dataset: HNDataset = {
    items: new Map(),
    users: new Map(),
    storyLists: { top: [], best: [], new: [], ask: [], show: [], job: [] },
    searchPool: [],
    nextAutoId: 9_000_000,
  };

  buildMainStory(dataset);
  buildManyTopLevelCommentsStory(dataset);
  buildFillerStories(dataset);
  buildUsers(dataset);
  recomputeDescendants(dataset);
  dataset.searchPool = buildSearchPool();

  return dataset;
}
