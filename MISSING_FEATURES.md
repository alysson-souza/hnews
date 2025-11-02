# Missing Features - HNews Reader

A comprehensive analysis of genuinely useful features that are missing from this Hacker News reader PWA.

## Overview

This HNews reader is a mature, well-built Angular PWA with excellent architecture. This document catalogs features that are **completely absent** from the codebase, not superficial gaps or nice-to-haves for generic web apps.

---

## Missing Features by Priority

### 🔴 High Priority

#### 1. **Bookmarks / Favorites / Read Later**

- **Status**: Completely absent
- **Impact**: Core feature present in all major HN readers (official site, Hacker News app, all third-party clients)
- **Current state**:
  - No bookmark/favorite service exists
  - No UI to save stories
  - No bookmarked stories list or page
  - Only localStorage keys: `visited`, `votedComments`, `hn_user_tags`, `hn_comment_state.v1`, `hn_user_settings`
- **Implementation notes**:
  - Could follow the pattern of `visited.service.ts`
  - Store in localStorage as Set or Map with timestamps
  - Add bookmark button to story-item component
  - Create dedicated bookmarks page/list
  - Could include sort options (newest saved, most read)

#### 2. **OP (Original Poster) Comment Highlighting**

- **Status**: Completely missing
- **Impact**: Standard visual feature - helps readers follow story author's responses in discussions
- **Current state**:
  - No logic in `comment-header.component.ts` to compare comment author to story author
  - No CSS classes or visual indicators for OP comments
  - No way to know which comments are from the story author
- **Implementation notes**:
  - Need to pass story author to comment-thread component
  - Add `isOP` computed signal comparing comment.by to story.author
  - Add visual indicator (badge, highlight, or color)
  - Consider accessibility (not relying on color alone)

#### 3. **Individual New Comment Highlighting**

- **Status**: Partially implemented (backend ready, UI missing)
- **Impact**: Users returning to discussions can't see which comments are new
- **Current state**:
  - `visited.service.ts` tracks comment counts per story
  - Story-item shows "+X new comments" badge at story level
  - Comment thread does NOT highlight which individual comments are new
  - `hasNewComments()` and `getNewCommentCount()` only used in story-list
- **Implementation notes**:
  - Add `isNewComment()` computed signal in comment-thread component
  - Compare comment timestamp to when story was last visited
  - Add CSS class or icon for new comments
  - Consider fade/highlight effect for visual emphasis
  - Stored data already available in visited.service

#### 4. **Hide Read Stories**

- **Status**: Missing
- **Impact**: Power users want less visual clutter
- **Current state**:
  - Visited tracking exists (visited.service.ts)
  - No setting to hide visited stories
  - No filter on story-list component
  - Only shows "+X new" indicator in auto-refresh button
- **Implementation notes**:
  - Add toggle to settings.component
  - Add boolean to user-settings.service
  - Filter story list in story-list.component before rendering
  - Consider "Archive read" option (move to separate list)

---

### 🟡 Medium Priority

#### 5. **Comment-Specific Keyboard Navigation**

- **Status**: Missing
- **Impact**: Inconsistent with story list navigation (j/k already work there)
- **Current state**:
  - Story navigation: j/k for next/prev, o to open, c for comments
  - Comment navigation: NO keyboard shortcuts
  - keyboard-navigation.service.ts only handles story-list items
  - No comment traversal hotkeys
- **Implementation notes**:
  - Extend keyboard-navigation.service or create new keyboard-comment.service
  - Consider: n/p for next/prev top-level comment
  - Consider: Space to expand/collapse, Enter to expand replies
  - Would need to track focused comment in state
  - Integrate with existing keyboard-shortcuts.component hints

#### 6. **Parent Comment Navigation**

- **Status**: Completely missing
- **Impact**: Hard to follow context in deep comment threads (common on HN)
- **Current state**:
  - Only child navigation exists (expandReplies loads children)
  - No "parent" link in comment-header
  - No way to navigate up comment tree
  - Comment API has parent_id available
- **Implementation notes**:
  - Add parent link/button to comment-header
  - Navigate to parent comment in current thread
  - Could auto-scroll parent into view
  - Or open parent in sidebar
  - Useful for comment permalinks (deep link to single comment with no context)

#### 7. **Story Filtering (Minimum Score, Age)**

