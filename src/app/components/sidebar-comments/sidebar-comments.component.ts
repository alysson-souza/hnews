// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
  viewChild,
} from '@angular/core';
import { DiscussionEntry, SidebarService } from '@services/sidebar.service';
import { DiscussionViewComponent } from './discussion-view.component';

@Component({
  selector: 'app-sidebar-comments',
  imports: [DiscussionViewComponent],
  template: `
    <div
      #panel
      class="sidebar-panel"
      [class.open]="sidebarService.isOpen()"
      [class.dragging]="dragging()"
    >
      @for (entry of renderedEntries(); track entry.key) {
        <app-discussion-view
          #screen
          [entry]="entry"
          [active]="sidebarService.currentEntry()?.key === entry.key"
          [style.transform]="transform(entry.key)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .sidebar-panel {
        position: fixed;
        inset: 0;
        z-index: 50;
        overflow: hidden;
        pointer-events: none;
      }
      app-discussion-view {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: var(--app-surface);
      }
      app-discussion-view[data-active='true'] {
        pointer-events: auto;
      }
      @media (max-width: 1023.98px) {
        app-discussion-view {
          padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
            env(safe-area-inset-left);
        }
      }
      @media (display-mode: standalone) and (max-width: 639.98px) {
        app-discussion-view {
          /* The original phone header already applies the top safe-area inset. */
          padding-top: 0;
        }
      }
      @media (min-width: 1024px) {
        .sidebar-panel {
          left: auto;
          width: 40vw;
          top: 4rem;
          z-index: 30;
        }
        .sidebar-panel.open {
          border-left: 1px solid var(--app-border);
          box-shadow: -8px 0 30px #0002;
        }
        @media (display-mode: standalone) {
          .sidebar-panel {
            top: calc(4rem + env(safe-area-inset-top));
          }
        }
      }
    `,
  ],
})
export class SidebarCommentsComponent {
  readonly sidebarService = inject(SidebarService);
  private panel = viewChild('panel', { read: ElementRef<HTMLElement> });
  private retainedEntries = signal<DiscussionEntry[]>([]);
  readonly renderedEntries = computed(() =>
    this.sidebarService.entries().length
      ? this.sidebarService.visibleEntries()
      : this.retainedEntries(),
  );
  private screens = viewChildren('screen', { read: ElementRef<HTMLElement> });
  readonly dragging = signal(false);
  private offset = signal(0);
  private pointer: {
    id: number;
    x: number;
    y: number;
    position: number;
    horizontal: boolean;
  } | null = null;
  private animations: Animation[] = [];
  private generation = 0;
  private previousPositions = new Map<number, number>();
  private gestureCommitted = false;
  private readonly positions = computed(
    () => new Map(this.sidebarService.entries().map((entry, index) => [entry.key, index])),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const entries = this.sidebarService.visibleEntries();
      if (entries.length) this.retainedEntries.set(entries);
    });
    afterRenderEffect(() => {
      const position = this.sidebarService.position();
      const entries = this.positions();
      const screens = this.screens();
      const previous = this.previousPositions;
      const desktop = matchMedia('(min-width: 1024px)').matches;
      const duration = matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : desktop
          ? 300
          : 220;
      const easing = desktop ? 'cubic-bezier(.4,0,.2,1)' : 'cubic-bezier(.2,.8,.2,1)';
      const panel = this.panel()?.nativeElement;
      if (!entries.size) {
        if (!screens.length) return;
        const generation = ++this.generation;
        this.animations =
          desktop && panel
            ? [
                panel.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], {
                  duration,
                  easing,
                  fill: 'forwards',
                }),
              ]
            : screens.map((ref) => {
                const from = previous.get(Number(ref.nativeElement.dataset['entryKey'])) ?? 0;
                return ref.nativeElement.animate(
                  [
                    { transform: `translateX(${from * 100}%)` },
                    { transform: `translateX(${(from + 1) * 100}%)` },
                  ],
                  { duration, easing, fill: 'forwards' },
                );
              });
        void Promise.all(this.animations.map((animation) => animation.finished))
          .then(() => {
            if (generation !== this.generation) return;
            this.cancel();
            this.previousPositions.clear();
            this.retainedEntries.set([]);
          })
          .catch(() => {});
        return;
      }
      this.previousPositions = new Map([...entries].map(([key, index]) => [key, index - position]));
      if (this.gestureCommitted) {
        this.gestureCommitted = false;
        return;
      }
      if (desktop && panel && !previous.size) {
        this.animations = [
          panel.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], {
            duration,
            easing,
          }),
        ];
        return;
      }
      // An open desktop sidebar replaces its discussion in place.
      if (desktop || !duration) return;
      this.animations = screens.flatMap((ref) => {
        const key = Number(ref.nativeElement.dataset['entryKey']);
        const to = this.previousPositions.get(key) ?? 0;
        const from = previous.get(key) ?? 1;
        if (from === to) return [];
        return [
          ref.nativeElement.animate(
            [
              { transform: `translateX(${from * 100}%)` },
              { transform: `translateX(${to * 100}%)` },
            ],
            { duration, easing },
          ),
        ];
      });
    });
    const listen = <K extends keyof DocumentEventMap>(
      name: K,
      handler: (event: DocumentEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      document.addEventListener(name, handler, options);
      destroyRef.onDestroy(() => document.removeEventListener(name, handler, options));
    };
    listen('pointerdown', (e) => {
      if (e.pointerType !== 'touch') {
        this.start(e.pointerId, e.clientX, e.clientY, e.target, e.button);
        // At a mobile viewport a mouse drag emulates a finger. Prevent a new text
        // selection from taking the same stream after an eligible pointerdown.
        if (this.pointer?.id === e.pointerId) e.preventDefault();
      }
    });
    listen('pointermove', (e) => {
      if (e.pointerType !== 'touch') this.move(e.pointerId, e.clientX, e.clientY, e);
    });
    listen('pointerup', (e) => {
      if (e.pointerType !== 'touch') this.finish(e.pointerId);
    });
    listen('pointercancel', (e) => {
      if (e.pointerType !== 'touch') this.cancel();
    });
    // Native touch scrolling stays available in both axes, including code blocks and zoom.
    // Only a deliberate horizontal discussion gesture cancels a touchmove.
    listen(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) {
          this.cancel();
          return;
        }
        const t = e.touches[0];
        this.start(t.identifier, t.clientX, t.clientY, e.target, 0);
      },
      { passive: true },
    );
    listen(
      'touchmove',
      (e) => {
        if (e.touches.length !== 1) {
          this.cancel();
          return;
        }
        const t = e.touches[0];
        this.move(t.identifier, t.clientX, t.clientY, e);
      },
      { passive: false },
    );
    listen('touchend', (e) => {
      if (e.changedTouches.length) this.finish(e.changedTouches[0].identifier);
    });
    listen('touchcancel', () => this.cancel());
    window.addEventListener('resize', this.cancel);
    window.addEventListener('orientationchange', this.cancel);
    destroyRef.onDestroy(() => {
      this.cancel();
      window.removeEventListener('resize', this.cancel);
      window.removeEventListener('orientationchange', this.cancel);
    });
    effect(() => {
      this.sidebarService.position();
      this.sidebarService.entries();
      this.cancel();
    });
    effect((onCleanup) => {
      if (!this.sidebarService.isOpen()) return;
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previous;
      });
    });
  }
  transform(key: number): string {
    const relative = this.sidebarService.entries().length
      ? (this.positions().get(key) ?? 0) - this.sidebarService.position()
      : (this.previousPositions.get(key) ?? 0);
    return `translateX(calc(${relative * 100}% + ${this.offset()}px))`;
  }
  private start(
    id: number,
    x: number,
    y: number,
    target: EventTarget | null,
    button: number,
  ): void {
    if (this.pointer) {
      this.cancel();
      return;
    }
    if (
      button !== 0 ||
      !matchMedia('(max-width: 1023.98px)').matches ||
      !this.sidebarService.entries().length
    )
      return;
    if (x < 24 || x > innerWidth - 24 || window.getSelection()?.toString()) return;
    if (!(target instanceof HTMLElement)) return;
    if (this.sidebarService.isOpen() && !target.closest('app-discussion-view[data-active="true"]'))
      return;
    if (
      target.closest(
        'button,a,input,textarea,select,[contenteditable="true"],[role="button"],pre,code',
      )
    )
      return;
    for (let el: HTMLElement | null = target; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX))
        return;
    }
    this.cancel();
    this.pointer = { id, x, y, position: this.sidebarService.position(), horizontal: false };
  }
  private move(id: number, x: number, y: number, event: Event): void {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== id) return;
    if (window.getSelection()?.toString()) {
      this.cancel();
      return;
    }
    const dx = x - pointer.x,
      dy = y - pointer.y;
    if (!pointer.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
        this.cancel();
        return;
      }
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      pointer.horizontal = true;
      this.dragging.set(true);
    }
    if (!event.cancelable) {
      this.cancel();
      return;
    }
    event.preventDefault();
    const allowed = dx > 0 ? this.sidebarService.canGoBack() : this.sidebarService.canGoForward();
    this.offset.set(allowed ? Math.max(-innerWidth, Math.min(innerWidth, dx)) : dx * 0.12);
  }
  private finish(id: number): void {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== id) return;
    this.pointer = null;
    const dx = this.offset();
    const direction = dx > 0 ? -1 : 1;
    const allowed =
      direction === -1 ? this.sidebarService.canGoBack() : this.sidebarService.canGoForward();
    const succeeds =
      pointer.horizontal &&
      allowed &&
      Math.abs(dx) >= innerWidth * 0.28 &&
      pointer.position === this.sidebarService.position();
    const target = succeeds ? -direction * innerWidth : 0;
    const generation = ++this.generation;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    this.animations = this.screens().map((ref) => {
      const element = ref.nativeElement;
      const key = Number(element.dataset['entryKey']);
      const base = ((this.positions().get(key) ?? 0) - pointer.position) * 100;
      return element.animate(
        [
          { transform: `translateX(calc(${base}% + ${dx}px))` },
          { transform: `translateX(calc(${base}% + ${target}px))` },
        ],
        { duration, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' },
      );
    });
    void Promise.all(this.animations.map((a) => a.finished))
      .then(() => {
        if (generation !== this.generation) return;
        this.cancel();
        if (succeeds) {
          this.gestureCommitted = true;
          if (direction === -1) this.sidebarService.back();
          else this.sidebarService.forward();
        }
      })
      .catch(() => {
        /* Cancelled by rotation, navigation, or another gesture. */
      });
  }
  private cancel = (): void => {
    this.generation++;
    this.animations.forEach((a) => a.cancel());
    this.animations = [];
    this.pointer = null;
    this.offset.set(0);
    this.dragging.set(false);
  };
}
