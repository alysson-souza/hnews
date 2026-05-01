# Comment Navigation

Comments can be browsed in two contexts: the full **item page** (at `/item/:id`) and the **sidebar** (a slide-in panel opened from the story list). Keyboard shortcuts work in both. The sidebar is available on all screen sizes.

## Opening the Sidebar

Clicking a story's comment count opens the sidebar. Holding a modifier key (Shift, Cmd, Ctrl) or middle-clicking opens the full item page instead. The behavior can be toggled in user settings (default: sidebar on).

On mobile, the page behind the sidebar stops scrolling while the sidebar is open.

## J / K — Move Between Comments

`J` moves to the previous comment. `K` moves to the next comment. Both skip collapsed threads.

The selected comment is highlighted and scrolled into view, positioned just below the sticky comments toolbar with enough clearance to visually separate them. These keys do nothing if there are no comments or if no comment is loaded.

## L — Drill Into a Thread

`L` opens a focused view showing only the selected comment and its replies. If the comment has no replies, `L` does nothing.

After opening the thread, the first visible comment is both scrolled into view **and** selected, so the user can immediately continue with `J`/`K`.

On the item page, `L` navigates to a new URL. In the sidebar, the thread opens inline and the previous view is saved so `H` can return to it.

## » Button — View Thread

The `»` button (shown next to each comment that has replies) does the same thing as `L` with one difference: it scrolls the thread into view but does **not** select the first comment. Selection is only needed for keyboard navigation, and button users are not navigating with `J`/`K`.

## H — Go Back

After drilling into a thread with `L`, pressing `H` returns to the previous view. The scroll position and selected comment are restored exactly as they were before pressing `L`.

## Scroll Requirements

- Comments must scroll into view below the sticky toolbar, never behind it
- Scrolling must work even when the page content is shorter than the viewport (e.g. a single short comment)
- Rapid navigation must not cause the scroll position to jump to the top
- Going back with `H` must restore the exact previous scroll position

## Mobile

- Sidebar covers the full screen
- The page behind it does not scroll
- Swiping right from the sidebar's left edge closes the sidebar while it covers the full viewport
- The "Open in full view" button in the sidebar header is hidden
