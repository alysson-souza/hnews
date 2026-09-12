# Comment navigation

Comments open at `/item/:id` or in a discussion session above the current page. The existing "Open comments in sidebar" preference applies at every screen size. Turning it off keeps full-page navigation. Modifier clicks, middle clicks, URLs, and full-page links retain their usual behavior.

## Discussion sessions

At widths below 1024px, each discussion fills the screen, with an opaque background and safe-area padding. At 1024px and above, discussions occupy the existing right sidebar, below the header. The page stops scrolling while a discussion is open.

Back returns one discussion level. On mobile, returning from the first discussion reveals the underlying page without ending the session. On desktop, `H` from the first discussion closes the session. Forward revisits a discussion left through Back. Opening a different discussion discards forward history. Close or navigating to another URL ends the session and releases its views.

The original toolbar and OS-dependent control order are preserved at every width. Close is always available; Back appears only inside a nested discussion, and the full-view link remains desktop-only. Forward navigation uses the left swipe without an added button. Desktop panels enter and leave as one unit over 300ms. Once the desktop sidebar is open, changing discussions replaces its contents without a slide. Each discussion's header and content move together. Inactive discussions are inert, hidden from assistive technology, and excluded from keyboard actions and visit tracking.

## Mobile gestures

Swipe right across the reading area to go Back; swipe left to go Forward. The current and adjacent discussion move with the finger. A short drag returns to its starting position. Crossing 28% of the viewport commits one step after the browser animation finishes.

The outermost 24px on each side are reserved for operating-system gestures. Links, controls, editable fields, code blocks, horizontally scrollable content, and active text selections do not start discussion gestures. Vertical reading scroll, horizontal code panning, and pinch zoom stay native. Multiple touches, pointer cancellation, resizing, rotation, or navigation cancel an unfinished gesture. Reduced-motion mode removes settling and button-navigation animations.

After backing out to the underlying page, swipe left on its noninteractive reading area to resume. Close ends the session, so subsequent swipes cannot reopen it.

## Keyboard navigation

`J` and `K` move between comments, skipping collapsed descendants. Selection belongs to the active discussion. The selected comment scrolls below the sticky toolbar. Empty or unloaded discussions do not receive comment actions.

`L` opens the selected comment's thread when it has replies. On the item page this navigates to a new URL. In a discussion session it pushes another discussion and, once its comments render, scrolls to and selects the first comment.

The `»` button opens the same thread and scrolls to its first comment without selecting it. `H` returns one level and restores the previous selection and reading position. Escape closes the session. The full-view command retains `/item/:id` navigation.

## Reading state and lifetime

One history store owns entries and the current position. Each entry saves its scroll position, keyboard selection, top-level pagination, comment expansion and loaded reply pages, loaded discussion data, and original visit timestamp. Sorting remains a shared preference. An unavailable sorting response falls back to available comment order without changing that preference.

Only the current entry and its immediate history neighbors are rendered, at most three discussions. Before an older view is released it saves its state. Neighbors are reconstructed from that state and the existing data caches. Scroll restoration waits for enough content height when comments arrive asynchronously. Once loading settles, an unreachable offset clamps to the available content. User scrolling cancels a pending restoration. Requests owned by a released view are unsubscribed so late responses cannot replace another discussion or mark it visited.

## Validation limits

Browser automation covers mobile entry, history, reading-state restoration, gesture cancellation, focus isolation, and repeated-navigation frame timing. Emulation does not establish installed Android or iPhone behavior. Device checks must include system-edge gestures, browser chrome, rotation, safe areas, and pinch zoom in the installed application before claiming device-level polish.

SSR and startup optimization are outside this change.