- **Status**: Missing
- **Impact**: Power user feature for filtering noise
- **Current state**:
  - Story lists show exactly what API returns
  - No client-side filtering beyond page selection
  - Visited tracking exists but no score/age filtering
  - `story-list.ts` loads stories but doesn't filter them
- **Implementation notes**:
  - Add filter controls to story-list or settings
  - Consider: minimum score threshold
  - Consider: stories only from past X hours/days
  - Requires filtering after data loads
  - Could add to sort/filter dropdown menu

#### 8. **Comment Search/Filter**

- **Status**: Missing
- **Impact**: Finding specific comments in 200+ comment threads is tedious
- **Current state**:
  - Comment sorting exists (best/newest/oldest/default in item.component.ts)
  - No search functionality
  - No author filtering within thread
  - No keyword search within comments
- **Implementation notes**:
  - Add search input to item.component (above comment-thread)
  - Filter comments by author or text content
  - Debounce search input
  - Highlight matching text
  - Could bookmark found comments

#### 9. **Author Filter in Search UI**

- **Status**: Missing from UI (Algolia supports it)
- **Impact**: Common search pattern not exposed to users
- **Current state**:
  - Algolia supports `author:username` syntax
  - Search hint only mentions `site:example.com`
  - Single text input field, no author field
  - Users can type manually but it's not discoverable
- **Implementation notes**:
  - Add dedicated author input field to search.component
  - Update search hint to mention author: syntax
  - Validate and build query string
  - Optional: add author autocomplete

---

### 🟢 Lower Priority

#### 10. **User Submission Type Filter**

- **Status**: Missing
- **Impact**: Nice to have when viewing user profiles
- **Current state**:
  - User pages show all submissions (stories + comments) in one list
  - No tabs or filter controls
  - `user.component.ts` loads all submissions without type filtering
  - API returns mixed types
- **Implementation notes**:
  - Add toggle/tabs to user.component template
  - Filter submissions array by type
  - Track selected filter in route params or component state
  - Two tabs: "Stories" and "Comments"

#### 11. **Font Size / Reading Density Controls**

- **Status**: Missing
- **Impact**: Accessibility and personal preference
- **Current state**:
  - Theme customization exists (light/dark/auto)
  - No font size adjustment
  - No compact/comfortable/spacious density options
  - user-settings.service only has `openCommentsInSidebar`
- **Implementation notes**:
  - Add font-size setting (small/normal/large/larger)
  - Add density setting (compact/comfortable/spacious) controlling padding/margins
  - Store in user-settings.service
  - Apply via CSS custom properties or class on root element
  - Consider persistent scaling across full app

---

## Features That Exist (For Reference)

The following features **are implemented** and should not be added:

✅ Comment collapse/expand with persistence
✅ Scroll position restoration via NavigationHistoryService
✅ Comment vote tracking (shows which you've upvoted)
✅ Comprehensive offline support (service worker + IndexedDB)
✅ Story sharing (Web Share API + clipboard fallback)
✅ User tag system (with search, pagination, import/export)
✅ Sidebar comment viewing (split-view with navigation history)
✅ Navigation history (10-state stack with back navigation)
✅ Search with filters (type/sort/date range)
✅ Theme customization (light/dark/auto)
✅ Story actions menu (share/copy/open in new tab)
✅ Cache management UI with statistics
✅ Comment sorting (4 modes: default/newest/oldest/best)
✅ Auto-refresh with smart pausing
✅ Comprehensive keyboard shortcuts for story lists
✅ New comment count badges (story-level)

---

## Implementation Recommendations

### Quick Wins (1-2 hour features)

1. **Hide read stories** - Simple toggle + filter
2. **Author filter UI hint** - Just update search hint text
3. **Story score filtering** - Simple numeric filter

### Medium Effort (4-6 hours)

1. **Bookmarks** - New service + component + page
2. **OP comment highlighting** - Simple comparison logic + styling
3. **Individual new comment highlighting** - Use existing data, add UI
4. **User submission type filter** - Simple array filter + tabs

### Larger Effort (8+ hours)

1. **Comment keyboard navigation** - New keyboard service, state management
2. **Comment search** - Search logic, highlighting, debouncing
3. **Font size/density controls** - CSS design, settings integration
4. **Parent comment navigation** - Navigation logic, UX design

---

## Notes

- All missing features are frontend-only (no backend required)
- Most can leverage existing services and patterns in the codebase
- Several have partial implementations that just need UI layer
- These are features found in major HN readers (official app, Hacker News Search, etc.)
