/**
 * mobile-panels — which side panel is open as an overlay drawer on narrow
 * screens.
 *
 * On desktop (viewport >= 768px) both panels are always visible sidebars
 * and this state is ignored. Below that breakpoint the shape library and
 * the format panel are hidden until the user opens one from the toolbar;
 * only one drawer can be open at a time, and tapping its toolbar button
 * again closes it.
 */

export type MobilePanel = "shapes" | "format";

/**
 * Next drawer state after tapping a panel's toolbar button: opens the
 * panel when another one (or none) is open, closes it when it is already
 * open.
 */
export function toggleMobilePanel(
  current: MobilePanel | null,
  panel: MobilePanel
): MobilePanel | null {
  return current === panel ? null : panel;
}
