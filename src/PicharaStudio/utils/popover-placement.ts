/**
 * Popover placement — pure geometry for fixed-position popovers
 * (File menu, color picker) anchored to a button's bounding rect.
 *
 * Kept free of React and store dependencies so the placement rules can
 * be unit-tested in isolation (see `tests/popover-placement.test.mjs`).
 * Callers measure the popover's real size after it mounts (its width is
 * content-driven, so assuming a fixed width clips text when the content
 * is wider) and pass the viewport size; the popover is then clamped
 * inside the viewport instead of overflowing it.
 */

export interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/** Margin (px) kept between a popover and the viewport edges. */
export const POPOVER_MARGIN = 8;

/**
 * Place a popover next to its anchor: below the anchor and right-aligned
 * with it by default; flips above the anchor when it would overflow the
 * bottom edge; always clamped inside the viewport (8px margin). Never
 * returns a negative top or left.
 */
export function placePopover(
  anchor: AnchorRect,
  size: PopoverSize,
  viewport: ViewportSize,
  gap = 6
): { top: number; left: number } {
  const maxLeft = Math.max(
    POPOVER_MARGIN,
    viewport.width - size.width - POPOVER_MARGIN
  );
  const left = Math.min(
    Math.max(POPOVER_MARGIN, anchor.right - size.width),
    maxLeft
  );
  let top = anchor.bottom + gap;
  if (top + size.height > viewport.height - POPOVER_MARGIN) {
    top = anchor.top - gap - size.height;
  }
  const maxTop = Math.max(
    POPOVER_MARGIN,
    viewport.height - size.height - POPOVER_MARGIN
  );
  top = Math.min(Math.max(POPOVER_MARGIN, top), maxTop);
  return { top, left };
}

/**
 * Place a popover above its anchor (the format popup): centered on the
 * anchor's horizontal center, its bottom edge `gap` px above the
 * anchor's top edge; flips below the anchor when there is no room
 * above; always clamped inside the viewport (8px margin). The anchor
 * may be a point (zero-size rect, e.g. a right-click position) or the
 * screen rect of the current selection. Never returns a negative top
 * or left.
 */
export function placePopoverAbove(
  anchor: AnchorRect,
  size: PopoverSize,
  viewport: ViewportSize,
  gap = 6
): { top: number; left: number } {
  const anchorCenterX = (anchor.left + anchor.right) / 2;
  const maxLeft = Math.max(
    POPOVER_MARGIN,
    viewport.width - size.width - POPOVER_MARGIN
  );
  const left = Math.min(
    Math.max(POPOVER_MARGIN, anchorCenterX - size.width / 2),
    maxLeft
  );
  let top = anchor.top - gap - size.height;
  if (top < POPOVER_MARGIN) {
    top = anchor.bottom + gap;
  }
  const maxTop = Math.max(
    POPOVER_MARGIN,
    viewport.height - size.height - POPOVER_MARGIN
  );
  top = Math.min(Math.max(POPOVER_MARGIN, top), maxTop);
  return { top, left };
}
