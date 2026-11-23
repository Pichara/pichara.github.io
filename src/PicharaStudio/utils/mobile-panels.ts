/**
 * mobile-panels — which side panel is open as an overlay drawer on narrow
 * screens.
 *
 * On desktop (viewport >= 768px) the shape library is always visible
 * and this state is ignored. Below that breakpoint the shape library is
 * hidden until the user opens it from the toolbar. (The format panel
 * used to be a second drawer here; it was removed 2026-11-23 — formatting
 * is now a popup above the item — so the shape library is the only
 * drawer left.) Tapping its toolbar button again closes it.
 */

export type MobilePanel = "shapes";

/**
 * Next drawer state after tapping a panel's toolbar button: opens the
 * panel when none is open, closes it when it is already open.
 */
export function toggleMobilePanel(
  current: MobilePanel | null,
  panel: MobilePanel
): MobilePanel | null {
  return current === panel ? null : panel;
}
